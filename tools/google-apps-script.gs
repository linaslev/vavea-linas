/* ══════════════════════════════════════════════════════════════════
   Vavea & Linas — guest form backend
   Paste this whole file into a Google Apps Script bound to your Sheet.
   Full step-by-step instructions are in README.md.
   ══════════════════════════════════════════════════════════════════ */

/* Optional: get an email every time somebody submits.
   Put your address between the quotes, or leave '' for no emails. */
var NOTIFY_EMAIL = '';

var HEADERS = [
  'Submitted at',
  'First name',
  'Last name',
  'Email',
  'Postal address',
  'Attending',
  'Note',
  'Language'
];


/* ── main entry point: called by the website ───────────────────── */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // avoid two people writing the same row

  try {
    var data = JSON.parse(e.postData.contents);

    // very light validation
    if (!data.firstName || !data.lastName || !data.address) {
      return json({ ok: false, error: 'missing required fields' });
    }

    var sheet = getSheet();

    sheet.appendRow([
      new Date(),
      String(data.firstName || '').slice(0, 100),
      String(data.lastName  || '').slice(0, 100),
      String(data.email     || '').slice(0, 150),
      String(data.address   || '').slice(0, 500),
      String(data.attending || '').slice(0, 50),
      String(data.note      || '').slice(0, 800),
      String(data.language  || '').slice(0, 10)
    ]);

    // keep the address column readable
    sheet.getRange(sheet.getLastRow(), 1, 1, HEADERS.length)
         .setVerticalAlignment('top')
         .setWrap(true);

    if (NOTIFY_EMAIL) notify(data);

    return json({ ok: true });

  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/* ── a friendly page if you open the Web App URL in a browser ──── */
function doGet() {
  return ContentService
    .createTextOutput('Vavea & Linas guest form endpoint is live. 🌿')
    .setMimeType(ContentService.MimeType.TEXT);
}


/* ── helpers ───────────────────────────────────────────────────── */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Guests');

  if (!sheet) {
    sheet = ss.insertSheet('Guests');
  }

  // write the header row once, and make it pretty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setFontWeight('bold')
         .setBackground('#3d4a2c')
         .setFontColor('#f7f2e8');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150); // submitted at
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 210);
    sheet.setColumnWidth(5, 280); // address
    sheet.setColumnWidth(6, 130);
    sheet.setColumnWidth(7, 320); // note
    sheet.setColumnWidth(8, 80);
  }

  return sheet;
}

function notify(data) {
  var subject = '💌 New save-the-date reply: ' + data.firstName + ' ' + data.lastName;
  var body =
    data.firstName + ' ' + data.lastName + '\n' +
    (data.email || '—') + '\n\n' +
    'Attending: ' + (data.attending || '—') + '\n\n' +
    'Address:\n' + (data.address || '—') + '\n\n' +
    (data.note ? 'Note:\n' + data.note + '\n' : '');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ── run this once from the editor to test without the website ─── */
function testAppend() {
  doPost({ postData: { contents: JSON.stringify({
    firstName: 'Test',
    lastName:  'Guest',
    email:     'test@example.com',
    address:   'Gedimino pr. 1\n01103 Vilnius\nLithuania',
    attending: 'Yes',
    note:      'Delete this row afterwards 🙂',
    language:  'en'
  }) } });
}
