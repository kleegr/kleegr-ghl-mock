# Kleegr GHL Mock — Project Current Status

> Reality audit + release overview. This document records the **verified** state of the
> repository, the open/closed/merged pull requests, the production deployment, and the
> remaining work. Every claim below was checked against GitHub, the live Vercel
> deployment, and a local build of `main`.

- **Repository:** `kleegr/kleegr-ghl-mock`
- **Audited branch:** `main` @ `a99c2c1` (`fix(reputation): replace Card with div for onClick`)
- **Last verified:** 2026-05-28 ~19:00 UTC
- **Auditor:** Developer #26 — Project Reality Auditor

---

## 1. Current Production Status

| Item | Status |
| --- | --- |
| Production URL | https://kleegr-ghl-mock.vercel.app |
| Production reachable | **Yes** — HTTP 200 at root |
| Served build matches `main` | **Yes** — production serves `index-Bik5EaM2.js` / `index-CogPhjLS.css`, the exact asset hashes produced by building `main` @ `a99c2c1` locally |
| `main` build | **Green** — `tsc -b && vite build` succeeds (0 type errors) |
| Core CRM live | **Yes** |

**Note on deployment metadata:** the Vercel *deployments API* (READY/ERROR state, build
logs) could not be queried during this audit because the repo contains no
`.vercel/project.json` and the team ID was not available, so direct API access returned
"Not authorized." Production health was therefore confirmed by **direct HTTP verification**
(200 responses serving the current `main` assets, `x-vercel-cache: HIT`) rather than by the
dashboard status field. Treat "READY" as **inferred from live serving**, not read from the API.

---

## 2. What Is Live Now

**Core CRM (fully built, merged to `main`, live in production):**

- **Dashboard** — KPI stat tiles, pipeline/lead-source/revenue charts, lead-volume trend, activity feed, tasks-due and upcoming-appointments cards.
- **Contacts** — contacts table, smart lists, search/filter, detail drawer, Add Contact (wired to store `addContact`).
- **Conversations** — 3-pane unified inbox, channel filter tabs, reply composer (wired to `sendMessage`), scripted "AI suggest".
- **Opportunities** — pipeline selector, Kanban board with drag-and-drop (`@dnd-kit`), list view, detail modal (stage move wired to `moveOpportunity`).
- **Calendars** — month / week / agenda views, booking flow (wired to `bookAppointment`), appointment detail modal.
- **Tasks** — summary cards, filter/group tabs, detail + add modals, complete toggle (wired to `toggleTask`).
- **Guides** — tutorial launcher with 10 tutorial cards + preview modal (tutorial *engine* deferred to a later wave).
- **TopBar** — global search, account switcher, quick-add menu, notifications, mode toggle, Reset Demo.
- **Sidebar** — GHL-style navigation, core-CRM emphasis, account identity block, collapse mode.

