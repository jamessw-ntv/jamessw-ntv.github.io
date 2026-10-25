# Umpire quiz: setup (about 15 minutes, all free, no Google)

How it fits together: the quiz page (on GitHub Pages) is the paper form. A
small script we wrote ([`worker.js`](./worker.js)) runs on a free Cloudflare
Worker and acts as the filing clerk. It files each result in a database first,
then emails the admin. If the email fails, the result is already filed. All
results download as `results.csv`.

You need two free accounts:
- **Cloudflare** (<https://dash.cloudflare.com/sign-up>) runs the script and stores the results.
- **Resend** (<https://resend.com/signup>) sends the email. **Sign up with the admin's email
  address.** Without your own domain, Resend only delivers to the address the account is registered with.

Cloudflare's dashboard moves things around now and then. If a button name
below doesn't match, look for the closest one.

## 1. Get a Resend API key
1. In Resend, open **API Keys > Create API key**. Give it "Sending access".
2. Copy the key (it starts with `re_`). You'll paste it in step 3.

## 2. Create the Worker and paste in the script
1. In Cloudflare, go to **Workers & Pages > Create > Worker**. Name it `umpire-quiz`
   and click **Deploy** to accept the Hello World starter.
2. Click **Edit code**. Delete everything, paste in all of [`worker.js`](./worker.js),
   and click **Deploy**.
3. Copy the Worker's URL. It looks like `https://umpire-quiz.<you>.workers.dev`.

## 3. Add the database and settings
1. Go to **Storage & Databases > D1 > Create database** and name it `quiz-results`.
2. Back on the Worker, open **Settings > Bindings > Add > D1 database**.
   Set the variable name to **`DB`** (capitals, exactly) and pick `quiz-results`.
3. Open **Settings > Variables and Secrets** and add:

   | Name | Type | Value |
   |---|---|---|
   | `ADMIN_EMAIL` | Text | the admin's email (the same one as the Resend account) |
   | `RESEND_API_KEY` | Secret | the `re_…` key from step 1 |
   | `CSV_KEY` | Secret | a password you make up, for downloading results |

4. Check it: open the Worker URL in a browser. You should see
   `{"ok":true,"message":"Quiz backend is running."}`.

## 4. Paste the URL into the quiz
1. Open [`questions.js`](./questions.js) (on GitHub: click the file, then the pencil icon).
2. Replace `PASTE_YOUR_WORKER_URL_HERE` with the Worker URL, keeping the quotes.
3. Commit. The page updates in about a minute at
   <https://jamessw-ntv.github.io/quiz/>.

## 5. Test it
Take the quiz once. You should see "Your result has been saved", and the admin
should get an email.

## Downloading results
Open this in a browser and `results.csv` downloads. It opens in Excel or Numbers.

```
https://umpire-quiz.<you>.workers.dev/results.csv?key=<your CSV_KEY>
```

Keep that link private, because anyone with it can download the results.

---

## Editing questions
Everything lives in `questions.js`. Each question has a `q`, a list of
`options`, and an `answer`. The answer is the position of the correct option counting
from **0**, so the first option is 0 and the second is 1. `passMark` sets the pass percentage.

## If you change worker.js later
Open the Worker, click **Edit code**, paste the new version, then **Deploy**. The URL doesn't change.

## Troubleshooting
- **"could not be saved"**: open the Worker URL. If it shows an error mentioning `DB`,
  the D1 binding is missing or isn't named exactly `DB`. Also check that the URL in `questions.js` is right.
- **Saved but no email**: the `email_status` column in the CSV shows the
  error. Most often the key is wrong, or `ADMIN_EMAIL` isn't the Resend account's email.
- **Free limits**: Cloudflare allows 100,000 requests a day. Resend allows 100 emails a day and 3,000 a month.
- **Answer key is visible**: the answers are in the page source, which is fine
  for practice checks. If it ever needs to be cheat-proof, move the scoring into the Worker.
