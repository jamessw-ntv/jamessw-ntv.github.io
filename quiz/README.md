# Softball Umpires: umpire quiz

A static site (GitHub Pages) plus one Cloudflare Worker. Umpires take a practice or
recorded quiz; each recorded attempt is **saved to a database first, then emailed**
to an admin. An admin dashboard and a CSV download show every result. Free: GitHub
Pages + Cloudflare free plan. No Google, no email account, no API keys.

```
Browser ──loads──▶ GitHub Pages: index.html · take/ · admin/ · questions.js · site.js
   │
   └─POST (text/plain JSON)──▶ Cloudflare Worker "umpire-quiz"
                                  1. INSERT row ──▶ D1 database "quiz-results"
                                  2. send email ──▶ Email Routing ──▶ admin inbox
Admin dashboard ──GET /results.json (Bearer password)──▶ Worker ──▶ D1
CSV            ──GET /results.csv?key=…──────────────▶ Worker ──▶ D1
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page |
| `take/index.html` | Quiz page (`?category=general|plate|base|situations` preselects) |
| `admin/index.html` | Dashboard: login, totals, score chart, hardest questions, searchable table, CSV |
| `questions.js` | Questions, `passMark` (85), `rulebookEdition`, `WORKER_URL` |
| `site.js`, `site.css` | Quiz engine and styles |
| `worker.js` | Backend, deployed to Cloudflare (Pages does not run it) |
| `SETUP.md` | Click-by-click Cloudflare setup |
| `CLAUDE.md` | Rules for developing this with Claude |

## The Worker

Endpoints (all CORS-open, `Access-Control-Allow-Origin: *`):

| Request | Does |
|---|---|
| `GET /` | Health check: `{"ok":true,"message":"Quiz backend is running."}` |
| `POST /` | Save a result, then email it. Replies `{saved, emailed}` |
| `GET /results.json` | All rows. Needs `Authorization: Bearer <ADMIN_PASSWORD or CSV_KEY>` |
| `GET /results.csv?key=<CSV_KEY>` | All rows as CSV (formula-safe cells) |

Bindings and settings (Cloudflare → Worker → Settings):

| Name | Type | Value |
|---|---|---|
| `DB` | D1 binding | database `quiz-results` |
| `EMAIL` | Send email binding | Email Routing on the sender's domain |
| `FROM_EMAIL` | Text | e.g. `quiz@yourdomain.com` |
| `ADMIN_EMAIL` | Secret | a verified Email Routing destination |
| `CSV_KEY` | Secret | password for the CSV link |
| `ADMIN_PASSWORD` | Secret | password for the dashboard |

The table creates itself, and missing columns are added on the first request, so
schema changes need no manual migration.

**Redeploy after editing `worker.js`:** Cloudflare dashboard → Workers & Pages →
`umpire-quiz` → Edit code → paste → Deploy. Bindings and secrets are kept. (Or ask
Claude with the Cloudflare connector to deploy it with the existing bindings inherited.)

## Run a copy on another GitHub Pages site (same Cloudflare backend)

The Worker accepts requests from any site, so a second copy needs **no Cloudflare
changes**. Both copies write to the same database, email the same admin, and show
on the same dashboard.

1. **Create the repo.** GitHub → New repository (public, or private on a paid plan).
2. **Copy the files.** Put the contents of this folder at the repo root (or in any
   subfolder): `index.html`, `take/`, `admin/`, `images/`, `questions.js`,
   `site.js`, `site.css`. `worker.js`, `SETUP.md`, `README.md` and `CLAUDE.md`
   can come along; Pages serves them but they hold no secrets.
3. **Point at the backend.** In `questions.js`, keep
   `WORKER_URL: 'https://umpire-quiz.jsiddelwhipp.workers.dev'`.
4. **Tell the copies apart (recommended).** Change `title` in `questions.js`, e.g.
   `'WBSC Softball Umpire Quiz · Oceania'`. Every result stores it in the `quiz`
   column, so the dashboard and CSV show which site each attempt came from.
5. **Turn on Pages.** Repo → Settings → Pages → Build and deployment → Source:
   **Deploy from a branch**, Branch: `main`, folder `/ (root)` → Save. The site is
   live at `https://<owner>.github.io/<repo>/` within about a minute.
6. **Test.** Open `…/take/`, run a Recorded Quiz, and check the "saved and sent"
   message, the email, and the dashboard at `…/admin/`.

All links are relative, so the site works at a domain root or under `/<repo>/`.

**Optional: restrict which sites may post.** Today any web page could post results.
To allow only known sites, change `cors()` in `worker.js` to echo the request's
`Origin` only when it is in a list (e.g. a new `ALLOWED_ORIGINS` text variable,
comma-separated) and redeploy. Reading results stays password-protected either way.

## A separate backend instead

If the second site must keep its own results, follow `SETUP.md` on that Cloudflare
account (new Worker name, new D1 database, own secrets) and put the new Worker URL
in that copy's `questions.js`.

## Develop it with Claude

1. Open the repo in Claude Code (or a claude.ai project with the GitHub repo connected).
2. Claude reads `CLAUDE.md` first: file map, where to edit, the `?v=` cache rule,
   and the no-secrets rule.
3. Ask in plain words: "add 10 plate-umpire questions", "add a phone number field
   to the recorded quiz", "email a second admin". Claude edits, tests in a local
   browser, and opens a PR.
4. Backend changes also need the Worker redeployed (above). With the Cloudflare
   connector, Claude can do this itself when you say so.

## Free limits

100,000 Worker requests a day, 5 GB of D1 storage. The answer key is visible in
the page source: fine for training, not for high-stakes exams.
