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
 *   story   short sequences (hero ledger loop, chat, bank line → entry)
 * Product micro-animations (row cascade, lane bars, chart draw, tab progress)
 * stay in CSS, keyed to [data-in]; this file only decides when data-in is set.
 */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

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

  // Stroke length for draw-in effects; also sets the dash so offset can hide the line.
  function len(el) {
    var n = el.getTotalLength();
    el.style.strokeDasharray = n;
    return n;
  }

  // Hero ledger: a T-account that tips like a seesaw as entries land on each
  // side, settles level when they balance, then totals and double-rules.
  // Each set must balance (left sum = right sum). Markup holds set 1, drawn.
  function ledger(fig) {
    var SETS = [
      [[1250, 340.5, 2075.25], [1500, 865.75, 1300]],
      [[4800, 120.25, 615], [2400, 3000, 135.25]]
    ];
    var L = $$('.lg-l', fig), R = $$('.lg-r', fig), tot = $$('.lg-tot', fig),
        one = $$('.lg-one', fig), two = $$('.lg-two', fig), rules = one.concat(two),
        tilt = $('.lg-tilt', fig), ring = $('.lg-ring', fig);
    function rot(diff) { return gsap.utils.clamp(-3.5, 3.5, -diff / 1300 * 3.5); }

    gsap.set(L.concat(R, tot, rules), { opacity: 0 });
    gsap.set(tilt, { svgOrigin: '240 470' });
    fig.classList.remove('ok');

    function cycle(set) {
      var c = gsap.timeline(), l = set[0], r = set[1], run = 0, o = { v: 0 },
          sum = l.reduce(function (a, b) { return a + b; }, 0);
      c.call(function () {
        fig.classList.remove('ok');
        l.forEach(function (v, i) { L[i].textContent = fmt(v); });
        r.forEach(function (v, i) { R[i].textContent = fmt(v); });
        tot.forEach(function (t) { t.textContent = fmt(0); });
      })
        .set(L.concat(R), { opacity: 0, y: -40 })
        .set(tot, { opacity: 0 })
        .set(rules, { opacity: 1, strokeDashoffset: function (i, el) { return len(el); } })
        .set(o, { v: 0 });
      // Alternate sides: left 1, right 1, left 2, ...
      [0, 1, 2].forEach(function (i) {
        [[L[i], l[i], 1], [R[i], r[i], -1]].forEach(function (e, s) {
          var at = 0.3 + (i * 2 + s) * 0.75;
          run += e[1] * e[2];
          c.to(e[0], { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }, at)
            .to(tilt, { rotation: rot(run), duration: 1.2, ease: 'elastic.out(1,0.45)' }, at + 0.25);
        });
      });
      var end = 0.3 + 5 * 0.75 + 1.1;
      c.to(one, { strokeDashoffset: 0, duration: 0.5, stagger: 0.1, ease: 'power2.inOut' }, end)
        .to(tot, { opacity: 1, duration: 0.3 }, end + 0.3)
        .to(o, { v: sum, duration: 1, ease: 'power2.out', onUpdate: function () { tot.forEach(function (t) { t.textContent = fmt(o.v); }); } }, end + 0.3)
        .to(two, { strokeDashoffset: 0, duration: 0.6, stagger: 0.1, ease: 'power2.inOut' }, end + 1.2)
        .call(function () { fig.classList.add('ok'); }, null, end + 1.7)
        .fromTo(ring, { scale: 0.6, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 3.2, opacity: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, end + 1.7)
        .to(L.concat(R, tot, rules), { opacity: 0, duration: 0.5, stagger: 0.03 }, end + 4.6);
      return c;
    }

    var loop = gsap.timeline({ repeat: -1, paused: true });
    SETS.forEach(function (s) { loop.add(cycle(s)); });
    return loop;
  }

  function hero(handled) {
    var top = $('.hero-top'), shot = $('.hero-shot');
    if (!top) return;
    var col = top.firstElementChild, led = $('.hero-ledger'), h1 = $('.h1', col);
    [col, led, shot].forEach(function (el) { if (el) handled.push(el); });
    gsap.set([col, led], { opacity: 1 });

    var tl = gsap.timeline({ defaults: { ease: T.ease } });
    tl.from($('.hero-ar', col), { opacity: 0, y: 8, duration: T.fast });
    if (window.SplitText) {
      // Split once and restore the plain h1 afterwards, so later resizes reflow it normally.
      var sp = SplitText.create(h1, { type: 'lines', mask: 'lines' });
      tl.from(sp.lines, { yPercent: 105, duration: T.slow, stagger: 0.09, onComplete: function () { sp.revert(); } }, 0.1);
    } else {
      tl.from(h1, { opacity: 0, y: T.rise, duration: T.base }, 0.1);
    }
    tl.from([$('.cta', col), $('.fine', col)], { opacity: 0, y: 12, duration: T.base, stagger: 0.08 }, 0.55);
    if (led) {
      var frame = $$('.lg-bar, .lg-stem', led), loop = ledger(led);
      tl.from(led, { opacity: 0, y: 20, duration: T.slow }, 0.2)
        .from(frame, { strokeDashoffset: function (i, el) { return len(el); }, duration: 0.9, stagger: 0.2, ease: 'power2.inOut' }, 0.4)
        .from($$('.lg-pivot, .lg-ground', led), { opacity: 0, duration: T.fast }, 0.9)
        .call(function () {
          // Loop only while the hero is on screen.
          ScrollTrigger.create({ trigger: led, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? loop.play() : loop.pause(); } });
          if (ScrollTrigger.isInViewport(led)) loop.play();
        }, null, 1.4);
    }
    if (shot) {
      tl.fromTo(shot, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: T.slow }, 0.75)
        .call(function () { mark(shot); }, null, 0.9)
        .fromTo($$('.pop', shot), { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 1.9);
    }
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
    ScrollTrigger.create({ trigger: shot, start: 'top 70%', once: true, onEnter: function () { tl.play(); } });
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
    ScrollTrigger.create({ trigger: win || flow, start: 'top 70%', once: true, onEnter: function () { tl.play(); } });
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
    var loop = null, live = false;
    ScrollTrigger.create({
      trigger: box, start: 'top 75%', end: 'bottom top',
      onToggle: function (s) {
        live = s.isActive;
        if (live) { if (!loop) loop = cycle(); loop.play(); } else if (loop) loop.pause();
      }
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
      hero(handled);

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
        ScrollTrigger.create({ trigger: s, start: T.start, once: true, onEnter: function () {
          count(s);
          var btn = $('.btn.sm', s);
          if (btn) gsap.fromTo(btn, { boxShadow: '0 0 0 0 rgba(0,166,132,.45)' }, { boxShadow: '0 0 0 10px rgba(0,166,132,0)', duration: 1.2, delay: 1.8, ease: 'power2.out', clearProps: 'boxShadow' });
        } });
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

      // Layout changes (fonts, "Show all" toggles, tabs) move trigger points.
      if (window.ResizeObserver) {
        var pending;
        new ResizeObserver(function () { clearTimeout(pending); pending = setTimeout(function () { ScrollTrigger.refresh(); }, 200); }).observe(document.body);
      }
    } catch (e) {
      // Never leave content hidden.
      root.classList.remove('gs');
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
