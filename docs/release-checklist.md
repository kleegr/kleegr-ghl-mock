# Release Checklist

A pre-release checklist for **kleegr-ghl-mock**. This app is a front-end-only
demo (GoHighLevel-style mock). There is no backend, no real integrations, and
all data is fake. Keep it that way.

Run the local gate before every release:

```bash
npm install
npm run build
npm run verify   # = lint + smoke (routes/SPA) + check:tutorials
```

All must succeed. (`npm run verify` runs the tutorial registry check in addition
to the route smoke test.)

---

## Build checklist

- [ ] `npm install` completes cleanly (CI uses `npm install`; no committed lockfile required).
- [ ] `npm run build` succeeds (`tsc -b` typecheck + `vite build`).
- [ ] No new runtime dependencies were added without justification.
- [ ] `dist/` is produced and is not committed (it is gitignored).

## Vercel checklist

- [ ] Vercel project is connected to the `main` branch.
- [ ] Build command is `npm run build`; output directory is `dist`.
- [ ] `vercel.json` SPA rewrite is present so deep links resolve to `index.html`.
- [ ] No deployment secrets or environment variables are required (none should be).
- [ ] Preview deployment for the PR loads without a blank screen / console errors.

## Route smoke checklist

- [ ] `npm run smoke` and `npm run check:tutorials` pass (run automatically in CI after build).
- [ ] All expected routes are declared in `src/App.tsx`:
      `/`, `/contacts`, `/conversations`, `/opportunities`, `/calendars`,
      `/tasks`, `/guides`, `/payments`, `/phone`, `/reputation`,
      `/marketing/email`, `/marketing/sms`, `/reporting`, `/sites`,
      `/automations`, `/integrations`, `/settings`, `/media`.
- [ ] No forbidden / dangling route (e.g. `/appointments`) is linked from `TopBar.tsx`.
- [ ] Manually click through the sidebar; no link lands on the catch-all redirect unexpectedly.

## Tutorial checklist

- [ ] `npm run check:tutorials` passes (runs in CI after smoke).
- [ ] Exactly 16 executable flows (`TUTORIAL_FLOWS`) and 16 guide defs (`TUTORIALS`, derived from the flows).
- [ ] Flow IDs, guide def IDs, and `REQUIRED_TUTORIAL_IDS` are all in sync.
- [ ] Every flow step `target` has a rendered `data-tour` attribute in the DOM.
- [ ] Every flow step `route` and every guide def `module` hint is a real `App.tsx` route.
- [ ] Each flow has completion title + body copy.

## Demo safety checklist

- [ ] All data shown is fake / illustrative — no real customer names, emails, or phone numbers.
- [ ] No real PII anywhere in seed data, screenshots, or sample content.
- [ ] No live API keys, tokens, or webhook URLs in source, env, or committed files.
- [ ] No buttons claim to perform real external actions (sending email/SMS, charging cards).
- [ ] Console is free of errors on the main routes.

## Reset Demo checklist

- [ ] "Reset Demo" returns the app to its initial seeded state.
- [ ] Reset clears any in-session edits (contacts, deals, tasks, etc.).
- [ ] After reset, every module renders without errors.
- [ ] Reset does not depend on any backend call.

## PR merge checklist

- [ ] CI is green (`install` · `build` · `smoke` · `check:tutorials`).
- [ ] Diff touches only the files in scope for the PR.
- [ ] No changes to `src/**` in infra/release-only PRs.
- [ ] PR has been reviewed; no direct merge of unverified PRs.
- [ ] Any source/UI bug found by the smoke gate is tracked and assigned to its owner before merge.

---

## Known guardrails

These are hard constraints for this project:

- **No backend** — the app is purely client-side.
- **No real integrations** — GoHighLevel and all third-party services are mocked.
- **Fake data only** — seed data is illustrative.
- **No real PII** — never introduce real personal data.
- **No direct merge of unverified PRs** — CI must pass and a human must review.
