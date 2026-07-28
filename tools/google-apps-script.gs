/* ══════════════════════════════════════════════════════════════════
   Vavea & Linas — guest form backend
   Paste this whole file into a Google Apps Script bound to your Sheet.
   Full step-by-step instructions are in README.md.
   ══════════════════════════════════════════════════════════════════ */

/* Optional: get an email every time somebody submits.
   Add one address per line (both of you, if you like), or leave the list
   empty for no emails at all. Everyone listed gets the same message. */
var NOTIFY_EMAILS = [
  // 'vavea@example.com',
  // 'linas@example.com'
];

var HEADERS = [
  'Submitted at',
  'Name(s)',
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
    if (!data.name || !data.address) {
      return json({ ok: false, error: 'missing required fields' });
    }

    var sheet = getSheet();

    sheet.appendRow([
      new Date(),
      String(data.name      || '').slice(0, 160),
      String(data.address   || '').slice(0, 500),
      String(data.attending || '').slice(0, 50),
      String(data.note      || '').slice(0, 800),
      String(data.language  || '').slice(0, 10)
    ]);

    // keep the address column readable
    sheet.getRange(sheet.getLastRow(), 1, 1, HEADERS.length)
         .setVerticalAlignment('top')
         .setWrap(true);

    notify(data);

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
    sheet.setColumnWidth(2, 200); // name(s)
    sheet.setColumnWidth(3, 280); // address
    sheet.setColumnWidth(4, 130); // attending
    sheet.setColumnWidth(5, 320); // note
    sheet.setColumnWidth(6, 80);  // language
  }

  return sheet;
}

function notify(data) {
  // drop blanks / commented-out entries, then hand Gmail one comma-separated list
  var to = (NOTIFY_EMAILS || [])
    .map(function (a) { return String(a).trim(); })
    .filter(function (a) { return a.indexOf('@') > 0; })
    .join(',');

  if (!to) return;

  var subject = '💌 New save-the-date reply: ' + data.name;
  var body =
    data.name + '\n\n' +
    'Attending: ' + (data.attending || '—') + '\n\n' +
    'Address:\n' + (data.address || '—') + '\n\n' +
    (data.note ? 'Note:\n' + data.note + '\n' : '');

  // A failed email must never lose the row that's already been saved.
  try {
    MailApp.sendEmail(to, subject, body);
  } catch (err) {
    console.error('notify failed: ' + err);
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ── run this once from the editor to test without the website ─── */
function testAppend() {
  doPost({ postData: { contents: JSON.stringify({
    name:      'Test Guest & Plus One',
    address:   'Gedimino pr. 1\n01103 Vilnius\nLithuania',
    attending: 'Yes',
    note:      'Delete this row afterwards 🙂',
    language:  'en'
  }) } });
}
