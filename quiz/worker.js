/**
 * Umpire quiz backend: a Cloudflare Worker (free plan). No Google.
 * Paste this whole file into the Worker's code editor. See SETUP.md.
 *
 * Order matters: 1) save the row to the database, 2) THEN try the email.
 * If the email fails, the row is still saved and its "email_status" says why.
 *
 * Settings the Worker needs (Cloudflare dashboard > the Worker > Settings):
 *   DB           D1 database binding (where results are stored)
 *   EMAIL        "Send email" binding (Cloudflare Email Routing on your domain)
 *   ADMIN_EMAIL  who gets the notification (a verified Email Routing destination address)
 *   FROM_EMAIL   sender on your domain, e.g. quiz@yourdomain.com
 *   CSV_KEY      secret, a password you choose for downloading results.csv
 *   ADMIN_PASSWORD  secret, the shared password for the dashboard (quiz/admin/)
 */

const COLUMNS = ["submitted_at", "name", "email", "association", "quiz", "score", "total", "percent", "result", "answers", "email_status"];
let migrated = false;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors() });

    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT, ${COLUMNS.map(c => c + " TEXT").join(", ")})`).run();
      if (!migrated) {
        // Tables made before a column existed get it added once; "duplicate column" just means it's already there.
        for (const c of COLUMNS) {
          try { await env.DB.prepare(`ALTER TABLE results ADD COLUMN ${c} TEXT`).run(); } catch (err) { /* already present */ }
        }
        migrated = true;
      }

      if (request.method === "POST") return await submit(request, env);

      // Download every result: https://<worker-url>/results.csv?key=<CSV_KEY>
      if (url.pathname === "/results.csv") {
        if (!allowed(request, url, env)) return new Response("Wrong or missing key", { status: 403, headers: cors() });
        return await csv(env);
      }

      // The dashboard reads results here, sending the password as "Authorization: Bearer <password>".
      if (url.pathname === "/results.json") {
        if (!allowed(request, url, env)) return json({ error: "Wrong password" }, 403);
        const { results } = await env.DB.prepare(`SELECT id, ${COLUMNS.join(", ")} FROM results ORDER BY id DESC`).all();
        return json({ results });
      }

      // Opening the Worker URL in a browser is a quick "is it live?" check.
      return json({ ok: true, message: "Quiz backend is running." });
    } catch (err) {
      return json({ saved: false, emailed: false, error: "Server error: " + err.message }, 500);
    }
  }
};

async function submit(request, env) {
  let data;
  try {
    data = JSON.parse(await request.text());
  } catch (err) {
    return json({ saved: false, emailed: false, error: "Bad request" }, 400);
  }

  // 1) SAVE.
  const row = {
    submitted_at: new Date().toISOString(),
    name: text(data.name), email: text(data.email), association: text(data.association), quiz: text(data.quiz),
    score: String(Number(data.correct) || 0), total: String(Number(data.total) || 0),
    percent: String(Number(data.percent) || 0), result: text(data.result),
    answers: text(data.answers), email_status: "sending"
  };
  let id;
  try {
    const saved = await env.DB.prepare(
      `INSERT INTO results (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`
    ).bind(...COLUMNS.map(c => row[c])).run();
    id = saved.meta.last_row_id;
  } catch (err) {
    return json({ saved: false, emailed: false, error: "Save failed: " + err.message }, 500);
  }

  // 2) EMAIL, in its own try/catch so a failure can never undo the save above.
  // Sent by Cloudflare itself (Email Routing), so no email account or API key is needed.
  let emailed = false, status;
  try {
    await env.EMAIL.send({
      to: env.ADMIN_EMAIL,
      from: { email: env.FROM_EMAIL, name: "Umpire Quiz" },
      subject: `Quiz result: ${row.name} - ${row.result} (${row.percent}%)`,
      text:
        `Name: ${row.name}\nEmail: ${row.email}\nAssociation: ${row.association || "-"}\nQuiz: ${row.quiz}\n` +
        `Score: ${row.score}/${row.total} (${row.percent}%) ${row.result}\n\n${row.answers}`
    });
    emailed = true;
    status = "sent";
  } catch (err) {
    status = "FAILED: " + (err.code ? err.code + " " : "") + err.message;
  }
  try {
    await env.DB.prepare("UPDATE results SET email_status = ? WHERE id = ?").bind(status, id).run();
  } catch (err) { /* the result is already saved; a stale status is harmless */ }

  return json({ saved: true, emailed });
}

async function csv(env) {
  const { results } = await env.DB.prepare(`SELECT ${COLUMNS.join(", ")} FROM results ORDER BY id`).all();
  const lines = [COLUMNS.join(",")].concat(results.map(r => COLUMNS.map(c => cell(r[c])).join(",")));
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="results.csv"',
      ...cors()
    }
  });
}

// One CSV cell: quote it, and stop text starting with = + - @ running as a formula in Excel.
function cell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

// True when the request carries the dashboard password or the CSV key.
function allowed(request, url, env) {
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "") || url.searchParams.get("key") || "";
  return given !== "" && (given === env.ADMIN_PASSWORD || given === env.CSV_KEY);
}

function text(v) { return String(v == null ? "" : v).slice(0, 5000); }

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors() } });
}
