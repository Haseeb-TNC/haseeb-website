#!/usr/bin/env node
/* ============================================================
   Haseeb public site — definition-of-done tripwires.
   Brief §8: fourteen checks, exit 1 on any failure.
   node >= 18, zero dependencies.
   ============================================================ */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { renderAll } from './build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const BUILT = ['haseeb.html', 'ar.html'];
const LEGAL = ['privacy.html', 'website-terms.html'];
const ALL_PAGES = [...BUILT, ...LEGAL];
const SOURCE_DIRS = ['src', 'assets', 'scripts'];

const results = [];
function check(n, title, fn) {
  let ok = false;
  let detail = '';
  try {
    const r = fn();
    ok = r === true || (r && r.ok === true);
    detail = (r && r.detail) || '';
  } catch (err) {
    ok = false;
    detail = err && err.message ? err.message : String(err);
  }
  results.push({ n, title, ok, detail });
}

function walk(dir, acc = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return acc;
  for (const entry of readdirSync(abs)) {
    const rel = join(dir, entry);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

function flatten(node, prefix, out) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) value.forEach((v, i) => out.set(`${path}[${i}]`, v));
    else if (value && typeof value === 'object') flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

/* rendered text of a page: script/style/comments and all markup removed,
   with every element carrying class="num" (and its contents) taken out */
function renderedText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<([a-zA-Z]+)[^>]*class="[^"]*\bnum\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function bodyOf(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}

