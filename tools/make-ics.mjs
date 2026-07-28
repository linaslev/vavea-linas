/* ══════════════════════════════════════════════════════════════════
   Generates the real .ics files served from assets/calendar/.

   Why real files instead of a Blob built in the browser?
   In-app browsers (Messenger, Instagram, Facebook…) ignore the
   `download` attribute and refuse to hand a `blob:` URL to the OS, so
   the guest just saw the raw text of the file. A normal https URL
   served as `text/calendar` gets handed to the Calendar app instead.

   One file per language, because a static file can't be translated at
   runtime the way the old Blob could.

   Run:  node tools/make-ics.mjs
   ══════════════════════════════════════════════════════════════════ */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'assets/calendar');

/* Keep these in sync with CONFIG.weddingDay + STRINGS in js/app.js */
const DAY = { y: 2027, m: 7, d: 31 };

const TEXT = {
  en: {
    title: 'Vavea & Linas — Wedding',
    where: 'Vilnius, Lithuania',
    note: 'Vavea and Linas are getting married. A proper invitation with all the details will follow.'
  },
  lt: {
    title: 'Vavea ir Linas — Vestuvės',
    where: 'Vilnius, Lietuva',
    note: 'Vavea ir Linas tuokiasi. Tikras pakvietimas su visa informacija atkeliaus vėliau.'
  },
  fr: {
    title: 'Vavea & Linas — Mariage',
    where: 'Vilnius, Lituanie',
    note: 'Vavea et Linas se marient. Une véritable invitation avec tous les détails suivra.'
  }
};

const pad2 = (n) => String(n).padStart(2, '0');
const dayStamp = ({ y, m, d }) => `${y}${pad2(m)}${pad2(d)}`;

/* all-day events use an EXCLUSIVE end date → the day after */
function nextDay({ y, m, d }) {
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

const esc = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1').replace(/\n/g, '\\n');

/* RFC 5545 says content lines must be folded at 75 octets. Fold on byte
   length, not character length, so Lithuanian/French accents can't split
   a multi-byte sequence across lines. */
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const out = [];
  let start = 0;
  let limit = 75; // subsequent lines lose one octet to the leading space
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // don't cut inside a UTF-8 sequence: continuation bytes are 10xxxxxx
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74;
  }
  return out.join('\r\n ');
}

function buildIcs(lang) {
  const { title, where, note } = TEXT[lang];
  const start = dayStamp(DAY);
  const end = dayStamp(nextDay(DAY));

  // A fixed DTSTAMP keeps the generated files byte-stable between runs, so
  // regenerating doesn't show up as a diff unless the content really changed.
  const stamp = '20260728T000000Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vavea & Linas//Save the Date//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:vavea-linas-${start}@vavea-linas`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(note)}`,
    `LOCATION:${esc(where)}`,
    'TRANSP:TRANSPARENT',
    'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE',
    'BEGIN:VALARM',
    'TRIGGER;RELATED=START:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  // CRLF line endings + a trailing CRLF are required by the spec; Outlook
  // in particular rejects bare LF.
  return lines.map(fold).join('\r\n') + '\r\n';
}

mkdirSync(OUT_DIR, { recursive: true });
for (const lang of Object.keys(TEXT)) {
  const file = resolve(OUT_DIR, `vavea-linas-${lang}.ics`);
  writeFileSync(file, buildIcs(lang), 'utf8');
  console.log('wrote', file.replace(ROOT + '/', ''));
}
