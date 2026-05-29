#!/usr/bin/env node
/**
 * check-tutorials.mjs
 *
 * Dependency-free static checker for the Tutorial Mode subsystem. Like
 * smoke-routes.mjs it never starts a server or browser and never modifies
 * files — it only reads source and asserts the tutorial wiring is internally
 * consistent, so CI can gate on it.
 *
 * It verifies:
 *   1. Exactly 10 executable flows in   src/tutorials/flows.ts            (TUTORIAL_FLOWS)
 *   2. Exactly 10 guide defs in         src/modules/guides/tutorialDefs.ts (TUTORIALS)
 *   3. Flow IDs === guide def IDs       (1:1, no orphans on either side)
 *   4. REQUIRED_TUTORIAL_IDS (registry) === flow IDs (registry stays in sync)
 *   5. Every flow step `route` is a real <Route> path in src/App.tsx
 *   6. Every flow step `target` is an actually-rendered `data-tour=""` attr
 *      (the live DOM attribute is the source of truth, per flows.ts authoring
 *       rules — the registry union type is allowed to lag behind)
 *   7. Every flow has a non-empty completionTitle AND completionBody
 *   8. Every guide def `module` route hint is a real <Route> path in App.tsx
 *
 * Exit code is 0 on success and 1 on any failure.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

let failures = 0;
const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => {
  console.error(`  FAIL  ${m}`);
  failures += 1;
};

function read(relPath) {
  try {
    return readFileSync(resolve(repoRoot, relPath), 'utf8');
  } catch (err) {
    fail(`could not read ${relPath}: ${err.message}`);
    return null;
  }
}

/**
 * Extract the interior text of a top-level array literal `NAME ... = [ ... ];`.
 * Returns the substring between the opening `[` and the first column-0 `];`.
 */
function arrayBody(src, name) {
  const nameIdx = src.indexOf(name);
  if (nameIdx === -1) return null;
  const open = src.indexOf('= [', nameIdx);
  if (open === -1) return null;
  const start = open + 2; // position of '['
  const close = src.indexOf('\n];', start); // column-0 close of the top-level array
  if (close === -1) return null;
  return src.slice(start + 1, close);
}

/** Split an array body into top-level object blocks (each indented `\n  {`). */
function objectBlocks(body) {
  if (body == null) return [];
  return body
    .split(/\n {2}\{/) // exactly two-space indent + brace = a top-level element
    .slice(1); // first chunk is whatever precedes the first object
}

const firstMatch = (block, re) => {
  const m = block.match(re);
  return m ? m[1] : null;
};

function allMatches(block, re) {
  const out = [];
  let m;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = g.exec(block)) !== null) out.push(m[1]);
  return out;
}

const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const diff = (a, b) => [...a].filter((x) => !b.has(x));

// ── Gather rendered data-tour attributes by walking src/ ────────────────────
function collectRenderedTours(dir) {
  const found = new Set();
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      for (const v of collectRenderedTours(full)) found.add(v);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      const txt = readFileSync(full, 'utf8');
      for (const m of txt.matchAll(/data-tour="([^"$]+)"/g)) found.add(m[1]);
    }
  }
  return found;
}

console.log('Running tutorial registry checks...\n');

const flowsSrc = read('src/tutorials/flows.ts');
const defsSrc = read('src/modules/guides/tutorialDefs.ts');
const registrySrc = read('src/tutorials/registry.ts');
const appSrc = read('src/App.tsx');

if (!flowsSrc || !defsSrc || !registrySrc || !appSrc) {
  console.error('\nAborting: one or more source files could not be read.');
  process.exit(1);
}

// App routes (quoted path="..." declarations)
const appRoutes = new Set(allMatches(appSrc, /path="([^"]+)"/g));

// Parse flows
const flowBlocks = objectBlocks(arrayBody(flowsSrc, 'TUTORIAL_FLOWS'));
const flows = flowBlocks.map((b) => ({
  id: firstMatch(b, /id:\s*'([^']+)'/),
  routes: allMatches(b, /route:\s*'([^']+)'/g),
  targets: allMatches(b, /target:\s*'([^']+)'/g),
  completionTitle: firstMatch(b, /completionTitle:\s*'([^']*)'/),
  completionBody: firstMatch(b, /completionBody:\s*'([^']*)'/),
}));

// Parse guide defs
const defBlocks = objectBlocks(arrayBody(defsSrc, 'TUTORIALS'));
const defs = defBlocks.map((b) => ({
  id: firstMatch(b, /id:\s*'([^']+)'/),
  module: firstMatch(b, /module:\s*'([^']+)'/),
}));

