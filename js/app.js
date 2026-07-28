/* ============================================================
   Vavea & Linas — Save the Date
   ============================================================ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     ⚙️  CONFIGURATION — edit these two values
     ══════════════════════════════════════════════════════════ */
  var CONFIG = {
    // The wedding: 31 July 2027, 13:00 Lithuanian time (EEST = UTC+3 in July).
    // Pinned to UTC on purpose so the countdown shows the same remaining time
    // for every guest, wherever they are — not 13:00 in their own timezone.
    weddingDate: new Date(Date.UTC(2027, 6, 31, 10, 0, 0)),

    // The calendar date, as written on the invitation (Vilnius local).
    // Kept separate from weddingDate so the all-day calendar entry can't drift
    // to the wrong day for guests in far-off timezones.
    weddingDay: { y: 2027, m: 7, d: 31 },

    // Paste your Google Apps Script Web App URL here.
    // See README.md → "Collecting the answers" for the 5-minute setup.
    // Leave as '' while developing: the form will run in demo mode.
    endpoint: 'https://script.google.com/macros/s/AKfycbybRzE4H_IhqsT5CJNoU48VlaKzwThb7ixQRYXGnNJGKkXGyx38d--h7DHfMeB7ILcTAw/exec'
  };
  /* ════════════════════════════════════════════════════════ */

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ══════════════════ 1. LANGUAGE ══════════════════ */
  var STRINGS = {
    en: {
      sending:  'Sending…',
      sent:     'Thank you! Your details are safely with us — a proper invitation will be on its way. 💌',
      failed:   'Something went wrong. Please try again — or just get in touch with Vavea and Linas directly.',
      demo:     'Demo mode: no backend connected yet, so nothing was sent. See README.md to hook up the Google Sheet.',
      required: 'Please fill this in',
      choose:   'Please pick one',
      close:    'Close', prev: 'Previous', next: 'Next', photo: 'Photo',
      calTitle: 'Vavea & Linas — Wedding',
      calWhere: 'Vilnius, Lithuania',
      calNote:  'Vavea and Linas are getting married. A proper invitation with all the details will follow.'
    },
    lt: {
      sending:  'Siunčiama…',
      sent:     'Dėkojame! Jūsų duomenys jau pas mus — tikras pakvietimas jau pakeliui. 💌',
      failed:   'Kažkas nutiko. Pabandykite dar kartą arba susisiekite tiesiogiai su Vavea ir Linu.',
      demo:     'Demonstracinis režimas: serveris dar nesujungtas, todėl niekas nebuvo išsiųsta. Žr. README.md.',
      required: 'Užpildykite šį lauką',
      choose:   'Pasirinkite vieną',
      close:    'Uždaryti', prev: 'Ankstesnė', next: 'Kita', photo: 'Nuotrauka',
      calTitle: 'Vavea ir Linas — Vestuvės',
      calWhere: 'Vilnius, Lietuva',
      calNote:  'Vavea ir Linas tuokiasi. Tikras pakvietimas su visa informacija atkeliaus vėliau.'
    },
    fr: {
      sending:  'Envoi en cours…',
      sent:     'Merci ! Vos coordonnées sont bien arrivées — une véritable invitation est en route. 💌',
      failed:   'Une erreur est survenue. Merci de réessayer ou de contacter directement Vavea et Linas.',
      demo:     'Mode démo : aucun serveur n’est encore connecté, rien n’a donc été envoyé. Voir README.md.',
      required: 'Merci de remplir ce champ',
      choose:   'Merci de choisir une option',
      close:    'Fermer', prev: 'Précédente', next: 'Suivante', photo: 'Photo',
      calTitle: 'Vavea & Linas — Mariage',
      calWhere: 'Vilnius, Lituanie',
      calNote:  'Vavea et Linas se marient. Une véritable invitation avec tous les détails suivra.'
    }
  };

  var lang = 'en';

  function t(key) { return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key]; }

  function setLang(next, remember) {
    lang = STRINGS[next] ? next : 'en';
    document.documentElement.lang = lang;

    $$('[data-i18n]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val != null) el.textContent = val;
    });

    $$('[data-i18n-placeholder]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang + '-placeholder');
      if (val != null) el.setAttribute('placeholder', val);
    });

    $$('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // re-label dynamic controls
    var lb = { '[data-lb-close]': 'close', '[data-lb-prev]': 'prev', '[data-lb-next]': 'next' };
    Object.keys(lb).forEach(function (sel) {
      var el = $(sel); if (el) el.setAttribute('aria-label', t(lb[sel]));
    });

    // calendar links carry translated title/location/notes
    refreshCalendarLinks();

    if (remember) { try { localStorage.setItem('vl-lang', lang); } catch (e) {} }
  }

  $$('.lang button').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang'), true); });
  });

  (function initLang() {
    var saved = null;
    try { saved = localStorage.getItem('vl-lang'); } catch (e) {}

    if (!STRINGS[saved]) {
      // fall back to the browser's preferred languages, in order
      var prefs = navigator.languages || [navigator.language || 'en'];
      saved = 'en';
      for (var i = 0; i < prefs.length; i++) {
        var code = String(prefs[i]).toLowerCase().slice(0, 2);
        if (STRINGS[code]) { saved = code; break; }
      }
    }
    setLang(saved, false);
  }());


  /* ══════════════════ 2. COUNTDOWN ══════════════════ */
  (function countdown() {
    var cells = {
      days:    $('[data-clock="days"]'),
      hours:   $('[data-clock="hours"]'),
      minutes: $('[data-clock="minutes"]'),
      seconds: $('[data-clock="seconds"]')
    };
    if (!cells.days) return;

    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    function tick() {
      var diff = CONFIG.weddingDate - new Date();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) { cells[k].textContent = '00'; });
        return;
      }
      var s = Math.floor(diff / 1000);
      cells.days.textContent    = String(Math.floor(s / 86400));
      cells.hours.textContent   = pad(Math.floor(s / 3600) % 24);
      cells.minutes.textContent = pad(Math.floor(s / 60) % 60);
      cells.seconds.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }());


  /* ══════════════════ 3. SCROLL REVEAL + STICKY NAV ══════════════════ */
  (function reveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }());

  (function stickyNav() {
    var bar = $('.topbar');
    if (!bar) return;
    var raf = null;
    function update() {
      bar.classList.toggle('is-stuck', window.scrollY > 40);
      raf = null;
    }
    window.addEventListener('scroll', function () {
      if (raf === null) raf = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }());


  /* ══════════════════ 4. GALLERY LIGHTBOX ══════════════════ */
  (function lightbox() {
    var box = $('#lightbox');
    var img = $('#lightbox-img');
    var cap = $('#lightbox-cap');
    var shots = $$('.shot');
    if (!box || !shots.length) return;

    var index = 0;
    var lastFocus = null;

    function captionFor(i) {
      var el = $('.shot-caption', shots[i]);
      if (!el) return '';
      return el.getAttribute('data-' + lang) || el.textContent || '';
    }

    function show(i) {
      index = (i + shots.length) % shots.length;
      var shot = shots[index];
      img.src = shot.getAttribute('data-full') || $('img', shot).src;
      img.alt = captionFor(index) || t('photo');
      cap.textContent = captionFor(index);
      box.setAttribute('aria-label', captionFor(index) || t('photo'));
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('lb-open');
      $('[data-lb-close]').focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    shots.forEach(function (shot, i) {
      shot.addEventListener('click', function () { open(i); });
    });

    $('[data-lb-close]').addEventListener('click', close);
    $('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
    $('[data-lb-next]').addEventListener('click', function () { show(index + 1); });

    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape')     { close(); }
      if (e.key === 'ArrowLeft')  { show(index - 1); }
      if (e.key === 'ArrowRight') { show(index + 1); }
      if (e.key === 'Tab') {
        // keep focus inside the dialog
        var focusables = $$('button', box);
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }());


  /* ══════════════════ 5. ADD TO CALENDAR ══════════════════ */
  // The event is added as an ALL-DAY event (no start time), so it sits at the
  // top of the guest's day instead of blocking 15:00. All-day events use plain
  // YYYYMMDD dates and an EXCLUSIVE end date, i.e. the day after.

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  // calendar date → YYYYMMDD (all-day / floating, no timezone).
  // Built from UTC parts because the source Date is constructed with Date.UTC.
  function dayStamp(d) {
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate());
  }

  // UTC timestamp → YYYYMMDDTHHMMSSZ (only used for DTSTAMP)
  function utcStamp(d) {
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
           'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  }

  var icsUrl = null;

  // Hoisted so setLang() can call it before this point in the file.
  function refreshCalendarLinks() {
    var g = $('#cal-google'), i = $('#cal-ics');
    if (!g && !i) return;

    var title = t('calTitle'), where = t('calWhere'), note = t('calNote');

    var w = CONFIG.weddingDay;
    var startDay = new Date(Date.UTC(w.y, w.m - 1, w.d));
    var endDay = new Date(startDay);
    endDay.setUTCDate(endDay.getUTCDate() + 1); // exclusive end → single all-day event

    var start = dayStamp(startDay), end = dayStamp(endDay);

    if (g) {
      g.href = 'https://calendar.google.com/calendar/render' +
        '?action=TEMPLATE' +
        '&text='     + encodeURIComponent(title) +
        '&dates='    + start + '/' + end +
        '&details='  + encodeURIComponent(note) +
        '&location=' + encodeURIComponent(where);
    }

    if (i) {
      var esc = function (s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); };
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Vavea & Linas//Save the Date//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:vavea-linas-2027-07-31@vavea-linas',
        'DTSTAMP:' + utcStamp(new Date()),
        'DTSTART;VALUE=DATE:' + start,
        'DTEND;VALUE=DATE:'   + end,
        'SUMMARY:'     + esc(title),
        'DESCRIPTION:' + esc(note),
        'LOCATION:'    + esc(where),
        'TRANSP:TRANSPARENT',
        'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE',
        'BEGIN:VALARM',
        'TRIGGER;RELATED=START:-P7D',
        'ACTION:DISPLAY',
        'DESCRIPTION:' + esc(title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      if (icsUrl) URL.revokeObjectURL(icsUrl);
      icsUrl = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      i.href = icsUrl;
    }
  }


  /* ══════════════════ 6. FORM ══════════════════ */
  (function form() {
    var form   = $('#rsvp-form');
    var status = $('#form-status');
    var thanks = $('#thankyou');
    if (!form) return;

    var btn = $('[data-submit]', form);

    function succeed() {
      form.reset();
      clearErrors();
      say('');
      form.hidden = true;
      if (!thanks) { say(t('sent'), 'is-ok'); form.hidden = false; return; }
      refreshCalendarLinks();
      thanks.hidden = false;
      // let the browser paint the hidden→visible switch before animating
      requestAnimationFrame(function () { thanks.classList.add('is-in'); });
      thanks.focus();
    }

    function fieldOf(input) { return input.closest('.field'); }

    function clearErrors() {
      $$('.field', form).forEach(function (f) {
        f.classList.remove('has-error');
        var msg = $('.field-error', f);
        if (msg) msg.remove();
      });
      $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
    }

    function addError(input, message) {
      var f = fieldOf(input);
      if (!f || $('.field-error', f)) return;
      f.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      var p = document.createElement('span');
      p.className = 'field-error';
      p.textContent = message;
      f.appendChild(p);
    }

    function validate() {
      clearErrors();
      var bad = null;

      ['#f-name', '#f-address'].forEach(function (sel) {
        var el = $(sel, form);
        if (!el.value.trim()) { addError(el, t('required')); bad = bad || el; }
      });

      var picked = $('input[name="attending"]:checked', form);
      if (!picked) {
        var fs = $('.field--choice', form);
        if (fs && !$('.field-error', fs)) {
          fs.classList.add('has-error');
          var p = document.createElement('span');
          p.className = 'field-error';
          p.textContent = t('choose');
          fs.appendChild(p);
        }
        bad = bad || $('input[name="attending"]', form);
      }

      if (bad) { bad.focus(); }
      return !bad;
    }

    function say(message, kind) {
      status.textContent = message;
      status.classList.remove('is-ok', 'is-err');
      if (kind) status.classList.add(kind);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot — silently pretend success for bots
      if ($('#f-hp', form).value) { succeed(); return; }

      if (!validate()) return;

      var data = {
        name:      $('#f-name', form).value.trim(),
        address:   $('#f-address', form).value.trim(),
        attending: ($('input[name="attending"]:checked', form) || {}).value || '',
        note:      $('#f-note', form).value.trim(),
        language:  lang,
        submittedAt: new Date().toISOString()
      };

      // ── demo mode ─────────────────────────────────────────
      if (!CONFIG.endpoint) {
        console.log('[Vavea & Linas] Form data (demo mode — nothing sent):', data);
        btn.classList.add('is-sending');
        btn.disabled = true;
        say(t('sending'));
        setTimeout(function () {
          btn.classList.remove('is-sending');
          btn.disabled = false;
          succeed();
        }, 900);
        return;
      }

      btn.classList.add('is-sending');
      btn.disabled = true;
      say(t('sending'));

      // Apps Script Web Apps reject cross-origin JSON preflights, so we send
      // the payload as text/plain — the script parses it with JSON.parse().
      fetch(CONFIG.endpoint, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json().catch(function () { return { ok: true }; });
        })
        .then(function (res) {
          if (res && res.ok === false) throw new Error(res.error || 'rejected');
          succeed();
        })
        .catch(function (err) {
          console.error('[Vavea & Linas] submit failed:', err);
          say(t('failed'), 'is-err');
        })
        .then(function () {
          btn.classList.remove('is-sending');
          btn.disabled = false;
        });
    });

    // clear a field's error as soon as the guest starts fixing it
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('has-error')) {
        f.classList.remove('has-error');
        var msg = $('.field-error', f);
        if (msg) msg.remove();
        e.target.removeAttribute('aria-invalid');
      }
    });
  }());

}());
