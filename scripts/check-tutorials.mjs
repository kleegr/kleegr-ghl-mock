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
 * Help content model (foundation for the new "What is this?" system):
 *   9.  src/help/helpContent.ts exists and its HELP_CONTENT catalog parses
 *   10. Every help entry has non-empty key, area, tier, label and help copy
 *   11. Help keys are unique (no duplicates)
 *   12. Help entry areas fall within the declared HELP_AREAS set        (WARN)
 *   13. Every guided-tutorial target also has a help entry
 *   14. Learning paths (paths.ts) reference existing flow ids or ids that are
 *       explicitly listed as planned (PLANNED_TUTORIAL_IDS)
 *   15. Required-for-V1 help keys already have a rendered data-tour      (WARN)
 *       (Developer 5 still has to instrument any missing anchors, so a gap here
 *        is tracked, not a build breaker — warning mode now, strict mode later.)
 *
 * Checks 1–8 and 9–14 are HARD (failures exit 1). Checks 12 and 15 are WARN
 * (reported but never change the exit code). Exit code is 0 on success (warnings
 * allowed) and 1 on any failure.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

let failures = 0;
let warnings = 0;
const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => {
  console.error(`  FAIL  ${m}`);
  failures += 1;
};
// Non-blocking: surfaced in the summary but never changes the exit code. Used
// for the help-coverage checks that depend on instrumentation Developer 5 has
// not landed yet (warning mode now, strict mode later — per the architecture
// plan).
const warn = (m) => {
  console.warn(`  WARN  ${m}`);
  warnings += 1;
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

// ── Gather rendered data-tour attributes by walking src/ ───────────────────────────
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

// ── Check 1: 10 flows ────────────────────────────────────────────────────
console.log('[1] Executable flow count (flows.ts)');
flows.length === 10
  ? pass(`TUTORIAL_FLOWS has 10 flows`)
  : fail(`expected 10 flows, found ${flows.length}`);
console.log('');

// ── Check 2: 10 guide defs ──────────────────────────────────────────────
console.log('[2] Guide definition count (tutorialDefs.ts)');
defs.length === 10
  ? pass(`TUTORIALS has 10 defs`)
  : fail(`expected 10 guide defs, found ${defs.length}`);
console.log('');

// ── Check 3: flow IDs === def IDs ─────────────────────────────────────────
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

// ── Check 4: registry REQUIRED_TUTORIAL_IDS === flow IDs ───────────────────────
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

// ── Check 6: flow targets are actually rendered ───────────────────────────────
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

// ── Check 7: completion title + body present ─────────────────────────────────
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

// ── Check 8: guide def module hints are real routes ────────────────────────────
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

// ═════════════════════════════════════════════════════════════════════════════════════════
// Help content model checks (foundation for the new "What is this?" system).
//
// These prepare for contextual help without blocking the repo before anchors
// are instrumented. Structural checks on the help model itself are HARD (this
// PR owns that data); checks that depend on app-wide instrumentation Developer
// 5 has not done yet are WARN-only for now.
// ════════════════════════════════════════════════════════════════════════════════════════════
const helpSrc = read('src/help/helpContent.ts');
const pathsSrc = read('src/tutorials/paths.ts');

// Parse help entries (single-quoted fields; prose uses curly apostrophes so a
// stray ASCII apostrophe never terminates a string — same convention as flows.ts).
let helpEntries = [];
if (helpSrc) {
  helpEntries = objectBlocks(arrayBody(helpSrc, 'HELP_CONTENT')).map((b) => ({
    key: firstMatch(b, /key:\s*'([^']+)'/),
    area: firstMatch(b, /area:\s*'([^']+)'/),
    tier: firstMatch(b, /tier:\s*'([^']+)'/),
    label: firstMatch(b, /label:\s*'([^']*)'/),
    help: firstMatch(b, /help:\s*'([^']*)'/),
    tutorialId: firstMatch(b, /tutorialId:\s*'([^']+)'/),
    requiredForV1: firstMatch(b, /requiredForV1:\s*(true|false)/),
  }));
}
const helpKeySet = new Set(helpEntries.map((e) => e.key).filter(Boolean));

// Known areas, parsed from the HELP_AREAS literal in the same file.
const knownAreas = (() => {
  if (!helpSrc) return new Set();
  const i = helpSrc.indexOf('HELP_AREAS');
  const open = helpSrc.indexOf('[', i);
  const close = helpSrc.indexOf(']', open);
  return i === -1 ? new Set() : new Set(allMatches(helpSrc.slice(open, close), /'([^']+)'/g));
})();

// Union of every flow step target (the elements guided tutorials walk through).
const flowTargets = new Set();
for (const f of flows) for (const t of f.targets) flowTargets.add(t);

// ── Check 9: help content model exists & parses ──────────────────────────────
console.log('[9] Help content model exists and parses (src/help/helpContent.ts)');
if (helpSrc && helpEntries.length) {
  pass(`helpContent.ts parsed — ${helpEntries.length} help entries`);
} else if (helpSrc) {
  fail('helpContent.ts present but no HELP_CONTENT entries could be parsed');
}
console.log('');