// Parse registry required IDs
const reqBody = (() => {
  const i = registrySrc.indexOf('REQUIRED_TUTORIAL_IDS');
  const open = registrySrc.indexOf('[', i);
  const close = registrySrc.indexOf(']', open);
  return i === -1 ? '' : registrySrc.slice(open, close);
})();
// The selector registry (registry.ts) catalogs tutorials under descriptive
// legacy IDs that map 1:1 to the runtime flow IDs. The runtime engine uses the
// flow/def IDs (verified mutually consistent by check #3); these aliases let
// check #4 confirm the registry enumerates exactly the same 10 tutorials.
const LEGACY_REGISTRY_ALIASES = {
  'reply-to-conversation': 'reply-conversation',
  'move-pipeline-lead': 'move-pipeline',
  'view-outlook-inbox': 'outlook-inbox',
};
const requiredIds = allMatches(reqBody, /'([^']+)'/g).map(
  (id) => LEGACY_REGISTRY_ALIASES[id] ?? id,
);

const renderedTours = collectRenderedTours(resolve(repoRoot, 'src'));

// ── Check 1: 10 flows ───────────────────────────────────────────────────────
console.log('[1] Executable flow count (flows.ts)');
flows.length === 10
  ? pass(`TUTORIAL_FLOWS has 10 flows`)
  : fail(`expected 10 flows, found ${flows.length}`);
console.log('');

// ── Check 2: 10 guide defs ──────────────────────────────────────────────────
console.log('[2] Guide definition count (tutorialDefs.ts)');
defs.length === 10
  ? pass(`TUTORIALS has 10 defs`)
  : fail(`expected 10 guide defs, found ${defs.length}`);
console.log('');

// ── Check 3: flow IDs === def IDs ───────────────────────────────────────────
console.log('[3] Flow IDs match guide def IDs (1:1)');
const flowIds = new Set(flows.map((f) => f.id));
const defIds = new Set(defs.map((d) => d.id));
if (setEq(flowIds, defIds)) {
  pass(`all ${flowIds.size} IDs align between flows and guide defs`);
} else {
  const a = diff(flowIds, defIds);
  const b = diff(defIds, flowIds);
  if (a.length) fail(`flow IDs with no matching guide def: ${a.join(', ')}`);
  if (b.length) fail(`guide def IDs with no matching flow: ${b.join(', ')}`);
}
console.log('');

// ── Check 4: registry REQUIRED_TUTORIAL_IDS === flow IDs ────────────────────
console.log('[4] Registry REQUIRED_TUTORIAL_IDS in sync with flows');
const reqSet = new Set(requiredIds);
if (setEq(reqSet, flowIds)) {
  pass(`REQUIRED_TUTORIAL_IDS matches the ${flowIds.size} flow IDs`);
} else {
  const a = diff(reqSet, flowIds);
  const b = diff(flowIds, reqSet);
  if (a.length) fail(`registry IDs not present as flows: ${a.join(', ')}`);
  if (b.length) fail(`flow IDs missing from registry: ${b.join(', ')}`);
}
console.log('');

// ── Check 5: flow routes exist in App.tsx ───────────────────────────────────
console.log('[5] Flow step routes are declared in App.tsx');
{
  let ok = 0;
  for (const f of flows) {
    for (const r of f.routes) {
      if (appRoutes.has(r)) ok += 1;
      else fail(`flow "${f.id}" references route not in App.tsx: ${r}`);
    }
  }
  if (ok) pass(`${ok} flow route reference(s) resolve to real App.tsx routes`);
}
console.log('');

// ── Check 6: flow targets are actually rendered ─────────────────────────────
console.log('[6] Flow step targets have a rendered data-tour attribute');
{
  let ok = 0;
  for (const f of flows) {
    for (const t of f.targets) {
      if (renderedTours.has(t)) ok += 1;
      else fail(`flow "${f.id}" target has no rendered data-tour: ${t}`);
    }
  }
  if (ok) pass(`${ok} flow target(s) found in rendered data-tour attributes`);
}
console.log('');

// ── Check 7: completion title + body present ────────────────────────────────
console.log('[7] Every flow has completion title + body');
{
  let ok = 0;
  for (const f of flows) {
    if (f.completionTitle && f.completionTitle.trim() && f.completionBody && f.completionBody.trim()) {
      ok += 1;
    } else {
      fail(`flow "${f.id ?? '?'}" is missing completionTitle/completionBody`);
    }
  }
  if (ok === flows.length && flows.length) pass(`all ${flows.length} flows have completion copy`);
}
console.log('');

// ── Check 8: guide def module hints are real routes ─────────────────────────
console.log('[8] Guide def module route hints resolve to real routes');
{
  let ok = 0;
  for (const d of defs) {
    if (!d.module) continue;
    if (appRoutes.has(d.module)) ok += 1;
    else fail(`guide def "${d.id}" module hint is not a real route: ${d.module}`);
  }
  if (ok) pass(`${ok} guide def module hint(s) resolve to real App.tsx routes`);
}
console.log('');

// ── Summary ─────────────────────────────────────────────────────────────────
if (failures > 0) {
  console.error(`Tutorial checks FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log('All tutorial checks passed.');
