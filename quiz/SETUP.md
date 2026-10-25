# Umpire quiz: setup (about 10 minutes, all free)

How it fits together: the quiz page (on GitHub Pages) is the front desk. Google
Apps Script is the back office. It files each result in a Google Sheet first,
then emails the admin. If the email fails, the result is already filed.

## 1. Create the results Sheet
1. Go to <https://sheets.new> and name it **Umpire Quiz Results**.
2. Leave it empty. The headers are added automatically on the first submission.

## 2. Paste in the script
1. In that Sheet, open **Extensions > Apps Script**.
2. Delete everything in `Code.gs` and paste in the contents of [`Code.gs`](./Code.gs).
3. Change `ADMIN_EMAIL` near the top to the admin's email address.
4. Click **Save** (the disk icon).

## 3. Deploy it as a web app
1. Click **Deploy > New deployment**.
2. Click the gear next to "Select type" and pick **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy**, then **Authorize access** and allow it. If Google shows
   "Google hasn't verified this app", click **Advanced > Go to … (unsafe)**. This is your own script, so it's safe.
5. Copy the **Web app URL**. It ends in `/exec`.
6. Optional check: open that URL in a browser. You should see
   `{"ok":true,"message":"Quiz backend is running."}`.

## 4. Paste the URL into the quiz
1. Open [`questions.js`](./questions.js) (on GitHub: click the file, then the pencil icon).
2. Replace `PASTE_YOUR_WEB_APP_URL_HERE` with the URL from step 3, keeping the quotes.
3. Commit. The page updates in about a minute at
   <https://jamessw-ntv.github.io/quiz/>.

## 5. Test it
Take the quiz once. You should see "Your result has been saved", a new row in
the Sheet, and an email to the admin.

---

## Editing questions
Everything lives in `questions.js`. Each question is a `q`, a list of
`options`, and an `answer`, which is the position of the correct option
counting from **0** (so the first option is 0 and the second is 1). `passMark` sets the pass percentage.

## If you change Code.gs later
Saving is not enough. Go to **Deploy > Manage deployments**, click the pencil,
set **Version: New version**, then **Deploy**. This keeps the same URL. Using
"New deployment" instead creates a *new* URL, and you'd have to paste it into
`questions.js` again.

## Troubleshooting
- **"could not be saved"**: check the URL in `questions.js` ends in `/exec`
  and that access is set to **Anyone** (not "Anyone with Google account").
- **Saved but no email**: look at the **Email status** column in the Sheet. It
  shows the error. Free Gmail accounts can send about 100 emails a day.
- **Answer key is visible**: the answers are in the page source, which is fine
  for practice checks. If it ever needs to be cheat-proof, the scoring should move into the script.
