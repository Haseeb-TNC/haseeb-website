#!/usr/bin/env node
/* ============================================================
   Haseeb public site — static build.
   node >= 18, zero dependencies.

   src/site.template.html
   + src/copy/{en,ar}.json          (copy of record — templates, no figures)
   + src/fixture/sample-company.json (THE one fixture — every figure)
        ->  haseeb.html, ar.html, docs/film-proof.html

   Placeholders:
     {{a.b}}    HTML text.  Arabic values get digit runs wrapped in
                <span class="num"> so numerals stay LTR-isolated.
     {{@a.b}}   attribute value. Never wrapped, always attribute-escaped.
     *Html / *Attr keys are derived here and inserted verbatim.
   The template carries no conditionals and no loops.

   Copy values additionally carry {placeholder} tokens that are filled from
   the fixture BEFORE anything is escaped (round 7, §5): the copy files must
   never contain a literal money figure, and scripts/check.mjs tripwire 18
   asserts that they do not.

   The deployed pages carry NO HTML comments (round 7, §8): the template's
   comments are stripped from the built output after the film fragment has
   been sliced out of it.
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  { copy: 'src/copy/en.json', out: 'haseeb.html', lang: 'en' },
  { copy: 'src/copy/ar.json', out: 'ar.html', lang: 'ar' }
];

const FIXTURE = 'src/fixture/sample-company.json';

/* The opening film's proof page is generated from the SAME template
   fragment, the SAME stylesheet block and the SAME script module as the
   site, so it cannot drift from what ships. It lives under docs/ and is not
   deployed, so it keeps its explanatory comments. */
const PROOF_OUT = 'docs/film-proof.html';

/* digit runs, with an optional leading sign so "−28.500" stays one unit */
const DIGIT_RUN = /[-−+]?[0-9][0-9,.٪%–-]*/g;

/* keys whose values are never digit-wrapped */
function isWrapExempt(path) {
  if (path.startsWith('html.')) return true;
  if (path.startsWith('brand.')) return true;
  if (path === 'footer.contact') return true;
  const leaf = path.split('.').pop();
  if (leaf.endsWith('Ph')) return true;
  return false;
}

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const wrapDigits = (s) => String(s).replace(DIGIT_RUN, (m) => `<span class="num">${m}</span>`);

/* flatten the copy tree into dot-path dictionaries */
function flatten(node, prefix, raw) {
  for (const [key, value] of Object.entries(node)) {
    if (key === '_headlineOptions') continue; // never rendered
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, raw);
    else raw.set(path, value);
  }
  return raw;
}

/* ═══════════════════ the fixture ═══════════════════════════════════════
   Kuwaiti money is three decimals and is held in the fixture as a STRING
   with exactly three of them, so it can be read as an exact integer number
   of fils. Nothing here ever parses money as a float: 39190.59 is not
   representable in binary, and 48420.75 - 39190.59 = 9230.160000000003 is
   the kind of arithmetic that turns a reconciliation tripwire into noise.

   No reconciliation is asserted HERE. The build's job is to render; the
   check's job is to disagree with it. check.mjs tripwire 17 recomputes
   every total, percentage and difference from the same file with its own
   arithmetic and compares against the rendered text.
   ------------------------------------------------------------------ */

const AMOUNT_RE = /^(-?)(\d+)\.(\d{3})$/;

export function fils(value, what) {
  const m = AMOUNT_RE.exec(String(value));
  if (!m) throw new Error(`fixture: ${what} = "${value}" is not a three-decimal amount`);
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 1000 + Number(m[3]));
}

