#!/usr/bin/env node
/* ============================================================
   Haseeb public site — definition-of-done tripwires.
   Brief §8: fourteen checks, plus 15 and 16 for the opening film
   (docs/HASEEB-4113-opening-film-spec.md). Exit 1 on any failure.
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
/* A check may return { ok, detail, exempt }. `exempt` is a list of every
   carve-out the check applies; the printer emits it on the check's line
   whether it passed or failed, so no exemption can be introduced silently. */
function check(n, title, fn) {
  let ok = false;
  let detail = '';
  let exempt = [];
  try {
    const r = fn();
    ok = r === true || (r && r.ok === true);
    detail = (r && r.detail) || '';
    exempt = (r && r.exempt) || [];
  } catch (err) {
    ok = false;
    detail = err && err.message ? err.message : String(err);
  }
  results.push({ n, title, ok, detail, exempt });
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
/* the one scan set, shared by tripwires 1 and 11 */
const SCAN_SET = () => [
  ...SOURCE_DIRS.flatMap((d) => walk(d)),
  ...ALL_PAGES,
  'vercel.json',
  '.vercelignore',
  'package.json'
].filter((f) => existsSync(join(ROOT, f)));

const SCAN_EXEMPT =
  'scripts/check.mjs is itself in the scan set; it assembles the two forbidden ' +
  'patterns from string fragments so it cannot match itself. No file is skipped.';

const BRAND = new RegExp(['am' + 'in[ae]h?', 'am' + 'eena',
  '\\u0623\\u0645\\u064A\\u0646\\u0629', '\\u0627\\u0645\\u064A\\u0646\\u0629'].join('|'), 'i');
const REFERENCE_BRAND = new RegExp('kp' + 'mg', 'i');

check(1, 'no assistant brand anywhere in the scan set (source, output and deploy config)', () => {
  const files = SCAN_SET();
  const hits = files.filter((f) => BRAND.test(read(f)));
  return {
    ok: hits.length === 0,
    detail: hits.length ? `matches in ${hits.join(', ')}` : `${files.length} files scanned: ${SOURCE_DIRS.map((d) => d + '/').join(' ')} ${ALL_PAGES.join(' ')} vercel.json .vercelignore package.json`,
    exempt: [SCAN_EXEMPT]
  };
});

check(2, 'en.json and ar.json have identical deep key sets and no empty values', () => {
  const enRaw = JSON.parse(read('src/copy/en.json'));
  const arRaw = JSON.parse(read('src/copy/ar.json'));
  const en = flatten(enRaw, '', new Map());
  const ar = flatten(arRaw, '', new Map());
  /* film.tokens is the ONE array whose length is language-specific: the two
     lists in the film spec are different sets of local vocabulary (20 EN,
     19 AR), so index-for-index parity would be a false requirement. The key
     itself must exist on both sides and be a non-empty array — asserted
     here and in tripwire 16 — and every OTHER array still needs exact
     index parity, so a lost kuwait chip or cohort bullet still fails. */
  const perLanguage = (k) => k.startsWith('film.tokens[');
  const enKeys = [...en.keys()].filter((k) => !perLanguage(k)).sort();
  const arKeys = [...ar.keys()].filter((k) => !perLanguage(k)).sort();
  const onlyEn = enKeys.filter((k) => !ar.has(k));
  const onlyAr = arKeys.filter((k) => !en.has(k));
  const empty = [...en, ...ar].filter(([, v]) => typeof v === 'string' && v.trim() === '').map(([k]) => k);
  const tokensOk = Array.isArray(enRaw.film && enRaw.film.tokens) && enRaw.film.tokens.length > 0 &&
                   Array.isArray(arRaw.film && arRaw.film.tokens) && arRaw.film.tokens.length > 0;
  if (!tokensOk) onlyEn.push('film.tokens (missing or not a non-empty array on one side)');
  const ok = onlyEn.length === 0 && onlyAr.length === 0 && empty.length === 0;
  return {
    ok,
    detail: ok
      ? `${enKeys.length} keys each · film.tokens ${enRaw.film.tokens.length} EN / ${arRaw.film.tokens.length} AR`
      : `en-only: ${onlyEn.join(',') || '—'} · ar-only: ${onlyAr.join(',') || '—'} · empty: ${empty.join(',') || '—'}`,
    exempt: ['film.tokens[i] is exempt from index-for-index parity — the two token lists are ' +
             'different local vocabularies (EN 20 / AR 19) fixed by the film spec. The key must ' +
             'still exist on both sides as a non-empty array. Every other array is still compared index by index.']
  };
});

check(3, 'removed-section copy is gone from the WHOLE file and the section id set is exact', () => {
  /* No head carve-out. These six phrases belong to sections deleted in the
     redesign; none of them may survive anywhere in a built page — body,
     <head>, metadata, comments or attributes. */
  const gone = [
    'will become normal',
    'put it to work first',
    'catches up',
    'Better information. Faster accounting',
    'more value from the accounting',
    'Intelligent accounting'
  ];
  /* Ruling 2026-09-02: "Founding cohort now forming" was the announcement BAR,
     not a removed section. It is allowed in meta.description and nowhere else,
     so it is asserted separately and only against <body>. */
  const announcement = ['Founding cohort now forming', 'الدفعة التأسيسية قيد التشكيل'];
  const want = ['cohort', 'how', 'kuwait', 'top', 'ask'].sort().join(',');
  const problems = [];
  const notes = [];

  for (const page of BUILT) {
    const html = read(page);
    for (const phrase of gone) {
      if (html.includes(phrase)) problems.push(`${page}: "${phrase}" (whole-file scan)`);
    }
    const body = bodyOf(html);
    const bodyText = renderedText(body).replace(/\s+/g, ' ');
    for (const phrase of announcement) {
      if (body.includes(phrase) || bodyText.includes(phrase)) problems.push(`${page}: "${phrase}" in <body>`);
      else if (html.includes(phrase)) notes.push(`${page}: "${phrase}" in <head> only`);
    }
    const ids = (html.match(/<section[^>]*\sid="([^"]+)"/g) || []).map((t) => attr(t, 'id')).sort().join(',');
    if (ids !== want) problems.push(`${page}: section ids = [${ids}]`);
  }

  return {
    ok: problems.length === 0,
    detail: problems.join(' · ') || `${gone.length} phrases scanned whole-file · announcement absent from both bodies · ids = [${want}]` + (notes.length ? ` · ${notes.join(' · ')}` : ''),
    exempt: ['"Founding cohort now forming" / "الدفعة التأسيسية قيد التشكيل" may appear in <head> (meta.description) — asserted absent from <body> only. Every other removed-section phrase has NO exemption and is scanned across the whole file.']
  };
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

check(7, 'the rendered .hero-support element IS the locked supporting line, both pages', () => {
  /* Asserted on the element, not the file: the same sentence also lives in
     meta.description, so a whole-file substring test passes even when the
     hero line has been changed or deleted. */
  const LOCKED = {
    'haseeb.html': 'Haseeb is built for Kuwaiti businesses.',
    'ar.html': 'حسيب مصمّم للأعمال الكويتية.'
  };
  const decode = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
  const problems = [];
  const seen = [];
  for (const page of BUILT) {
    const html = read(page);
    const m = html.match(/<p[^>]*\sclass="[^"]*\bhero-support\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (!m) { problems.push(`${page}: no .hero-support element`); continue; }
    const rendered = decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    seen.push(`${page}: "${rendered}"`);
    if (rendered !== LOCKED[page]) problems.push(`${page}: .hero-support renders "${rendered}", locked line is "${LOCKED[page]}"`);
  }
  return { ok: problems.length === 0, detail: problems.join(' · ') || seen.join(' · ') };
});

check(8, 'a reduced-motion rule exists and nothing on either page autoplays', () => {
  /* The hero sequence was shelved on 2026-09-02, so there is no pause/play
     control left to assert. What must stay true is the reason that control
     existed: no motion starts on its own, and any future opt-out motion
     carries a real control. */
  const problems = [];
  const checked = [];

  const css = read('assets/site.css');
  if (/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css)) checked.push('assets/site.css: @media (prefers-reduced-motion: reduce) present');
  else problems.push('assets/site.css: no prefers-reduced-motion rule');

  for (const page of BUILT) {
    const html = read(page);
    const tags = tagsOf(html);
    const autoplay = tags.filter((t) => /\sautoplay(\s|=|\/|>)/i.test(t));
    const videos = tags.filter((t) => /^<video/i.test(t));
    const flagged = tags.filter((t) => /\sdata-autoplay/i.test(t));
    const controls = tags.filter((t) => /\saria-pressed\s*=/i.test(t));
    const controlled = new Set(controls.map((t) => attr(t, 'aria-controls')).filter(Boolean));

    if (autoplay.length) problems.push(`${page}: ${autoplay.length} autoplay attribute(s)`);
    if (videos.length) problems.push(`${page}: ${videos.length} <video> element(s)`);
    for (const tag of flagged) {
      const id = attr(tag, 'id');
      if (!id) problems.push(`${page}: a data-autoplay element has no id, so no control can reference it`);
      else if (!controlled.has(id)) problems.push(`${page}: data-autoplay #${id} has no aria-pressed control targeting it`);
    }
    checked.push(`${page}: ${tags.length} tags — 0 autoplay attrs, 0 <video>, ${flagged.length} data-autoplay element(s), ${controls.length} aria-pressed control(s)`);
  }

  return {
    ok: problems.length === 0,
    detail: problems.join(' · ') || checked.join(' · '),
    exempt: ['The opening film (founder direction, 2026-09-02) is the one thing on these pages ' +
             'that starts on its own. It carries no autoplay attribute and no <video>, so this ' +
             'check cannot see it; tripwire 15 asserts its mitigations instead — Skip visible and ' +
             'focused from the first frame, Esc, once per session, and no film at all under ' +
             'prefers-reduced-motion.']
  };
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
  return {
    ok: problems.length === 0,
    detail: problems.join(' · ') || `${ALL_PAGES.length} pages scanned; allowed hosts ${allowed.join(' ')}`,
    exempt: [
      'rel="canonical" and rel="alternate" links are skipped: §2 REQUIRES them to be absolute https://haseeb.app URLs.',
      'mailto: hrefs are skipped: they reach no host.'
    ]
  };
});

check(11, 'no reference to the excluded reference brand anywhere', () => {
  const files = SCAN_SET();
  const hits = files.filter((f) => REFERENCE_BRAND.test(read(f)));
  return {
    ok: hits.length === 0,
    detail: hits.length ? `matches in ${hits.join(', ')}` : `${files.length} files scanned (identical set to tripwire 1)`,
    exempt: [SCAN_EXEMPT]
  };
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
  return {
    ok: leaks.length === 0,
    detail: leaks.length ? `unisolated: ${leaks.slice(0, 8).join(' ')}` : 'no unisolated digit run in ar.html text',
    exempt: [
      '<script>, <style> and HTML comments are removed before the scan (not rendered text).',
      'Elements carrying class="num" are removed WITH their contents — that is the isolation being asserted.',
      'Attribute values are not scanned: the scan runs on text nodes only.'
    ]
  };
});

check(14, 'the build is idempotent (a second run produces no diff)', () => {
  const fresh = renderAll();
  const drift = Object.entries(fresh).filter(([name, html]) => read(name) !== html).map(([n]) => n);
  return {
    ok: drift.length === 0,
    detail: drift.length ? `stale: ${drift.join(', ')}` : Object.keys(fresh).join(' ')
  };
});

/* ══════════════════  the opening film · tripwires 15 and 16  ══════════════════
   docs/HASEEB-4113-opening-film-spec.md. The film markup is delimited on both
   built pages by the FILM:START / FILM:END comments, and every assertion below
   is scoped to that region — the page around it legitimately says "approve"
   and "Kuwait", the film may not. */

function filmMarkup(html, page) {
  const start = html.indexOf('<!-- FILM:START');
  const end = html.indexOf('<!-- FILM:END -->');
  if (start < 0 || end < 0) throw new Error(`${page}: FILM:START / FILM:END markers missing`);
  const afterComment = html.indexOf('-->', start);
  return html.slice(afterComment + 3, end);
}

/* the [start,end) span of the first <div class="film-field">, by div nesting */
function fieldSpan(markup, page) {
  const open = markup.search(/<div[^>]*\sclass="[^"]*\bfilm-field\b[^"]*"/);
  if (open < 0) throw new Error(`${page}: no .film-field element`);
  const re = /<div\b|<\/div>/g;
  re.lastIndex = open;
  let depth = 0;
  let m;
  while ((m = re.exec(markup))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return [open, m.index + m[0].length];
  }
  throw new Error(`${page}: .film-field is not closed`);
}

const decodeEntities = (t) => t
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

const plainText = (html) => decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/* The three statements and the skip label are held here as LITERALS, exactly
   as the founder wrote them. Comparing the page against the copy file it was
   built from would pass on any rewrite of that file. */
const FILM_LOCKED = {
  'haseeb.html': {
    lines: ['YOU RUN THE BUSINESS.', 'HASEEB PREPARES THE ACCOUNTING.', 'YOU STAY IN CONTROL.'],
    skip: 'Skip',
    skipAria: 'Skip the opening'
  },
  'ar.html': {
    lines: ['\u0623\u0646\u062A \u062A\u062F\u064A\u0631 \u0623\u0639\u0645\u0627\u0644\u0643.',
            '\u062D\u0633\u064A\u0628 \u064A\u062C\u0647\u0651\u0632 \u062D\u0633\u0627\u0628\u0627\u062A\u0643.',
            '\u0648\u0623\u0646\u062A \u0635\u0627\u062D\u0628 \u0627\u0644\u0642\u0631\u0627\u0631.'],
    skip: '\u062A\u062E\u0637\u0651\u064A',
    skipAria: '\u062A\u062E\u0637\u0651\u064A \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D'
  }
};

check(15, 'the opening film: three statements verbatim, a real Skip outside the aria-hidden field, and both reduced-motion guards', () => {
  const problems = [];
  const seen = [];

  for (const page of BUILT) {
    const html = read(page);
    const markup = filmMarkup(html, page);
    const want = FILM_LOCKED[page];

    /* the three statements, on the elements, byte-for-byte */
    want.lines.forEach((locked, i) => {
      const re = new RegExp(`<p[^>]*\\sdata-film-line="${i + 1}"[^>]*>([\\s\\S]*?)<\\/p>`);
      const m = markup.match(re);
      if (!m) { problems.push(`${page}: statement ${i + 1} is missing from the film`); return; }
      const rendered = plainText(m[1]);
      if (rendered !== locked) problems.push(`${page}: statement ${i + 1} renders "${rendered}", locked line is "${locked}"`);
    });

    /* the brand word in statement 2 is the film's only teal text */
    const line2 = (markup.match(/<p[^>]*\sdata-film-line="2"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
    const teal = line2.match(/<span class="film-teal">([^<]+)<\/span>/g) || [];
    if (teal.length !== 1) problems.push(`${page}: statement 2 has ${teal.length} teal words, expected exactly 1`);

    /* Skip: a real button, the locked label, and OUTSIDE the hidden field */
    const buttons = markup.match(/<button[^>]*\sclass="[^"]*\bfilm-skip\b[^"]*"[^>]*>[\s\S]*?<\/button>/g) || [];
    if (buttons.length !== 1) {
      problems.push(`${page}: ${buttons.length} .film-skip <button> elements, expected 1`);
    } else {
      const label = plainText(buttons[0].replace(/^<button[^>]*>/, ''));
      if (label !== want.skip) problems.push(`${page}: skip label is "${label}", locked label is "${want.skip}"`);
      const aria = decodeEntities(attr(buttons[0], 'aria-label') || '');
      if (aria !== want.skipAria) problems.push(`${page}: skip aria-label is "${aria}", locked is "${want.skipAria}"`);
      const [fs0, fs1] = fieldSpan(markup, page);
      const at = markup.indexOf(buttons[0]);
      if (at >= fs0 && at < fs1) problems.push(`${page}: the Skip button is INSIDE the aria-hidden film field`);
      const fieldTag = markup.slice(fs0, markup.indexOf('>', fs0) + 1);
      if (attr(fieldTag, 'aria-hidden') !== 'true') problems.push(`${page}: .film-field is not aria-hidden="true"`);
    }

    /* the film never becomes a video or an audio player */
    const tags = tagsOf(html);
    const av = tags.filter((t) => /^<(video|audio)/i.test(t));
    if (av.length) problems.push(`${page}: ${av.length} <video>/<audio> element(s)`);

    seen.push(`${page}: 3 statements verbatim, 1 teal word, Skip "${want.skip}" outside the aria-hidden field, 0 <video>/<audio>`);
  }

  /* the reduced-motion guard, in BOTH layers */
  const css = read('assets/site.css');
  const js = read('assets/site.js');
  const filmCss = css.slice(css.indexOf('/* FILM-CSS:START'), css.indexOf('/* FILM-CSS:END */'));
  const filmJs = js.slice(js.indexOf('/* FILM-MODULE:START'), js.indexOf('/* FILM-MODULE:END */'));
  if (!filmCss) problems.push('assets/site.css: no FILM-CSS region');
  if (!filmJs) problems.push('assets/site.js: no FILM-MODULE region');
  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.film\s*\{[^}]*display:\s*none/.test(filmCss)) {
    problems.push('assets/site.css: the film has no prefers-reduced-motion display:none guard');
  }
  if (!/prefers-reduced-motion:\s*reduce/.test(filmJs) || !/reduceQuery\.matches/.test(filmJs)) {
    problems.push('assets/site.js: the film module does not test prefers-reduced-motion before playing');
  }
  if (!/sessionStorage/.test(filmJs) || /localStorage/.test(filmJs)) {
    problems.push('assets/site.js: the film module must gate on sessionStorage and never localStorage');
  }
  if (!/'Escape'/.test(filmJs)) problems.push('assets/site.js: the film module has no Esc handler');

  seen.push('reduced-motion guard in site.css (display:none) and in site.js (checked before play) · sessionStorage only · Esc handled');

  return { ok: problems.length === 0, detail: problems.join(' · ') || seen.join(' · ') };
});

/* The copy of record behind each built page. Tripwire 16 asserts the film's
   money tokens against THESE files rather than against the classes build.mjs
   assigned, and the two patterns below are written out literally here rather
   than imported from build.mjs, so this tripwire still fails when the BUILD's
   own classifier is what breaks. */
const COPY_OF = { 'haseeb.html': 'src/copy/en.json', 'ar.html': 'src/copy/ar.json' };
/* carries money: a currency mark in either language, or a dot beside a digit.
   The Arabic mark \u062F.\u0643 owns a dot, so it is matched as a mark, never as a decimal. */
const SOURCE_MONEY = /KWD|\u062F\.\u0643|\d\.|\.\d/;
/* and Kuwaiti money is exactly one figure carrying exactly three decimals */
const SOURCE_AMOUNT = /^(?:(?:KWD|\u062F\.\u0643)\s*)?\d{1,3}(?:,\d{3})*\.\d{3}(?:\s*(?:KWD|\u062F\.\u0643))?$/;

check(16, 'the film markup is a brand hook: no product UI, no place messaging, no imagery', () => {
  /* Patterns are assembled from fragments where a literal would make this
     file match itself under a future whole-repo scan. */
  const FORBIDDEN = [
    ['dashboard', new RegExp('dash' + 'board', 'i')],
    ['approve', new RegExp('appr' + 'ove', 'i')],
    ['Dr (ledger abbreviation)', /\bdr\b/i],
    ['Cr (ledger abbreviation)', /\bcr\b/i],
    ['Kuwait', new RegExp('Kuw' + 'ait', 'i')],
    ['\u0627\u0644\u0643\u0648\u064A\u062A', new RegExp('\u0627\u0644\u0643\u0648\u064A\u062A')]
  ];
  const problems = [];
  const seen = [];

  for (const page of BUILT) {
    const markup = filmMarkup(read(page), page);
    for (const [label, re] of FORBIDDEN) {
      if (re.test(markup)) problems.push(`${page}: the film markup contains ${label}`);
    }
    const imagery = (markup.match(/<(img|svg|picture|canvas|video|audio|iframe|object|embed)\b/gi) || []);
    if (imagery.length) problems.push(`${page}: the film markup contains ${imagery.join(' ')}`);

    /* THE DENOMINATOR IS THE SOURCE, NOT THE BUILD'S CLASSES. The build
       classifies a token as an amount by finding a three-decimal figure in
       it, so a two-decimal figure is not a failed amount — it is silently
       re-classified as a WORD, and counting decimals over the amount spans
       the build emitted then measures a set the bad token has already left.
       Every money token is therefore read from src/copy/*.json, the copy of
       record, and the markup is checked for AGREEING with it. */
    const srcTokens = JSON.parse(read(COPY_OF[page])).film.tokens;
    if (!Array.isArray(srcTokens) || !srcTokens.length) {
      problems.push(`${COPY_OF[page]}: film.tokens is not a non-empty array`);
      continue;
    }
    const srcMoney = srcTokens.filter((t) => SOURCE_MONEY.test(t));
    const srcWords = srcTokens.filter((t) => !SOURCE_MONEY.test(t));
    const notThreeDp = srcMoney.filter((t) => !SOURCE_AMOUNT.test(t));
    if (notThreeDp.length) {
      problems.push(`${COPY_OF[page]}: ${notThreeDp.length} money token(s) are not a single three-decimal figure: ${notThreeDp.join(' | ')}`);
    }
    if (srcTokens.length < 14) problems.push(`${COPY_OF[page]}: ${srcTokens.length} film tokens, the spec asks for at least 14`);
    if (srcWords.length < 10) problems.push(`${COPY_OF[page]}: ${srcWords.length} word tokens`);
    if (srcMoney.length < 4) problems.push(`${COPY_OF[page]}: ${srcMoney.length} money tokens`);

    /* and the markup must render exactly the source's split, token for token */
    const tokens = markup.match(/class="film-tok /g) || [];
    const words = markup.match(/class="film-tok film-word"/g) || [];
    const amounts = markup.match(/class="film-tok film-amt"/g) || [];
    if (tokens.length !== srcTokens.length) problems.push(`${page}: ${tokens.length} rendered film tokens, ${srcTokens.length} in ${COPY_OF[page]}`);
    if (amounts.length !== srcMoney.length) problems.push(`${page}: ${amounts.length} rendered amount tokens against ${srcMoney.length} money tokens in ${COPY_OF[page]} — a money token rendered as a WORD`);
    if (words.length !== srcWords.length) problems.push(`${page}: ${words.length} rendered word tokens, ${srcWords.length} in ${COPY_OF[page]}`);
    const rendered3dp = (markup.match(/class="film-amt-f"><span class="num">\.\d{3}</g) || []).length;
    if (rendered3dp !== srcMoney.length) problems.push(`${page}: ${srcMoney.length - rendered3dp} money token(s) do not render a three-decimal fraction`);

    seen.push(`${page}: ${srcTokens.length} source tokens in ${COPY_OF[page]} (${srcWords.length} words, ${srcMoney.length} money, every money token 3dp AT SOURCE) rendered as ${words.length} words + ${amounts.length} amounts · 0 img/svg/canvas/video/audio/iframe · ${FORBIDDEN.length} forbidden patterns absent`);
  }

  return {
    ok: problems.length === 0,
    detail: problems.join(' · ') || seen.join(' · '),
    exempt: ['Scoped to the FILM:START…FILM:END region ONLY. The page around it says "approve", ' +
             '"Kuwait" and "\u0627\u0644\u0643\u0648\u064A\u062A" legitimately — the founder\'s limit is that the ' +
             'opening film may not. Nothing else on the page is skipped by this check.']
  };
});

/* ------------------------------------------------------------------ */

let failed = 0;
let exemptions = 0;
for (const r of results.sort((a, b) => a.n - b.n)) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${String(r.n).padStart(2, ' ')}. ${r.title}${r.detail ? `  —  ${r.detail}` : ''}`);
  /* Exemptions print on the check's own line, pass or fail. A carve-out that
     is not visible in the output is a silent downgrade. */
  for (const e of r.exempt || []) {
    exemptions++;
    console.log(`          EXEMPT  ${e}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} tripwires passed · ${exemptions} exemption(s) declared and printed above`);
process.exit(failed ? 1 : 0);