**Secondary modules also live (merged via PR #19):**

- **Payments** — invoices/transactions with modals and filters.
- **Phone** — call log + dialer UI.
- **Reputation** — reviews + review-request flow.

**Not yet live (still placeholder scaffolds on `main`):** Marketing (email/SMS), Reporting,
Sites, Automations, Integrations, Settings, Media. Each renders a `PageHeader` + "coming in
a later wave" `EmptyState`. These are the targets of the two open PRs (#13 and #17).

---

## 3. Current Open PRs

Only **two** PRs are open. (The earlier plan that listed #19 and #20 as pending is **stale**:
#19 is now merged and #20 is now closed — see §4.)

| PR | Title | Branch scope | Merges onto `main`? | Build (merged onto `main`) | Recommendation |
| --- | --- | --- | --- | --- | --- |
| **#13** | Marketing, Reporting, and Sites modules | `src/modules/{marketing,reporting,sites}` only | Clean (no conflicts) | **FAILS** — 1 TypeScript error | **Needs build fix**, then merge |
| **#17** | Automations, Integrations, Settings, Media modules | `src/modules/{automations,integrations,settings,media}` + `workflowNodes.ts` | Clean (no conflicts) | **PASSES** | **Good to merge** after rebase + final build check |

**PR #13 — exact blocker (verified):**
```
src/modules/sites/Sites.tsx(174,121): error TS2322:
  Type '{ children...; onClick: () => void; }' is not assignable to
  type 'IntrinsicAttributes & CardProps'.
```
`<Card>` is being given an `onClick` handler, but `CardProps` only permits `data-*`
attributes. This is the **same class of error** that was already hot-fixed on `main` for
Reputation in commit `a99c2c1`. Fix is identical and small: replace the clickable `<Card>`
with a `<div>` (or extend `CardProps` to accept `onClick`). After that one fix, PR #13
builds and is mergeable.

Both open PRs are correctly scoped (they touch only their own scaffold modules) and are
demo-safe (store reads and local static/fake data; no store mutations beyond their module;
no network calls).

---

## 4. Closed / Superseded PRs

| PR | Title | State | Reason | Superseded / replaced by |
| --- | --- | --- | --- | --- |
| #4 | Dashboard module (Agent 1) | Closed, not merged | Duplicate Dashboard | **#14** (merged) |
| #9 | Seed / fake data enrichment (Agent 7) | Closed, not merged | Duplicate seed work | **#16** (merged) |
| #10 | Conversations — unified inbox | Closed, not merged | Folded into combined module | **#15** (merged) |
| #11 | Tasks module | Closed, not merged | Folded into combined module | **#15** (merged) |
| #20 | Core daily workspace polish (Dashboard, Conversations, Tasks, TopBar) | **Closed, not merged** | Overlapped work already merged via #14/#15/#6 | n/a — superseded by the already-merged core PRs |

All five should **stay closed**. None appear as merge commits in `main` history.

---

## 5. Merge Queue Recommendation

The original plan's queue is mostly **already done** (#19 merged; #20 closed). Remaining work:

1. **PR #17 — Automations / Integrations / Settings / Media.** Rebase on latest `main`,
   re-run the build (currently green when merged onto `main`), then merge.
2. **PR #13 — Marketing / Reporting / Sites.** Apply the one-line `Card`→`div` `onClick`
   fix in `Sites.tsx`, rebase, confirm build is green, then merge.

Either order is safe (the two PRs touch disjoint module sets and do not conflict). #17 is
the lower-risk merge today because it already builds; #13 needs its fix first.

**Do not** reopen or merge #20 — its scope is already in `main`.

---

## 6. Core CRM Health

| Area | Rating | Notes |
| --- | --- | --- |
| Dashboard | **Live and good** | KPIs + charts + activity feed present and wired to store |
| Contacts | **Live and good** | Table, detail drawer, Add Contact wired |
| Conversations | **Live and good** | Inbox + reply composer wired |
| Opportunities | **Live and good** | Kanban drag-and-drop + stage move wired |
| Calendars | **Live and good** | Month/week/agenda + booking wired |
| Tasks | **Live and good** | List, modals, complete toggle wired |
| TopBar | **Live and good** | Search, quick-add, notifications, reset all present |
| Sidebar | **Live and good** | Polished GHL-style nav |
| Reset Demo | **Live and good** | `TopBar` button → store `resetDemo()` → regenerates deterministic seed |

No core area is currently rated "polish needed", "not live", or "blocked".

---

## 7. Remaining Work

**Must-fix before demo**
- Nothing blocking. Core CRM is live, production serves the current `main`, and `main` builds green.

**Should-fix after demo**
- Fix PR #13's `Card onClick` TypeScript error and merge (brings Marketing / Reporting / Sites live).
- Rebase + merge PR #17 (brings Automations / Integrations / Settings / Media live).
- Add a committed `package-lock.json` so `npm ci` works in CI (see §9 — the lockfile is currently missing).

**Nice-to-have polish**
- Code-split the bundle. The production JS chunk is ~844 kB (vite emits a >500 kB chunk-size warning). Functional, but worth `manualChunks` / dynamic imports later.
- Build the actual tutorial engine behind the Guides cards (currently launcher + previews only).

---

## 8. Guardrails Confirmed

Verified by scanning `src/` at `main` @ `a99c2c1`:

- **Front-end only** — Vite + React SPA, no server code.
- **No backend** — no `fetch` / `axios` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` calls anywhere in `src/`.
- **No real integrations** — no GoHighLevel/email/SMS/phone/payment/calendar APIs; no `process.env` / `import.meta.env` endpoints or secrets.
- **Fake-data only** — deterministic in-memory seed (`src/data/seed.ts`); emails use reserved `example.com` / demo domains only.
- **No real PII** — generated names, `example.com` addresses, fake phone numbers.
- **In-memory state only** — single Zustand store; **no** `localStorage` / `sessionStorage` / `indexedDB` / persistence.
- **Reset Demo wired** — restores the original deterministic seed.

The only outbound network references found are cosmetic / inert: a Google Fonts
`@import` in `index.css`, a fake `https://g.page/review-demo` string inside a sample review
message, and generated `*.example.com` website URLs in seed data. None are functional
integrations.

---

## 9. Important Warnings

- **`npm ci` does not work as-is** — there is **no `package-lock.json`** in the repo, so `npm ci` exits with an error. This audit's build was verified with `npm install` instead. Commit a lockfile before relying on `npm ci` in CI.
- **PR #13 will fail the build if merged as-is** — apply the `Card`→`div` `onClick` fix in `Sites.tsx` first.
- **Do not merge / reopen PR #20** — it overlaps Dashboard / Conversations / Tasks / TopBar work already merged via #14 / #15 / #6.
- **Rebase both open PRs on the latest `main` before merging** — several core PRs and a hotfix landed after these branches were cut.
- **Build + production must be green before every production merge** — `tsc -b && vite build` must pass; confirm the deployment serves the new asset hashes afterward.
- **Don't assign polish work against the stale scaffolds** for Marketing / Reporting / Sites / Automations / Integrations / Settings / Media — those modules are being replaced wholesale by #13 and #17.

---

*Verification methods: GitHub PR/commit inspection; local `git` merge tests of PR #13 and
PR #17 onto `main`; local `npm install` + `npm run build`; direct HTTP fetches of the
production URL and several deep links; static `grep` scans of `src/` for network calls,
persistence, env usage, and PII. Browser runtime (DOM render) testing was **not** available;
route checks were performed at the HTTP level only — see §10.*

## 10. Routes Checked (HTTP level)

The SPA rewrite in `vercel.json` (`/(.*) → /index.html`) means **every** path returns the
app shell (`index.html`, HTTP 200); client-side React Router then renders the matched route.
Confirmed 200 + correct shell for `/`, `/contacts`, and the nested `/settings/business`.
All app routes are registered in `src/App.tsx`: `/`, `/contacts`, `/conversations`,
`/opportunities`, `/calendars`, `/tasks`, `/guides`, `/payments`, `/phone`, `/reputation`,
`/marketing/email`, `/marketing/sms`, `/reporting`, `/sites`, `/automations`,
`/integrations`, `/settings` (+ `/settings/:section`), `/media`. Because JavaScript was not
executed during the audit, **in-browser rendering of each route's content was not
verified** — only that the server returns the SPA shell for each path and that the route
components exist and are wired in code.
