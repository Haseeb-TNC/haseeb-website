#!/usr/bin/env node
/* ============================================================
   Haseeb public site — reproducible axe-core accessibility run.

   Brief §9 (QA pass 2) requires the audit to run in the READING STATE, not
   the landing state. Three things make the landing state a false negative:

     · every .reveal section sits at opacity 0 until it scrolls into view, and
       axe SKIPS a subtree it considers invisible — a round-2 run passed while
       .pill-ask, which lives inside a .reveal card, was failing AA;
     · the opening film is a fixed overlay above the whole page on a first
       visit, so a run against a fresh session audits the film, not the site;
     · the .55s reveal fade is a real transition — an unsettled run reported 4
       transient color-contrast failures on .hero-fact, which is 5.51:1
       settled and 3.78:1 at opacity .9. Those were artefacts of the clock.

   So each run here marks the film seen for the session, forces every .reveal
   to .visible, disables CSS transitions and animations, and then WAITS for
   and MEASURES the settle: the table carries the minimum computed opacity
   over all .reveal elements per run, so a run that audited a half-faded page
   cannot report itself as clean.

   Reduced motion is deliberately NOT emulated to hold things still: that
   media query hides the film outright and rewrites .reveal, so it audits a
   different page than the one visitors get. The stylesheet injected here
   only stops the clock.

   ── ROUND 6: the guard is two-sided ────────────────────────────────────
   Summing res.violations alone made this runner one-sided, and the blind
   side was ARABIC. Two measured mechanisms, both on the real tree at
   ef43229, both reproduced identically on three consecutive runs:

     1. axe returns "incomplete" — a node it could not decide — and the old
        code counted only violations, so an undecided node exited 0. On
        ar.html at 390x568 and 320x568, .pill-hold comes back incomplete with
        messageKey "elmPartiallyObscured" and contrastRatio 0.

     2. Worse: on ar.html most text is never evaluated AT ALL. axe's
        color-contrast MATCHER calls hasRealTextChildren(), which rejects a
        text node that its isIconLigature() heuristic believes is an icon
        font. That heuristic rasterises the text and compares it per
        character against a reference rendering — a comparison Arabic script
        fails, because its glyphs join. Measured with axe.commons.text
        .isIconLigature on ar.html 1440x900: .hero-fact (both text nodes),
        .pill-ready, .pill-ask and .form-note all return TRUE, so the rule
        does not match them and they appear in NO bucket — not passes, not
        violations, not incomplete. h1, .pill-hold and .foot-copy score under
        the threshold and are evaluated normally. The same selectors return
        FALSE on haseeb.html. Net effect at 1440x900: 72 color-contrast nodes
        evaluated on the English page, 18 on the Arabic one.

   An exemption list cannot close (2), because there is no axe result to
   exempt. So this file now carries its OWN deterministic contrast
   measurement (CONTRAST_ASSERTIONS below) that does not ask axe anything:
   it composites the element's background over its ancestors, computes the
   WCAG 2.x ratio against the computed colour, and fails under threshold.
   It runs on both built pages, so an Arabic-only regression is attributed
   to ar.html by name.

   For (1), every incomplete color-contrast node is now dispositioned. It is
   EXEMPT only if it matches INCOMPLETE_EXEMPTIONS, whose reason is printed;
   otherwise it is RESOLVED by the same deterministic measurement, and a node
   that neither exemption nor measurement clears FAILS. Nothing is silent.

   DEPENDENCIES — this repo has none of its own and installs nothing. It
   borrows playwright and axe-core from the product checkout:

     HASEEB_PW_NODE_MODULES   default /Users/tarekaljasem/Downloads/haseeb-corporate/node_modules

   Usage:  npm run site:axe        (or: node scripts/axe.mjs)
   Exit 1 on any violation, any undispositioned incomplete, any measured
   contrast under threshold, a failed settle, or a missing dependency.
   ============================================================ */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const NODE_MODULES =
  process.env.HASEEB_PW_NODE_MODULES ||
  '/Users/tarekaljasem/Downloads/haseeb-corporate/node_modules';

