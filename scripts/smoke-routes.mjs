#!/usr/bin/env node
/**
 * smoke-routes.mjs
 *
 * Lightweight, dependency-free smoke test for the Kleegr GHL mock.
 * It does NOT start a server or a browser. It performs static checks
 * against source files to catch the most common release-breaking mistakes:
 *
 *   1. All expected app routes are declared in src/App.tsx
 *   2. vercel.json contains the SPA rewrite (so deep links don't 404)
 *   3. The forbidden "/appointments" route does not appear in TopBar.tsx
 *
 * Exit code is 0 on success and 1 on any failure, so CI can gate on it.
 *
 * This script only READS source files. It never modifies them.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Resolve repo root relative to this file (scripts/ -> repo root),
// so the script works regardless of the current working directory.
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const EXPECTED_ROUTES = [
  '/',
  '/contacts',
  '/conversations',
  '/opportunities',
  '/calendars',
  '/tasks',
  '/guides',
  '/payments',
  '/phone',
  '/reputation',
  '/marketing/email',
  '/marketing/sms',
  '/reporting',
  '/sites',
  '/automations',
  '/integrations',
  '/settings',
  '/media',
];

const FORBIDDEN_ROUTES = ['/appointments'];

let failures = 0;

function pass(msg) {
  console.log(`  PASS  ${msg}`);
}

function fail(msg) {
  console.error(`  FAIL  ${msg}`);
  failures += 1;
}

function read(relPath) {
  try {
    return readFileSync(resolve(repoRoot, relPath), 'utf8');
  } catch (err) {
    fail(`could not read ${relPath}: ${err.message}`);
    return null;
  }
}

console.log('Running route/SPA smoke checks...\n');

// --- Check 1: expected routes present in src/App.tsx -------------------------
console.log('[1] App routes (src/App.tsx)');
const appSrc = read('src/App.tsx');
if (appSrc) {
  for (const route of EXPECTED_ROUTES) {
    // Routes are declared as path="/foo" / to="/foo", so we look for the
    // quoted form to avoid false positives on substrings.
    if (appSrc.includes(`"${route}"`)) {
      pass(`route present: ${route}`);
    } else {
      fail(`expected route missing: ${route}`);
    }
  }
}
console.log('');

// --- Check 2: SPA rewrite present in vercel.json -----------------------------
console.log('[2] SPA rewrite (vercel.json)');
const vercelSrc = read('vercel.json');
if (vercelSrc) {
  let rewriteOk = false;
  try {
    const cfg = JSON.parse(vercelSrc);
    rewriteOk =
      Array.isArray(cfg.rewrites) &&
      cfg.rewrites.some(
        (r) => r && r.destination === '/index.html',
      );
  } catch (err) {
    fail(`vercel.json is not valid JSON: ${err.message}`);
  }
  if (rewriteOk) {
    pass('vercel.json rewrites all paths to /index.html');
  } else if (vercelSrc) {
    fail('vercel.json is missing the SPA rewrite to /index.html');
  }
}
console.log('');

// --- Check 3: forbidden routes absent from TopBar.tsx ------------------------
console.log('[3] Forbidden routes (src/components/shell/TopBar.tsx)');
const topBarSrc = read('src/components/shell/TopBar.tsx');
if (topBarSrc) {
  for (const route of FORBIDDEN_ROUTES) {
    if (topBarSrc.includes(route)) {
      fail(`forbidden route present in TopBar.tsx: ${route}`);
    } else {
      pass(`forbidden route absent: ${route}`);
    }
  }
}
console.log('');

// --- Summary -----------------------------------------------------------------
if (failures > 0) {
  console.error(`Smoke checks FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log('All smoke checks passed.');
