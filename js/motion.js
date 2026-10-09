/* Haseeb site motion (GSAP 3.13 + ScrollTrigger + SplitText).
 *
 * The page works without this file: content is visible by default, and the
 * inline script falls back to an IntersectionObserver when HMotion is missing.
 * <html class="gs"> (set in <head>, skipped under reduced motion) hides
 * .rv / .msg / .pop / seat dots until start() animates them in.
 *
 * Motion vocabulary — keep to these, don't invent one-off effects:
 *   reveal  fade + 14px rise, batched on scroll, once
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

  var T = { ease: 'power3.out', rise: 14, fast: 0.5, base: 0.8, slow: 1.1, stagger: 0.06, start: 'top 88%' };
  var root = document.documentElement;

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

  // 01–03 sit in a sideways carousel: a scene in a hidden slide waits until its slide is shown.
  function shown(el) { var s = el.closest('.slide'); return !s || s.classList.contains('on'); }
  function whenShown(el, fn) {
    var s = el.closest('.slide');
    if (shown(el)) return fn();
    s.addEventListener('tour:on', function on() { s.removeEventListener('tour:on', on); fn(); });
  }

  // Pinned, the next slide slides in from the side: its text should already be there, so plain reveals skip the wait.
  function whenNear(el, fn) { return el.closest('.tour.pin') ? fn() : whenShown(el, fn); }

  function lines(el, opts) {
    gsap.set(el, { opacity: 1 });
    if (!window.SplitText) return gsap.from(el, { opacity: 0, y: T.rise, duration: T.base, ease: T.ease, scrollTrigger: opts.trigger });
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 105, duration: opts.duration || T.slow, stagger: 0.08, ease: T.ease, delay: opts.delay || 0, scrollTrigger: opts.trigger });
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
    tl.fromTo(shot, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: T.slow })
      .call(function () { mark(shot); }, null, 0.15)
      .fromTo($$('.pop', shot), { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 1.2);
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
    var t1 = typing(msgs[1]), t2 = typing(msgs[3]);
    var inn = { opacity: 1, y: 0, duration: T.fast, ease: T.ease }, from = { opacity: 0, y: 10 };
    var tl = gsap.timeline({ paused: true });
    tl.fromTo(msgs[0], from, inn, 0.3)
      .call(place(t1, msgs[1])).set(t1, { display: 'flex' }).fromTo(t1, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .set(t1, { display: 'none' }, '+=0.8')
      .fromTo(msgs[1], from, inn)
      .fromTo(msgs[2], from, inn, '+=0.7')
      .call(place(t2, msgs[3])).set(t2, { display: 'flex' }).fromTo(t2, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .set(t2, { display: 'none' }, '+=0.8')
      .fromTo(msgs[3], from, inn);
    ScrollTrigger.create({ trigger: shot, start: 'top 70%', once: true, onEnter: function () { whenShown(shot, function () { tl.play(); }); } });
  }

  function bankFlow() {
    var flow = $('.flow');
    if (!flow) return;
    var win = flow.closest('.win'), cards = $$('.fcard', flow), mid = $('.fmid', flow);
    var tl = gsap.timeline({ paused: true, defaults: { ease: T.ease } });
    tl.from(cards[0], { opacity: 0, y: 10, duration: T.fast }, 0.9)
      .from($('.dot', mid), { scale: 0.4, opacity: 0, duration: 0.45, ease: 'back.out(2)' })
      .from($('.dot svg', mid), { y: -6, opacity: 0, duration: 0.35 }, '<0.15')
      .from(mid.lastElementChild, { opacity: 0, x: -6, duration: 0.4 }, '<')
      .fromTo(cards[1], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 })
      .from($$('.je .row', cards[1]), { opacity: 0, y: 6, duration: 0.4, stagger: 0.12 }, '<0.2');
    ScrollTrigger.create({ trigger: win || flow, start: 'top 70%', once: true, onEnter: function () { whenShown(flow, function () { tl.play(); }); } });
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
    var loop = null, live = false, inView = false, slide = box.closest('.slide');
    function sync() {
      live = inView && shown(box);
      if (live) { if (!loop) loop = cycle(); loop.play(); } else if (loop) loop.pause();
    }
    var pinBox = box.closest('.tour.pin');
    if (pinBox) {
      pinBox.addEventListener('tour:in', function () { inView = true; sync(); });
      pinBox.addEventListener('tour:out', function () { inView = false; sync(); });
    } else ScrollTrigger.create({
      trigger: box, start: 'top 75%', end: 'bottom top',
      onToggle: function (s) { inView = s.isActive; sync(); }
    });
    if (slide) { slide.addEventListener('tour:on', sync); slide.addEventListener('tour:off', sync); }
  }

  // 01–03 tour (wide screens): pins under the nav and page scroll drives it, scrubbed with light smoothing.
  // A tall slide first scrolls through its own overflow, then the track slides across to the next one.
  // Each slide rests for REST of the screen height before the next one moves in, so a reader who keeps scrolling
  // still sees it. Stop part-way across and it settles on the slide you were heading for, never back against you.
  // A pill at the bottom names the slide and fills one bar per slide, so it reads as three parts from the start.
  // Narrow screens skip the pin: the slides stack as normal sections. HTour (inline script) owns slide state.
  var NAV = 68, MOVE = 0.75, REST = 0.3, WIDE = '(min-width: 861px)';
  function tour() {
    var box = $('#tour'), api = window.HTour;
    if (!box || !api) return;
    var track = $('.tour-track', box), slides = api.slides, n = slides.length;
    var st = null, tl = null, at = [], moves = [], total = 1, lastW = innerWidth, pinned = false;
    var prog = $('.tour-prog', box), num = $('.n', prog), name = $('.t', prog), lab = -1;
    var fills = $$('b', prog).map(function (b) { return gsap.quickSetter(b, 'scaleX'); });

    // Slide in place: the one whose move across is more than half done.
    function current(t) {
      var i = 0;
      while (i < moves.length && t >= (moves[i][0] + moves[i][1]) / 2) i++;
      return i;
    }
    function update(self) {
      var i = current(self.progress * total);
      api.mark(i);
      if (i === lab) return;
      lab = i;
      var words = slides[i].getAttribute('aria-label').split(' ');
      num.textContent = words.shift();
      name.textContent = words.join(' ');
    }
    // Bar k fills from slide k arriving to slide k+1 arriving. Follows the smoothed timeline, not the raw scroll.
    function fill() {
      var t = tl.time();
      fills.forEach(function (set, k) {
        var a = at[k], b = k < n - 1 ? moves[k][1] : total;
        set(b > a ? Math.max(0, Math.min(1, (t - a) / (b - a))) : t >= a ? 1 : 0);
      });
    }
    // Snap only while between two slides, and only in the direction of travel. Inside a tall slide, rest anywhere.
    function snap(p, self) {
      var t = p * total, dir = (self || st).direction;
      for (var k = 0; k < moves.length; k++) {
        if (t > moves[k][0] + 1 && t < moves[k][1] - 1) return (dir < 0 ? moves[k][0] : moves[k][1]) / total;
      }
      return p;
    }
    function build() {
      if (st) st.kill(true);
      if (tl) tl.kill();
      box.scrollTop = box.scrollLeft = track.scrollLeft = 0;  // older browsers without overflow:clip
      gsap.set(track, { x: 0 });
      gsap.set(slides, { y: 0 });
      lastW = innerWidth;
      var W = track.clientWidth, H = track.clientHeight, move = Math.round(H * MOVE), rest = Math.round(H * REST), pos = 0;
      at = []; moves = [];
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: fill });
      slides.forEach(function (sl, i) {
        var ov = Math.max(0, sl.offsetHeight - H);
        at.push(pos);
        if (ov) { tl.to(sl, { y: -ov, duration: ov }, pos); pos += ov; }
        if (i < n - 1) {
          pos += rest;
          tl.to(track, { x: -(i + 1) * W, duration: move }, pos);
          moves.push([pos, pos + move]);
          pos += move;
        }
      });
      total = Math.max(pos, 1);
      st = ScrollTrigger.create({
        trigger: box, start: 'top ' + NAV + 'px', end: '+=' + total,
        pin: true, anticipatePin: 1, refreshPriority: 1,
        animation: tl, scrub: 0.5,
        snap: { snapTo: snap, delay: 0.15, duration: { min: 0.25, max: 0.6 }, ease: 'power2.inOut', inertia: false },
        onUpdate: update, onRefresh: update,
        onToggle: function (s) { box.dispatchEvent(new CustomEvent(s.isActive ? 'tour:in' : 'tour:out')); }
      });
      update(st);
      fill();
    }
    function pin() {
      pinned = true;
      box.classList.add('pin');
      api.mark(0, true);
      build();
    }
    function unpin() {
      pinned = false;
      if (st) st.kill(true);
      if (tl) tl.kill();
      st = tl = null;
      gsap.set(track, { clearProps: 'x' });
      gsap.set(slides, { clearProps: 'y' });
      box.classList.remove('pin');
      slides.forEach(function (sl) { sl.classList.add('on'); sl.inert = false; sl.dispatchEvent(new CustomEvent('tour:on')); });
      box.dispatchEvent(new CustomEvent('tour:in'));
    }
    // Jumps (reload, #links, resize) land at once: finish the scrub instead of easing to the new place.
    api.jump = function (y) {
      window.scrollTo({ top: y, behavior: 'instant' });
      ScrollTrigger.update();
      var tw = st && st.getTween && st.getTween();
      if (tw) tw.progress(1);
    };
    api.go = function (i, instant) {
      var y = pinned ? st.start + at[i] : slides[i].getBoundingClientRect().top + scrollY - NAV;
      if (instant) api.jump(y); else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    // Width change: rebuild, then put the reader back on the same slide, the same share of the way through it.
    function rebuild() {
      var y = scrollY, s0 = st.start, e0 = st.end, old = at.concat(e0 - s0), t = y - s0, i = 0;
      while (i < n - 1 && t >= old[i + 1]) i++;
      var f = Math.max(0, Math.min(1, (t - old[i]) / (old[i + 1] - old[i])));
      build();
      ScrollTrigger.refresh();
      var now = at.concat(st.end - st.start);
      if (y > s0) api.jump(y >= e0 ? st.end + (y - e0) : st.start + now[i] + f * (now[i + 1] - now[i]));
    }
    if (matchMedia(WIDE).matches) pin(); else unpin();
    var pending;
    addEventListener('resize', function () {
      if (innerWidth === lastW) return;
      clearTimeout(pending);
      pending = setTimeout(function () {
        lastW = innerWidth;
        var wide = matchMedia(WIDE).matches;
        if (wide && pinned) return rebuild();
        if (wide) pin(); else if (pinned) unpin(); else return;
        ScrollTrigger.refresh();
      }, 250);
    });
    // A slide's #id typed into the address bar.
    addEventListener('hashchange', function () {
      var i = slides.findIndex(function (sl) { return '#' + sl.id === location.hash; });
      if (i > -1) api.go(i, true);
    });
  }

  // Scroll position on load. The browser's own restore runs before the pin exists and lands in the wrong place,
  // so it's off (inline head script) and we put the position back once every trigger is built.
  var KEY = 'haseeb-y:' + location.pathname;
  addEventListener('pagehide', function () { try { sessionStorage.setItem(KEY, String(Math.round(scrollY))); } catch (e) {} });
  function land() {
    ScrollTrigger.refresh();
    var el = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    var tourApi = window.HTour, i = el && tourApi && tourApi.go ? tourApi.slides.indexOf(el) : -1;
    if (i > -1) return tourApi.go(i, true);
    if (el) return window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - NAV, behavior: 'instant' });
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var y = 0;
    try { y = parseInt(sessionStorage.getItem(KEY), 10) || 0; } catch (e) {}
    if (!y || !nav || nav.type === 'navigate') return;
    if (tourApi && tourApi.jump) tourApi.jump(y); else window.scrollTo({ top: y, behavior: 'instant' });
  }

  // In-page links glide (CSS smooth scroll is off under GSAP) and stop below the sticky nav.
  function anchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      var el = a && a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - NAV, behavior: 'smooth' });
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
        if (shown(h)) return lines(h, { trigger: { trigger: h, start: T.start, once: true } });
        gsap.set(h, { opacity: 0 });
        ScrollTrigger.create({ trigger: h, start: T.start, once: true, onEnter: function () { whenNear(h, function () { lines(h, {}); }); } });
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
          // Group by slide so a hidden slide's items reveal together when it's shown.
          var groups = [];
          batch.forEach(function (el) {
            var s = el.closest('.slide'), g = groups.filter(function (x) { return x.s === s; })[0];
            if (!g) groups.push(g = { s: s, els: [] });
            g.els.push(el);
          });
          groups.forEach(function (g) {
            whenNear(g.els[0], function () {
              g.els.forEach(mark);
              gsap.to(g.els, { opacity: 1, y: 0, duration: T.base, stagger: T.stagger, ease: T.ease, overwrite: true });
            });
          });
        }
      });

      anchors();
      land();

      // Layout changes (fonts, "Show all" toggles, tabs) move trigger points.
      if (window.ResizeObserver) {
        var pending;
        new ResizeObserver(function () { clearTimeout(pending); pending = setTimeout(function () { ScrollTrigger.refresh(); }, 200); }).observe(document.body);
      }
    } catch (e) {
      // Never leave content hidden.
      root.classList.remove('gs');
      var tb = $('#tour');
      if (tb) tb.classList.remove('pin');
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
