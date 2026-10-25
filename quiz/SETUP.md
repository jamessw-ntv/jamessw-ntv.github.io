# Umpire quiz: runsheet (about 15 minutes, all free, all on your Cloudflare)

The quiz page is on GitHub Pages. [`worker.js`](./worker.js) runs on a free
Cloudflare Worker. It saves each result to a D1 database **first**, then
emails the admin through Cloudflare Email Routing. Results download as
`results.csv`. The admin needs no account. She only clicks one verification email.

Cloudflare's dashboard labels shift sometimes. If a button doesn't match, look for the closest one.

## 0. Before you start (check this)
- [ ] **Does the domain already receive email somewhere else** (Google Workspace, M365, a host)?
  Turning on Email Routing **replaces the domain's MX records**, which would break that mail.
  If it does, use a domain with no existing email, or stop and tell me.

## 1. Turn on Email Routing and verify the admin (5 min)
1. Cloudflare dashboard > your domain > **Email > Email Routing > Get started / Enable**.
   Let it add the DNS records it asks for.
2. **Email Routing > Destination addresses > Add**, then enter the **admin's email**.
3. The admin clicks the link in the verification email Cloudflare sends.
   - [ ] Status shows **Verified**.

## 2. Create the database (1 min)
1. **Storage & Databases > D1 > Create database**, name it `quiz-results`.

## 3. Create the Worker (3 min)
1. **Workers & Pages > Create > Worker**, name it `umpire-quiz`, then **Deploy**.
2. **Edit code**, delete everything, paste all of [`worker.js`](./worker.js), then **Deploy**.
3. Copy the URL: `https://umpire-quiz.<you>.workers.dev`.

## 4. Connect bindings and settings (4 min)
Worker > **Settings > Bindings > Add**:

| Type | Variable name | Value |
|---|---|---|
| D1 database | `DB` | `quiz-results` |
| Send email | `EMAIL` | (if asked) the admin's address as the destination |

Worker > **Settings > Variables and Secrets > Add**:

| Name | Type | Value |
|---|---|---|
| `ADMIN_EMAIL` | Text | admin's email (the verified one from step 1) |
| `FROM_EMAIL` | Text | e.g. `quiz@yourdomain.com` (any name **at your domain**) |
| `CSV_KEY` | Secret | a password you make up for the results download |
| `ADMIN_PASSWORD` | Secret | the shared password for the results dashboard |

The names must be exact, in capitals.

- [ ] Open the Worker URL. You should see `{"ok":true,"message":"Quiz backend is running."}`.

> If the dashboard has no **Send email** binding type, add it with Wrangler
> instead. Put this in `wrangler.toml` and run `npx wrangler deploy`:
> ```toml
> name = "umpire-quiz"
> main = "worker.js"
> compatibility_date = "2026-10-01"
> [[send_email]]
> name = "EMAIL"
> [[d1_databases]]
> binding = "DB"
> database_name = "quiz-results"
> database_id = "<from the D1 page>"
> ```

## 5. Point the quiz at the Worker (2 min)
1. In GitHub, open `quiz/questions.js` and click the pencil icon.
2. Replace `PASTE_YOUR_WORKER_URL_HERE` with the Worker URL, keeping the quotes.
3. Commit. Wait about 1 minute for Pages to rebuild.

## 6. Test (2 min)
1. Open <https://jamessw-ntv.github.io/quiz/take/>, choose **Recorded Quiz**, and submit a test attempt.
   - [ ] The page says **"Your result has been saved."**
   - [ ] The admin receives the email.
2. Download the results: `https://umpire-quiz.<you>.workers.dev/results.csv?key=<CSV_KEY>`
   - [ ] The CSV contains the test row with `email_status` = `sent`.

## Results dashboard
Open <https://jamessw-ntv.github.io/quiz/admin/> and enter `ADMIN_PASSWORD`. It shows attempts,
pass rate, average score, a score chart, accuracy for each question, and a searchable table. Click a row
to see that person's answers, or use **Download CSV**. The password is remembered until the tab closes.
To change it, update the `ADMIN_PASSWORD` secret on the Worker. The new password works straight away.

## If something fails
| Symptom | Check |
|---|---|
| "could not be saved" | Open the Worker URL. An error mentioning `DB` means the D1 binding is missing or misnamed. Also check the URL in `questions.js`. |
| Saved, but the page says the email didn't send | Look at `email_status` in the CSV. `E_RECIPIENT_NOT_ALLOWED` means the admin address isn't verified. `E_SENDER…` means `FROM_EMAIL` isn't at the Email Routing domain. |
| CSV says "Wrong or missing key" | The `?key=` value must match `CSV_KEY` exactly. |

---

**Editing questions:** everything lives in `questions.js`. Each question has an `id` (e.g. `G1`), a `category`
(general, plate, base or situations), a `difficulty` (foundation, intermediate or advanced), `options`, and `correct`,
the position of the right option counting from **0**. `active:false` hides a question without deleting it. `passMark` is
the pass percentage (85 by default). Only **Recorded Quiz** attempts are saved and emailed. Practice attempts are not.
Browsers can keep the old `questions.js` for up to 10 minutes; to force the new one at once, change the `?v=` number after `questions.js` in `quiz/index.html`, `quiz/take/index.html` and `quiz/admin/index.html`.

**Changing worker.js later:** open the Worker, **Edit code**, paste, **Deploy**. The URL doesn't change.

**Free limits:** 100,000 Worker requests a day and 5 GB of D1 storage. The answer key is
visible in the page source, which is fine for practice checks but not for strict exams.
