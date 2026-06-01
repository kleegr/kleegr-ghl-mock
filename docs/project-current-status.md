# Project Current Status

_A snapshot of where **kleegr-ghl-mock** stands, intended to be accurate to the
repository as built. This is a front-end-only demo (GoHighLevel-style mock) with
**no backend, no real APIs, and no integrations** — all data is fake, seeded, and
in-memory._

## How to run locally

```bash
npm install     # install dependencies
npm run dev     # Vite dev server
npm run build   # tsc -b typecheck + vite production build
npm run preview # preview the production build
npm run verify  # lint + route smoke + tutorial registry check
```

## Live modules

The app shell (collapsible dark sidebar + top bar with global search, quick-add,
notifications, account switcher, and a Demo/Tutorial mode toggle) wraps these routes,
all declared in `src/App.tsx`:

- **Dashboard** (`/`) — KPI cards + pipeline / lead-source / revenue / trend charts.
- **Conversations** (`/conversations`) — multi-channel inbox with a working reply composer.
- **Contacts** (`/contacts`) — sortable/filterable table, add-contact modal, detail drawer.
- **Opportunities** (`/opportunities`) — drag-and-drop Kanban with live stage totals.
- **Calendars** (`/calendars`) — month/week/agenda views + booking modal.
- **Marketing** (`/marketing/email`, `/marketing/sms`) — campaign lists, detail, wizard.
- **Automations** (`/automations`) — workflow list + visual builder + educational picker.
- **Sites, Reputation, Reporting, Payments, Phone, Tasks, Integrations, Media, Settings** —
  starter modules with realistic seeded data and empty/populated states.
- **Guides** (`/guides`) — launcher for the guided tutorials (16 today), grouped into learning paths.

## Automations (workflows)

The `/automations` module presents a small, curated set of realistic GHL-style workflows
(quality over quantity) rather than a long list of filler. Each workflow shows a name,
status, trigger, a one-line explanation, enrollment numbers, and a "view builder" action.
The builder renders a trigger card, action/wait/condition cards with connectors, an
educational trigger/action picker drawer, a selected-step detail panel, and draft/publish
controls. Display data lives in `src/modules/automations/automationData.ts` and
`workflowNodes.ts`; the extended `Workflow` display metadata is typed in `src/types/index.ts`.

## Tutorial mode

Tutorial Mode is an in-app, Arcade-style walkthrough engine (`TutorialOverlay`) driven by
two parallel, ID-aligned sources:

- `src/tutorials/flows.ts` — `TUTORIAL_FLOWS`: 16 executable flows (route + `data-tour`
  target + step copy + completion screen). Single source of truth for Tutorial Mode.
- `src/modules/guides/tutorialDefs.ts` — `TUTORIALS`: 16 guide definitions (catalog cards),
  now derived from `TUTORIAL_FLOWS` rather than hand-maintained.
- `src/tutorials/registry.ts` — the single source of truth for `data-tour` keys and the
  `REQUIRED_TUTORIAL_IDS` list, kept in sync with the flows.

The 16 flows: tour-dashboard, add-contact, reply-conversation, check-missed-calls,
move-pipeline, book-appointment, create-invoice, review-document, send-review-request,
create-workflow, view-campaign-performance, explore-reporting, productivity-tickets,
configure-business-profile, invite-team-member, outlook-inbox. They are grouped into six
learning paths in `src/tutorials/paths.ts`. Consistency is enforced by `npm run check:tutorials`.

## Prompt library

`prompts/` holds structured, offline prompt templates used to author the seeded demo
content (see `prompts/README.md` for the full index and universal guardrails). Templates
cover fake data, conversations, tutorial scripts, demo scripts, pipeline scenarios,
workflow explanations, contact profiles, onboarding copy, module helper copy, review
responses, campaign copy, and reporting insights. They run in any LLM and their output is
pasted into the relevant seed/config file — there is no live API call in V1.

## Verification flow

Static, dependency-free checks gate every release (and run in CI):

- `npm run build` — `tsc -b` typecheck + `vite build` (now split into vendor chunks; the
  previous single ~1.1 MB bundle and its 500 kB warning are resolved).
- `npm run smoke` (`scripts/smoke-routes.mjs`) — every expected route is declared in
  `App.tsx`, `vercel.json` has the SPA rewrite, and no forbidden route is linked.
- `npm run check:tutorials` (`scripts/check-tutorials.mjs`) — 16 flows / 16 defs, IDs and
  registry in sync, every flow route is real, every flow target is a rendered `data-tour`,
  every flow has completion copy, and every guide module hint is a real route.
- `npm run verify` — runs lint + smoke + check:tutorials together.

CI (`.github/workflows/ci.yml`) runs `npm install → build → smoke → check:tutorials` on every
PR and on pushes to `main`.

## Known limitations

- **Front-end only.** No backend, database, or real third-party integrations; every
  "send", "charge", "connect", and "call" is cosmetic.
- **In-memory state.** All edits reset on refresh or via the **Reset Demo** button.
- **Placeholder branding.** Palette, font, and logo in `src/theme/tokens.ts` are
  placeholders pending Kleegr’s verified brand tokens.
- **Seed data is illustrative.** Generated via the `prompts/` templates; no real PII.
