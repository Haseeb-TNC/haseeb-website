/* ============================================================
   Haseeb public site — behaviour.
   No network calls of any kind. No libraries. No storage.
   ============================================================ */
(function () {
  'use strict';

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 719px)');

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  (function reveal() {
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
  })();

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
     Hero sequence
     Five beats, ~12s, transform/opacity only. The owner's
     approval in stage 4 is an explicit press: nothing in
     stage 5 updates before it.
     --------------------------------------------------------- */
  (function sequence() {
    var seq = document.getElementById('seq');
    var stage = document.getElementById('seqStage');
    var strip = document.getElementById('seqStrip');
    var toggle = document.getElementById('seqToggle');
    if (!seq || !stage || !toggle) return;

    var RESET = {
      line: 'hidden', mini: 'hidden', panel: 'hidden', line2: 'hidden',
      task: 'hidden', reply: 'idle', send: '0',
      draft: 'hidden', approve: 'idle', owner: 'hidden', tween: 'from'
    };

    var STAGES = [
      { n: 1, dur: 2200, beats: [
        { at: 0,    s: { line: 'small' } },
        { at: 700,  s: { line: 'big' } }
      ] },
      { n: 2, dur: 2400, beats: [
        { at: 0,    s: { line: 'mini', mini: 'in' } },
        { at: 280,  s: { panel: 'in' } }
      ] },
      { n: 3, dur: 2800, beats: [
        { at: 0,    s: { line: 'gone', mini: 'gone', panel: 'gone', line2: 'small' } },
        { at: 450,  s: { line2: 'big' } },
        { at: 900,  s: { task: 'in' } },
        { at: 1350, s: { reply: 'typing' } },
        { at: 2100, s: { reply: 'done', send: '1' } },
        { at: 2450, s: { send: '0' } }
      ] },
      { n: 4, dur: 2400, beats: [
        { at: 0,    s: { line2: 'gone', task: 'out' } },
        { at: 400,  s: { task: 'hidden', draft: 'in' } },
        { at: 1300, s: { approve: 'pressed' } },
        { at: 1650, s: { approve: 'done' } }
      ] },
      { n: 5, dur: 2200, beats: [
        { at: 0,    s: { draft: 'thumb' } },
        { at: 400,  s: { owner: 'in' } },
        { at: 800,  s: { tween: 'to' } }
      ] }
    ];

    /* state key -> [selector, attribute] */
    var MAP = {
      line:    ['.f-line',  'data-state'],
      mini:    ['.f-mini',  'data-state'],
      panel:   ['.f-panel', 'data-state'],
      line2:   ['.f-line2', 'data-state'],
      task:    ['.f-task',  'data-state'],
      reply:   ['.f-task',  'data-reply'],
      send:    ['.f-task',  'data-send'],
      draft:   ['.f-draft', 'data-state'],
      approve: ['.btn-mini', 'data-approve'],
      owner:   ['.f-owner', 'data-state']
    };

    function merge(a, b) {
      var out = {}, k;
      for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k]; }
      for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k]; }
      return out;
    }

    /* cumulative state at the end of stage n */
    function stateAt(n) {
      var st = merge(RESET, {});
      for (var i = 0; i < STAGES.length && STAGES[i].n <= n; i++) {
        for (var b = 0; b < STAGES[i].beats.length; b++) st = merge(st, STAGES[i].beats[b].s);
      }
      return st;
    }

    function parseNum(str) { return parseFloat(String(str).replace(/,/g, '')); }
    function formatNum(v) {
      var parts = v.toFixed(3).split('.');
      return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1];
    }

    var tweenTimer = null;

    function setTween(root, mode, animate) {
      var els = root.querySelectorAll('.tween');
      if (tweenTimer && root === stage) { cancelAnimationFrame(tweenTimer); tweenTimer = null; }
      if (!animate || mode === 'from') {
        Array.prototype.forEach.call(els, function (el) {
          el.textContent = el.getAttribute(mode === 'to' ? 'data-to' : 'data-from');
        });
        return;
      }
      var t0 = null, DUR = 600;
      var pairs = Array.prototype.map.call(els, function (el) {
        return { el: el, from: parseNum(el.getAttribute('data-from')), to: parseNum(el.getAttribute('data-to')) };
      });
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DUR);
        var e = 1 - Math.pow(1 - p, 3);
        pairs.forEach(function (pair) {
          pair.el.textContent = formatNum(pair.from + (pair.to - pair.from) * e);
        });
        if (p < 1) tweenTimer = requestAnimationFrame(frame);
        else tweenTimer = null;
      }
      tweenTimer = requestAnimationFrame(frame);
    }

    function applyTo(root, state, animateTween) {
      Object.keys(MAP).forEach(function (key) {
        var el = root.querySelector(MAP[key][0]);
        if (el && state[key] !== undefined) el.setAttribute(MAP[key][1], state[key]);
      });
      setTween(root, state.tween, !!animateTween);
    }

    var timers = [];
    var playing = false;
    var userPaused = false;
    var current = 1;

    function clearTimers() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers = [];
    }

    function runStage(index) {
      var st = STAGES[index];
      current = st.n;
      seq.setAttribute('data-stage', String(st.n));
      var base = index === 0 ? merge(RESET, {}) : stateAt(STAGES[index - 1].n);
      applyTo(stage, base, false);

      st.beats.forEach(function (beat) {
        timers.push(setTimeout(function () {
          Object.keys(beat.s).forEach(function (k) {
            if (k === 'tween') { setTween(stage, beat.s.tween, true); return; }
            var el = stage.querySelector(MAP[k][0]);
            if (el) el.setAttribute(MAP[k][1], beat.s[k]);
          });
        }, beat.at));
      });

      timers.push(setTimeout(function () {
        runStage((index + 1) % STAGES.length);
      }, st.dur));
    }

    function play() {
      if (seq.getAttribute('data-mode') === 'static') return;
      seq.setAttribute('data-mode', 'motion');
      if (strip) { strip.hidden = true; }
      clearTimers();
      playing = true;
      toggle.setAttribute('aria-pressed', 'false');
      toggle.querySelector('.seq-toggle-label').textContent = toggle.getAttribute('data-pause');
      runStage(indexOf(current));
    }

    function pause() {
      clearTimers();
      playing = false;
      toggle.setAttribute('aria-pressed', 'true');
      toggle.querySelector('.seq-toggle-label').textContent = toggle.getAttribute('data-play');
    }

    function indexOf(n) {
      for (var i = 0; i < STAGES.length; i++) { if (STAGES[i].n === n) return i; }
      return 0;
    }

    /* Jump to a stage's settled frame and hold it (used by tests). */
    function goto(n) {
      n = Math.min(5, Math.max(1, Number(n) || 1));
      clearTimers();
      playing = false;
      current = n;
      seq.setAttribute('data-mode', 'motion');
      if (strip) strip.hidden = true;
      seq.setAttribute('data-stage', String(n));
      applyTo(stage, stateAt(n), false);
      toggle.setAttribute('aria-pressed', 'true');
      toggle.querySelector('.seq-toggle-label').textContent = toggle.getAttribute('data-play');
    }

    function buildStrip() {
      if (!strip || strip.getAttribute('data-built') === '1') return;
      var caps = document.querySelectorAll('#seqCaps .seq-cap');
      for (var i = 0; i < STAGES.length; i++) {
        var n = STAGES[i].n;
        var item = document.createElement('div');
        item.className = 'strip-item';

        var framed = document.createElement('div');
        framed.className = 'strip-frame';
        framed.setAttribute('role', 'img');
        framed.setAttribute('aria-label', caps[i] ? caps[i].textContent : '');

        var clone = stage.cloneNode(true);
        clone.removeAttribute('id');
        clone.removeAttribute('role');
        clone.removeAttribute('aria-label');
        clone.setAttribute('aria-hidden', 'true');
        applyTo(clone, stateAt(n), false);
        framed.appendChild(clone);

        var cap = document.createElement('p');
        cap.className = 'strip-cap';
        cap.textContent = caps[i] ? caps[i].textContent : '';

        item.appendChild(framed);
        item.appendChild(cap);
        strip.appendChild(item);
      }
      strip.setAttribute('data-built', '1');
    }

    function showStrip() {
      clearTimers();
      playing = false;
      buildStrip();
      seq.setAttribute('data-mode', 'strip');
      if (strip) strip.hidden = false;
      toggle.setAttribute('aria-pressed', 'true');
      toggle.querySelector('.seq-toggle-label').textContent = toggle.getAttribute('data-play');
    }

    function showStatic() {
      clearTimers();
      playing = false;
      if (strip) strip.hidden = true;
      seq.setAttribute('data-mode', 'static');
      seq.setAttribute('data-stage', '4');
      current = 4;
      applyTo(stage, stateAt(4), false);
    }

    function init() {
      var storyboard = window.location.search.indexOf('storyboard=1') !== -1;
      if (storyboard) { showStrip(); return; }
      if (mobileQuery.matches) { showStatic(); return; }
      if (reduceQuery.matches) { showStrip(); return; }
      userPaused = false;
      play();
    }

    toggle.addEventListener('click', function () {
      if (playing) { userPaused = true; pause(); }
      else { userPaused = false; play(); }
    });

    document.addEventListener('visibilitychange', function () {
      if (seq.getAttribute('data-mode') !== 'motion') return;
      if (document.hidden) { if (playing) pause(); }
      else if (!userPaused && !playing) { play(); }
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (seq.getAttribute('data-mode') !== 'motion') return;
          if (!e.isIntersecting) { if (playing) pause(); }
          else if (!userPaused && !playing && !document.hidden) { play(); }
        });
      }, { threshold: 0.15 });
      io.observe(stage);
    }

    var onMedia = function () { init(); };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onMedia);
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onMedia);

    window.__haseebSeq = {
      goto: goto,
      pause: function () { userPaused = true; pause(); },
      play: function () { userPaused = false; play(); },
      stage: function () { return current; },
      mode: function () { return seq.getAttribute('data-mode'); },
      strip: function () { showStrip(); }
    };

    init();
  })();

  /* ---------------------------------------------------------
     Guided-demo chatbot
     --------------------------------------------------------- */
  (function bot() {
    var dialog = document.getElementById('botDialog');
    var launcher = document.getElementById('botLauncher');
    var askDemo = document.getElementById('askDemo');
    var closeBtn = document.getElementById('botClose');
    var chips = document.getElementById('botChips');
    var again = document.getElementById('botAgain');
    if (!dialog || !launcher || !chips) return;

    var openers = [launcher, askDemo].filter(Boolean);
    var lastOpener = launcher;

    function setExpanded(v) {
      openers.forEach(function (o) { o.setAttribute('aria-expanded', v ? 'true' : 'false'); });
    }

    function open(opener) {
      lastOpener = opener || launcher;
      if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
      else dialog.setAttribute('open', '');
      setExpanded(true);
      document.body.classList.add('bot-open');
      /* re-opening always offers the questions again (answers already given stay
         in the transcript), so there is always a visible element to focus */
      chips.hidden = false;
      if (again) again.hidden = true;
      var first = chips.querySelector('.bot-chip');
      if (first) first.focus();
    }

    function close() {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    }

    dialog.addEventListener('close', function () {
      setExpanded(false);
      document.body.classList.remove('bot-open');
      if (lastOpener) lastOpener.focus();
    });

    launcher.addEventListener('click', function () {
      if (dialog.open) close(); else open(launcher);
    });
    if (askDemo) askDemo.addEventListener('click', function () { open(askDemo); });
    if (closeBtn) closeBtn.addEventListener('click', close);

    /* click on the backdrop area closes */
    dialog.addEventListener('click', function (ev) {
      if (ev.target === dialog) close();
    });

    /* Explicit focus trap. <dialog>.showModal() already makes the rest of the
       page inert, but Chromium's own cycle passes through <body> on the way
       round; this keeps every Tab inside the dialog. */
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab' || !dialog.open) return;
      var all = dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var list = Array.prototype.filter.call(all, function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      var active = document.activeElement;
      var inside = dialog.contains(active);
      if (ev.shiftKey) {
        if (!inside || active === first) { ev.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        ev.preventDefault();
        first.focus();
      }
    });

    chips.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.bot-chip');
      if (!chip) return;
      var target = document.getElementById(chip.getAttribute('data-x'));
      if (!target) return;
      target.hidden = false;
      chips.hidden = true;
      if (again) {
        again.hidden = false;
        again.focus();
      }
    });

    if (again) {
      again.addEventListener('click', function () {
        chips.hidden = false;
        again.hidden = true;
        var first = chips.querySelector('.bot-chip');
        if (first) first.focus();
      });
    }
  })();

  /* ---------------------------------------------------------
     Founding-cohort form — opens the visitor's own email app.
     No endpoint, no storage, no network call.
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
  (function sticky() {
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
  })();

})();