/* ── the run matrix ───────────────────────────────────────────────────────
   Closed state on all four pages at all three viewports; the drawer-open
   state only where the drawer exists (the two built pages) and only at the
   two viewports where it is reachable — 320x568 is below the launcher's
   breakpoint. Order matches the table published in the round-3 commit. */
const BUILT = ['haseeb.html', 'ar.html'];
const LEGAL = ['privacy.html', 'website-terms.html'];
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
  { w: 320, h: 568 }
];
const DRAWER_VIEWPORTS = [{ w: 1440, h: 900 }, { w: 390, h: 844 }];

const MATRIX = [
  ...VIEWPORTS.flatMap((v) => [...BUILT, ...LEGAL].map((p) => ({ page: p, ...v, drawer: false }))),
  ...DRAWER_VIEWPORTS.flatMap((v) => BUILT.map((p) => ({ page: p, ...v, drawer: true })))
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const FILM_KEY = 'haseeb.film.v1';

/* ── the two-sided contrast guard ─────────────────────────────────────────

   INCOMPLETE_EXEMPTIONS — the ONLY incomplete color-contrast nodes allowed
   to pass without a measured ratio. Each carries its reason and the reason
   is printed on every run, for every node it exempts, so no carve-out can
   widen without showing up in the log. Everything else incomplete is
   measured by measureContrast() and fails if it does not clear AA. */
const INCOMPLETE_EXEMPTIONS = [
  {
    id: 'decorative-arrow',
    test: (target) => /\.arrow\[aria-hidden="true"\]/.test(target),
    why: 'aria-hidden decorative arrow glyph, not informative text — WCAG 1.4.3 exempts pure decoration; axe returns nonBmp because it will not judge the glyph'
  },
  {
    id: 'film-token',
    test: (target) => /\.film-tok/.test(target),
    /* inert in practice: the reading state marks the film seen, so a
       .film-tok node has never appeared in a run here. Carried because the
       exemption set is the spec's, and an exemption that stops firing should
       be visible as an absence rather than deleted quietly. */
    why: 'transient decorative token in the aria-hidden film field; the film is over before the reading state and its recession is an opacity keyframe, not ink'
  },
  {
    id: 'launcher-text',
    test: (target) => /\.bot-launcher-text/.test(target),
    why: 'text inside the FIXED launcher, which overlaps the page by design — axe reports elmPartiallyObscuring about what the launcher covers, not about its own ink'
  }
];

/* A fourth exemption that the target string cannot express, so it is applied
   only AFTER the ratio has been measured and only if the measurement fails:
   an aria-hidden run of at most two characters is a decorative glyph, the
   same WCAG 1.4.3 carve-out the arrows already ride. It is what covers
   .bot-empty-mark — the 28px teal square holding an "H" at opacity .6,
   which measures 2.26:1 here and which axe itself declines to judge
   (shortTextContent). The measured ratio is printed with the exemption, so
   the number is on the log either way. The two .arrow entries above are
   deliberately kept separate even though this rule would also catch them:
   the log should name them. */
const DECORATIVE_GLYPH_WHY =
  'aria-hidden decoration of at most two characters (a glyph, not informative text) — WCAG 1.4.3 exempts pure decoration';

/* The named set measured deterministically on BOTH built pages, in the
   reading state. `state` says which run measures it: the drawer-only pair
   needs #botDialog open. A missing or unrendered element is a FAILURE — a
   renamed class must not quietly drop its own coverage. */
const CONTRAST_ASSERTIONS = [
  { sel: '.pill-ready', state: 'closed' },
  { sel: '.pill-ask', state: 'closed' },
  { sel: '.pill-hold', state: 'closed' },
  { sel: '.hero-fact', state: 'closed' },
  { sel: '.form-note', state: 'closed' },
  { sel: '.foot-copy', state: 'closed' },
  { sel: '.bot-disclaimer', state: 'drawer' },
  { sel: '.bot-sugg-label', state: 'drawer' }
];

/* ── dependency resolution ───────────────────────────────────────────── */

function fail(msg) {
  console.error(`axe: ${msg}`);
  process.exit(1);
}

/* Inside the run loop the browser and the server are still up, so an
   assertion failure THROWS and is reported after teardown — process.exit()
   there would orphan a chromium. */
function assertOrThrow(cond, msg) {
  if (!cond) throw new Error(msg);
}

if (!existsSync(NODE_MODULES)) {
  fail(`HASEEB_PW_NODE_MODULES does not exist: ${NODE_MODULES}`);
}
const req = createRequire(join(NODE_MODULES, 'noop.js'));

let chromium, axeSource, axeVersion;
try {
  ({ chromium } = req('playwright'));
} catch (err) {
  fail(`cannot load playwright from ${NODE_MODULES} — ${err.message}`);
}
try {
  const axePath = req.resolve('axe-core/axe.min.js');
  axeSource = readFileSync(axePath, 'utf8');
  axeVersion = req('axe-core/package.json').version;
} catch (err) {
  fail(`cannot load axe-core from ${NODE_MODULES} — ${err.message}`);
}

/* ── a static server, so the pages run on a real http origin ──────────────
   file:// gives every document an opaque origin, where sessionStorage throws
   and the film's "seen" flag cannot be set at all. */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function serve() {
  return new Promise((resolve) => {
    const server = createServer((rq, rs) => {
      const rel = normalize(decodeURIComponent(rq.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
      const abs = join(ROOT, rel === '/' ? 'haseeb.html' : rel);
      if (!abs.startsWith(ROOT) || !existsSync(abs)) {
        rs.writeHead(404).end('not found');
        return;
      }
      rs.writeHead(200, { 'content-type': MIME[extname(abs)] || 'application/octet-stream' });
      rs.end(readFileSync(abs));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ── the reading state ───────────────────────────────────────────────── */

const STILL = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
`;

async function readingState(page) {
  /* the page's own script has run and released the ready gate; force every
     reveal regardless of whether it was ever scrolled into view */
  await page.addStyleTag({ content: STILL });
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  });
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true));

  /* WAIT for the settle rather than assuming the injected stylesheet won */
  await page.waitForFunction(() => {
    const els = [...document.querySelectorAll('.reveal')];
    return els.every((el) => parseFloat(getComputedStyle(el).opacity) === 1);
  }, null, { timeout: 5000 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function measure(page) {
  return page.evaluate((key) => {
    const els = [...document.querySelectorAll('.reveal')];
    const opacities = els.map((el) => parseFloat(getComputedStyle(el).opacity));
    const film = document.querySelector('.film');
    return {
      total: els.length,
      visible: els.filter((el) => el.classList.contains('visible')).length,
      minOpacity: opacities.length ? Math.min(...opacities) : 1,
      filmSeen: sessionStorage.getItem(key) === '1',
      filmShown: !!film && !film.hidden && getComputedStyle(film).display !== 'none'
    };
  }, FILM_KEY);
}

async function openDrawer(page) {
  const launcher = page.locator('#botLauncher');
  await launcher.waitFor({ state: 'visible', timeout: 5000 });
  await launcher.click();
  await page.locator('#botDialog').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector('#botLauncher').getAttribute('aria-expanded') === 'true',
    null, { timeout: 5000 }
  );
}

async function runAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(
    (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    TAGS
  );
}

/* ── deterministic computed contrast ──────────────────────────────────────
   Runs entirely in the page, asks axe nothing, and therefore has no opinion
   about what script the text is written in. For each selector it composites
   the element's own background over every ancestor background up to <body>
   (source-over, so rgba is handled), composites the computed colour over
   that if the ink itself is translucent, and computes the WCAG 2.x ratio.

   Opacity is rendered, not refused. An element with opacity < 1 paints its
   own background AND its ink as one group at that alpha, so the group is
   composited first and the result is laid over what is beneath — which is
   how .bot-empty-mark (teal square, opacity .6) actually reaches the screen.
   Ancestor opacities multiply into the same factor; that is exact for one
   opacity level and an approximation for nested ones, and nothing on this
   site nests them.

   It refuses to guess about the rest. A background-image anywhere in the
   chain, or a colour it cannot parse, is returned as a `problem` and
   reported as a FAILURE — an unmeasurable element is exactly the hole this
   guard exists to close.

   Cover: after scrolling the element to the middle of the viewport it asks
   what is actually painted on top of the text. An element in normal flow on
   top means the composited background is a fiction, and FAILS. An element
   that is position:fixed or :sticky on top is a NOTE, not a failure — a
   fixed bar floating above content at some scroll offset is what fixed
   means (the mobile .sticky-cta sits over the footer at maximum scroll,
   where the page cannot scroll any further), and it says nothing about the
   ink of the element beneath it. */
async function measureContrast(page, selectors) {
  return page.evaluate((sels) => {
    const parse = (s) => {
      const m = String(s).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)$/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    };
    const hex = (c) =>
      '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    /* source-over: `top` painted on `bottom` */
    const over = (top, bottom) => {
      const a = top.a + bottom.a * (1 - top.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
        a
      };
    };
    const lum = (c) => {
      const ch = [c.r, c.g, c.b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    /* This composites in float. axe rounds each channel to an integer before
       it divides, which is why its number can sit 0.01 below this one — on
       .pill-hold axe prints 5.53 from #fce9e9 where the composite is really
       (251.5, 233.3, 233.3) and the ratio is 5.5427. Neither is wrong at the
       threshold; this one is the arithmetic WCAG describes. */
    const ratio = (x, y) => {
      const a = lum(x);
      const b = lum(y);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };

    return sels.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, problem: 'no element matches the selector' };
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        return { sel, problem: `element is not rendered (${rect.width}x${rect.height})` };
      }

      const name = (node) =>
        `${node.tagName.toLowerCase()}${node.className ? '.' + String(node.className).trim().split(/\s+/).join('.') : ''}`;

      const cs = getComputedStyle(el);
      const fgRaw = parse(cs.color);
      if (!fgRaw) return { sel, problem: `cannot parse color ${cs.color}` };
      const ownBg = parse(cs.backgroundColor);
      if (!ownBg) return { sel, problem: `cannot parse background-color ${cs.backgroundColor}` };
      if (cs.backgroundImage !== 'none') {
        return { sel, problem: `background-image on ${name(el)} — the painted background is not computable` };
      }

      /* group alpha: this element's opacity times every ancestor's */
      let groupAlpha = parseFloat(cs.opacity);
      if (!Number.isFinite(groupAlpha)) groupAlpha = 1;

      /* composite what is BENEATH the element: ancestor backgrounds, nearest
         first, each scaled by the opacity of the ancestors above it */
      let below = { r: 0, g: 0, b: 0, a: 0 };
      const chain = [];
      let mul = 1;
      for (let node = el.parentElement; node; node = node.parentElement) {
        const s = getComputedStyle(node);
        if (s.backgroundImage !== 'none') {
          return { sel, problem: `background-image on ${name(node)} — the painted background is not computable` };
        }
        const o = parseFloat(s.opacity);
        mul *= Number.isFinite(o) ? o : 1;
        groupAlpha *= Number.isFinite(o) ? o : 1;
        const c = parse(s.backgroundColor);
        if (!c) return { sel, problem: `cannot parse background-color ${s.backgroundColor} on ${name(node)}` };
        if (c.a > 0) {
          chain.push(`${name(node)}=${s.backgroundColor}`);
          below = over(below, { ...c, a: c.a * mul });
          if (below.a >= 1) break;
        }
      }
      /* whatever is still translucent lands on the canvas, which is white */
      below = over(below, { r: 255, g: 255, b: 255, a: 1 });

      /* the element's own group, then that group over what is beneath */
      const inkOnOwn = over(fgRaw, ownBg);
      const inkGroupAlpha = fgRaw.a + ownBg.a * (1 - fgRaw.a);
      const fg = over({ ...inkOnOwn, a: inkGroupAlpha * groupAlpha }, below);
      const bg = over({ ...ownBg, a: ownBg.a * groupAlpha }, below);
      if (ownBg.a > 0) chain.unshift(`${name(el)}=${cs.backgroundColor}`);
      if (groupAlpha !== 1) chain.unshift(`opacity ${groupAlpha.toFixed(3)}`);

      /* is anything actually on top of the text? scroll to the middle of the
         viewport first, so the sticky header is not counted by construction */
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r2 = el.getBoundingClientRect();
      const px = r2.left + r2.width / 2;
      const py = r2.top + r2.height / 2;
      let covered = null;
      let coveredFixed = false;
      const top = document.elementFromPoint(px, py);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) {
        covered = name(top);
        const pos = getComputedStyle(top).position;
        coveredFixed = pos === 'fixed' || pos === 'sticky';
      }

      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const threshold = large ? 3 : 4.5;
      const value = ratio(fg, bg);
      const hardCover = covered && !coveredFixed;

      return {
        sel,
        fg: hex(fg),
        bg: hex(bg),
        chain: chain.join(' over '),
        ratio: value,
        size,
        weight,
        large,
        threshold,
        covered,
        coveredFixed,
        /* aria-hidden single-glyph decoration — see INCOMPLETE_EXEMPTIONS */
        decorativeGlyph: !!el.closest('[aria-hidden="true"]') && (el.textContent || '').trim().length <= 2,
        pass: value >= threshold && !hardCover,
        problem: hardCover ? `covered by ${covered} (position ${getComputedStyle(top).position}) — the composited background is not what is painted` : null
      };
    });
  }, selectors);
}

/* ── tables ──────────────────────────────────────────────────────────── */

const COLS = [
  ['page / viewport / state', 45],
  ['violations', 11],
  ['nodes', 7],
  ['passes', 8],
  ['incomplete', 11],
  ['.reveal total/visible + settle proof', 36]
];
const RULE = '-'.repeat(COLS.reduce((n, [, w]) => n + w + 1, 0) - 1);
const row = (cells) => cells.map((c, i) => String(c).padEnd(COLS[i][1])).join(' ').trimEnd();

const CCOLS = [
  ['page', 12],
  ['selector', 17],
  ['fg', 9],
  ['composited bg', 14],
  ['ratio', 7],
  ['need', 6],
  ['size/weight', 14],
  ['runs', 6],
  ['verdict', 7]
];
const CRULE = '-'.repeat(CCOLS.reduce((n, [, w]) => n + w + 1, 0) - 1);
const crow = (cells) => cells.map((c, i) => String(c).padEnd(CCOLS[i][1])).join(' ').trimEnd();

/* axe truncates the ratio it prints; printing a rounded-UP 4.50 next to a
   4.4996 measurement would read as a pass. Truncate, and compare exact. */
const floor2 = (n) => (Math.floor(n * 100) / 100).toFixed(2);

/* ── main ────────────────────────────────────────────────────────────── */

const { server, port } = await serve();
const browser = await chromium.launch();
const rows = [];
const detail = [];
const exemptLog = [];
const resolvedLog = [];
const otherIncomplete = [];
const notes = [];
const failures = [];
/* page|selector -> worst measured row, plus how many runs contributed */
const contrast = new Map();
let totalViolations = 0;
let totalIncompleteNodes = 0;

try {
  for (const run of MATRIX) {
    const context = await browser.newContext({ viewport: { width: run.w, height: run.h } });
    /* mark the film seen BEFORE any page script runs, on the http origin */
    await context.addInitScript((key) => {
      try { sessionStorage.setItem(key, '1'); } catch (e) {}
    }, FILM_KEY);

    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/${run.page}`, { waitUntil: 'load' });
    await readingState(page);
    if (run.drawer) await openDrawer(page);

    const m = await measure(page);
    assertOrThrow(!m.filmShown, `${run.page} ${run.w}x${run.h}: the opening film is still on screen — the run would audit the film, not the site`);
    assertOrThrow(m.filmSeen, `${run.page} ${run.w}x${run.h}: the film "seen" flag did not survive to the page — reading state not established`);
    assertOrThrow(m.total === m.visible, `${run.page} ${run.w}x${run.h}: ${m.total - m.visible} .reveal element(s) not visible`);
    assertOrThrow(m.minOpacity === 1, `${run.page} ${run.w}x${run.h}: minimum .reveal opacity ${m.minOpacity}, the page had not settled`);

    const res = await runAxe(page);
    const nodes = res.violations.reduce((n, v) => n + v.nodes.length, 0);
    totalViolations += res.violations.length;

    const state = run.drawer ? 'drawer OPEN' : 'closed';
    const where = `${run.page} ${run.w}x${run.h} ${state}`;

    rows.push(row([
      `${run.page.padEnd(18)} ${String(run.w + 'x' + run.h).padEnd(12)} ${state}`,
      res.violations.length, nodes, res.passes.length, res.incomplete.length,
      `${m.total}/${m.visible} minOpacity ${m.minOpacity}`
    ]));

    for (const v of res.violations) {
      detail.push(`  ${where}  ${v.id} (${v.impact}) x${v.nodes.length}  ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      failures.push(`${where}: axe violation ${v.id} on ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
    }

    /* ── disposition every incomplete node ──────────────────────────────
       Undecided is not decided. A color-contrast node axe could not judge
       is EXEMPT with a printed reason, or MEASURED here, or a FAILURE. */
    const toResolve = [];
    for (const inc of res.incomplete) {
      for (const n of inc.nodes) {
        totalIncompleteNodes += 1;
        const target = n.target.join(' ');
        const key = [...(n.any || []), ...(n.all || []), ...(n.none || [])]
          .map((c) => c.data && c.data.messageKey).find(Boolean) || 'no-messageKey';
        if (inc.id !== 'color-contrast') {
          otherIncomplete.push(`  ${where}  ${inc.id} (${key})  ${target}`);
          continue;
        }
        const ex = INCOMPLETE_EXEMPTIONS.find((e) => e.test(target));
        if (ex) {
          exemptLog.push(`  EXEMPT   ${where}\n           ${target}  [${key}]\n           reason (${ex.id}): ${ex.why}`);
          continue;
        }
        if (n.target.length !== 1) {
          failures.push(`${where}: incomplete color-contrast on a cross-frame target that cannot be measured here — ${target}`);
          continue;
        }
        toResolve.push({ target, key });
      }
    }
    if (toResolve.length) {
      const measured = await measureContrast(page, toResolve.map((t) => t.target));
      measured.forEach((r, i) => {
        const k = toResolve[i].key;
        if (r.covered && r.coveredFixed) {
          notes.push(`  ${where}  ${r.sel} sits under ${r.covered}, which is fixed or sticky — noted, not gated`);
        }
        if (!r.problem && r.pass) {
          resolvedLog.push(`  RESOLVED ${where}\n           ${r.sel}  [${k}]  ${r.fg} on ${r.bg} = ${floor2(r.ratio)}:1 (needs ${r.threshold}:1)`);
          return;
        }
        if (!r.problem && r.decorativeGlyph) {
          exemptLog.push(`  EXEMPT   ${where}\n           ${r.sel}  [${k}]  measured ${floor2(r.ratio)}:1 against ${r.threshold}:1\n           reason (decorative-glyph): ${DECORATIVE_GLYPH_WHY}`);
          return;
        }
        const why = r.problem || `${floor2(r.ratio)}:1 against the required ${r.threshold}:1`;
        resolvedLog.push(`  FAIL     ${where}\n           ${r.sel}  [${k}]  ${why}`);
        failures.push(`${where}: incomplete color-contrast on ${r.sel} [${k}] is not cleared — ${why}`);
      });
    }

    /* ── the named set, measured deterministically ─────────────────────── */
    if (BUILT.includes(run.page)) {
      const want = CONTRAST_ASSERTIONS
        .filter((a) => a.state === (run.drawer ? 'drawer' : 'closed'))
        .map((a) => a.sel);
      const measured = await measureContrast(page, want);
      for (const r of measured) {
        const k = `${run.page}|${r.sel}`;
        if (r.covered && r.coveredFixed) {
          notes.push(`  ${where}  ${r.sel} sits under ${r.covered}, which is fixed or sticky — noted, not gated`);
        }
        if (r.problem || !r.pass) {
          const why = r.problem || `${floor2(r.ratio)}:1 is under the required ${r.threshold}:1`;
          failures.push(`${where}: ${r.sel} — ${why}`);
        }
        const prev = contrast.get(k);
        if (!prev) {
          contrast.set(k, { ...r, runs: 1, varied: false });
        } else {
          const same = prev.fg === r.fg && prev.bg === r.bg && Math.abs((prev.ratio || 0) - (r.ratio || 0)) < 0.005;
          const worse = !prev.problem && r.problem ? true : (r.ratio || 0) < (prev.ratio || 0);
          contrast.set(k, worse
            ? { ...r, runs: prev.runs + 1, varied: prev.varied || !same }
            : { ...prev, runs: prev.runs + 1, varied: prev.varied || !same });
        }
      }
    }

    await context.close();
  }
} catch (err) {
  await browser.close();
  server.close();
  fail(err && err.message ? err.message : String(err));
} finally {
  await browser.close();
  server.close();
}

console.log(`\naxe-core ${axeVersion} · tags: ${TAGS.join(' ')} · reading state (.reveal forced visible)\n`);
console.log(row(COLS.map(([t]) => t)));
console.log(RULE);
rows.forEach((r) => console.log(r));
console.log(RULE);
console.log(`${MATRIX.length} runs · ${totalViolations} violation(s) · ${totalIncompleteNodes} incomplete node(s), every one dispositioned below`);

/* every measured selector must have been seen on both built pages */
for (const p of BUILT) {
  for (const a of CONTRAST_ASSERTIONS) {
    if (!contrast.has(`${p}|${a.sel}`)) {
      failures.push(`${p}: ${a.sel} was never measured — the ${a.state} run that should carry it did not produce a row`);
    }
  }
}

console.log('\nCOMPUTED CONTRAST — composited background, WCAG 2.x ratio, measured in the page (axe not consulted)');
console.log(crow(CCOLS.map(([t]) => t)));
console.log(CRULE);
for (const p of BUILT) {
  for (const a of CONTRAST_ASSERTIONS) {
    const r = contrast.get(`${p}|${a.sel}`);
    if (!r) {
      console.log(crow([p, a.sel, '-', '-', '-', '-', '-', 0, 'FAIL']));
      continue;
    }
    if (r.problem) {
      console.log(crow([p, a.sel, '-', '-', '-', '-', '-', r.runs, 'FAIL']));
      console.log(`  ${p} ${a.sel}: ${r.problem}`);
      continue;
    }
    console.log(crow([
      p, a.sel, r.fg, r.bg, floor2(r.ratio), `${r.threshold}:1`,
      `${r.size}px/${r.weight}${r.large ? ' L' : ''}`,
      `${r.runs}${r.varied ? ' *' : ''}`,
      r.pass ? 'PASS' : 'FAIL'
    ]));
  }
}
console.log(CRULE);
console.log('runs = how many matrix runs measured this selector; * = the measured triple was not identical in every run (worst shown)');
console.log('L in size/weight = WCAG large text (>=24px, or >=18.66px at weight >=700), which needs 3:1 rather than 4.5:1');

console.log(`\nINCOMPLETE color-contrast nodes — ${exemptLog.length} exempt, ${resolvedLog.length} measured here`);
if (exemptLog.length) exemptLog.forEach((l) => console.log(l));
if (resolvedLog.length) resolvedLog.forEach((l) => console.log(l));
if (!exemptLog.length && !resolvedLog.length) console.log('  none');
if (notes.length) {
  console.log('\nNOTES (measured, not gated)');
  notes.forEach((l) => console.log(l));
}
if (otherIncomplete.length) {
  console.log('\nINCOMPLETE nodes on other rules (reported, not gated by the contrast guard)');
  otherIncomplete.forEach((l) => console.log(l));
}

if (detail.length) {
  console.log('\nVIOLATIONS');
  detail.forEach((d) => console.log(d));
}

if (failures.length) {
  console.log(`\nFAILURES (${failures.length})`);
  failures.forEach((f) => console.log(`  ${f}`));
  process.exit(1);
}
