#!/usr/bin/env node
/* ============================================================
   Haseeb public site — static build.
   node >= 18, zero dependencies.

   src/site.template.html + src/copy/{en,ar}.json  ->  haseeb.html, ar.html

   Placeholders:
     {{a.b}}    HTML text.  Arabic values get digit runs wrapped in
                <span class="num"> so numerals stay LTR-isolated.
     {{@a.b}}   attribute value. Never wrapped, always attribute-escaped.
     *Html keys are pre-rendered markup and are inserted verbatim.
   The template carries no conditionals and no loops.
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  { copy: 'src/copy/en.json', out: 'haseeb.html', lang: 'en' },
  { copy: 'src/copy/ar.json', out: 'ar.html', lang: 'ar' }
];

/* The opening film's proof page is generated from the SAME template
   fragment, the SAME stylesheet block and the SAME script module as the
   site, so it cannot drift from what ships. */
const PROOF_OUT = 'docs/film-proof.html';

const BANNER =
  '<!-- GENERATED FILE — do not edit by hand.\n' +
  '     Source: src/site.template.html + src/copy/*.json\n' +
  '     Rebuild: npm run site:build   ·   Verify: npm run site:check -->';

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

/* ---- the opening film -------------------------------------------------
   A token is an AMOUNT when it carries a three-decimal figure; everything
   else is a word. Words take the first column, start-aligned; amounts take
   the second, aligned on the decimal point by right-aligning the integer
   part in a fixed box. Both are laid out here, in their FINAL ordered
   position — the film transforms them OUT to the edges and animates back,
   so the ordered state is exact by construction and never by arithmetic. */

const FILM_AMOUNT = /^(.*?)(\.\d{3})(.*)$/;

function renderFilmTokens(tokens, isArabic) {
  if (!Array.isArray(tokens)) throw new Error('build: film.tokens must be an array');
  const words = [];
  const amounts = [];
  for (const t of tokens) (FILM_AMOUNT.test(t) ? amounts : words).push(t);
  if (!words.length || !amounts.length) throw new Error('build: film.tokens needs both words and amounts');

  const out = words.map((t, i) => {
    const body = isArabic ? wrapDigits(escText(t)) : escText(t);
    return `<span class="film-tok film-word" style="grid-row:${i + 1}">${body}</span>`;
  });

  /* Every digit run is isolated, in BOTH languages. On the Arabic page that
     is tripwire 13; on the English page it is what stops an Arabic currency
     mark that PRECEDES its figure (د.ك 28.500) from being reordered by the
     bidi algorithm into the middle of the number. */
  const isolateDigits = (s) =>
    s.replace(/[0-9][0-9,]*(?:\.[0-9]+)?|\.[0-9]+/g, (m) => `<span class="num">${m}</span>`);

  /* amounts spread evenly down the same rows, so the second column reads as
     an even rhythm rather than a block */
  amounts.forEach((t, j) => {
    const m = t.match(FILM_AMOUNT);
    const row = Math.min(words.length, Math.max(1,
      Math.round(((j + 0.5) * words.length) / amounts.length)));
    out.push(
      `<span class="film-tok film-amt" style="grid-row:${row}">` +
      `<span class="film-amt-i">${isolateDigits(escText(m[1]))}</span>` +
      `<span class="film-amt-f">${isolateDigits(escText(m[2] + m[3]))}</span></span>`
    );
  });

  return out.join('\n        ');
}

/* statement 2 carries the brand word, and it is the only teal TEXT in the
   film. Derived rather than hand-written so the copy of record stays plain. */
function renderFilmLine2(line2, brandWord) {
  const re = new RegExp(brandWord.replace(/[.*+?^${}()|[\]\\]/g, '\\function buildPage(copyPath, templateSrc) {'), 'i');
  if (!re.test(line2)) {
    throw new Error(`build: film.line2 "${line2}" does not contain the brand word "${brandWord}"`);
  }
  return line2.replace(re, (m) => `<span class="film-teal">${m}</span>`);
}

/* the film fragment, rendered, lifted straight out of a built page */
function sliceFilm(html) {
  const start = html.indexOf('<!-- FILM:START');
  const end = html.indexOf('<!-- FILM:END -->');
  if (start < 0 || end < 0) throw new Error('build: FILM:START / FILM:END markers missing');
  const afterComment = html.indexOf('-->', start);
  return html.slice(afterComment + 3, end).trim();
}

function buildPage(copyPath, templateSrc) {
  const copy = JSON.parse(readFileSync(join(ROOT, copyPath), 'utf8'));
  const raw = flatten(copy, '', new Map());
  const isArabic = copy.html.lang === 'ar';

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
  text.set('film.tokensHtml', renderFilmTokens(raw.get('film.tokens'), isArabic));
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

  const page = html.replace('<head>\n', `<head>\n${BANNER}\n`);
  return {
    html: page,
    film: sliceFilm(page),
    lang: copy.html.lang,
    dir: copy.html.dir,
    heroH1: text.get('hero.h1'),
    heroSupport: text.get('hero.support'),
    wordmark: text.get('brand.wordmark')
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
  const out = {};
  const built = {};
  for (const page of PAGES) {
    built[page.lang] = buildPage(page.copy, templateSrc);
    out[page.out] = built[page.lang].html;
  }
  out[PROOF_OUT] = buildProof(built);
  return out;
}

function main() {
  const pages = renderAll();
  for (const [name, html] of Object.entries(pages)) {
    writeFileSync(join(ROOT, name), html, 'utf8');
    console.log(`built  ${name}  (${html.length} bytes)`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
