/* ============================================================
   Vavea & Linas — Save the Date
   ============================================================ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     ⚙️  CONFIGURATION — edit these two values
     ══════════════════════════════════════════════════════════ */
  var CONFIG = {
    // The wedding day (year, monthIndex 0-11, day, hour, minute) — local time.
    weddingDate: new Date(2027, 6, 31, 15, 0, 0), // 31 July 2027, 15:00

    // Paste your Google Apps Script Web App URL here.
    // See README.md → "Collecting the answers" for the 5-minute setup.
    // Leave as '' while developing: the form will run in demo mode.
    endpoint: 'https://script.google.com/macros/s/AKfycbyZVW7dJGLdOBcp6jfVHB-1RbUweCSRtuANd9CidBWe2SvelaictxyXMwyBnD1Upo_IpQ/exec'
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
      failed:   'Something went wrong. Please try again, or email us at hello@vavea-linas.lt',
      demo:     'Demo mode: no backend connected yet, so nothing was sent. See README.md to hook up the Google Sheet.',
      required: 'Please fill this in',
      email:    'Please enter a valid email address',
      choose:   'Please pick one',
      close:    'Close', prev: 'Previous', next: 'Next', photo: 'Photo'
    },
    lt: {
      sending:  'Siunčiama…',
      sent:     'Dėkojame! Jūsų duomenys jau pas mus — tikras pakvietimas jau pakeliui. 💌',
      failed:   'Kažkas nutiko. Pabandykite dar kartą arba rašykite hello@vavea-linas.lt',
      demo:     'Demonstracinis režimas: serveris dar nesujungtas, todėl niekas nebuvo išsiųsta. Žr. README.md.',
      required: 'Užpildykite šį lauką',
      email:    'Įveskite teisingą el. pašto adresą',
      choose:   'Pasirinkite vieną',
      close:    'Uždaryti', prev: 'Ankstesnė', next: 'Kita', photo: 'Nuotrauka'
    },
    fr: {
      sending:  'Envoi en cours…',
      sent:     'Merci ! Vos coordonnées sont bien arrivées — une véritable invitation est en route. 💌',
      failed:   'Une erreur est survenue. Merci de réessayer ou de nous écrire à hello@vavea-linas.lt',
      demo:     'Mode démo : aucun serveur n’est encore connecté, rien n’a donc été envoyé. Voir README.md.',
      required: 'Merci de remplir ce champ',
      email:    'Merci de saisir une adresse e-mail valide',
      choose:   'Merci de choisir une option',
      close:    'Fermer', prev: 'Précédente', next: 'Suivante', photo: 'Photo'
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


  /* ══════════════════ 5. FORM ══════════════════ */
  (function form() {
    var form   = $('#rsvp-form');
    var status = $('#form-status');
    if (!form) return;

    var btn = $('[data-submit]', form);

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

      ['#f-first', '#f-last', '#f-address'].forEach(function (sel) {
        var el = $(sel, form);
        if (!el.value.trim()) { addError(el, t('required')); bad = bad || el; }
      });

      var email = $('#f-email', form);
      if (!email.value.trim())                      { addError(email, t('required')); bad = bad || email; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        addError(email, t('email')); bad = bad || email;
      }

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
      if ($('#f-hp', form).value) { say(t('sent'), 'is-ok'); return; }

      if (!validate()) return;

      var data = {
        firstName: $('#f-first', form).value.trim(),
        lastName:  $('#f-last', form).value.trim(),
        email:     $('#f-email', form).value.trim(),
        address:   $('#f-address', form).value.trim(),
        attending: ($('input[name="attending"]:checked', form) || {}).value || '',
        note:      $('#f-note', form).value.trim(),
        language:  lang,
        submittedAt: new Date().toISOString()
      };

      // ── demo mode ─────────────────────────────────────────
      if (!CONFIG.endpoint) {
        console.log('[Vavea & Linas] Form data (demo mode — nothing sent):', data);
        say(t('demo'), 'is-ok');
        return;
      }

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
          form.reset();
          clearErrors();
          say(t('sent'), 'is-ok');
          status.focus();
        })
        .catch(function (err) {
          console.error('[Vavea & Linas] submit failed:', err);
          say(t('failed'), 'is-err');
        })
        .then(function () { btn.disabled = false; });
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
