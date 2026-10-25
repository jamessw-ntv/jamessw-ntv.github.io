/**
 * Umpire quiz backend (Google Apps Script).
 * Paste this into Extensions > Apps Script from the results Google Sheet.
 * See SETUP.md in the same folder for the full steps.
 *
 * Order matters: 1) save the row, 2) THEN try the email.
 * If the email fails, the row is still saved and its "Email" column says why.
 */

// Who gets the notification email. Change this to the admin's address.
const ADMIN_EMAIL = 'admin@example.com';

const HEADERS = ['Timestamp', 'Name', 'Email', 'Quiz', 'Score', 'Total', 'Percent', 'Result', 'Answers', 'Email status'];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ saved: false, emailed: false, error: 'Bad request' });
  }

  // 1) SAVE. A lock stops two people submitting at the same moment from clashing.
  let sheet, row;
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([
      new Date(),
      clean(data.name), clean(data.email), clean(data.quiz),
      Number(data.correct) || 0, Number(data.total) || 0, Number(data.percent) || 0,
      clean(data.result), clean(data.answers),
      'sending…'
    ]);
    row = sheet.getLastRow();
    SpreadsheetApp.flush();
  } catch (err) {
    return reply({ saved: false, emailed: false, error: 'Save failed: ' + err.message });
  } finally {
    lock.releaseLock();
  }

  // 2) EMAIL, in its own try/catch so a failure can never undo the save above.
  let emailed = false;
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Quiz result: ' + data.name + ' - ' + data.result + ' (' + data.percent + '%)',
      body:
        'Name: ' + data.name + '\n' +
        'Email: ' + data.email + '\n' +
        'Quiz: ' + data.quiz + '\n' +
        'Score: ' + data.correct + '/' + data.total + ' (' + data.percent + '%) ' + data.result + '\n\n' +
        data.answers + '\n\n' +
        'Full results: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
    emailed = true;
    sheet.getRange(row, HEADERS.length).setValue('sent');
  } catch (err) {
    sheet.getRange(row, HEADERS.length).setValue('FAILED: ' + err.message);
  }

  return reply({ saved: true, emailed: emailed });
}

// Opening the web app URL in a browser shows this, which is a quick "is it live?" check.
function doGet() {
  return reply({ ok: true, message: 'Quiz backend is running.' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Stops text that starts with = + - @ being run as a spreadsheet formula.
function clean(v) {
  const s = String(v == null ? '' : v).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
