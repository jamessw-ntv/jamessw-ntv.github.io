/**
 * Umpire quiz backend: a Cloudflare Worker (free plan). No Google.
 * Paste this whole file into the Worker's code editor. See SETUP.md.
 *
 * Order matters: 1) save the row to the database, 2) THEN try the email.
 * If the email fails, the row is still saved and its "email_status" says why.
 *
 * Settings the Worker needs (Cloudflare dashboard > the Worker > Settings):
 *   DB              D1 database binding (where results are stored)
 *   ADMIN_EMAIL     who gets the notification (must be your Resend account email)
 *   RESEND_API_KEY  secret, from resend.com
 *   CSV_KEY         secret, a password you choose for downloading results.csv
 */

const COLUMNS = ["submitted_at", "name", "email", "quiz", "score", "total", "percent", "result", "answers", "email_status"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors() });

    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT, ${COLUMNS.map(c => c + " TEXT").join(", ")})`).run();

      if (request.method === "POST") return await submit(request, env);

      // Download every result: https://<worker-url>/results.csv?key=<CSV_KEY>
      if (url.pathname === "/results.csv") {
        if (!env.CSV_KEY || url.searchParams.get("key") !== env.CSV_KEY) {
          return new Response("Wrong or missing key", { status: 403 });
        }
        return await csv(env);
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
    name: text(data.name), email: text(data.email), quiz: text(data.quiz),
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
  let emailed = false, status;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Umpire Quiz <onboarding@resend.dev>",
        to: env.ADMIN_EMAIL,
        subject: `Quiz result: ${row.name} - ${row.result} (${row.percent}%)`,
        text:
          `Name: ${row.name}\nEmail: ${row.email}\nQuiz: ${row.quiz}\n` +
          `Score: ${row.score}/${row.total} (${row.percent}%) ${row.result}\n\n${row.answers}`
      })
    });
    if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 200));
    emailed = true;
    status = "sent";
  } catch (err) {
    status = "FAILED: " + err.message;
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
      "Content-Disposition": 'attachment; filename="results.csv"'
    }
  });
}

// One CSV cell: quote it, and stop text starting with = + - @ running as a formula in Excel.
function cell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function text(v) { return String(v == null ? "" : v).slice(0, 5000); }

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors() } });
}
