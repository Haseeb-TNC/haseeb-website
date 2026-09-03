/* ============================================================
   Haseeb public site — behaviour.
   No network calls of any kind. No libraries. No storage except one
   sessionStorage flag for the opening film.

   NOTHING HERE IS REQUIRED FOR THE PAGE TO WORK. The document renders and
   is usable with scripting off: sections are visible unless this file adds
   `js` to <html>, the film overlay stays [hidden] unless this file shows
   it, and the application form has a real mailto: action that the browser
   submits on its own. Everything below is enhancement.
   ============================================================ */
(function () {
  'use strict';

  /* First thing, before anything can throw: the stylesheet hides .reveal
     sections only under html.js, so this class is the switch that hands the
     page's entrance animation over to script. If this line never runs, the
     whole page is simply visible. */
  document.documentElement.classList.add('js');

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------
     Page-ready gate. The film is an overlay over the fully rendered page,
     so the page's own entrance (hero reveal, sticky CTA, launcher) must not
     run underneath it. Everything that reveals page furniture registers
     here; the film releases the gate at its hand-off, or immediately when
     policy says there is no film to play.
     --------------------------------------------------------- */
  var readyDone = false;
  var readyQueue = [];

  function onPageReady(fn) {
    if (readyDone) fn();
    else readyQueue.push(fn);
  }

  function markPageReady() {
    if (readyDone) return;
    readyDone = true;
    document.body.classList.add('ui-ready');
    readyQueue.splice(0).forEach(function (fn) { fn(); });
  }

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  onPageReady(function reveal() {
    var els = document.querySelectorAll('.reveal');
    function showAll() {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('visible'); });
    }
    if (!('IntersectionObserver' in window) || reduceQuery.matches) { showAll(); return; }

    Array.prototype.forEach.call(document.querySelectorAll('.hero .reveal'), function (el) {
      el.classList.add('visible');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  });

  /* ---------------------------------------------------------
     Nav: scrolled state, mobile menu
     --------------------------------------------------------- */
  (function nav() {
    var bar = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');
    if (!bar || !toggle || !menu) return;

    function onScroll() { bar.classList.toggle('scrolled', window.scrollY > 24); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setOpen(open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (ev) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!ev.target.closest('#navMenu') && !ev.target.closest('#navToggle')) setOpen(false);
    });
  })();

  /* ---------------------------------------------------------
     Language switch — keep the current section anchor
     --------------------------------------------------------- */
  (function langSwitch() {
    var links = document.querySelectorAll('[data-lang-switch]');
    Array.prototype.forEach.call(links, function (a) {
      var base = a.getAttribute('href');
      function sync() { a.setAttribute('href', base + (window.location.hash || '')); }
      sync();
      window.addEventListener('hashchange', sync);
      a.addEventListener('mousedown', sync);
      a.addEventListener('focus', sync);
    });
  })();

  /* ---------------------------------------------------------
     Conversation drawer — guided demo.

     Recreates the product's in-app conversation drawer. There is no
     endpoint of any kind: the three suggested questions have scripted
     answers rendered by the build from ONE fixture, and anything typed gets
     the demo-boundary reply. No answer is ever generated here, and free
     text is never echoed as if it had been understood.

     THE STATE MACHINE (round 7 §4). Two pieces of state make every rule
     below hold at once:

       token   an integer bumped on every reset, close and page-hide. Every
               deferred callback captures the token it was scheduled under
               and does nothing if it no longer matches, so an answer from a
               conversation the visitor has already left can never render.
       busy    true while an answer is being prepared. It disables the send
               button and every remaining suggestion, so a double click, a
               second Enter, or a click on another suggestion cannot create
               an unanswered or duplicated message.

     Every timeout is registered in `timers` and cleared on answer, close,
     new conversation and visibilitychange. A suggestion is removed from the
     DOM the moment it is chosen, so it is usable exactly once; when the
     last one goes the whole block is hidden until a new conversation.
     --------------------------------------------------------- */
  (function drawer() {
    var drawerEl = document.getElementById('botDialog');
    var backdrop = document.getElementById('botBackdrop');
    var launcher = document.getElementById('botLauncher');
    var askDemo = document.getElementById('askDemo');
    var closeBtn = document.getElementById('botClose');
    var newBtn = document.getElementById('botNew');
    var body = document.getElementById('botBody');
    var empty = document.getElementById('botEmpty');
    var suggest = document.getElementById('botSuggest');
    var chips = document.getElementById('botChips');
    var thread = document.getElementById('botThread');
    var store = document.getElementById('botStore');
    var form = document.getElementById('botForm');
    var text = document.getElementById('botText');
    var send = document.getElementById('botSend');
    if (!drawerEl || !backdrop || !launcher || !chips || !thread || !store) return;

    var THINK_MS = 600;
    var INERT = ['nav.nav', 'main', 'footer.foot', '#stickyCta'];
    var openers = [launcher, askDemo].filter(Boolean);
    var lastOpener = launcher;

    /* the three suggestions as authored, kept detached so a reset can put
       every one of them back exactly as it shipped */
    var chipSeed = chips.cloneNode(true);

    var token = 0;
    var busy = false;
    var timers = [];

    function later(fn, ms) {
      var mine = token;
      var id = window.setTimeout(function () {
        timers = timers.filter(function (t) { return t !== id; });
        if (mine !== token) return;      /* a conversation that no longer exists */
        fn();
      }, ms);
      timers.push(id);
      return id;
    }

    function clearTimers() {
      timers.splice(0).forEach(function (id) { window.clearTimeout(id); });
    }

    /* cancel everything pending and unlock the controls, without touching
       the transcript */
    function cancelPending() {
      token += 1;
      clearTimers();
      var spin = thread.querySelector('.bot-thinking');
      if (spin && spin.parentNode) spin.parentNode.removeChild(spin);
      busy = false;
      syncControls();
    }

    function setExpanded(v) {
      openers.forEach(function (o) { o.setAttribute('aria-expanded', v ? 'true' : 'false'); });
    }

    function setInert(on) {
      INERT.forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    function focusables() {
      var all = drawerEl.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      return Array.prototype.filter.call(all, function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
    }

    function remaining() {
      return Array.prototype.slice.call(chips.querySelectorAll('.bot-chip'));
    }

    /* the one place that decides what is clickable */
    function syncControls() {
      remaining().forEach(function (c) { c.disabled = busy; });
      if (suggest) suggest.hidden = remaining().length === 0;
      if (send && text) send.disabled = busy || text.value.trim().length === 0;
      if (text) text.readOnly = busy;
    }

    function open(opener) {
      if (!drawerEl.hidden) return;
      lastOpener = opener || launcher;
      drawerEl.hidden = false;
      backdrop.hidden = false;
      drawerEl.classList.add('entering');
      setExpanded(true);
      document.body.classList.add('bot-open');
      setInert(true);
      var chip = remaining()[0];
      (chip || text || drawerEl).focus();
    }

    function close() {
      if (drawerEl.hidden) return;
      cancelPending();                    /* §4: closing cancels pending timers */
      drawerEl.hidden = true;
      drawerEl.classList.remove('entering');
      backdrop.hidden = true;
      setExpanded(false);
      document.body.classList.remove('bot-open');
      setInert(false);
      if (lastOpener) lastOpener.focus();
    }

    /* ---- transcript ---- */

    function scrollDown() { if (body) body.scrollTop = body.scrollHeight; }

    function addUser(value) {
      var row = document.createElement('div');
      row.className = 'bot-msg bot-msg-user';
      var bubble = document.createElement('div');
      bubble.className = 'bot-user';
      bubble.setAttribute('dir', 'auto');   /* the visitor may type either language */
      bubble.textContent = value;           /* always plain text, never markup */
      row.appendChild(bubble);
      thread.appendChild(row);
      return row;
    }

    function addAnswer(key) {
      var source = store.querySelector('[data-store="' + key + '"]');
      if (!source) return null;
      var row = document.createElement('div');
      row.className = 'bot-msg bot-msg-assistant';
      var node = source.cloneNode(true);
      node.removeAttribute('data-store');
      row.appendChild(node);
      thread.appendChild(row);
      return row;
    }

    function addThinking() {
      var source = store.querySelector('[data-store="thinking"]');
      if (!source) return null;
      var node = source.cloneNode(true);
      node.removeAttribute('data-store');
      thread.appendChild(node);
      return node;
    }

    function answer(key, moveFocus) {
      if (busy) return;
      busy = true;
      if (empty) empty.hidden = true;
      syncControls();

      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var thinking = reduce ? null : addThinking();
      scrollDown();

      function finish() {
        if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
        addAnswer(key);
        busy = false;
        syncControls();
        scrollDown();
        if (moveFocus) {
          var next = remaining()[0] || text;
          if (next) next.focus();
        }
      }

      if (reduce) finish();
      else later(finish, THINK_MS);
    }

    /* "New conversation": nothing survives it — not a timer, not a message,
       and not a spent suggestion. */
    function reset() {
      cancelPending();
      thread.innerHTML = '';
      chips.innerHTML = '';
      Array.prototype.forEach.call(chipSeed.children, function (c) {
        chips.appendChild(c.cloneNode(true));
      });
      if (empty) empty.hidden = false;
      if (text) text.value = '';
      syncControls();
      scrollDown();
      var first = remaining()[0];
      if (first && !drawerEl.hidden) first.focus();
    }

    /* ---- wiring ---- */

    launcher.addEventListener('click', function () {
      if (drawerEl.hidden) open(launcher); else close();
    });
    if (askDemo) askDemo.addEventListener('click', function () { open(askDemo); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (newBtn) newBtn.addEventListener('click', reset);
    backdrop.addEventListener('click', close);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelPending();
    });

    drawerEl.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.bot-chip');
      if (!chip || chip.disabled) return;
      if (busy) return;
      var key = chip.getAttribute('data-answer');
      var label = chip.textContent.trim();
      /* spent the moment it is chosen: a second click has nothing to hit */
      if (chip.parentNode) chip.parentNode.removeChild(chip);
      addUser(label);
      answer(key, true);
    });

    if (form && text && send) {
      text.addEventListener('input', syncControls);
      text.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit(); }
      });
      form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(); });
    }

    function submit() {
      if (busy || !text) return;
      var value = text.value.trim();
      if (!value) return;
      addUser(value);
      text.value = '';
      answer('boundary', false);
    }

    document.addEventListener('keydown', function (ev) {
      if (drawerEl.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
      if (ev.key !== 'Tab') return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      var active = document.activeElement;
      var inside = drawerEl.contains(active);
      if (ev.shiftKey) {
        if (!inside || active === first) { ev.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        ev.preventDefault();
        first.focus();
      }
    });

    syncControls();
  })();

  /* ---------------------------------------------------------
     Founding-cohort form — opens the visitor's own email app.

     The form already carries action="mailto:founder@haseeb.app" method=post
     enctype=text/plain, which is what submits it with scripting off. This
     handler takes the event first and composes a better subject and body
     from the same three fields. Either way nothing is posted to a server:
     there is no endpoint anywhere in this project.
     --------------------------------------------------------- */
  (function form() {
    var form = document.getElementById('cohortForm');
    if (!form) return;
    var status = document.getElementById('formStatus');
    var fields = [
      { input: document.getElementById('f-name'), err: document.getElementById('e-name'), test: function (v) { return v.length > 0; } },
      { input: document.getElementById('f-phone'), err: document.getElementById('e-phone'), test: function (v) { return v.length > 0; } },
      { input: document.getElementById('f-email'), err: document.getElementById('e-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } }
    ];

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstBad = null;
      var values = [];

      fields.forEach(function (f) {
        var v = f.input.value.trim();
        var ok = f.test(v);
        f.err.hidden = ok;
        f.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstBad) firstBad = f.input;
        values.push(v);
      });

      if (firstBad) {
        status.className = 'form-status bad';
        status.textContent = form.getAttribute('data-summary');
        firstBad.focus();
        return;
      }

      var lines = [
        form.getAttribute('data-heading'),
        '---------------------------',
        fields[0].input.getAttribute('data-label') + ': ' + values[0],
        fields[1].input.getAttribute('data-label') + ': ' + values[1],
        fields[2].input.getAttribute('data-label') + ': ' + values[2],
        '',
        form.getAttribute('data-trailer')
      ];

      var subject = form.getAttribute('data-subject').replace('{name}', values[0]);
      var href = 'mailto:' + form.getAttribute('data-to') +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;
      status.className = 'form-status ok';
      status.textContent = form.getAttribute('data-success');
    });
  })();

  /* ---------------------------------------------------------
     Mobile sticky CTA
     --------------------------------------------------------- */
  onPageReady(function sticky() {
    var bar = document.getElementById('stickyCta');
    var hero = document.getElementById('top');
    var apply = document.getElementById('apply');
    if (!bar || !hero || !apply) return;

    function check() {
      var past = window.scrollY > (hero.offsetTop + hero.offsetHeight - 120);
      var nearApply = apply.getBoundingClientRect().top < window.innerHeight;
      var show = past && !nearApply;
      if (show) {
        bar.hidden = false;
        requestAnimationFrame(function () { bar.classList.add('up'); });
      } else {
        bar.classList.remove('up');
        bar.hidden = true;
      }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
  });

  /* FILM-MODULE:START ─────────────────────────────────────────────────────
     THE OPENING FILM — one continuous composition, ≈7.6 s.
     Business activity is constantly moving; Haseeb brings clarity and order;
     the owner stays in control.

     ONE rAF loop computes every value on screen from the clock and writes it:
     the canvas field, the three statements, the wordmark, the overlay's own
     dissolve. Nothing is switched and nothing is scheduled by a timer that
     could land between frames, so "no hard cuts" is a property of the code.

     Storyboard (s):  0.00 the field is already alive · 1.60 statement 1 FORMS
     over it · 2.40-4.00 a teal current crosses once, and as it passes each
     token that token damps and interpolates into an ordered row (words in one
     column, amounts aligned on the decimal point) while still drifting —
     order, not stop · 3.20 statement 2, HASEEB in teal · 4.60 statement 3;
     the three are one block and the field fades while it keeps flowing ·
     6.00-6.80 the block condenses and dissolves while the HASEEB. wordmark
     forms at the centre out of the current · 6.80-7.60 the wordmark FLIPs
     into the nav position while the overlay dissolves over the hero.

     One factory, no site-specific selector: everything comes from the root it
     is handed and from its options, every element addressed by class. That is
     what lets docs/film-proof.html run THIS code — scripts/build.mjs copies
     the block between these markers into that page verbatim.

     Canvas 2D and inline styles. No image, video, audio, library or network.
     ------------------------------------------------------------------ */
  function createFilm(root, options) {
    var opts = options || {};
    var doc = root.ownerDocument;
    var win = doc.defaultView || window;

    /* the reduced-motion guard lives INSIDE the film: no film at all */
    var reduceQuery = win.matchMedia('(prefers-reduced-motion: reduce)');

    var field = root.querySelector('.film-field');
    var canvas = root.querySelector('.film-canvas');
    var linesBox = root.querySelector('.film-lines');
    var lines = Array.prototype.slice.call(root.querySelectorAll('.film-line'));
    var mark = root.querySelector('.film-mark');
    var word = root.querySelector('.film-mark-word');
    var skipBtn = root.querySelector('.film-skip');

    var KEY = opts.storageKey || 'haseeb.film.v2';

    /* ---- the storyboard ---- */
    var T = {
      line1: 1.60,
      band0: 2.40,
      line2: 3.20,
      band1: 4.00,
      line3: 4.60,
      fade0: 5.30,
      fade1: 6.50,
      glow0: 5.30,
      glow1: 6.10,
      condense: 6.00,
      markForm: 6.00,
      flip: 6.80,
      end: 7.60
    };
    var FORM_MS = 0.60;        /* how long a statement takes to form */
    var ORDER_MS = 0.90;       /* how long a token takes to fall into order */
    var SKIP_MS = 0.30;        /* the skip dissolve, the same for Esc */
    var FLOW = 9;              /* px/s the ordered rows keep flowing */
    var WATCHDOG_MS = 10000;   /* JS-side twin of the CSS failsafe */

    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    var running = false;
    var ended = false;
    var phase = 'idle';
    var raf = 0;
    var t0 = 0;
    var now = 0;
    var skipAt = -1;
    var timers = [];
    var toks = [];
    var geom = null;
    var flipFrom = null;
    var handedOff = false;
    var W = 0;
    var H = 0;
    var rtl = false;

    function timer(fn, ms) { timers.push(win.setTimeout(fn, ms)); }
    function clearTimers() { timers.splice(0).forEach(function (id) { win.clearTimeout(id); }); }

    /* ---- small maths ---- */
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var lerp = function (a, b, u) { return a + (b - a) * u; };
    /* smootherstep: zero velocity at both ends, so nothing starts or stops
       with a visible corner */
    function ease(u) { u = clamp(u, 0, 1); return u * u * u * (u * (u * 6 - 15) + 10); }
    function span(t, a, b) { return ease((t - a) / (b - a)); }

    /* seeded, so two runs and two languages scatter identically */
    function prng(seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /* ---- the vocabulary, from the field element ---- */
    function list(attr) {
      var v = field ? field.getAttribute(attr) : '';
      return v ? v.split('|').filter(Boolean) : [];
    }
    var VOCAB_WORDS = list('data-film-words');
    var VOCAB_AMOUNTS = list('data-film-amounts');

    /* An amount is split on its three-decimal point so the ordered column
       can align on it: "28.500 KWD" -> head "28", tail ".500 KWD", and
       "د.ك 28.500" -> head "د.ك 28", tail ".500". */
    var THREE_DP = /(\d[\d,]*)(\.\d{3})/;

    /* Canvas has no markup, so the bidi isolation the DOM did with
       <span dir=ltr> is done here with the Unicode isolate controls:
       every digit run is wrapped in LRI … PDI (U+2066 … U+2069).

       Without it "د.ك 28.500" renders as "28 د.ك.500". That is not a bug in
       the renderer — in a left-to-right context the Unicode algorithm gives
       an unmarked number following an Arabic run the level of that run, so
       the whole head reorders and the separately-drawn ".500" then lands on
       the wrong side of the currency mark. Isolating the number makes it a
       neutral object that stays where it was written. */
    var DIGIT_RUN = /[0-9][0-9,]*(?:\.[0-9]+)?|\.[0-9]+/g;
    function isolate(s) { return s.replace(DIGIT_RUN, function (m) { return '\u2066' + m + '\u2069'; }); }

    function splitAmount(s) {
      var m = THREE_DP.exec(s);
      if (!m) return { head: isolate(s), tail: '' };
      var cut = m.index + m[1].length;
      return { head: isolate(s.slice(0, cut)), tail: isolate(s.slice(cut)) };
    }

    /* ---- the field ---- */

    function measure() {
      var r = field.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      rtl = win.getComputedStyle(root).direction === 'rtl';
      if (!ctx) return;
      var dpr = Math.min(3, win.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function fontFor(px, bold) {
      return (bold ? '500 ' : '400 ') + px + 'px ' +
        (rtl ? "'Noto Sans Arabic', system-ui, sans-serif"
             : "'DM Sans', system-ui, sans-serif");
    }
    var MONO = function (px) {
      return "500 " + px + "px 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    };

    /* Token instances: 34 on a desktop field, 16 on a phone, sampled from
       the vocabulary without repeating a neighbour. */
    function build() {
      if (!ctx || !VOCAB_WORDS.length || !VOCAB_AMOUNTS.length) { toks = []; return; }
      var small = W < 720;
      var total = small ? 16 : 34;
      var nWords = Math.round(total * 0.6);
      var nAmts = total - nWords;
      var rnd = prng(20260903);

      function pick(vocab, count) {
        var out = [];
        var last = -1;
        for (var i = 0; i < count; i++) {
          var j = Math.floor(rnd() * vocab.length);
          if (j === last && vocab.length > 1) j = (j + 1) % vocab.length;
          last = j;
          out.push(vocab[j]);
        }
        return out;
      }

      var base = small ? 12 : 15;
      toks = [];
      var i;
      var wordText = pick(VOCAB_WORDS, nWords);
      var amtText = pick(VOCAB_AMOUNTS, nAmts);

      /* Lanes. Speed is drawn fast — this is meant to read as activity, and
         at 0.6 s apart a slow drift is indistinguishable from a still frame
         — and then clamped to the ROOM the token actually has in the
         direction it is going, over the longest stretch it can drift for
         (the last token is not ordered until ~4.2 s). That keeps every
         token's text inside the frame without ever clamping a POSITION,
         which would be a visible stop. */
      var DRIFT_S = 4.2;
      for (i = 0; i < nWords + nAmts; i++) {
        var isAmt = i >= nWords;
        var scale = 0.86 + rnd() * 0.85;
        var sx = W * (0.13 + rnd() * 0.64);
        var sy = H * (0.07 + rnd() * 0.84);
        var dirX = rnd() < 0.5 ? -1 : 1;
        var dirY = rnd() < 0.5 ? -1 : 1;
        var roomX = dirX > 0 ? (W * 0.90 - sx) : (sx - W * 0.07);
        var roomY = dirY > 0 ? (H * 0.93 - sy) : (sy - H * 0.05);
        toks.push({
          amount: isAmt,
          text: isAmt ? amtText[i - nWords] : wordText[i],
          row: isAmt ? i - nWords : i,
          size: Math.round(base * scale),
          soft: rnd() < 0.42,
          sx: sx,
          sy: sy,
          vx: dirX * Math.min(34 + rnd() * 52, Math.max(16, roomX / DRIFT_S)),
          vy: dirY * Math.min(6 + rnd() * 20, Math.max(3, roomY / DRIFT_S)),
          swayA: 0.6 + rnd() * 1.2,
          swayP: rnd() * 6.283,
          fadeIn: 0.30 + rnd() * 0.55
        });
      }
      layout();
    }

    /* The ordered state, in absolute field coordinates, so a token is
       interpolated from where it drifts to where it belongs, never snapped. */
    function layout() {
      if (!ctx || !toks.length) { geom = null; return; }
      var words = toks.filter(function (t) { return !t.amount; });
      var amts = toks.filter(function (t) { return t.amount; });
      var rows = Math.max(words.length, amts.length);
      var rowH = clamp(H / (rows + 5), 14, 26);
      var wordW = 0;
      var headW = 0;
      var tailW = 0;

      words.forEach(function (t) {
        ctx.font = fontFor(t.size, true);
        wordW = Math.max(wordW, ctx.measureText(t.text).width);
      });
      amts.forEach(function (t) {
        var p = splitAmount(t.text);
        t.head = p.head;
        t.tail = p.tail;
        ctx.font = MONO(t.size);
        headW = Math.max(headW, ctx.measureText(p.head).width);
        tailW = Math.max(tailW, ctx.measureText(p.tail).width);
      });

      var gap = clamp(W * 0.05, 26, 96);
      var blockW = wordW + gap + headW + tailW;
      var x0 = (W - blockW) / 2;
      var top = (H - rows * rowH) / 2 + rowH / 2;

      var wordX, decimalX;
      if (rtl) {
        decimalX = x0 + headW;                       /* amounts column first */
        wordX = x0 + headW + tailW + gap + wordW;    /* words end-aligned */
      } else {
        wordX = x0;                                  /* words column first */
        decimalX = x0 + wordW + gap + headW;
      }

      words.forEach(function (t, i) { t.ox = wordX; t.oy = top + i * rowH; });
      amts.forEach(function (t, i) { t.ox = decimalX; t.oy = top + i * rowH; });
      geom = { rows: rows, rowH: rowH, top: top, blockW: blockW };
    }

    /* when did the teal current reach this token? */
    function orderAt(t) {
      var x = t.sx + t.vx * T.band0;
      var m = W * 0.22;
      var u = clamp((x + m) / (W + 2 * m), 0, 1);
      return lerp(T.band0, T.band1, u);
    }

    /* ---- painting ---- */

    function bandX(t) {
      var m = W * 0.22;
      var u = span(t, T.band0, T.band1);
      return lerp(-m, W + m, u) * (rtl ? -1 : 1) + (rtl ? W : 0);
    }

    function glow(t) {
      /* the current gathers back into the centre, becomes the wordmark, and
         then travels with it — so there is always something moving on the
         canvas, right up to the moment the overlay is removed */
      if (t < T.glow0) return null;
      var cx = W / 2;
      var cy = H / 2;
      var fromX = rtl ? W * 0.14 : W * 0.86;

      /* 1 — the current gathers back from the edge it left by */
      var u = span(t, T.glow0, T.glow1);
      var x = lerp(fromX, cx, u);
      var y = lerp(H * 0.42, cy, u);
      var r = lerp(W * 0.42, W * 0.20, u);
      var a = lerp(0.18, 0.26, u);

      /* 2 — and keeps condensing while the wordmark forms out of it. This
         leg is not decoration: without it the canvas holds one still image
         from 6.1 s to the flip, which the continuity probe reads — rightly —
         as the film stopping for seven tenths of a second. */
      var c = span(t, T.glow1, T.flip);
      r = lerp(r, W * 0.115, c);
      a = lerp(a, 0.34, c);
      y = lerp(y, cy - H * 0.012, c);

      if (t > T.flip && flipFrom) {
        var v = span(t, T.flip, T.end);
        x = lerp(cx, flipFrom.x, v);
        y = lerp(cy, flipFrom.y, v);
        r = lerp(W * 0.17, W * 0.025, v);
        a = lerp(0.30, 0.13, v);
      }
      return { x: x, y: y, r: Math.max(6, r), a: a };
    }

    /* The field is the subject until the first statement forms, texture
       while the current orders it, and gone before the three statements
       stand alone. Three interpolations, no step anywhere. */
    function fieldAlphaAt(t) {
      var a = lerp(1, 0.45, ease((t - T.line1) / 0.9));
      a = lerp(a, 0.20, ease((t - (T.band1 - 0.25)) / 0.95));
      return a * (1 - ease((t - T.fade0) / (T.fade1 - T.fade0)));
    }

    function draw(t) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      var fieldAlpha = fieldAlphaAt(t);

      /* the teal current, once, left to right (mirrored on the Arabic page) */
      if (t >= T.band0 - 0.2 && t <= T.band1 + 0.35) {
        var bx = bandX(t);
        var ba = 0.85 * (1 - Math.abs(span(t, T.band0, T.band1) * 2 - 1) * 0.35);
        var bw = clamp(W * 0.10, 60, 190);
        var g = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
        g.addColorStop(0, 'rgba(0,166,132,0)');
        g.addColorStop(0.5, 'rgba(0,166,132,' + (0.34 * ba).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(0,166,132,0)');
        ctx.fillStyle = g;
        ctx.fillRect(bx - bw, 0, bw * 2, H);
        ctx.fillStyle = 'rgba(0,166,132,' + (0.55 * ba).toFixed(3) + ')';
        ctx.fillRect(bx - 1.5, 0, 3, H);
      }

      /* the condensing glow the wordmark forms out of */
      var gl = glow(t);
      if (gl) {
        var rg = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
        rg.addColorStop(0, 'rgba(0,166,132,' + gl.a.toFixed(3) + ')');
        rg.addColorStop(0.55, 'rgba(0,166,132,' + (gl.a * 0.34).toFixed(3) + ')');
        rg.addColorStop(1, 'rgba(0,166,132,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
      }

      if (fieldAlpha <= 0.004 || !toks.length) return;

      ctx.textBaseline = 'middle';
      for (var i = 0; i < toks.length; i++) {
        var tok = toks[i];
        var oAt = tok.orderAt;
        var w = ease((t - oAt) / ORDER_MS);
        var flow = -FLOW * Math.max(0, t - oAt);
        var sway = tok.swayA * Math.sin(t * 0.9 + tok.swayP);

        var dx = tok.sx + tok.vx * t;
        var dy = tok.sy + tok.vy * t + sway * 2;
        var x = lerp(dx, tok.ox, w);
        var y = lerp(dy, tok.oy + flow + sway, w);

        var a = fieldAlpha * (tok.soft ? 0.50 : 0.88) * clamp((t + tok.fadeIn) / 0.95, 0, 1);
        if (a <= 0.004) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#2A2E35';

        if (tok.amount) {
          /* always LTR: a figure is written left to right in Arabic too, and
             an un-isolated currency mark gets reordered into the middle of
             its own number by the bidi algorithm */
          ctx.direction = 'ltr';
          ctx.font = MONO(tok.size);
          ctx.textAlign = 'right';
          ctx.fillText(tok.head, x, y);
          ctx.textAlign = 'left';
          ctx.fillText(tok.tail, x, y);
        } else {
          ctx.direction = rtl ? 'rtl' : 'ltr';
          ctx.font = fontFor(tok.size, true);
          ctx.textAlign = rtl ? 'right' : 'left';
          ctx.fillText(tok.text, x, y);
        }
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
    }

    /* ---- the DOM half of the same frame ---- */

    function paintDom(t) {
      /* the block drifts slowly upward for the whole film, so the three
         statements are never a still picture waiting for the next cue */
      var drift = lerp(10, -10, clamp(t / T.end, 0, 1));
      var cond = ease((t - T.condense) / (T.flip - T.condense));

      if (linesBox) {
        linesBox.style.transform = 'translateY(' + (drift - cond * 46).toFixed(2) + 'px)';
        linesBox.style.opacity = (1 - cond).toFixed(3);
      }

      [T.line1, T.line2, T.line3].forEach(function (at, i) {
        var el = lines[i];
        if (!el) return;
        var u = ease((t - at) / FORM_MS);
        el.style.opacity = u.toFixed(3);
        el.style.transform = 'translateY(' + ((1 - u) * 18).toFixed(2) + 'px)';
        el.style.filter = u >= 1 ? 'none' : 'blur(' + ((1 - u) * 9).toFixed(2) + 'px)';
      });

      if (mark) {
        var f = ease((t - T.markForm) / (T.flip - T.markForm));
        mark.style.opacity = f.toFixed(3);
        if (t < T.flip || !flipFrom) {
          mark.style.filter = f >= 1 ? 'none' : 'blur(' + ((1 - f) * 12).toFixed(2) + 'px)';
          mark.style.transform = 'scale(' + lerp(0.86, 1, f).toFixed(4) + ')';
        } else {
          var v = span(t, T.flip, T.end - 0.05);
          mark.style.filter = 'none';
          mark.style.transform =
            'translate(' + (flipFrom.dx * v).toFixed(2) + 'px,' + (flipFrom.dy * v).toFixed(2) + 'px) ' +
            'scale(' + lerp(1, flipFrom.ratio, v).toFixed(4) + ')';
        }
      }

      /* the overlay dissolves over a page that is already there */
      var a = 1 - ease((t - (T.flip + 0.05)) / (T.end - (T.flip + 0.05)));
      if (skipAt >= 0) a = Math.min(a, 1 - clamp((t - skipAt) / SKIP_MS, 0, 1));
      root.style.opacity = a.toFixed(3);
    }

    /* the FLIP: measured once, at the moment it starts */
    function prepareFlip() {
      if (flipFrom || !mark || !word) return;
      var target = typeof opts.handoffTarget === 'function' ? opts.handoffTarget() : opts.handoffTarget;
      if (!target) { flipFrom = { dx: 0, dy: 0, ratio: 1, x: W / 2, y: H / 2 }; return; }
      var tr = target.getBoundingClientRect();
      var wr = word.getBoundingClientRect();
      var mr = mark.getBoundingClientRect();
      var fr = field.getBoundingClientRect();
      var ratio = parseFloat(win.getComputedStyle(target).fontSize) /
                  parseFloat(win.getComputedStyle(word).fontSize);
      if (!isFinite(ratio) || ratio <= 0) ratio = 0.4;
      mark.style.transformOrigin =
        (wr.left + wr.width / 2 - mr.left) + 'px ' + (wr.top + wr.height / 2 - mr.top) + 'px';
      flipFrom = {
        dx: Math.round((tr.left + tr.width / 2) - (wr.left + wr.width / 2)),
        dy: Math.round((tr.top + tr.height / 2) - (wr.top + wr.height / 2)),
        ratio: ratio,
        x: tr.left + tr.width / 2 - fr.left,
        y: tr.top + tr.height / 2 - fr.top
      };
    }

    /* ---- phases, for the proof page caption and for tests ---- */
    var PHASES = [
      [0, 'activity'], [T.line1, 'statement-1'], [T.band0, 'order'],
      [T.line2, 'statement-2'], [T.line3, 'statement-3'],
      [T.condense, 'wordmark'], [T.flip, 'handoff']
    ];
    function phaseAt(t) {
      var name = 'activity';
      for (var i = 0; i < PHASES.length; i++) if (t >= PHASES[i][0]) name = PHASES[i][1];
      return name;
    }

    function setPhase(name, at) {
      if (phase === name) return;
      phase = name;
      root.setAttribute('data-phase', name);
      var ms = Math.round((at === undefined ? now : at) * 1000);
      if (opts.onBeat) opts.onBeat(name, ms);
      try {
        root.dispatchEvent(new CustomEvent('film:beat', {
          bubbles: true, detail: { beat: name, t: ms }
        }));
      } catch (e) {}
    }

    /* ---- the loop ---- */

    function frame(stamp) {
      if (!running) return;
      now = (stamp - t0) / 1000;
      var t = now;
      if (t >= T.flip) {
        prepareFlip();
        /* the page beneath is revealed HERE, not at the end: §2 asks for the
           overlay to dissolve over an already-rendered hero, and the reveal
           transition needs the dissolve's own 0.75 s to finish inside */
        if (!handedOff) { handedOff = true; if (opts.onHandoff) opts.onHandoff(); }
      }
      draw(t);
      paintDom(t);
      setPhase(skipAt >= 0 ? 'handoff' : phaseAt(t), t);
      if (skipAt >= 0 && t >= skipAt + SKIP_MS) { finish('skipped'); return; }
      if (t >= T.end) { finish('completed'); return; }
      raf = win.requestAnimationFrame(frame);
    }

    /* ---- session policy ---- */

    function seen() {
      if (opts.once === false) return false;
      try { return win.sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    }
    function markSeen() {
      if (opts.once === false) return;
      try { win.sessionStorage.setItem(KEY, '1'); } catch (e) {}
    }
    function saveData() {
      var c = win.navigator && (win.navigator.connection || win.navigator.webkitConnection);
      return !!(c && c.saveData);
    }

    /* ---- entry and exit ---- */

    function skipNow() {
      if (!running || ended || skipAt >= 0) return;
      skipAt = now;
      setPhase('handoff');
      if (!handedOff) { handedOff = true; if (opts.onHandoff) opts.onHandoff(); }
    }

    function onKey(ev) {
      if (!running || ended) return;
      if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); skipNow(); }
    }

    function onResize() {
      if (!running) return;
      measure();
      layout();
    }

    function finish(reason) {
      if (ended) return;
      ended = true;
      running = false;
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0;
      clearTimers();
      if (!handedOff) { handedOff = true; if (opts.onHandoff) opts.onHandoff(); }
      root.setAttribute('data-phase', reason === 'skipped' ? 'skipped' : 'done');
      phase = reason === 'skipped' ? 'skipped' : 'done';
      root.hidden = true;
      doc.removeEventListener('keydown', onKey, true);
      win.removeEventListener('resize', onResize);
      if (opts.onEnd) opts.onEnd(reason);
    }

    function reset() {
      if (raf) win.cancelAnimationFrame(raf);
      raf = 0;
      clearTimers();
      running = false;
      ended = false;
      skipAt = -1;
      now = 0;
      flipFrom = null;
      handedOff = false;
      phase = 'idle';
      root.setAttribute('data-phase', 'idle');
      root.hidden = true;
      root.style.opacity = '';
      if (mark) { mark.style.cssText = ''; }
      if (linesBox) { linesBox.style.cssText = ''; }
      lines.forEach(function (el) { el.style.cssText = ''; });
      doc.removeEventListener('keydown', onKey, true);
      win.removeEventListener('resize', onResize);
    }

    function play() {
      reset();
      if (!field || !canvas || !ctx || !skipBtn) return 'unsupported';
      if (reduceQuery.matches) { root.setAttribute('data-phase', 'reduced-motion'); return 'reduced-motion'; }
      if (saveData()) { root.setAttribute('data-phase', 'save-data'); return 'save-data'; }
      if (seen()) { root.setAttribute('data-phase', 'seen'); return 'seen'; }
      markSeen();

      root.hidden = false;
      running = true;
      measure();
      build();

      /* Fonts: start on the fallback face rather than waiting for the web
         font, then re-measure the ordered columns once it lands — which is
         always long before the ordering begins at 2.4 s. If it is late, the
         layout is left alone rather than moved under the viewer. */
      if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
        doc.fonts.ready.then(function () {
          if (running && now < 2.0) layout();
        }).catch(function () {});
      }

      toks.forEach(function (tok) { tok.orderAt = orderAt(tok); });

      doc.addEventListener('keydown', onKey, true);
      win.addEventListener('resize', onResize);
      if (opts.onStart) opts.onStart();

      try { skipBtn.focus({ preventScroll: true }); } catch (e) { skipBtn.focus(); }

      /* paint frame ZERO synchronously: the film is never an empty screen */
      draw(0);
      paintDom(0);
      setPhase('activity', 0);

      t0 = win.performance ? win.performance.now() : Date.now();
      raf = win.requestAnimationFrame(frame);

      /* the JS twin of the CSS failsafe: if the loop is somehow still alive
         at ten seconds, hand off anyway */
      timer(function () { finish('watchdog'); }, WATCHDOG_MS);
      return 'playing';
    }

    if (skipBtn) skipBtn.addEventListener('click', skipNow);

    return {
      play: play,
      skip: skipNow,
      reset: reset,
      root: root,
      t: function () { return now; },
      phase: function () { return phase; }
    };
  }
  /* FILM-MODULE:END */

  /* the film, wired to this page: scroll lock, inert page, focus, and the
     release of the page-ready gate at the hand-off */
  (function openingFilm() {
    var root = document.querySelector('.film');
    if (!root) { markPageReady(); return; }

    var INERT = ['nav.nav', 'main', 'footer.foot'];
    var scrollY = window.scrollY;
    var guard = 0;

    function setInert(on) {
      INERT.forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    function teardown() {
      document.body.classList.remove('film-playing');
      setInert(false);
      if (root && root.parentNode) root.parentNode.removeChild(root);
      markPageReady();
    }

    /* RESILIENCE (§8). If anything on this page throws, the overlay must not
       be what the visitor is left looking at. This handler is registered
       before the film starts, removes the overlay and gives the page its
       scrolling back. The CSS failsafe on .film covers the case where the
       script stops without throwing at all. */
    function rescue() {
      try { teardown(); } catch (e) { /* nothing left to do */ }
    }
    window.addEventListener('error', rescue);
    window.addEventListener('unhandledrejection', rescue);

    var film = createFilm(root, {
      handoffTarget: function () { return document.querySelector('.nav .wordmark'); },
      onStart: function () {
        scrollY = window.scrollY;
        document.body.classList.add('film-playing');
        setInert(true);
      },
      onHandoff: markPageReady,
      onEnd: function () {
        window.clearTimeout(guard);
        teardown();
        window.scrollTo(0, scrollY);
        var first = document.querySelector('.nav .wordmark');
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      }
    });

    /* the film's own clock and controls, for verification */
    window.__haseebFilm = {
      t: film.t,
      phase: film.phase,
      skip: film.skip
    };

    var status = film.play();
    window.__haseebFilm.status = status;
    if (status !== 'playing') {
      teardown();
    } else {
      /* A last-resort timer that belongs to the PAGE, not to the film. The
         film has its own watchdog, but if the module's loop and its timers
         are lost together this one is still armed, and it is the only layer
         that can put back the two things CSS cannot: the `inert` attribute
         on nav/main/footer and the body scroll lock. Beyond it there is only
         the CSS failsafe, which hides the overlay and nothing more. */
      guard = window.setTimeout(teardown, 10200);
    }
  })();

  /* The launcher is the last thing to appear, and on a short viewport it
     waits for the first scroll too, so it can never sit on top of the hero's
     own call to action. */
  onPageReady(function launcherGate() {
    function show() { document.body.classList.add('launcher-ready'); }
    if (window.innerHeight >= 600) { show(); return; }
    window.addEventListener('scroll', function once() {
      window.removeEventListener('scroll', once);
      show();
    }, { passive: true });
  });

})();
