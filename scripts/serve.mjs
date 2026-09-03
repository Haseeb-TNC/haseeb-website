#!/usr/bin/env node
/* ============================================================
   Haseeb public site — local review server.
   node >= 18, zero dependencies, read-only.

   The point of this file is that the founder reviews the site at ONE URL,
   under the same two rewrites Vercel applies, serving exactly the files the
   deployment would serve and refusing exactly the ones it would not.

     /     ->  haseeb.html          (from vercel.json, not hard-coded here)
     /ar   ->  ar.html

   The rewrite table is READ FROM vercel.json so this server cannot drift
   away from production, and the refusal list is READ FROM .vercelignore for
   the same reason: docs/, src/, scripts/, package.json and *.md are not part
   of the deployment, so they are 404 here too. .git is refused on top of
   that list — it is not in .vercelignore because Vercel never uploads it,
   but this server is pointed at a working clone.

   Nothing is cached (Cache-Control: no-store), so a rebuild is visible on
   reload without a hard refresh.

     npm run site:serve            # port 4113
     PORT=8080 npm run site:serve

   Usage: node scripts/serve.mjs   ·   Ctrl-C to stop.
   ============================================================ */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize, sep } from 'node:path';
import { networkInterfaces } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4113);
const HOST = '0.0.0.0';

/* ── the rewrites, from vercel.json ───────────────────────────────────── */

function loadRewrites() {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
  const list = Array.isArray(cfg.rewrites) ? cfg.rewrites : [];
  const map = new Map();
  for (const r of list) {
    if (typeof r.source !== 'string' || typeof r.destination !== 'string') continue;
    if (/[:*(]/.test(r.source)) {
      console.warn(`serve: rewrite "${r.source}" is a pattern; this server only does exact paths`);
      continue;
    }
    map.set(r.source, r.destination);
  }
  return map;
}

/* ── the refusal list, from .vercelignore ─────────────────────────────── */

function loadDenied() {
  const dirs = ['.git'];
  const files = [];
  const suffixes = [];
  const raw = existsSync(join(ROOT, '.vercelignore'))
    ? readFileSync(join(ROOT, '.vercelignore'), 'utf8')
    : '';
  for (const line of raw.split('\n').map((l) => l.trim())) {
    if (!line || line.startsWith('#')) continue;
    if (line.endsWith('/')) dirs.push(line.slice(0, -1));
    else if (line.startsWith('*.')) suffixes.push(line.slice(1));
    else files.push(line);
  }
  return { dirs, files, suffixes };
}

const REWRITES = loadRewrites();
const DENIED = loadDenied();

function isDenied(rel) {
  const parts = rel.split('/').filter(Boolean);
  if (!parts.length) return false;
  if (DENIED.dirs.includes(parts[0])) return true;
  if (DENIED.files.includes(rel)) return true;
  if (DENIED.suffixes.some((s) => rel.endsWith(s))) return true;
  /* dotfiles are never part of a static deployment */
  return parts.some((p) => p.startsWith('.') && p !== '.well-known');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4'
};

function send(res, code, type, body) {
  res.writeHead(code, {
    'content-type': type,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

const server = createServer((req, res) => {
  let path;
  try {
    path = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  } catch (e) {
    send(res, 400, 'text/plain; charset=utf-8', 'bad request');
    return;
  }

  /* the two rewrites, exactly as vercel.json states them */
  const rewritten = REWRITES.get(path);
  const target = rewritten || path;

  /* resolve inside ROOT and nowhere else */
  const rel = normalize(target).replace(/^([/\\])+/, '').split(sep).join('/');
  if (isDenied(rel)) {
    send(res, 404, 'text/plain; charset=utf-8', 'not found');
    console.log(`  404  ${req.method} ${path}  (excluded from the deployment)`);
    return;
  }

  const abs = join(ROOT, rel);
  if (!abs.startsWith(ROOT + sep) || !existsSync(abs) || !statSync(abs).isFile()) {
    send(res, 404, 'text/plain; charset=utf-8', 'not found');
    console.log(`  404  ${req.method} ${path}`);
    return;
  }

  send(res, 200, MIME[extname(abs)] || 'application/octet-stream', readFileSync(abs));
  console.log(`  200  ${req.method} ${path}${rewritten ? `  ->  ${rewritten}` : ''}`);
});

function lanAddresses() {
  const out = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

server.listen(PORT, HOST, () => {
  const paths = [...REWRITES.keys()];
  console.log(`\nHaseeb website — local review server (no-store, read-only)`);
  console.log(`  root      ${ROOT}`);
  console.log(`  rewrites  ${paths.map((p) => `${p} -> ${REWRITES.get(p)}`).join('   ·   ') || '(none)'}`);
  console.log(`  refused   ${[...DENIED.dirs.map((d) => d + '/'), ...DENIED.files, ...DENIED.suffixes.map((s) => '*' + s)].join(' ')}`);
  console.log('');
  console.log(`  English   http://localhost:${PORT}/`);
  console.log(`  Arabic    http://localhost:${PORT}/ar`);
  console.log(`  Privacy   http://localhost:${PORT}/privacy.html`);
  console.log(`  Terms     http://localhost:${PORT}/website-terms.html`);
  for (const ip of lanAddresses()) {
    console.log(`  on this network   http://${ip}:${PORT}/   ·   http://${ip}:${PORT}/ar`);
  }
  console.log('\n  Ctrl-C to stop.\n');
});
