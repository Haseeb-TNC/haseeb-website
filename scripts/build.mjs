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
  { copy: 'src/copy/en.json', out: 'haseeb.html' },
  { copy: 'src/copy/ar.json', out: 'ar.html' }
];

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

  return html.replace('<head>\n', `<head>\n${BANNER}\n`);
}

export function renderAll() {
  const templateSrc = readFileSync(join(ROOT, 'src/site.template.html'), 'utf8');
  const out = {};
  for (const page of PAGES) out[page.out] = buildPage(page.copy, templateSrc);
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