export function money(f) {
  const neg = f < 0;
  const abs = Math.abs(f);
  const whole = String(Math.floor(abs / 1000)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = String(abs % 1000).padStart(3, '0');
  return (neg ? '−' : '') + whole + '.' + frac;
}

/* tenths of a percent, computed on integers, then rendered with one decimal */
export function changePct(currentFils, previousFils) {
  if (previousFils === 0) throw new Error('fixture: cannot compute a change against a zero base');
  const diff = currentFils - previousFils;
  if (diff === 0) return 'unchanged';
  const tenths = Math.round((Math.abs(diff) * 1000) / previousFils);
  return `${diff > 0 ? 'up' : 'down'} ${(tenths / 10).toFixed(1)}%`;
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/* Month NAMES are formatting, not copy. The only one that reaches the
   Arabic page is أبريل, which the Arabic copy of record already carried
   before this round; the rest of the table is inert until a fixture date
   moves. No new Arabic sentence is authored anywhere in this round. */
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function parseDate(iso, what) {
  const m = DATE_RE.exec(String(iso));
  if (!m) throw new Error(`fixture: ${what} = "${iso}" is not an ISO date`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/* "30 April 2026" — English only, and deliberately so: it is quoted inside
   an answer that is an ENGLISH string on both pages this round (§5), and an
   Arabic month inside an English sentence would be worse than either. The
   short row dates below ARE language-aware, because the strings that carry
   them (the three "how" card rows) already had Arabic drafts. */
const longDateEn = (d) => `${d.d} ${MONTHS_EN[d.m - 1]} ${d.y}`;
const shortDate = (d, isArabic) =>
  `${d.d} ${(isArabic ? MONTHS_AR : MONTHS_EN_SHORT)[d.m - 1]}`;

/* every {placeholder} the copy files may use, for one language */
export function fixtureValues(fixture, isArabic) {
  const invoices = fixture.invoices.map((inv) => ({ ...inv, f: fils(inv.amount, `invoice ${inv.number}`) }));
  const largest = invoices.reduce((a, b) => (b.f > a.f ? b : a));
  const cur = fixture.periods.current;
  const prev = fixture.periods.previous;

  const curNet = fils(cur.netIncome, 'periods.current.netIncome');
  const prevNet = fils(prev.netIncome, 'periods.previous.netIncome');
  const netDiff = curNet - prevNet;

  const v = new Map([
    ['customerCount', String(new Set(invoices.map((i) => i.customer)).size)],
    ['openTotal', money(fils(fixture.openTotal, 'openTotal'))],
    ['largestInvoiceNo', String(largest.number)],
    ['largestCustomer', String(largest.customer)],
    ['largestAmount', money(largest.f)],

    ['cash', money(fils(fixture.cash, 'cash'))],
    ['accountCount', String(fixture.accounts.length)],
    ['asOfDate', longDateEn(parseDate(fixture.asOf, 'asOf'))],

    ['month', `${MONTHS_EN[cur.month - 1]} ${cur.year}`],
    ['prevMonth', `${MONTHS_EN[prev.month - 1]} ${prev.year}`],
    ['revenue', money(fils(cur.revenue, 'periods.current.revenue'))],
    ['opex', money(fils(cur.operatingExpenses, 'periods.current.operatingExpenses'))],
    ['net', money(curNet)],
    ['revenueChangePct', changePct(fils(cur.revenue, 'cur.revenue'), fils(prev.revenue, 'prev.revenue'))],
    ['opexChangePct', changePct(fils(cur.operatingExpenses, 'cur.opex'), fils(prev.operatingExpenses, 'prev.opex'))],
    ['netChangeAbs', money(Math.abs(netDiff))],
    ['netChangeDir', netDiff > 0 ? 'higher' : netDiff < 0 ? 'lower' : 'unchanged']
  ]);

  for (const row of fixture.exampleRows) {
    v.set(`${row.id}Amount`, money(fils(row.amount, `exampleRows.${row.id}`)));
    v.set(`${row.id}Date`, shortDate(parseDate(row.date, `exampleRows.${row.id}.date`), isArabic));
  }
  return v;
}

/* {name} is substituted by site.js at submit time, not here */
const RUNTIME_PLACEHOLDERS = new Set(['name']);

function applyFixture(node, values, path, seen) {
  if (typeof node === 'string') {
    const out = node.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (m, key) => {
      if (values.has(key)) { seen.add(key); return values.get(key); }
      if (RUNTIME_PLACEHOLDERS.has(key)) return m;
      throw new Error(`build: ${path} uses unknown fixture placeholder {${key}}`);
    });
    return out;
  }
  if (Array.isArray(node)) return node.map((v, i) => applyFixture(v, values, `${path}[${i}]`, seen));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(node)) {
      out[k] = applyFixture(val, values, path ? `${path}.${k}` : k, seen);
    }
    return out;
  }
  return node;
}

/* ---- the opening film -------------------------------------------------
   The field is a canvas (round 7): the token vocabulary reaches the module
   as two pipe-separated lists on the field element rather than as DOM
   spans. A token is an AMOUNT when it carries a three-decimal figure;
   everything else is a word. The ordered state the film settles into puts
   the words in one column and the amounts in a second, aligned on the
   decimal point, so the two lists are kept separate here.  */

/* A token CARRIES MONEY when it shows a currency mark in either language or
   a decimal point next to a digit. The Arabic mark د.ك carries a dot of its
   own, so it is matched as a mark and never read as a decimal point. */
const FILM_MONEY_MARK = /KWD|د\.ك/;
const FILM_CARRIES_MONEY = (t) => FILM_MONEY_MARK.test(t) || /\d\.|\.\d/.test(t);

/* Kuwaiti money is three decimals, always. Classifying by "has a
   three-decimal figure" alone DEMOTES a wrong figure ("450.00 KWD") to a
   word, which is silent: the film still renders, and any downstream "all
   amounts are 3dp" assertion then counts over a denominator the bad token
   has already left. So the demotion is refused here, at the source. */
function filmMoneyFault(t) {
  if (!FILM_CARRIES_MONEY(t)) return null;
  const bare = String(t).replace(new RegExp(FILM_MONEY_MARK.source, 'g'), ' ');
  const dots = (bare.match(/\./g) || []).length;
  const threeDp = (bare.match(/\d\.\d{3}(?!\d)/g) || []).length;
  if (dots === 1 && threeDp === 1) return null;
  return `film.tokens entry "${t}" carries money but is not exactly one ` +
         `three-decimal figure (${dots} decimal point(s), ${threeDp} three-decimal figure(s))`;
}

function splitFilmTokens(tokens) {
  if (!Array.isArray(tokens)) throw new Error('build: film.tokens must be an array');
  const words = [];
  const amounts = [];
  for (const t of tokens) {
    if (String(t).includes('|')) {
      throw new Error(`build: film.tokens entry "${t}" contains "|", the list separator`);
    }
    const fault = filmMoneyFault(t);
    if (fault) throw new Error(`build: ${fault}`);
    (FILM_CARRIES_MONEY(t) ? amounts : words).push(String(t));
  }
  if (words.length < 1 || amounts.length < 1) {
    throw new Error('build: film.tokens needs both words and amounts');
  }
  return { words, amounts };
}

/* statement 2 carries the brand word, and it is the only teal TEXT in the
   film. Derived rather than hand-written so the copy of record stays plain. */
function renderFilmLine2(line2, brandWord) {
  const re = new RegExp(brandWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (!re.test(line2)) {
    throw new Error(`build: film.line2 "${line2}" does not contain the brand word "${brandWord}"`);
  }
  return line2.replace(re, (m) => `<span class="film-teal">${m}</span>`);
}

/* the film fragment, rendered, lifted straight out of a built page BEFORE
   its comments are stripped */
function sliceFilm(html) {
  const start = html.indexOf('<!-- FILM:START');
  const end = html.indexOf('<!-- FILM:END -->');
  if (start < 0 || end < 0) throw new Error('build: FILM:START / FILM:END markers missing');
  const afterComment = html.indexOf('-->', start);
  return html.slice(afterComment + 3, end).trim();
}

/* Deployed HTML carries no internal comments (§8). Applied LAST, after the
   film fragment has been sliced, so the FILM markers can still do their job
   inside the build and never reach a visitor. */
function stripComments(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

function buildPage(copyPath, templateSrc, fixture) {
  const source = JSON.parse(readFileSync(join(ROOT, copyPath), 'utf8'));
  const isArabic = source.html.lang === 'ar';

  /* ---- the fixture, before anything is escaped ---- */
  const values = fixtureValues(fixture, isArabic);
  const used = new Set();
  const copy = applyFixture(source, values, '', used);

  const raw = flatten(copy, '', new Map());

  /* ---- derived keys (never edits to the copy of record) ---- */
  const canonical = copy.html.canonical;
  const altHref = copy.html.altHref;
  const enHref = isArabic ? altHref : canonical;
  const arHref = isArabic ? canonical : altHref;

  raw.set('html.altPath', new URL(altHref).pathname);
  raw.set('html.enHref', enHref);
  raw.set('html.arHref', arHref);
  raw.set('html.xDefaultHref', enHref);
  raw.set(
    'form.founderMailto',
    'mailto:founder@haseeb.app?subject=' + encodeURIComponent(copy.form.founderSubject)
  );

  const { words, amounts } = splitFilmTokens(raw.get('film.tokens'));
  raw.set('film.wordsAttr', words.join('|'));
  raw.set('film.amountsAttr', amounts.join('|'));

  /* ---- text dictionary: escape, then wrap digits on the Arabic page ---- */
  const text = new Map();
  for (const [path, value] of raw) {
    if (Array.isArray(value)) {
      text.set(
        path,
        value.map((v) => (isArabic && !isWrapExempt(path) ? wrapDigits(escText(v)) : escText(v)))
      );
    } else {
      const escaped = escText(value);
      text.set(path, isArabic && !isWrapExempt(path) ? wrapDigits(escaped) : escaped);
    }
  }

  /* ---- arrays are pre-rendered into derived *Html keys ---- */
  text.set('kuwait.chipsHtml', text.get('kuwait.chips').map((c) => `<li>${c}</li>`).join('\n        '));
  text.set(
    'cohort.bulletsHtml',
    text.get('cohort.bullets').map((b) => `<li>${b}</li>`).join('\n          ')
  );
  text.set('film.line2Html', renderFilmLine2(text.get('film.line2'), escText(copy.brand.name)));

  /* ---- render ---- */
  const missing = [];
  const html = templateSrc.replace(/\{\{(@?)([A-Za-z0-9_.]+)\}\}/g, (_m, at, path) => {
    if (at === '@') {
      if (!raw.has(path)) { missing.push('@' + path); return ''; }
      return escAttr(raw.get(path));
    }
    if (!text.has(path)) { missing.push(path); return ''; }
    const value = text.get(path);
    if (Array.isArray(value)) { missing.push(path + ' (array used directly)'); return ''; }
    return value;
  });

  if (missing.length) {
    throw new Error(`build: unknown or misused placeholders in ${copyPath}: ${missing.join(', ')}`);
  }

  return {
    html: stripComments(html),
    film: stripComments(sliceFilm(html)),
    lang: copy.html.lang,
    dir: copy.html.dir,
    heroH1: text.get('hero.h1'),
    heroSupport: text.get('hero.support'),
    wordmark: text.get('brand.wordmark'),
    fixtureUsed: used,
    answers: { a1: raw.get('bot.a1'), a2: raw.get('bot.a2'), a3: raw.get('bot.a3') },
    filmTokens: { words, amounts }
  };
}

/* ---- the proof page ---------------------------------------------------
   ONE self-contained file: the film's stylesheet block and script module
   are copied verbatim out of assets/, and the two film fragments out of the
   two built pages, so the founder watches exactly the code that ships. */

function region(src, startMark, endMark, what) {
  const a = src.indexOf(startMark);
  const b = src.indexOf(endMark);
  if (a < 0 || b < 0) throw new Error(`build: ${what} markers missing`);
  return src.slice(a, b + endMark.length);
}

function firstBlock(src, re, what) {
  const m = src.match(re);
  if (!m) throw new Error(`build: ${what} not found`);
  return m[0];
}

function buildProof(pages) {
  const tpl = readFileSync(join(ROOT, 'src/film-proof.template.html'), 'utf8');
  const css = readFileSync(join(ROOT, 'assets/site.css'), 'utf8');
  const js = readFileSync(join(ROOT, 'assets/site.js'), 'utf8');

  const values = {
    ROOT_CSS: firstBlock(css, /^:root \{[\s\S]*?\n\}/m, 'the :root token block') + '\n\n' +
              firstBlock(css, /^\[dir="rtl"\] \{[\s\S]*?\n\}/m, 'the [dir=rtl] token block'),
    FILM_CSS: region(css, '/* FILM-CSS:START', '/* FILM-CSS:END */', 'FILM-CSS'),
    FILM_JS: region(js, '/* FILM-MODULE:START', '/* FILM-MODULE:END */', 'FILM-MODULE'),
    FILM_EN: pages.en.film,
    FILM_AR: pages.ar.film,
    HERO_EN_H1: pages.en.heroH1,
    HERO_EN_SUPPORT: pages.en.heroSupport,
    HERO_AR_H1: pages.ar.heroH1,
    HERO_AR_SUPPORT: pages.ar.heroSupport,
    WORDMARK: pages.en.wordmark
  };

  const missing = [];
  const out = tpl.replace(/%%([A-Z0-9_]+)%%/g, (_m, key) => {
    if (!(key in values)) { missing.push(key); return ''; }
    return values[key];
  });
  if (missing.length) throw new Error(`build: unknown proof placeholders: ${missing.join(', ')}`);
  /* A key the substitution grammar cannot even SEE is the dangerous case:
     %%HERO_EN_H1%% has a digit in it and an [A-Z_]+ pattern skipped it
     silently, shipping the placeholder text into the page. Anything left
     that looks like a placeholder fails the build. */
  const leftover = out.match(/%%[^%\s]{2,40}%%/g);
  if (leftover) throw new Error(`build: unsubstituted proof placeholders: ${[...new Set(leftover)].join(', ')}`);
  return out;
}

export function renderAll() {
  const templateSrc = readFileSync(join(ROOT, 'src/site.template.html'), 'utf8');
  const fixture = JSON.parse(readFileSync(join(ROOT, FIXTURE), 'utf8'));
  const out = {};
  const built = {};
  for (const page of PAGES) {
    built[page.lang] = buildPage(page.copy, templateSrc, fixture);
    out[page.out] = built[page.lang].html;
  }
  out[PROOF_OUT] = buildProof(built);
  return out;
}

/* the same render, with the per-page detail check.mjs needs */
export function renderDetail() {
  const templateSrc = readFileSync(join(ROOT, 'src/site.template.html'), 'utf8');
  const fixture = JSON.parse(readFileSync(join(ROOT, FIXTURE), 'utf8'));
  const built = {};
  for (const page of PAGES) built[page.out] = buildPage(page.copy, templateSrc, fixture);
  return built;
}

function main() {
  const pages = renderAll();
  for (const [name, html] of Object.entries(pages)) {
    writeFileSync(join(ROOT, name), html, 'utf8');
    console.log(`built  ${name}  (${html.length} bytes)`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
