/* Haseeb site motion (GSAP 3.13 + ScrollTrigger + SplitText).
 *
 * The page works without this file: content is visible by default, and the
 * inline script falls back to an IntersectionObserver when HMotion is missing.
 * <html class="gs"> (set in <head>, skipped under reduced motion) hides
 * .rv / .msg / .pop / seat dots until start() animates them in.
 *
 * Motion vocabulary — keep to these, don't invent one-off effects:
 *   reveal  fade + 12px rise as it enters the screen, batched, once
 *   lines   masked line-by-line rise for big headings
 *   count   KWD figures count up to their exact 3-decimal value
 *   story   short sequences (chat, bank line → entry)
 * Product micro-animations (row cascade, lane bars, chart draw, tab progress)
 * stay in CSS, keyed to [data-in]; this file only decides when data-in is set.
 */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  ScrollTrigger.config({ ignoreMobileResize: true });

  // start 'top bottom': a reveal begins as the element's top edge enters the screen, not after it is already
  // well inside it, so content is never sitting on screen blank or half-faded while you scroll.
  var T = { ease: 'power3.out', rise: 12, fast: 0.4, base: 0.55, slow: 0.75, stagger: 0.04, start: 'top bottom' };
  var root = document.documentElement;

  function scrollToY(y, instant) { window.scrollTo({ top: y, behavior: instant ? 'instant' : 'smooth' }); }

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return [].slice.call((scope || document).querySelectorAll(sel)); }
  function mark(el) { if (el) el.setAttribute('data-in', '1'); }

  function fmt(n, int) {
    if (int) return String(Math.round(n));
    var s = n.toFixed(3).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + s[1];
  }

  function count(scope, delay) {
    $$('[data-count]', scope).forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')), int = el.hasAttribute('data-int'), o = { v: 0 };
      el.textContent = fmt(0, int);
      gsap.to(o, { v: to, duration: 1.3, delay: delay || 0.2, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v, int); } });
    });
  }

  function lines(el, opts) {
    gsap.set(el, { opacity: 1 });
    if (!window.SplitText) return gsap.from(el, { opacity: 0, y: T.rise, duration: T.base, ease: T.ease, scrollTrigger: opts.trigger });
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 105, duration: opts.duration || T.slow, stagger: 0.06, ease: T.ease, delay: opts.delay || 0, scrollTrigger: opts.trigger });
      }
    });
  }

  function hero(handled) {
    var col = $('.hero-copy');
    if (!col) return;
    var h1 = $('.h1', col);
    handled.push(col);
    gsap.set(col, { opacity: 1 });

    var tl = gsap.timeline({ defaults: { ease: T.ease } });
    tl.from($('.hero-ar', col), { opacity: 0, y: 8, duration: T.fast }, 0.3);
    if (window.SplitText) {
      // Split once and restore the plain h1 afterwards, so later resizes reflow it normally.
      var sp = SplitText.create(h1, { type: 'lines', mask: 'lines' });
      tl.from(sp.lines, { yPercent: 105, duration: T.slow, stagger: 0.09, onComplete: function () { sp.revert(); } }, 0.4);
    } else {
      tl.from(h1, { opacity: 0, y: T.rise, duration: T.base }, 0.4);
    }
    tl.from([$('.cta', col), $('.fine', col)], { opacity: 0, y: 12, duration: T.base, stagger: 0.08 }, 0.85);
  }

  // Transactions screen under the hero: rises in, rows cascade, then Haseeb's note pops.
  function txShot(handled) {
    var shot = $('.hero-shot');
    if (!shot) return;
    handled.push(shot);
    var tl = gsap.timeline({ paused: true, defaults: { ease: T.ease } });
    tl.fromTo(shot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: T.base })
      .call(function () { mark(shot); }, null, 0.15)
      .fromTo($$('.pop', shot), { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, 0.5);
    ScrollTrigger.create({ trigger: shot, start: T.start, once: true, onEnter: function () { tl.play(); } });
  }

  function chat(handled) {
    var shot = $('.askshot');
    if (!shot) return;
    var thread = $('.thread', shot), msgs = $$('.msg', thread);
    if (msgs.length < 4) { gsap.set(msgs, { opacity: 1 }); return; }
    // The dots sit over the answer's (still invisible) slot, so the window never changes height.
    thread.style.position = 'relative';
    function typing(before) {
      var t = document.createElement('div');
      t.className = 'ans typing';
      t.setAttribute('aria-hidden', 'true');
      t.innerHTML = '<span class="ava am">H</span><div class="b"><i></i><i></i><i></i></div>';
      thread.insertBefore(t, before);
      gsap.set(t, { display: 'none', position: 'absolute', left: before.offsetLeft });
      return t;
    }
    function place(t, before) { return function () { gsap.set(t, { top: before.offsetTop, left: before.offsetLeft }); }; }
    // The window is never empty: the first question and answer are already there, the second exchange plays.
    gsap.set([msgs[0], msgs[1]], { opacity: 1 });
    var t2 = typing(msgs[3]);
    var inn = { opacity: 1, y: 0, duration: T.fast, ease: T.ease }, from = { opacity: 0, y: 10 };
    var tl = gsap.timeline({ paused: true });
    tl.fromTo(msgs[2], from, inn, 0.2)
      .call(place(t2, msgs[3])).set(t2, { display: 'flex' }).fromTo(t2, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .set(t2, { display: 'none' }, '+=0.6')
      .fromTo(msgs[3], from, inn);
    ScrollTrigger.create({ trigger: shot, start: 'top 90%', once: true, onEnter: function () { whenShown(shot, function () { tl.play(); }); } });
  }

  function bankFlow() {
    var flow = $('.flow');
    if (!flow) return;
    var win = flow.closest('.win'), cards = $$('.fcard', flow), mid = $('.fmid', flow);
    var tl = gsap.timeline({ paused: true, defaults: { ease: T.ease } });
    tl.from(cards[0], { opacity: 0, y: 10, duration: T.fast }, 0.15)
      .from($('.dot', mid), { scale: 0.4, opacity: 0, duration: 0.45, ease: 'back.out(2)' })
      .from($('.dot svg', mid), { y: -6, opacity: 0, duration: 0.35 }, '<0.15')
      .from(mid.lastElementChild, { opacity: 0, x: -6, duration: 0.4 }, '<')
      .fromTo(cards[1], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 })
      .from($$('.je .row', cards[1]), { opacity: 0, y: 6, duration: 0.4, stagger: 0.12 }, '<0.2');
    ScrollTrigger.create({ trigger: win || flow, start: 'top 90%', once: true, onEnter: function () { whenShown(flow, function () { tl.play(); }); } });
  }

  // 03: three card taps -> one KNET settlement line -> Haseeb prepares the entry -> you approve it.
  // Markup holds the finished state. Each loop is rebuilt so token paths follow the current layout.
  function counterFlow() {
    var box = $('#kflow');
    if (!box) return;
    function q(s) { return $(s, box); }
    var pay = q('.kf-pay'), waves = $$('.kf-wave', box), amt = q('.kf-amt'), ok = q('.kf-ok'),
        scr = q('.kf-scr'), row = q('.kf-new'), sum = q('[data-kf="sum"]'), inn = q('.kf-in'), beam = q('.kf-beam'),
        out = q('.kf-out'), pill = q('.kf-out .pill'), jeBox = q('.kf-je'), je = $$('.kf-je > div:not(.h)', box),
        btn = q('.kf-btn'), posted = q('.kf-posted');
    var tok = document.createElement('i');
    tok.className = 'kf-tok';
    tok.setAttribute('aria-hidden', 'true');
    box.appendChild(tok);
    var TAPS = [12.5, 4.75, 8.25], AWAY = { x: 30, y: -22, rotation: 10 };

    function at(el) {
      var b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
    }
    function fly(tl, from, to) {
      tl.call(function () { var a = at(from); gsap.set(tok, { x: a.x, y: a.y, opacity: 1, scale: 1 }); })
        .to(tok, { x: function () { return at(to).x; }, y: function () { return at(to).y; }, duration: 0.8, ease: 'power2.inOut' })
        .to(tok, { opacity: 0, scale: 0.4, duration: 0.2 });
    }
    function reset() {
      gsap.set(pay, { x: AWAY.x, y: AWAY.y, rotation: AWAY.rotation, svgOrigin: '122 -7' });
      gsap.set(waves, { opacity: 0 });
      gsap.set(ok, { opacity: 0 });
      amt.textContent = fmt(0);
      gsap.set(row, { opacity: 0 });
      sum.textContent = fmt(0);
      gsap.set([inn, out], { opacity: 0.3 });
      gsap.set(pill, { opacity: 0, scale: 0.8 });
      gsap.set(beam, { opacity: 0, xPercent: -100 });
      gsap.set(je, { opacity: 0 });
      gsap.set(posted, { opacity: 0, scale: 0.8 });
      btn.textContent = 'Approve';
      btn.className = 'btn p sm kf-btn';
    }
    function cycle() {
      var tl = gsap.timeline({ paused: true, defaults: { ease: T.ease }, onComplete: function () { loop = cycle(); if (live) loop.play(); } });
      tl.call(reset);
      var total = 0;
      TAPS.forEach(function (v, i) {
        var o = { v: total };
        total += v;
        tl.set(ok, { opacity: 0 }, i ? '+=0.2' : 0.4)
          .to(pay, { x: 0, y: 0, rotation: -4, duration: 0.45, ease: 'power2.in' })
          .call(function () { amt.textContent = fmt(v); })
          .fromTo(waves, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.06 })
          .to(ok, { opacity: 1, duration: 0.2 }, '<')
          .to(pay, { x: AWAY.x, y: AWAY.y, rotation: AWAY.rotation, duration: 0.5, ease: 'power2.out' }, '+=0.1')
          .to(waves, { opacity: 0, duration: 0.3 }, '<');
        fly(tl, scr, row);
        tl.to(row, { opacity: 1, duration: 0.3 }, '-=0.25')
          .to(o, { v: total, duration: 0.5, onUpdate: function () { sum.textContent = fmt(o.v); } }, '<');
      });
      fly(tl, row, inn);
      tl.to(inn, { opacity: 1, duration: 0.3 }, '-=0.25')
        .fromTo(beam, { opacity: 1, xPercent: -100 }, { xPercent: 100, duration: 0.8, ease: 'none', repeat: 1 })
        .set(beam, { opacity: 0 })
        .to(out, { opacity: 1, duration: 0.35 })
        .to(pill, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' });
      fly(tl, out, jeBox);
      tl.to(je, { opacity: 0.45, duration: 0.3, stagger: 0.12 }, '-=0.25')
        .to(btn, { scale: 0.92, duration: 0.12, ease: 'power1.in' }, '+=0.5')
        .call(function () { btn.textContent = 'Approved'; btn.className = 'btn s sm kf-btn'; })
        .to(btn, { scale: 1, duration: 0.2 })
        .to(je, { opacity: 1, duration: 0.3 }, '<')
        .to(posted, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, '<')
        .to({}, { duration: 3 });
      return tl;
    }
    reset();
    // Plays while on screen, pauses once it scrolls away (the loop never runs unseen).
    var loop = null;
    ScrollTrigger.create({
      trigger: box, start: 'top 75%', end: 'bottom top',
      onToggle: function (s) { if (s.isActive) { if (!loop) loop = cycle(); loop.play(); } else if (loop) loop.pause(); }
    });
  }

  var NAV = 68;

  // 01–03 on wide screens with a mouse or trackpad: the box pins under the nav and the three slides sit on
  // top of each other. Scrolling crossfades one into the next (fade + a few px of drift), scrubbed to the
  // scrollbar, so it reads like a carousel without anything sliding sideways. Native scroll is never blocked.
  // A bar across the top (.tour-bar) has one rail per slide that fills as you scroll; its labels jump to a slide.
  // Touch, narrow screens, no GSAP and reduced motion get the slides stacked as normal sections.
  var TOUR = {
    media: '(min-width: 861px) and (pointer: fine)', // keep in step with the CSS media query on .gs .tour
    scrub: 0.6,  // seconds the fade takes to catch up with the scrollbar: higher = softer, lower = tighter
    hold: 0.3,   // scroll a slide stays fully shown, as a share of the box height
    fade: 0.4,   // scroll for one crossfade, as a share of the box height
    lift: 16     // px a slide drifts up as it fades
  };
  var tourAt = function () { return null; }, tourJump = null;

  // A scene in a slide that is still hidden waits until that slide starts to fade in (tour:near).
  function whenShown(el, fn) {
    var s = el.closest('.slide');
    if (!s || s.hasAttribute('data-near')) return fn();
    s.addEventListener('tour:near', function on() { s.removeEventListener('tour:near', on); fn(); });
  }

  function tour() {
    var box = $('#tour');
    if (!box) return;
    var slides = $$('.slide', box), n = slides.length, st = null, fades = [], total = 1, cur = -1, saved = null;
    var track = $('.tour-track', box), steps = $$('.tour-bar a', box), fills = steps.map(function (a) { return $('.rail i', a); });
    var tl = gsap.timeline({ paused: true, onUpdate: function () { update(tl.time()); } });

    function near(i) {
      var sl = slides[i];
      if (sl.hasAttribute('data-near')) return;
      sl.setAttribute('data-near', '');
      sl.dispatchEvent(new CustomEvent('tour:near'));
    }
    // Scenes start as their slide begins to fade in; the slide counts as current (clickable) once past halfway.
    function update(t) {
      near(0);
      for (var k = 0; k < fades.length; k++) if (t >= fades[k][0]) near(k + 1);
      var i = 0;
      while (i < fades.length && t >= (fades[i][0] + fades[i][1]) / 2) i++;
      if (i === cur) return;
      cur = i;
      slides.forEach(function (sl, j) { sl.inert = j !== i; });
      steps.forEach(function (a, j) { a.classList.toggle('on', j === i); if (j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    }
    function stacked() { cur = -1; slides.forEach(function (sl, i) { sl.inert = false; near(i); }); }

    // Measure once per refresh (never during scroll). Called from the pin's `end`, where ScrollTrigger has
    // already undone the pin, so the sizes read are the real ones. Timeline time = px of scroll.
    function build() {
      var H = box.clientHeight, hold = Math.round(H * TOUR.hold), fade = Math.round(H * TOUR.fade), pos = 0;
      tl.clear();
      fit(track.clientHeight);
      fades = [];
      gsap.set(slides, { autoAlpha: 0, y: 0 });
      gsap.set(slides[0], { autoAlpha: 1 });
      for (var k = 0; k < n - 1; k++) {
        pos += hold;
        // Out, then in: the outgoing slide is gone before the next one appears, so the two never overlap.
        tl.fromTo(slides[k], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -TOUR.lift, duration: fade * 0.5, ease: 'power1.in', immediateRender: false }, pos)
          .fromTo(slides[k + 1], { autoAlpha: 0, y: TOUR.lift }, { autoAlpha: 1, y: 0, duration: fade * 0.5, ease: 'power1.out', immediateRender: false }, pos + fade * 0.5);
        fades.push([pos, pos + fade]);
        pos += fade;
      }
      total = pos + hold;
      // Each rail fills, linear with the scroll, over the stretch where its slide is the current one.
      var cuts = [0].concat(fades.map(function (f) { return (f[0] + f[1]) / 2; }), total);
      gsap.set(fills, { scaleX: 0 });
      fills.forEach(function (f, i) { tl.fromTo(f, { scaleX: 0 }, { scaleX: 1, duration: cuts[i + 1] - cuts[i], ease: 'none', immediateRender: false }, cuts[i]); });
      if (tl.duration() < total) tl.set({}, {}, total);
    }
    // If any slide is taller than the box, every slide is scaled down by the same amount (zoom, so the layout
    // shrinks too): one scale for all three keeps headings and text the same size from slide to slide.
    // Max width and side padding are scaled up to match, so the edges still line up with the bar.
    function fit(H) {
      var wraps = slides.map(function (sl) { return $('.wrap', sl); }).filter(Boolean), k = 1;
      wraps.forEach(function (w) { w.style.zoom = w.style.maxWidth = w.style.paddingInline = ''; });
      wraps.forEach(function (w) {
        var cs = getComputedStyle(w.parentNode), room = H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        k = Math.min(k, room / w.getBoundingClientRect().height);
      });
      k = Math.floor(k * 1000) / 1000;
      if (k >= 1) return;
      wraps.forEach(function (w) {
        var ws = getComputedStyle(w);
        w.style.maxWidth = parseFloat(ws.maxWidth) / k + 'px';
        w.style.paddingInline = parseFloat(ws.paddingLeft) / k + 'px';
        w.style.zoom = k;
      });
    }
    // A resize changes the pin's length: keep the reader at the same share of the way through it.
    ScrollTrigger.addEventListener('refreshInit', function () { saved = st && st.isActive ? st.progress : null; });
    ScrollTrigger.addEventListener('refresh', function () {
      if (saved === null || !st) return;
      var y = Math.round(st.start + saved * (st.end - st.start));
      saved = null;
      if (Math.abs(y - scrollY) > 1) tourJump(y);
    });

    var mm = gsap.matchMedia();
    mm.add({ pin: TOUR.media }, function (ctx) {
      if (!ctx.conditions.pin) { stacked(); return; }
      box.classList.add('pin');
      st = ScrollTrigger.create({
        trigger: box, start: 'top ' + NAV + 'px', end: function () { build(); return '+=' + total; },
        pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
        animation: tl, scrub: TOUR.scrub,
        // A refresh renders the timeline silently (no onUpdate), so re-mark the current slide here.
        onRefresh: function () { update(tl.time()); }
      });
      return function () {
        st = null;
        tl.clear();
        gsap.set(slides.concat(fills), { clearProps: 'opacity,visibility,transform' });
        slides.forEach(function (sl) { var w = $('.wrap', sl); if (w) w.style.zoom = w.style.maxWidth = w.style.paddingInline = ''; });
        box.classList.remove('pin');
        stacked();
      };
    });

    // Where the page must be for a slide to be fully shown (null when not pinned or not a slide).
    tourAt = function (el) {
      var i = slides.indexOf(el);
      if (i < 0 || !st) return null;
      return st.start + (i ? fades[i - 1][1] : 0);
    };
    // Land somewhere at once (reload, #links, resize): skip the scrub's catch-up instead of fading there.
    tourJump = function (y) {
      scrollToY(y, true);
      ScrollTrigger.update();
      var tw = st && st.getTween();
      if (tw) tw.progress(1);
    };
  }

  // Scroll position on load. The browser's own restore runs before the triggers exist,
  // so it's off (inline head script) and we put the position back once every trigger is built.
  var KEY = 'haseeb-y:' + location.pathname;
  addEventListener('pagehide', function () { try { sessionStorage.setItem(KEY, String(Math.round(scrollY))); } catch (e) {} });
  function land() {
    ScrollTrigger.refresh();
    var el = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    var at = el && tourAt(el);
    if (at !== null && at !== false && at !== undefined) return tourJump(at);
    if (el) return scrollToY(el.getBoundingClientRect().top + scrollY - NAV, true);
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var y = 0;
    try { y = parseInt(sessionStorage.getItem(KEY), 10) || 0; } catch (e) {}
    if (!y || !nav || nav.type === 'navigate') return;
    if (tourJump) tourJump(y); else scrollToY(y, true);
  }

  // In-page links glide (CSS smooth scroll is off under GSAP) and stop below the sticky nav.
  function anchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      var el = a && a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      var at = tourAt(el);
      scrollToY(at !== null ? at : el.getBoundingClientRect().top + scrollY - NAV);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  function seats() {
    $$('.seats').forEach(function (s) {
      gsap.fromTo(s.children, { opacity: 0, scale: 0.6 }, {
        opacity: 1, scale: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(2)',
        scrollTrigger: { trigger: s, start: T.start, once: true, onEnter: function () { mark(s); } }
      });
    });
  }

  function start() {
    var handled = [];
    try {
      tour();
      hero(handled);
      txShot(handled);

      // Big headings: masked line reveal.
      $$('.sec .h2.rv, .dark .h1.rv').forEach(function (h) {
        handled.push(h);
        lines(h, { trigger: { trigger: h, start: T.start, once: true } });
      });

      chat(handled);
      bankFlow();
      counterFlow();
      seats();

      // Batch review + month-end: counts tick up; one soft pulse on the approve button.
      ['show', 's5'].forEach(function (id) {
        var s = document.getElementById(id);
        if (!s) return;
        $$('[data-count]', s).forEach(function (el) { el.textContent = fmt(0, el.hasAttribute('data-int')); });
        ScrollTrigger.create({ trigger: s, start: T.start, once: true, onEnter: function () { whenShown(s, function () {
          count(s);
          var pops = $$('.pop', s);
          if (pops.length) gsap.fromTo(pops, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: T.base, ease: T.ease, delay: 0.3 });
          var btn = $('.btn.sm', s);
          if (btn) gsap.fromTo(btn, { boxShadow: '0 0 0 0 rgba(0,166,132,.45)' }, { boxShadow: '0 0 0 10px rgba(0,166,132,0)', duration: 1.2, delay: 1.8, ease: 'power2.out', clearProps: 'boxShadow' });
        }); } });
      });

      // Everything else: one batched reveal.
      var rest = $$('.rv').filter(function (el) { return handled.indexOf(el) === -1; });
      gsap.set(rest, { opacity: 0, y: T.rise });
      ScrollTrigger.batch(rest, {
        start: T.start, once: true,
        onEnter: function (batch) {
          batch.forEach(mark);
          gsap.to(batch, { opacity: 1, y: 0, duration: T.base, stagger: T.stagger, ease: T.ease, overwrite: true });
        }
      });

      anchors();
      land();

      // Trigger points move when the page changes height (late fonts, "Show all" toggles, tabs). Window resizes
      // and the load event are already refreshed by ScrollTrigger itself (debounced), so only height counts here.
      var pending, lastH = document.body.offsetHeight;
      function refreshSoon() { clearTimeout(pending); pending = setTimeout(function () { ScrollTrigger.refresh(); }, 200); }
      if (window.ResizeObserver) {
        new ResizeObserver(function () {
          var h = document.body.offsetHeight;
          if (Math.abs(h - lastH) > 1) { lastH = h; refreshSoon(); }
        }).observe(document.body);
      }
      if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(refreshSoon);
    } catch (e) {
      // Never leave content hidden.
      root.classList.remove('gs');
      var tb = $('#tour');
      if (tb) tb.classList.remove('pin');
      gsap.set($$('.slide'), { clearProps: 'opacity,visibility,transform' });
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
      $$('.rv, .seats').forEach(mark);
      gsap.set($$('.rv, .msg, .pop, .seats i'), { clearProps: 'all' });
      if (window.console) console.error(e);
    }
  }

  window.HMotion = {
    start: function () {
      if (!root.classList.contains('gs')) { $$('.rv, .seats').forEach(mark); return; }
      if (document.fonts && document.fonts.ready) {
        var go = false, run = function () { if (!go) { go = true; start(); } };
        document.fonts.ready.then(run);
        setTimeout(run, 700);
      } else {
        start();
      }
    }
  };
})();