function tagsOf(html) {
  return html.match(/<[a-zA-Z][^>]*>/g) || [];
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */

/* The forbidden strings are assembled from fragments so that this file,
   which lives under scripts/ and is scanned by check 1 and check 11,
   does not match its own patterns. */
const BRAND = new RegExp(['am' + 'in[ae]h?', 'am' + 'eena',
  '\\u0623\\u0645\\u064A\\u0646\\u0629', '\\u0627\\u0645\\u064A\\u0646\\u0629'].join('|'), 'i');
const REFERENCE_BRAND = new RegExp('kp' + 'mg', 'i');

check(1, 'no assistant brand in src/, assets/, scripts/ or any built page', () => {
  const files = [...SOURCE_DIRS.flatMap((d) => walk(d)), ...ALL_PAGES];
  const hits = files.filter((f) => BRAND.test(read(f)));
  return { ok: hits.length === 0, detail: hits.length ? `matches in ${hits.join(', ')}` : `${files.length} files scanned` };
});

check(2, 'en.json and ar.json have identical deep key sets and no empty values', () => {
  const en = flatten(JSON.parse(read('src/copy/en.json')), '', new Map());
  const ar = flatten(JSON.parse(read('src/copy/ar.json')), '', new Map());
  const enKeys = [...en.keys()].sort();
  const arKeys = [...ar.keys()].sort();
  const onlyEn = enKeys.filter((k) => !ar.has(k));
  const onlyAr = arKeys.filter((k) => !en.has(k));
  const empty = [...en, ...ar].filter(([, v]) => typeof v === 'string' && v.trim() === '').map(([k]) => k);
  const ok = onlyEn.length === 0 && onlyAr.length === 0 && empty.length === 0;
  return {
    ok,
    detail: ok
      ? `${enKeys.length} keys each`
      : `en-only: ${onlyEn.join(',') || '—'} · ar-only: ${onlyAr.join(',') || '—'} · empty: ${empty.join(',') || '—'}`
  };
});

check(3, 'removed-section copy is gone and the section id set is exact', () => {
  const gone = [
    'will become normal',
    'put it to work first',
    'catches up',
    'Better information. Faster accounting',
    'more value from the accounting',
    'Founding cohort now forming'
  ];
  const want = ['cohort', 'how', 'kuwait', 'top', 'ask'].sort().join(',');
  const problems = [];
  const notes = [];
  for (const page of BUILT) {
    const html = read(page);
    const body = bodyOf(html);
    for (const phrase of gone) {
      if (body.includes(phrase)) problems.push(`${page}: "${phrase}"`);
      else if (html.includes(phrase)) notes.push(`${page}: "${phrase}" survives in <head> metadata only (copy of record, meta.description)`);
    }
    const ids = (html.match(/<section[^>]*\sid="([^"]+)"/g) || []).map((t) => attr(t, 'id')).sort().join(',');
    if (ids !== want) problems.push(`${page}: section ids = [${ids}]`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || notes.join(' · ') || 'ok' };
});

check(4, 'three-field form, no endpoint, no network call in site.js', () => {
  const problems = [];
  for (const page of BUILT) {
    const html = read(page);
    const form = html.match(/<form[^>]*id="cohortForm"[\s\S]*?<\/form>/);
    if (!form) { problems.push(`${page}: #cohortForm missing`); continue; }
    const f = form[0];
    const inputs = f.match(/<input[^>]*>/g) || [];
    const types = inputs.map((i) => attr(i, 'type')).sort().join(',');
    if (inputs.length !== 3) problems.push(`${page}: ${inputs.length} inputs`);
    if (types !== 'email,tel,text') problems.push(`${page}: input types = ${types}`);
    if (/<select/i.test(f)) problems.push(`${page}: <select> present`);
    if (/<textarea/i.test(f)) problems.push(`${page}: <textarea> present`);
    if (/<form[^>]*\saction\s*=/.test(f)) problems.push(`${page}: form has an action attribute`);
    if (!html.includes('mailto:founder@haseeb.app')) problems.push(`${page}: founder mailto missing`);
  }
  const js = read('assets/site.js');
  for (const banned of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket']) {
    if (js.includes(banned)) problems.push(`site.js contains ${banned}`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(5, 'info@haseeb.app and both legal pages are linked everywhere required', () => {
  const problems = [];
  for (const page of BUILT) {
    const html = read(page);
    for (const needle of ['mailto:info@haseeb.app', 'website-terms.html', 'privacy.html']) {
      if (!html.includes(needle)) problems.push(`${page}: ${needle} missing`);
    }
  }
  for (const page of LEGAL) {
    const html = read(page);
    if (!html.includes('mailto:info@haseeb.app')) problems.push(`${page}: info@haseeb.app missing`);
    if (!(html.includes('ar.html') && html.includes('العودة إلى حسيب'))) problems.push(`${page}: Arabic back link missing`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(6, 'lang/dir, canonical and three absolute hreflang alternates', () => {
  const problems = [];
  const en = read('haseeb.html');
  const ar = read('ar.html');
  if (!/<html[^>]*\slang="en"/.test(en)) problems.push('haseeb.html is not lang="en"');
  if (/<html[^>]*\sdir="rtl"/.test(en)) problems.push('haseeb.html carries dir="rtl"');
  if (!/<html[^>]*\slang="ar"/.test(ar)) problems.push('ar.html is not lang="ar"');
  if (!/<html[^>]*\sdir="rtl"/.test(ar)) problems.push('ar.html is not dir="rtl"');
  for (const [name, html] of [['haseeb.html', en], ['ar.html', ar]]) {
    if (!/<link[^>]*rel="canonical"[^>]*href="https:\/\//.test(html)) problems.push(`${name}: canonical missing`);
    const alts = (html.match(/<link[^>]*rel="alternate"[^>]*>/g) || []);
    const langs = alts.map((t) => attr(t, 'hreflang')).sort().join(',');
    const absolute = alts.every((t) => (attr(t, 'href') || '').startsWith('https://'));
    if (langs !== 'ar,en,x-default' || !absolute) problems.push(`${name}: hreflang set = [${langs}] absolute=${absolute}`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(7, 'the locked supporting line is verbatim on both pages', () => {
  const problems = [];
  if (!read('haseeb.html').includes('Haseeb is built for Kuwaiti businesses.')) problems.push('haseeb.html');
  if (!read('ar.html').includes('حسيب مصمّم للأعمال الكويتية.')) problems.push('ar.html');
  return { ok: problems.length === 0, detail: problems.length ? `missing on ${problems.join(', ')}` : 'ok' };
});

check(8, 'pause/play control on both pages and a reduced-motion rule in site.css', () => {
  const problems = [];
  for (const page of BUILT) if (!read(page).includes('aria-pressed')) problems.push(`${page}: no aria-pressed control`);
  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(read('assets/site.css'))) problems.push('site.css: no reduced-motion rule');
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(9, 'light-first: no dark theme attribute and no dark base colour', () => {
  const problems = [];
  for (const file of [...ALL_PAGES, 'assets/site.css']) {
    const src = read(file);
    if (src.includes('data-theme="dark"')) problems.push(`${file}: data-theme="dark"`);
    if (/#0b0f14/i.test(src)) problems.push(`${file}: #0B0F14`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(10, 'only the two font hosts are reached; no video/audio/iframe/off-site script', () => {
  const allowed = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
  const problems = [];
  for (const page of ALL_PAGES) {
    const html = read(page);
    for (const tag of tagsOf(html)) {
      const name = (tag.match(/^<([a-zA-Z]+)/) || [])[1].toLowerCase();
      if (['video', 'audio', 'iframe'].includes(name)) problems.push(`${page}: <${name}>`);
      const rel = (attr(tag, 'rel') || '').toLowerCase();
      // canonical / hreflang alternates are required to be absolute (§2)
      if (name === 'link' && (rel === 'canonical' || rel === 'alternate')) continue;
      for (const a of ['src', 'href']) {
        const v = attr(tag, a);
        if (!v || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) continue;
        if (v.startsWith('mailto:')) continue;
        if (!allowed.some((h) => v.startsWith(h))) problems.push(`${page}: <${name} ${a}="${v}">`);
        if (name === 'script') problems.push(`${page}: off-site <script src>`);
      }
    }
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || 'ok' };
});

check(11, 'no reference to the excluded reference brand anywhere', () => {
  const files = [...SOURCE_DIRS.flatMap((d) => walk(d)), ...ALL_PAGES, 'vercel.json', '.vercelignore', 'package.json'];
  const hits = files.filter((f) => existsSync(join(ROOT, f)) && REFERENCE_BRAND.test(read(f)));
  return { ok: hits.length === 0, detail: hits.length ? `matches in ${hits.join(', ')}` : `${files.length} files scanned` };
});

check(12, '.vercelignore keeps the source out of the deployment', () => {
  if (!existsSync(join(ROOT, '.vercelignore'))) return { ok: false, detail: 'file missing' };
  const lines = read('.vercelignore').split('\n').map((l) => l.trim());
  const need = ['docs/', 'src/', 'scripts/', 'package.json'];
  const missing = need.filter((n) => !lines.includes(n));
  return { ok: missing.length === 0, detail: missing.length ? `missing ${missing.join(', ')}` : need.join(' ') };
});

check(13, 'every numeral on ar.html is isolated inside class="num"', () => {
  const leaks = renderedText(read('ar.html'))
    .split(/\s+/)
    .filter((w) => /[0-9]/.test(w));
  return { ok: leaks.length === 0, detail: leaks.length ? `unisolated: ${leaks.slice(0, 8).join(' ')}` : 'ok' };
});

check(14, 'the build is idempotent (a second run produces no diff)', () => {
  const fresh = renderAll();
  const drift = Object.entries(fresh).filter(([name, html]) => read(name) !== html).map(([n]) => n);
  return { ok: drift.length === 0, detail: drift.length ? `stale: ${drift.join(', ')}` : 'haseeb.html ar.html' };
});

/* ------------------------------------------------------------------ */

let failed = 0;
for (const r of results.sort((a, b) => a.n - b.n)) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${String(r.n).padStart(2, ' ')}. ${r.title}${r.detail ? `  —  ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} tripwires passed`);
process.exit(failed ? 1 : 0);
