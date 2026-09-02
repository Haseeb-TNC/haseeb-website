/* ============================================================
   Haseeb public site — behaviour.
   No network calls of any kind. No libraries. No storage.
   ============================================================ */
(function () {
  'use strict';

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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
