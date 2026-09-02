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

   DEPENDENCIES — this repo has none of its own and installs nothing. It
   borrows playwright and axe-core from the product checkout:

     HASEEB_PW_NODE_MODULES   default /Users/tarekaljasem/Downloads/haseeb-corporate/node_modules

   Usage:  npm run site:axe        (or: node scripts/axe.mjs)
   Exit 1 on any violation, on a failed settle, or on a missing dependency.
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

/* ── the table ───────────────────────────────────────────────────────── */

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

/* ── main ────────────────────────────────────────────────────────────── */

const { server, port } = await serve();
const browser = await chromium.launch();
const rows = [];
const detail = [];
let totalViolations = 0;

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
    rows.push(row([
      `${run.page.padEnd(18)} ${String(run.w + 'x' + run.h).padEnd(12)} ${state}`,
      res.violations.length, nodes, res.passes.length, res.incomplete.length,
      `${m.total}/${m.visible} minOpacity ${m.minOpacity}`
    ]));

    for (const v of res.violations) {
      detail.push(`  ${run.page} ${run.w}x${run.h} ${state}  ${v.id} (${v.impact}) x${v.nodes.length}  ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
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
console.log(`${MATRIX.length} runs · ${totalViolations} violation(s) total`);

if (detail.length) {
  console.log('\nVIOLATIONS');
  detail.forEach((d) => console.log(d));
  process.exit(1);
}
