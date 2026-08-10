#!/usr/bin/env node
/**
 * check-env.js — audit env vars across local files, source usage, and Vercel.
 *
 * This repo is Vite + Express, not Next.js. The build-time public prefix is
 * VITE_, not NEXT_PUBLIC_. The distinction that matters:
 *
 *   VITE_*  -> inlined into the JS bundle by `vite build`. Public forever.
 *              Must exist in Vercel BEFORE the build. Changing one requires a
 *              REBUILD, not just a redeploy.
 *   others  -> read by the Express function via process.env at request time.
 *              Never shipped to the browser. Safe for secrets. A change takes
 *              effect on the next deploy without a rebuild of the frontend.
 *
 * Usage:
 *   node check-env.js              # audit local files + source
 *   node check-env.js --vercel     # also diff against `vercel env ls`
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const C = {
  r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', c: '\x1b[36m', d: '\x1b[2m', x: '\x1b[0m',
};
const ok = (m) => console.log(`${C.g}✅ ${m}${C.x}`);
const bad = (m, h) => { console.log(`${C.r}❌ ${m}${C.x}`); if (h) console.log(`   ${C.d}↳ ${h}${C.x}`); };
const warn = (m, h) => { console.log(`${C.y}⚠️  ${m}${C.x}`); if (h) console.log(`   ${C.d}↳ ${h}${C.x}`); };
const head = (m) => console.log(`\n${C.c}── ${m} ──${C.x}`);

const ROOT = __dirname;

/** Parse a .env file into {KEY: value}. Ignores comments and blanks. */
function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

/** Every VITE_* referenced anywhere under frontend/src. */
function usedViteVars() {
  const found = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(jsx?|tsx?)$/.test(e.name)) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) found.add(m[1]);
    }
  };
  const srcDir = path.join(ROOT, 'frontend', 'src');
  if (fs.existsSync(srcDir)) walk(srcDir);
  return found;
}

// Server-side vars this backend needs at runtime. Absent => 500s, not a blank page.
const SERVER_REQUIRED = [
  ['DATABASE_URL', 'Postgres connection string. Without it every /api call 500s.'],
  ['JWT_ACCESS_SECRET', 'Signs access tokens.'],
  ['JWT_REFRESH_SECRET', 'Signs refresh tokens.'],
  ['ENCRYPTION_KEY', 'Encrypts MFA secrets at rest.'],
  ['EMAIL_HMAC_KEY', 'Blind-indexes emails for lookup.'],
];
const SERVER_OPTIONAL = [
  ['GEMINI_API_KEY', 'AI chat/recommendations degrade without it.'],
  ['ML_SERVICE_URL', 'Python valuation service; falls back to the in-Node model.'],
  ['CORS_ORIGIN', 'Only needed if the frontend is on a different host.'],
  ['COOKIE_SAMESITE', 'Set to "none" ONLY for cross-site frontends.'],
];

const frontEnv = { ...parseEnv(path.join(ROOT, 'frontend/.env')), ...parseEnv(path.join(ROOT, 'frontend/.env.local')) };
const backEnv = { ...parseEnv(path.join(ROOT, 'backend/.env')), ...parseEnv(path.join(ROOT, '.env.local')) };

head('Build-time vars (VITE_*) — inlined into the bundle');

const declared = Object.keys(frontEnv).filter((k) => k.startsWith('VITE_'));
const used = usedViteVars();

if (!declared.length) ok('No VITE_* declared locally (all fall back to code defaults)');
for (const k of declared) {
  if (!used.has(k)) {
    bad(`${k} is declared but NEVER read in frontend/src`, 'Dead var, or a typo of the name the code actually reads.');
  } else {
    console.log(`   ${C.d}${k} = ${frontEnv[k] || '(empty)'}${C.x}`);
  }
}
for (const k of used) {
  if (!declared.includes(k)) console.log(`   ${C.d}${k} used in code, unset locally → code default applies${C.x}`);
}

// Repo-specific traps.
if (frontEnv.VITE_API_BASE_URL) {
  bad('VITE_API_BASE_URL is set', 'This repo serves /api same-origin via proxy+rewrite. A full URL makes auth cross-site and silently drops HttpOnly cookies. Leave it UNSET on Vercel.');
}
if (/localhost|127\.0\.0\.1/.test(JSON.stringify(frontEnv))) {
  bad('A VITE_* value points at localhost', 'Baked into the production bundle at build time — visitors\' browsers will call their own machine.');
}
if (frontEnv.VITE_ML_BASE_URL && frontEnv.VITE_ML_BASE_URL.startsWith('http://')) {
  warn('VITE_ML_BASE_URL is http://', 'An https page cannot call http — browsers block it as mixed content.');
}

head('Runtime vars (server-side only) — never in the bundle');

for (const [k, why] of SERVER_REQUIRED) {
  if (backEnv[k]) console.log(`   ${C.d}${k.padEnd(20)} local ✓  → must also exist in Vercel${C.x}`);
  else bad(`${k} missing locally`, why);
}
for (const [k, why] of SERVER_OPTIONAL) {
  if (!backEnv[k]) console.log(`   ${C.d}${k.padEnd(20)} unset (optional) — ${why}${C.x}`);
}

head('Secret hygiene');

try {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split(/\r?\n/);
  const leaked = tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'));
  if (leaked.length) bad(`Env file(s) tracked in git: ${leaked.join(', ')}`, `Fix: git rm --cached ${leaked.join(' ')} && rotate every key inside.`);
  else ok('No .env files tracked in git');
} catch { warn('Could not read git index', 'Not a git repo, or git unavailable.'); }

if (process.argv.includes('--vercel')) {
  head('Diff against Vercel');
  try {
    const out = execSync('vercel env ls', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const remote = new Set([...out.matchAll(/^\s*([A-Z][A-Z0-9_]+)\s/gm)].map((m) => m[1]));
    for (const k of [...declared, ...SERVER_REQUIRED.map(([n]) => n)]) {
      if (remote.has(k)) ok(`${k} present in Vercel`);
      else bad(`${k} MISSING in Vercel`, k.startsWith('VITE_') ? 'Add it, then REBUILD (redeploy alone will not re-inline it).' : 'Add it, then redeploy.');
    }
  } catch {
    warn('`vercel env ls` failed', 'Run: npm i -g vercel && vercel link');
  }
} else {
  console.log(`\n${C.d}Add --vercel to diff against the dashboard (needs the Vercel CLI).${C.x}`);
}

head('How to set these in Vercel');
console.log(`${C.d}  CLI:  vercel env add DATABASE_URL production
  UI:   vercel.com → real-estate-ai-platform → Settings → Environment Variables
        → Add New → pick Production / Preview / Development → Save

  Then, for any VITE_* change:  Deployments → ⋯ → Redeploy
        and UNTICK "Use existing Build Cache".
  A VITE_* var only enters the bundle during a build. Adding it to the
  dashboard changes nothing until you rebuild.${C.x}`);
