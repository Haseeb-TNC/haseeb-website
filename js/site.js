// Site behaviour shared by the English (haseeb.html) and Arabic (ar.html) pages.
(function () {
  var root = document.documentElement;
  // Arabic page? Every visible string below goes through t(english, arabic).
  var AR = root.lang === 'ar';
  function t(en, ar) { return AR ? ar : en; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme toggle — light by default, choice remembered per browser.
  var themeBtn = document.getElementById('themeBtn');
  function syncThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? t('Switch to light theme', 'التبديل إلى الوضع الفاتح') : t('Switch to dark theme', 'التبديل إلى الوضع الداكن'));
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || (dark ? '#0A1620' : '#FFFFFF'));
  }
  syncThemeLabel();
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('haseeb-theme', next); } catch (e) {}
    syncThemeLabel();
  });

  // Mobile menu.
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mmenu');
  function setMenu(open) { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); }
  });

  // Nav sits clear over the hero photo, solid everywhere else. An observer, so nothing runs on each scroll event.
  var siteNav = document.querySelector('.nav'), heroEl = document.querySelector('.hero');
  if (siteNav && heroEl && window.IntersectionObserver) {
    new IntersectionObserver(function (es) { siteNav.classList.toggle('over', es[es.length - 1].isIntersecting); },
      { rootMargin: '-' + siteNav.offsetHeight + 'px 0px 0px 0px' }).observe(heroEl);
  }

  // App sidebars (same nav in every product frame).
  var ic = {
    home: 'M2.5 7 8 2.5 13.5 7v6.5h-11z',
    tx: 'M2.5 5.5h11m0 0-3-3m3 3-3 3M13.5 10.5h-11m0 0 3-3m-3 3 3 3',
    box: 'M2.5 9.5h3l1 2h3l1-2h3M2.5 9.5v4h11v-4M2.5 9.5 4 3h8l1.5 6.5',
    inv: 'M4 2h8v12l-2-1.5L8 14l-2-1.5L4 14zM6.5 5.5h3M6.5 8.5h3',
    bill: 'M4 2h5.5L12 4.5V14H4zM9 2v3h3',
    bank: 'M2 6.5 8 3l6 3.5M3.5 7v5m3-5v5m3-5v5m3-5v5M2 13.5h12',
    rep: 'M3 13V8m5 5V3m5 10V6',
    set: 'M2.5 4.5h7m3 0h1M2.5 11.5h1m3 0h7M11 3v3M5 10v3'
  };
  var nav = [[t('Owner view', 'نظرة المالك'), ic.home, 0, 'Owner view'], [t('Transactions', 'المعاملات'), ic.tx, '15', 'Transactions'], [t('Taskbox', 'المهام'), ic.box, '3', 'Taskbox'], [t('Invoices', 'الفواتير'), ic.inv, 0, 'Invoices'], [t('Bills', 'فواتير الموردين'), ic.bill, 0, 'Bills'], [t('Bank accounts', 'الحسابات البنكية'), ic.bank, 0, 'Bank accounts'], [t('Reports', 'التقارير'), ic.rep, 0, 'Reports'], [t('Settings', 'الإعدادات'), ic.set, 0, 'Settings']];
  document.querySelectorAll('.side[data-nav]').forEach(function (side) {
    var on = side.getAttribute('data-nav');
    var html = nav.map(function (n) {
      return '<div class="it' + (n[3] === on ? ' on' : '') + '"><span class="l"><svg aria-hidden="true" focusable="false" class="ico" viewBox="0 0 16 16"><path d="' + n[1] + '"></path></svg><span>' + n[0] + '</span></span>' + (n[2] ? '<span class="c">' + n[2] + '</span>' : '') + '</div>';
    }).join('');
    side.innerHTML = html + '<div class="grp">' + t('Assistant', 'المساعد') + '</div><div class="it' + (on === 'Aminah' ? ' on' : '') + '"><span class="l"><span class="ava am xs">' + t('A', 'أ') + '</span><span>' + t('Aminah', 'أمينة') + '</span></span></div>';
  });

  // KPI count-up.
  function fmt(n, int) {
    if (int) return String(Math.round(n));
    var s = n.toFixed(3).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + s[1];
  }
  function countUp(scope) {
    var els = scope.querySelectorAll('[data-count]');
    var steps = 36, i = 0;
    var t = setInterval(function () {
      i++;
      var p = i >= steps ? 1 : 1 - Math.pow(1 - i / steps, 3);
      els.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count')) * p, el.hasAttribute('data-int')); });
      if (i >= steps) clearInterval(t);
    }, 32);
  }

  // Scroll reveal. js/motion.js (GSAP) runs it when loaded — see HMotion.start() at the end;
  // this observer is the fallback when the GSAP scripts fail to load.
  if (window.HMotion) root.classList.add('js-on');
  else if ('IntersectionObserver' in window) {
    root.classList.add('js-on');
    var counted = [document.getElementById('s1'), document.getElementById('s5')];
    if (!reduce) counted.forEach(function (s) { s.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = fmt(0, el.hasAttribute('data-int')); }); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-in', '1');
        io.unobserve(e.target);
        if (!reduce && counted.indexOf(e.target) !== -1) countUp(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv, .seats').forEach(function (el) { io.observe(el); });
  }

  // Small screens: long example lists show their first 5 rows, with a toggle for the rest.
  [].forEach.call(document.querySelectorAll('.tbl.rows'), function (tbl) {
    var rows = tbl.querySelectorAll('.tr:not(.h)');
    if (rows.length <= 6) return;
    for (var i = 5; i < rows.length; i++) rows[i].classList.add('more');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tmore'; b.setAttribute('aria-expanded', 'false');
    b.textContent = t('Show all ', 'عرض الكل ') + rows.length;
    b.addEventListener('click', function () {
      var open = tbl.classList.toggle('all');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? t('Show fewer', 'عرض أقل') : t('Show all ', 'عرض الكل ') + rows.length;
    });
    tbl.appendChild(b);
  });
  // Showcase tabs — auto-advance every 6s once in view.
  var tabs = [0, 1, 2].map(function (i) { return document.getElementById('tab-' + i); });
  var stages = [0, 1, 2].map(function (i) { return document.getElementById('stage-' + i); });
  var show = document.getElementById('show');
  var current = 0, timer = null;
  // Replay CSS animations (stage fade, row cascade, progress bar) on an element tree.
  function replay(el) {
    var els = [el].concat([].slice.call(el.querySelectorAll(':scope > *, .tr, .pg b, .result .pill, .result .arrow')));
    els.forEach(function (x) { x.style.animation = 'none'; });
    void el.offsetWidth;
    els.forEach(function (x) { x.style.animation = ''; });
  }
  function pick(i, focus) {
    current = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      stages[j].hidden = !on;
    });
    replay(stages[i]); replay(tabs[i]);
    // Flow scene: same bank line as the screen, goes in and lands in the books or comes back.
    var fs = document.getElementById('fscene');
    if (fs) {
      var lines = [['Zain Telecom', '−28.500'], ['Boutiqaat', '−64.000'], ['Al Rai Trading', '−1,840.000']];
      document.getElementById('fs-nm').textContent = lines[i][0];
      document.getElementById('fs-amt').textContent = lines[i][1];
      fs.setAttribute('data-s', i);
      var fx = [].slice.call(fs.querySelectorAll('.fs-card, .fs-dot, .fs-lt, .fs-chip, .fs-row, .fs-badge'));
      fx.forEach(function (x) { x.style.animation = 'none'; });
      void fs.getBoundingClientRect();
      fx.forEach(function (x) { x.style.animation = ''; });
    }
    // On narrow screens the tab row scrolls sideways — keep the active tab visible.
    if (tabList.scrollWidth > tabList.clientWidth) {
      var dx = tabs[i].getBoundingClientRect().left - tabList.getBoundingClientRect().left;
      tabList.scrollTo({ left: tabList.scrollLeft + dx, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (focus) tabs[i].focus();
  }
  // Rotation runs until the visitor picks a tab; picking one stops it for good (WCAG 2.2.2).
  var tabList = tabs[0].parentNode;
  var started = false, stopped = false;
  function run() {
    clearInterval(timer);
    var go = started && !stopped;
    show.classList.toggle('paused', !go);
    if (go) {
      replay(tabs[current]);
      timer = setInterval(function () { pick((current + 1) % 3); }, 6000);
    }
  }
  function takeOver(i, focus) { stopped = true; pick(i, focus); run(); }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { takeOver(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % 3;
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i + 2) % 3;
      if (n !== null) { e.preventDefault(); takeOver(n, true); }
    });
  });
  run();
  function begin() { started = true; pick(current); run(); }
  if ('IntersectionObserver' in window) {
    show.classList.add('paused');
    var showIo = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      showIo.disconnect();
      begin();
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    showIo.observe(show);
  } else begin();

  // Mobile sticky CTA — shows after the hero, hides near the form.
  var stick = document.getElementById('stick');
  var stickLink = stick.querySelector('a');
  var hero = document.getElementById('top');
  var apply = document.getElementById('apply');
  // Two observers instead of a scroll listener: "hero is scrolled past" and "form is still below the screen".
  var pastHero = false, formBelow = true;
  function checkStick() {
    var showIt = pastHero && formBelow;
    stick.setAttribute('aria-hidden', showIt ? 'false' : 'true');
    stickLink.tabIndex = showIt ? 0 : -1;
  }
  checkStick();
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { var e = es[es.length - 1]; pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; checkStick(); },
      { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (es) { var e = es[es.length - 1]; formBelow = !e.isIntersecting && e.boundingClientRect.top > 0; checkStick(); }).observe(apply);
  }

  // Founding-cohort application: opens the visitor's email app
  // (mailto: founder@haseeb.app). No invented endpoint.
  var form = document.getElementById('apply');
  var status = document.getElementById('formStatus');
  var ids = ['f-name', 'f-company', 'f-role', 'f-type', 'f-setup', 'f-contact'];
  function details() {
    var v = {};
    ids.forEach(function (id) { v[id] = document.getElementById(id).value.trim(); });
    return v;
  }
  function body(intro, v) {
    return [t('Hello,', 'مرحباً،'), '', intro, '',
      t('Name: ', 'الاسم: ') + v['f-name'], t('Company: ', 'الشركة: ') + v['f-company'],
      t('Role: ', 'المنصب: ') + v['f-role'], t('Business type: ', 'نوع النشاط: ') + v['f-type'],
      t('Current accounting setup: ', 'طريقة المحاسبة الحالية: ') + v['f-setup'],
      t('Work email or phone: ', 'البريد الإلكتروني أو الهاتف: ') + v['f-contact']].join('\n');
  }
  function mail(subject, text) {
    return 'mailto:founder@haseeb.app?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = details(), missing = 0, first = null;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      var bad = !v[id];
      el.closest('.fld').classList.toggle('bad', bad);
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) { missing++; if (!first) first = el; }
    });
    if (missing) {
      status.className = 'status err';
      status.textContent = t('Fill in the highlighted fields so we can review your application.', 'أكمل الحقول المحددة حتى نتمكن من مراجعة طلبك.');
      first.focus();
      return;
    }
    // Contact must look like an email address or a phone number (8+ digits).
    var c = v['f-contact'], contact = document.getElementById('f-contact');
    var okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || (/^\+?[\d\s()-]+$/.test(c) && c.replace(/\D/g, '').length >= 8);
    if (!okContact) {
      contact.closest('.fld').classList.add('bad');
      contact.setAttribute('aria-invalid', 'true');
      status.className = 'status err';
      status.textContent = t('Enter a work email (name@company.com) or a phone number such as +965 2222 3333.', 'أدخل بريد عمل (name@company.com) أو رقم هاتف مثل 3333 2222 965+.');
      contact.focus();
      return;
    }
    window.location.href = mail(t('Founding cohort application: ', 'طلب انضمام للمجموعة التأسيسية: ') + v['f-company'], body(t('I would like to apply for a place in the Haseeb founding cohort.', 'أرغب في التقدم لمكان في المجموعة التأسيسية لحسيب.'), v));
    status.className = 'status ok';
    status.textContent = t('Your email app should now be open with your application to founder@haseeb.app. Press send there to submit it. If nothing opened, email founder@haseeb.app directly.', 'يُفترض أن يكون تطبيق البريد قد فُتح الآن وفيه طلبك إلى founder@haseeb.app. اضغط إرسال هناك لتقديمه. إذا لم يُفتح شيء، راسل founder@haseeb.app مباشرة.');
  });
  document.getElementById('founderBtn').addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = mail(t('Conversation with the founder', 'محادثة مع المؤسس'), body(t('I would like to speak with the founder about Haseeb.', 'أرغب في التحدث مع المؤسس عن حسيب.'), details()));
  });

  if (window.HMotion) window.HMotion.start();
})();
