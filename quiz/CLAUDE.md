# Softball Umpires (umpire quiz): project rules

Umpire education site with a practice and recorded quiz. Recorded attempts are
saved to a database, emailed to an admin, and shown on a password-protected
dashboard. Renders at <https://jamessw-ntv.github.io/quiz/>. Read
[`README.md`](./README.md) for the architecture.

## Layout

| File | What it is |
|---|---|
| `index.html` | Landing page (Alex's design). No quiz on it; every "Take the quiz" link goes to `take/`. |
| `take/index.html` | The quiz page. `take/?category=plate` preselects a category. |
| `admin/index.html` | Results dashboard (password login, charts, table, CSV download). |
| `questions.js` | **Questions, pass mark, rulebook edition and `WORKER_URL`.** The usual file to edit. |
| `site.js` | Quiz engine (runs only where `#quiz-setup` exists) + logo carousel. |
| `site.css` | All styles. Tokens: `--navy #001848`, `--gold #DEC53E`, `--red #DC0D15`. |
| `worker.js` | The Cloudflare Worker (backend). Not served by Pages; deployed to Cloudflare. |
| `images/` | Photos and logos. |
| `SETUP.md` | Click-by-click Cloudflare runsheet. |

## Intent routing

1. **Change questions** → `questions.js` only. Fields: `id` (e.g. `G1`, never reuse
   one: the dashboard's "hardest questions" groups by id), `category`
   (`general|plate|base|situations`), `difficulty` (`foundation|intermediate|advanced`),
   `options`, `correct` (0-based), `ruling`, `explanation`, `ruleRef`, `edition`.
   `active:false` hides a question. Then bump `?v=` (see rule 4).
2. **Change the look or pages** → `index.html`, `take/index.html`, `site.css`.
   The header/footer are duplicated in `index.html` and `take/index.html`: change both.
3. **Change what is saved or emailed** → `site.js` (`payload` in `finishQuiz`) and
   `worker.js` (`COLUMNS`, the email body). A new column is added to the live table
   automatically on the Worker's first request. Redeploy the Worker (README).
4. **Cache:** GitHub Pages lets browsers keep files for 10 minutes. After changing
   `questions.js`, `site.js` or `site.css`, bump the `?v=` value on their `<script>`
   / `<link>` tags in `index.html`, `take/index.html` and `admin/index.html`.
   Skipping this once made the live quiz show "No questions" (a stale questions.js).

## Rules

- **Relative links only** (`../`, `take/`, never a leading `/`), so the folder works
  at any path or at the root of another Pages site.
- **Never commit secrets.** `CSV_KEY`, `ADMIN_PASSWORD` and `ADMIN_EMAIL` live only as
  Worker secrets on Cloudflare. The page and repo hold only the Worker URL.
- **Save before email.** The Worker writes the row first, then emails in its own
  try/catch and records `email_status`. Keep that order.
- **Keep the POST simple.** `site.js` sends `Content-Type: text/plain` so there is no
  CORS preflight and the reply is readable. Don't switch to a hidden-form POST.
- Practice attempts are never sent; only Recorded Quiz attempts are.
- Merging to `main` or redeploying the Worker needs the owner's OK.
