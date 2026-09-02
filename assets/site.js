/* ============================================================
   Haseeb public site — behaviour.
   No network calls of any kind. No libraries. No storage.
   ============================================================ */
(function () {
  'use strict';

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
     answers rendered by the build from the copy of record, and anything
     typed gets the demo-boundary reply. No answer is ever generated
     here, and free text is never echoed as if it had been understood.
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
    var pending = false;

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

    function open(opener) {
      if (!drawerEl.hidden) return;
      lastOpener = opener || launcher;
      drawerEl.hidden = false;
      backdrop.hidden = false;
      drawerEl.classList.add('entering');
      setExpanded(true);
      document.body.classList.add('bot-open');
      setInert(true);
      var chip = empty && !empty.hidden ? chips.querySelector('.bot-chip') : null;
      (chip || text || drawerEl).focus();
    }

    function close() {
      if (drawerEl.hidden) return;
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

    /* the same three questions, offered again so the demo never dead-ends */
    function addChips() {
      var group = chips.cloneNode(true);
      group.removeAttribute('id');
      thread.appendChild(group);
      return group;
    }

    function answer(key, moveFocus) {
      if (pending) return;
      pending = true;
      if (empty) empty.hidden = true;

      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var thinking = reduce ? null : addThinking();
      scrollDown();

      function finish() {
        if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
        addAnswer(key);
        var group = addChips();
        scrollDown();
        pending = false;
        if (moveFocus) {
          var first = group.querySelector('.bot-chip');
          if (first) first.focus();
        }
      }

      if (reduce) finish();
      else window.setTimeout(finish, THINK_MS);
    }

    function reset() {
      thread.innerHTML = '';
      if (empty) empty.hidden = false;
      if (text) { text.value = ''; syncSend(); }
      pending = false;
      scrollDown();
      var first = chips.querySelector('.bot-chip');
      if (first) first.focus();
    }

    function syncSend() {
      if (send && text) send.disabled = text.value.trim().length === 0;
    }

    /* ---- wiring ---- */

    launcher.addEventListener('click', function () {
      if (drawerEl.hidden) open(launcher); else close();
    });
    if (askDemo) askDemo.addEventListener('click', function () { open(askDemo); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (newBtn) newBtn.addEventListener('click', reset);
    backdrop.addEventListener('click', close);

    drawerEl.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.bot-chip');
      if (!chip) return;
      addUser(chip.textContent.trim());
      answer(chip.getAttribute('data-answer'), true);
    });

    if (form && text && send) {
      text.addEventListener('input', syncSend);
      text.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit(); }
      });
      form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(); });
      syncSend();
    }

    function submit() {
      if (pending || !text) return;
      var value = text.value.trim();
      if (!value) return;
      addUser(value);
      text.value = '';
      syncSend();
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
     The opening film. Storyboard and timings: the T map below, and
     docs/HASEEB-4113-opening-film-spec.md.

     One factory with no site-specific selector in it: everything comes from
     the root element it is handed and from its options, and every element is
     addressed by class. That is what lets docs/film-proof.html run THIS code
     — scripts/build.mjs copies the block between these markers into that
     page verbatim — instead of a fork of it.

     Transform and opacity only, Web Animations API. No image, no canvas, no
     library, no audio, no video, no network call.
     ------------------------------------------------------------------ */
  function createFilm(root, options) {
    var opts = options || {};
    var doc = root.ownerDocument;
    var win = doc.defaultView || window;

    /* the reduced-motion guard lives INSIDE the film: no film at all */
    var reduceQuery = win.matchMedia('(prefers-reduced-motion: reduce)');

    var field = root.querySelector('.film-field');
    var order = root.querySelector('.film-order');
    var band = root.querySelector('.film-band');
    var lines = Array.prototype.slice.call(root.querySelectorAll('.film-line'));
    var mark = root.querySelector('.film-mark');
    var markH = root.querySelector('.film-mark-h');
    var word = root.querySelector('.film-mark-word');
    var rule = root.querySelector('.film-mark-rule');
    var skipBtn = root.querySelector('.film-skip');
    var toks = Array.prototype.slice.call(root.querySelectorAll('.film-tok'));

    var KEY = opts.storageKey || 'haseeb.film.v1';
    var POSTER_BELOW = 720;   /* px of field width */
    var POSTER_HOLD = 1600;
    var HANDOFF = 200;        /* the skip hand-off, and the poster's */
    var BAND_MS = 1100;
    var T = {
      arrive: 600, order: 3200, line1: 4400, line2: 5600,
      line3: 6800, mark: 8000, handoff: 9000, end: 10000
    };

    var anims = [];
    var timers = [];
    var running = false;
    var ended = false;
    var mode = 'idle';
    var t0 = 0;

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

    /* A token snaps when the band REACHES it, so its delay is the inverse of
       the band's easing at its position; a linear clock lets the band run
       ahead of the tokens it is supposed to be ordering. */
    var BAND_EASE = [0.5, 0, 0.5, 1];

    function bandTimeAt(progress) {
      var x1 = BAND_EASE[0], y1 = BAND_EASE[1], x2 = BAND_EASE[2], y2 = BAND_EASE[3];
      var lo = 0, hi = 1, s = 0.5;
      for (var i = 0; i < 26; i++) {
        s = (lo + hi) / 2;
        var u = 1 - s;
        var y = 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s;
        if (y < progress) lo = s; else hi = s;
      }
      var v = 1 - s;
      return 3 * v * v * s * x1 + 3 * v * s * s * x2 + s * s * s;
    }

    function push(a) { if (a) anims.push(a); return a; }
    function timer(fn, ms) { timers.push(win.setTimeout(fn, ms)); }

    function clearAll() {
      timers.splice(0).forEach(function (id) { win.clearTimeout(id); });
      anims.splice(0).forEach(function (a) { try { a.cancel(); } catch (e) {} });
    }

    function emit(name, reason) {
      root.setAttribute('data-beat', name);
      var at = Math.round((win.performance ? win.performance.now() : Date.now()) - t0);
      if (opts.onBeat) opts.onBeat(name, at);
      var detail = { beat: name, t: at };
      if (reason) detail.reason = reason;
      try { root.dispatchEvent(new CustomEvent('film:beat', { bubbles: true, detail: detail })); } catch (e) {}
    }

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

    /* ---- the plan: where each token starts, clusters and lands ---- */

    var EDGES = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

    function plan() {
      var fr = field.getBoundingClientRect();
      var rtl = win.getComputedStyle(root).direction === 'rtl';
      var rnd = prng(20260902);
      return toks.map(function (el, i) {
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2 - fr.left;   /* its ORDERED centre */
        var cy = r.top + r.height / 2 - fr.top;
        var tx = fr.width * (0.5 + (rnd() - 0.5) * 0.66);
        var ty = fr.height * (0.5 + (rnd() - 0.5) * 0.58);
        tx = Math.max(fr.width * 0.08, Math.min(fr.width * 0.92, tx));
        ty = Math.max(fr.height * 0.10, Math.min(fr.height * 0.90, ty));
        var edge = EDGES[i % EDGES.length];
        var scale = 0.95 + rnd() * 0.9;            /* ~14px .. ~28px */
        var rot = (rnd() * 2 - 1) * 4;
        var soft = rnd() < 0.42;
        var late = i % 5 === 3;                    /* a few overshoot and settle */
        var base = rtl ? fr.width - 12 : 0;
        var span = (rtl ? -(fr.width + 60) : fr.width + 60) - (rtl ? 60 : -60);
        var sweep = Math.max(0, Math.min(1, ((tx - base) - (rtl ? 60 : -60)) / (span || 1)));
        return {
          el: el,
          start: 'translate(' + Math.round(tx - cx + edge[0] * (fr.width * 0.62 + 160)) + 'px,' +
                 Math.round(ty - cy + edge[1] * (fr.height * 0.62 + 140)) + 'px) rotate(' +
                 (rot * 3).toFixed(1) + 'deg) scale(' + (scale * 0.86).toFixed(3) + ')',
          cluster: 'translate(' + Math.round(tx - cx) + 'px,' + Math.round(ty - cy) + 'px) rotate(' +
                   rot.toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')',
          over: 'translate(' + Math.round((tx - cx) * 1.14) + 'px,' + Math.round((ty - cy) * 1.14) +
                'px) rotate(' + (rot * 1.5).toFixed(1) + 'deg) scale(' + (scale * 1.06).toFixed(3) + ')',
          opacity: soft ? 0.55 : 1,
          late: late,
          enterAt: T.arrive + i * 85,
          snapAt: T.order + Math.round(bandTimeAt(sweep) * BAND_MS)
        };
      });
    }

    /* ---- the full film ---- */

    function playFull() {
      mode = 'film';
      var fr = field.getBoundingClientRect();
      var rtl = win.getComputedStyle(root).direction === 'rtl';
      var steps = plan();

      push(field.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 400, easing: 'ease-out', fill: 'forwards' }));

      steps.forEach(function (s) {
        var frames = s.late
          ? [{ transform: s.start, opacity: 0, offset: 0 },
             { transform: s.over, opacity: s.opacity, offset: 0.78 },
             { transform: s.cluster, opacity: s.opacity, offset: 1 }]
          : [{ transform: s.start, opacity: 0 },
             { transform: s.cluster, opacity: s.opacity }];
        /* fill BOTH: without the backwards fill every token sits in its
           finished ordered position for the first 600ms — the answer on
           screen before the question. */
        push(s.el.animate(frames, {
          delay: s.enterAt, duration: s.late ? 980 : 860,
          easing: 'cubic-bezier(.16,.84,.44,1)', fill: 'both'
        }));
        push(s.el.animate([
          { transform: s.cluster, opacity: s.opacity },
          { transform: 'none', opacity: 1 }
        ], {
          delay: s.snapAt, duration: 220,
          easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards'
        }));
      });

      /* the ONE teal movement */
      var from = rtl ? 60 : -60;
      var to = rtl ? -(fr.width + 60) : fr.width + 60;
      push(band.animate([
        { transform: 'translateX(' + from + 'px)', opacity: 0, offset: 0 },
        { opacity: 0.95, offset: 0.12 },
        { opacity: 0.95, offset: 0.82 },
        { transform: 'translateX(' + to + 'px)', opacity: 0, offset: 1 }
      ], { delay: T.order, duration: BAND_MS, easing: 'cubic-bezier(.5,0,.5,1)', fill: 'forwards' }));

      /* the ordered rows recede, then hold as texture, then go */
      push(order.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.92)', opacity: 0.18 }],
        { delay: T.line1 - 200, duration: 520, easing: 'ease-out', fill: 'forwards' }));
      push(order.animate([{ transform: 'scale(.92)', opacity: 0.18 }, { transform: 'scale(.90)', opacity: 0.14 }],
        { delay: T.line2, duration: 420, easing: 'ease-out', fill: 'forwards' }));
      push(order.animate([{ transform: 'scale(.90)', opacity: 0.14 }, { transform: 'scale(.88)', opacity: 0 }],
        { delay: T.line3, duration: 600, easing: 'ease-out', fill: 'forwards' }));

      /* the three statements */
      [T.line1, T.line2, T.line3].forEach(function (at, i) {
        var el = lines[i];
        if (!el) return;
        push(el.animate([{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { delay: at, duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
        push(el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-24px)', opacity: 0 }],
          { delay: at + 1200, duration: 260, easing: 'ease-in', fill: 'forwards' }));
      });

      /* the mark */
      push(mark.animate([{ transform: 'scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { delay: T.mark, duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
      if (rule) {
        push(rule.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
          { delay: T.mark + 220, duration: 300, easing: 'ease-out', fill: 'forwards' }));
      }

      ['arrive', 'order', 'line1', 'line2', 'line3', 'mark'].forEach(function (name) {
        timer(function () { emit(name); }, T[name]);
      });
      timer(handoff, T.handoff);
    }

    /* ---- hand-off: the mark becomes the nav wordmark ---- */

    function handoff() {
      emit('handoff');
      if (opts.onHandoff) opts.onHandoff();

      var target = typeof opts.handoffTarget === 'function' ? opts.handoffTarget() : opts.handoffTarget;
      var travel = 520;

      if (target && word && mark) {
        var t = target.getBoundingClientRect();
        var w = word.getBoundingClientRect();
        var m = mark.getBoundingClientRect();
        var ratio = parseFloat(win.getComputedStyle(target).fontSize) /
                    parseFloat(win.getComputedStyle(word).fontSize);
        if (!isFinite(ratio) || ratio <= 0) ratio = 0.4;
        mark.style.transformOrigin =
          (w.left + w.width / 2 - m.left) + 'px ' + (w.top + w.height / 2 - m.top) + 'px';
        var dx = Math.round((t.left + t.width / 2) - (w.left + w.width / 2));
        var dy = Math.round((t.top + t.height / 2) - (w.top + w.height / 2));
        push(mark.animate([
          { transform: 'none' },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + ratio.toFixed(4) + ')' }
        ], { duration: travel, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }));
        if (markH) push(markH.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 260, easing: 'ease-out', fill: 'forwards' }));
        if (rule) push(rule.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 200, easing: 'ease-out', fill: 'forwards' }));
      }

      /* The overlay fades WHILE the mark travels, so the page rises underneath
         it and the mark cross-fades into the real nav wordmark it is landing
         on, rather than the page appearing after the mark has already parked. */
      push(root.animate([{ opacity: 1 }, { opacity: 0 }],
        { delay: 150, duration: 750, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }));
      timer(function () { finish('completed'); }, T.end - T.handoff);
    }

    /* ---- the static poster: no motion at all ---- */

    function playPoster() {
      mode = 'poster';
      root.classList.add('is-poster');
      emit('poster');
      if (skipBtn) { try { skipBtn.focus({ preventScroll: true }); } catch (e) { skipBtn.focus(); } }
      root.addEventListener('click', posterTap);
      timer(function () { posterEnd('completed'); }, POSTER_HOLD);
    }

    function posterTap() { posterEnd('tapped'); }

    function posterEnd(reason) {
      if (ended) return;
      if (opts.onHandoff) opts.onHandoff();
      finish(reason);
    }

    /* ---- skip: the same hand-off, in 200 ms ---- */

    function skipNow() {
      if (!running || ended) return;
      if (mode === 'poster') { posterEnd('skipped'); return; }
      emit('skip');
      clearAll();
      if (opts.onHandoff) opts.onHandoff();
      push(root.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: HANDOFF, easing: 'ease-out', fill: 'forwards' }));
      timer(function () { finish('skipped'); }, HANDOFF);
    }

    function onKey(ev) {
      if (!running || ended) return;
      if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); skipNow(); }
    }

    function finish(reason) {
      if (ended) return;
      ended = true;
      running = false;
      emit('end', reason);
      root.hidden = true;
      clearAll();
      root.removeEventListener('click', posterTap);
      doc.removeEventListener('keydown', onKey, true);
      if (opts.onEnd) opts.onEnd(reason);
    }

    function reset() {
      clearAll();
      ended = false;
      running = false;
      mode = 'idle';
      root.classList.remove('is-poster');
      root.removeEventListener('click', posterTap);
      doc.removeEventListener('keydown', onKey, true);
      if (mark) mark.style.transformOrigin = '';
      root.setAttribute('data-beat', 'idle');
      root.hidden = true;
    }

    function play() {
      reset();
      if (!field || !order || !skipBtn || typeof root.animate !== 'function') return 'unsupported';
      if (reduceQuery.matches) { root.setAttribute('data-beat', 'reduced-motion'); return 'reduced-motion'; }
      if (seen()) { root.setAttribute('data-beat', 'seen'); return 'seen'; }
      markSeen();

      root.hidden = false;
      running = true;
      ended = false;
      t0 = win.performance ? win.performance.now() : Date.now();
      doc.addEventListener('keydown', onKey, true);
      if (opts.onStart) opts.onStart();

      var width = root.clientWidth || win.innerWidth || 0;
      if (width < POSTER_BELOW || saveData()) { playPoster(); return 'poster'; }

      emit('open');
      try { skipBtn.focus({ preventScroll: true }); } catch (e) { skipBtn.focus(); }
      playFull();
      return 'playing';
    }

    if (skipBtn) skipBtn.addEventListener('click', skipNow);

    return { play: play, skip: skipNow, reset: reset, root: root };
  }
  /* FILM-MODULE:END */

  /* the film, wired to this page: scroll lock, inert page, focus, and the
     release of the page-ready gate at the hand-off */
  (function openingFilm() {
    var root = document.querySelector('.film');
    if (!root) { markPageReady(); return; }

    var INERT = ['nav.nav', 'main', 'footer.foot'];
    var scrollY = window.scrollY;

    function setInert(on) {
      INERT.forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    var film = createFilm(root, {
      handoffTarget: function () { return document.querySelector('.nav .wordmark'); },
      onStart: function () {
        scrollY = window.scrollY;
        document.body.classList.add('film-playing');
        setInert(true);
      },
      onHandoff: markPageReady,
      onEnd: function () {
        document.body.classList.remove('film-playing');
        setInert(false);
        if (root.parentNode) root.parentNode.removeChild(root);
        window.scrollTo(0, scrollY);
        var first = document.querySelector('.nav .wordmark');
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
        markPageReady();
      }
    });

    var status = film.play();
    if (status !== 'playing' && status !== 'poster') {
      if (root.parentNode) root.parentNode.removeChild(root);
      markPageReady();
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