// ── Check 10: every help entry has the required non-empty fields ────────────
console.log('[10] Help entries have non-empty key, area, tier, label, help');
{
  let bad = 0;
  for (const e of helpEntries) {
    const missing = ['key', 'area', 'tier', 'label', 'help'].filter(
      (f) => !e[f] || !String(e[f]).trim(),
    );
    if (missing.length) {
      fail(`help entry "${e.key ?? '(no key)'}" missing/empty: ${missing.join(', ')}`);
      bad += 1;
    }
  }
  if (helpEntries.length && !bad) pass(`all ${helpEntries.length} help entries are fully populated`);
}
console.log('');

// ── Check 11: no duplicate help keys ───────────────────────────────────────
console.log('[11] Help keys are unique');
{
  const keys = helpEntries.map((e) => e.key).filter(Boolean);
  const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  if (!dupes.length) pass(`no duplicate help keys (${keys.length} keys)`);
  else fail(`duplicate help keys: ${dupes.join(', ')}`);
}
console.log('');

// ── Check 12: help areas are within the known set (WARN) ──────────────────────
console.log('[12] Help entry areas are within the known HELP_AREAS set');
{
  const unknown = [...new Set(helpEntries.map((e) => e.area).filter((a) => a && !knownAreas.has(a)))];
  if (!unknown.length) pass(`all help areas are known (${knownAreas.size} areas defined)`);
  else warn(`help entries use areas not in HELP_AREAS: ${unknown.join(', ')}`);
}
console.log('');

// ── Check 13: every guided-tutorial target has a help entry ─────────────────
console.log('[13] Every tutorial flow target has a help entry');
{
  const missing = [...flowTargets].filter((t) => !helpKeySet.has(t));
  if (!missing.length) pass(`all ${flowTargets.size} tutorial flow targets have a help entry`);
  else fail(`tutorial flow targets with no help entry: ${missing.join(', ')}`);
}
console.log('');

// ── Check 14: learning paths reference existing or planned tutorials ────────
console.log('[14] Learning paths reference existing or planned tutorials');
{
  let plannedIds = new Set();
  let paths = [];
  if (pathsSrc) {
    // Anchor on the declaration (not the first textual mention) so the comment
    // that references PLANNED_TUTORIAL_IDS above the const cannot poison this,
    // and so the `] as const;` close is handled.
    const decl = 'PLANNED_TUTORIAL_IDS = [';
    const i = pathsSrc.indexOf(decl);
    if (i !== -1) {
      const open = i + decl.length - 1; // index of the '['
      const close = pathsSrc.indexOf(']', open);
      plannedIds = new Set(allMatches(pathsSrc.slice(open, close), /'([^']+)'/g));
    }
    paths = objectBlocks(arrayBody(pathsSrc, 'LEARNING_PATHS')).map((b) => {
      const idsPart = b.slice(b.indexOf('tutorialIds:'));
      const o = idsPart.indexOf('[');
      const c = idsPart.indexOf(']');
      return {
        id: firstMatch(b, /id:\s*'([^']+)'/),
        tutorialIds: o !== -1 && c !== -1 ? allMatches(idsPart.slice(o, c), /'([^']+)'/g) : [],
      };
    });
  }
  const validIds = new Set([...flowIds, ...plannedIds]);
  let badRefs = 0;
  for (const p of paths) {
    for (const tid of p.tutorialIds) {
      if (!validIds.has(tid)) {
        fail(`learning path "${p.id}" references unknown tutorial id: ${tid}`);
        badRefs += 1;
      }
    }
  }
  if (!pathsSrc) {
    /* read() already failed */
  } else if (!paths.length) {
    fail('no learning paths parsed from paths.ts (expected LEARNING_PATHS)');
  } else if (!badRefs) {
    pass(
      `${paths.length} learning paths reference only valid ids ` +
        `(${flowIds.size} existing flows + ${plannedIds.size} planned)`,
    );
  }
}
console.log('');

// ── Check 15: required-for-V1 help keys are rendered (WARN) ─────────────────
// Developer 5 still needs to place anchors across the app, so a required key
// that is not yet a rendered data-tour is a tracked gap, not a build breaker.
console.log('[15] Required-for-V1 help keys are rendered as data-tour (instrumentation gap)');
{
  const requiredKeys = helpEntries
    .filter((e) => e.requiredForV1 === 'true')
    .map((e) => e.key)
    .filter(Boolean);
  const notRendered = requiredKeys.filter((k) => !renderedTours.has(k));
  if (!requiredKeys.length) {
    warn('no required-for-V1 help keys are marked yet');
  } else if (!notRendered.length) {
    pass(`all ${requiredKeys.length} required-for-V1 help keys are rendered`);
  } else {
    warn(
      `${notRendered.length}/${requiredKeys.length} required-for-V1 help key(s) not yet rendered ` +
        `(Developer 5 to instrument): ${notRendered.join(', ')}`,
    );
  }
}
console.log('');

// ── Summary ───────────────────────────────────────────────────────────
if (warnings > 0) {
  console.warn(`Note: ${warnings} non-blocking warning(s) — help instrumentation is still in progress.`);
}
if (failures > 0) {
  console.error(`Tutorial checks FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log('All tutorial checks passed.');
