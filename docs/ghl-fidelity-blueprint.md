# GoHighLevel Fidelity Blueprint for Kleegr Mock

> **Scope:** docs-only. This file is the single implementation spec for raising
> `kleegr/kleegr-ghl-mock` to a high-fidelity, **GoHighLevel-inspired** look while
> staying Kleegr-branded, fake-data-only, in-memory, and free of real integrations.
>
> **Authored by:** Developer #37 — GHL Fidelity Blueprint Architect.
> **Verified against:** 19 reference screenshots; `main` source (shell, tokens,
> seed, store, types, Opportunities/Conversations/Automations modules); open PRs
> #21 and #23; production confirmed live (per PR #21 audit, serving `main`).

---

## 0. Legal / safety guardrails (read first — non-negotiable)

These bind every task in this document. They are not stylistic preferences.

1. **Do not copy GoHighLevel's proprietary assets.** No GHL logos, no GHL marketing
   copy, no exported GHL CSS, no GHL product screenshots committed to the repo, no
   GHL icon SVGs. We replicate **layout conventions and information architecture**
   (sidebar shape, kanban columns, table columns, drawer structure) — functional
   patterns — using our own Kleegr branding, our own Lucide icons, and our own tokens.
   The repo already encodes this stance in `src/theme/tokens.ts` (`placeholder: true`,
   "extract your own brand") and in the PR #23 release checklist; keep it.
2. **The reference screenshots contain REAL personal data.** Real human names, phone
   numbers, and email addresses are visible in the opportunity cards, conversation
   list, and contact panel. **Never transcribe any of that PII into seed data, code,
   comments, or this repo.** Use the existing fictional generators in `src/data/seed.ts`.
   When a spec below says "match the screenshot," it means match *layout and field
   structure*, never the literal person/number/email shown.
3. **Existing PII leak to fix:** `src/modules/conversations/Conversations.tsx` has a
   hardcoded fallback `agentName = ... || 'Naftuli Horowitz'`. Replace with a fictional
   default (the seeded current user's name, or `'Demo Agent'`).
4. **No real APIs, keys, webhooks, or network calls.** All behavior stays in-memory via
   Zustand; `resetDemo()` must continue to restore the seed.

---

## 1. Executive Summary

**Current fidelity level (overall ≈ 62%).** The global shell and the Opportunities
module are already strong GHL-style surfaces. Conversations is a deliberate screenshot
rebuild and is close. Automation is the weakest area relative to its screenshots. The
remaining modules are functional but generic.

- **Current fidelity by area:** Shell ≈ 75% · Opportunities ≈ 85% · Conversations ≈ 70%
  · Automation ≈ 35% · other modules ≈ 40–55%.

**Biggest visual gaps**
1. Automation is a generic SaaS page (PageHeader + 400px side-card builder). GHL shows a
   dark-banner subnav (`Automation / Workflows / Overview / Global Workflow Settings`), a
   full **Overview dashboard** (stat cards + enrollment line chart + Error Review +
   Trigger Analysis), a **folder/column workflow list**, and a **full-canvas builder**
   with an AI-first prompt, horizontal branching, zoom controls, and a minimap.
2. Sidebar is missing ~8 nav entries that appear in every screenshot (Ask AI row,
   Launchpad, URLs, AI Studio, AI Agents, Memberships, App Marketplace, Kleegr WA) and
   renders group-label text (`Core/Grow/Operate/Setup`) that GHL does not show.
3. Sidebar background gradient runs too bright/blue at the bottom (`#1c50bd`); GHL is a
   near-uniform dark navy.
4. Opportunity stage names (`New Lead / Contacted / Consult Booked …`) don't match the
   screenshot's call-cadence stages (`New Lead / Called 1 / Called 2 / Called 3 / Called 4 / …`).

**Biggest UX gaps**
1. Add/Edit Opportunity is cosmetic (toast only); the screenshots show a full edit modal
   (img 15/19) and the store has no `addOpportunity` / `updateOpportunity`.
2. Conversations right panel only renders Contact Details; GHL switches between three
   right panels via an icon rail: **Contact Details** (img 13), **Activity** timeline
   (img 12), and **Appointments** Upcoming/Past with empty state (img 10/11).
3. Conversation thread lacks **system-event rows** (`Opportunity X moved from A → B …
   Details · date`) and proper **call cards** (audio player + View Transcript), both
   prominent in img 10/12.
4. Multi-channel composer dropdown (SMS / WhatsApp / Email / Kleegr Whatsapp / Whatsapp
   Send Only) — partially present; verify against img 11.

**Biggest data / model gaps**
- `Opportunity` lacks `businessName`, `followers`, and per-card activity counts.
- `Workflow` lacks folders, `activeEnrolled` (second number), `lastUpdatedAt`,
  `createdAt`, and a `needsReview` flag — all visible in the workflow list (img 4/8).
- `Message` / `Conversation` lack `subject`, an `internal note` kind, a `system_event`
  kind, and a call kind with duration/transcript.
- Seed pipeline/stage/source names don't match the screenshots.

**Most important merge order**
1. **PR #23** (CI + smoke + release checklist) — merge first; foundational, no `src/**`.
2. **This blueprint PR** (docs only).
3. Then the build PRs in dependency order: **Shell → Data/Types → Opportunities polish →
   Conversations panels → Automation rebuild** (see §11–12).

**Biggest risk if we keep building randomly:** the shell (`nav.ts`, `Sidebar`, `TopBar`)
and shared seed/types are touched by almost every module. Parallel UI work without the
shell + data contracts landing first guarantees merge conflicts and rework. Land the
shell and the data-model changes (§3, §10) before fanning out module work.

---

## 2. Screenshot Inventory

Match % = how close the **current mock** is to that screenshot today.

| # | File | Mapped route / screen | Visible areas | Match % | Main gaps |
|---|------|----------------------|---------------|--------:|-----------|
| 1 | auto-overview | `/automations` → **Automation ▸ Overview** | Sidebar, topbar, Automation subnav, stat cards, enrollment chart, Error Review, Trigger Analysis | 20% | No Overview dashboard; generic header; no subnav |
| 2 | wf-add-trigger | Workflow builder ▸ **Add Trigger** drawer | Left icon rail, AI prompt card, Add Trigger panel (Recent + Contact group, Triggers/Apps tabs) | 35% | Picker inline not a right drawer; no Recent; no Apps tab; no left rail |
| 3 | wf-advanced-ivr | Workflow ▸ **Advanced canvas (IVR)** | Builder header (back, title, tabs, Draft/Publish, Saved), horizontal branching nodes, minimap | 15% | No full canvas, no horizontal branching, no condition/branch/goto nodes, no minimap |
| 4 | wf-list | `/automations` → **Workflows list** | Subnav, Create Folder/Build AI/Create Workflow, All/Needs Review/Deleted tabs, folders, table columns | 25% | No folders; single enrolled column; no dates; no Needs Review |
| 5 | wf-actions | Workflow builder ▸ **Actions** drawer | AI prompt, Or divider, Add New Trigger, Actions panel (Recent + Contact group) | 35% | Same as #2 (Actions side) |
| 6 | opp-board | `/opportunities` → **board** | Pipeline select, count pill, view toggle, Import/Add, filters, kanban columns + cards | 85% | Stage names; businessName as field; activity badge density |
| 7 | opp-bulk | `/opportunities` → **bulk select** | "N selected", Edit/Delete, column + card checkboxes | 80% | Bulk edit/delete are cosmetic toasts |
| 8 | wf-create-menu | Workflows list ▸ **Create Workflow menu** | Dropdown: Start from Scratch / Build Using AI / Select from Template / Import from campaign / Company based / Urls based | 20% | Menu options differ; current modal is template-list only |
| 9 | wf-ai-empty | Workflow builder ▸ **AI-first empty** | "What do you want to automate? BETA" prompt, chips, Or, Add New Trigger, END | 25% | No AI prompt surface; no END affordance |
| 10 | conv-appts | `/conversations` ▸ thread + **Appointments** panel | Subnav, inbox filters, call cards, system events, composer, right Appointments (Upcoming/Past, empty) | 65% | No Appointments right panel; verify call cards + system events |
| 11 | conv-channel | `/conversations` ▸ **channel dropdown** | Composer channel menu (SMS/WhatsApp/Email/…), email From Name + CC/BCC, email threads | 70% | Verify full channel list incl. "Kleegr Whatsapp" / "Whatsapp Send Only" |
| 12 | conv-activity | `/conversations` ▸ **Activity** panel | Team Inbox toolbar, thread system events, right Activity timeline (Source: Direct traffic) | 60% | No Activity timeline panel; no system-event rows |
| 13 | conv-contact | `/conversations` ▸ **Contact Details** panel | Right Contact Details (Owner/Followers/Tags, All fields/DND/Actions, fields) | 75% | Verify Followers + All-fields/DND/Actions tabs + field list |
| 14 | opp-board-wide | `/opportunities` board (wide viewport) | Same as #6 at wide width; sidebar shows App Marketplace + Kleegr WA | 85% | Confirms missing bottom nav items |
| 15 | opp-edit-narrow | `/opportunities` ▸ **Edit modal** (narrow) | Left modal nav, Contact details, Opportunity Details (Pipeline/Stage/Status/Value/Owner/Followers/Business Name/Source/Tags/Client number) | 30% | Modal read-only-ish; missing fields + update action |
| 16 | wf-trigger-node | Workflow ▸ **Add Trigger** w/ existing trigger node | Trigger node (Call Details), Stats/copy/delete, Add New Trigger, action node, END | 20% | Same as #2/#3 |
| 17 | opp-board-expanded | `/opportunities` board (Called 2 expanded) | Board with one column expanded showing scroll | 85% | Same as #6 |
| 18 | opp-pipeline-menu | `/opportunities` ▸ **Pipeline dropdown** | Pipeline menu: Archive / Kleegr Sales ✓ / Onboarding Process / Phone System / + New pipeline | 70% | Pipeline names differ from seed |
| 19 | opp-edit-wide | `/opportunities` ▸ **Edit modal** (wide) | Same as #15 at desktop width | 30% | Same as #15 |

---

## 3. Global Shell Blueprint

### 3.1 Sidebar — `src/components/shell/Sidebar.tsx`, `src/components/shell/nav.ts`

**Current (verified):** width `248px` expanded / `60px` collapsed; bg
`bg-gradient-to-b from-[#0a1f44] via-[#123070] to-[#1c50bd]`; wordmark "kleegr" purple
gradient 24px; account switcher (Building2 + name 13px bold + region 11px white/55 +
ChevronsUpDown); search button (`Search` 14px, label, `ctrlK` kbd, `Zap` box); nav items
`mx-2 rounded-lg px-3 py-[7px]`, text `13.5px`, icon `18px`; active = `bg-brand` + white
text + left `3px #38bdf8` accent bar; group-label TEXT rendered (`Core/Grow/Operate/Setup`);
collapse toggle at bottom.

**Target spec:**

- **Width:** keep `248px` / `60px`. ✔ already matches.
- **Background:** change to near-solid dark navy. Replace the bright bottom stop:
  `bg-gradient-to-b from-[#0b1f40] to-[#0a1a38]` (or just `bg-[#0b1f40]`). The current
  `#1c50bd` bottom is the most visible shell mismatch.
- **Wordmark:** keep purple "kleegr" gradient. ✔
- **Account switcher:** keep (cosmetic, demo sub-accounts). ✔
- **Search:** keep `Search … ctrlK [⚡]` row. ✔
- **Group labels:** **remove the rendered `Core/Grow/Operate/Setup` text.** GHL shows no
  group headers — only a single thin divider after `Tasks / Projects`. Keep one
  `border-white/10` divider there; drop the synthetic "Core" label entirely.
- **Nav item height/active/hover:** keep `~36px` rows, `18px` icons, `13.5px` text.
  Active target: brighter medium-blue bar reading nearly full-width with white text + the
  existing `#38bdf8` left accent. Reduce active margin `mx-2` → `mx-1.5` for a more
  full-bleed read (per img 1/4/6).
- **Badges:** support a small `Beta` pill on `AI Studio` (amber/gold) and an optional
  unread dot — both visible in screenshots.

**Required `nav.ts` changes (add the missing entries, in screenshot order):**

```
(top action)  Ask AI            cosmetic top row w/ Sparkles
              Launchpad         /launchpad   (Rocket)        ADD
              Dashboard         /            (LayoutDashboard)        exists
              Conversations     /conversations (MessagesSquare)       exists
              Calendars         /calendars   (Calendar)               exists
              Contacts          /contacts    (Users)                  exists
              Opportunities     /opportunities (nodes/Share2 glyph)   exists (swap icon)
              URLs              /urls        (Link)          ADD
              Payments          /payments    (CreditCard)             exists
              Tasks / Projects  /tasks       (CheckSquare)            exists
  -- divider --
              AI Studio [Beta]  /ai-studio   (Bot/Sparkles)  ADD
              AI Agents         /ai-agents   (Sparkles)      ADD
              Marketing         /marketing/email (Megaphone)          exists
              Automation        /automations (PlayCircle, not Workflow) exists (swap icon)
              Sites             /sites       (LayoutTemplate)         exists
              Memberships       /memberships (Award)         ADD
              Media Storage     /media       (FolderOpen)             exists
              Reputation        /reputation  (Star)                   exists
              Reporting         /reporting   (BarChart3)              exists
              App Marketplace   /integrations (LayoutGrid)  ADD (alias of Integrations)
              Kleegr WA         /kleegr-wa   (MessageSquare) ADD (cosmetic)
  (bottom)    Settings          /settings    (Settings)               exists
```

- `Phone`, `Integrations`, `Guides` are **not** visible in the screenshot sidebar. Keep
  their routes (smoke test requires them) but move them out of the visible rail (surface
  Phone in Conversations/dialer, Integrations as "App Marketplace", Guides under the `?`
  help menu) so the rail matches GHL.
- **New routes** added to nav must have matching `<Route>`s in `src/App.tsx` or the PR #23
  smoke test fails. For cosmetic-only entries (Ask AI, Launchpad, URLs, AI Studio, AI
  Agents, Memberships, Kleegr WA), either add lightweight placeholder route components
  **or** render them as cosmetic buttons that `pushToast` instead of `NavLink`s — do
  **not** leave dead `NavLink`s pointing at nonexistent routes.

**Files to change:** `nav.ts`, `Sidebar.tsx`, `src/App.tsx` (routes for any new real
paths). Optional placeholder module stubs under `src/modules/*`.

### 3.2 TopBar — `src/components/shell/TopBar.tsx`

**Current (verified):** `h-14` (56px); left = demo/tutorial mode toggle + Reset Demo +
Quick Add(+); right = dark trapezoid banner `bg-banner` (#0b1f40) + cyan diagonal slice
(`bg-banner-accent/80`, #38bdf8) via `clipPath`; action cluster: Phone (green 32px circle),
Ask AI pill (purple gradient), Megaphone (#0ea5a3), Notifications (bell + red badge,
functional), Help `?`, Avatar (initials, `ring-2 ring-white/20`).

**Target spec:**

- **Height:** bump to `h-16` (64px) to match GHL.
- **Background / diagonal:** keep the dark trapezoid + cyan diagonal. ✔ (good match).
- **"What's new" pill:** ADD a white rounded pill on the banner, left of the action
  cluster: `What's new [Automation Updates] •` with a small red dot (img 1/4/6).
- **Action cluster order (target):** Phone (green) · Ask AI (purple pill) · a
  broadcast/share icon with a **red dot** · Bell with an **amber dot** · `?` · Avatar.
  Reconcile current megaphone vs. the broadcast icon; keep both dots.
- **Left cluster:** the demo/tutorial toggle, Reset Demo, and Quick Add are demo chrome
  GHL has no equivalent for. Keep them (Reset Demo is required for demo behavior) but make
  them visually quiet so the white left region reads "empty" like GHL — e.g. move the mode
  toggle + Reset Demo into the user-avatar menu, leave only a subtle Quick Add.
- **Avatar initials:** seed current user shows `JA` today; screenshots show `CT`. Pick a
  **fictional** name whose initials read like the demo persona (do **not** use the real
  name from the screenshots). Initials are cosmetic.
- **Routes:** `Help` → `/guides` is fine; do not introduce `/appointments` (PR #23 smoke
  test forbids it). The functional notifications dropdown stays.

**Files to change:** `TopBar.tsx`; `src/data/seed.ts` (current-user name); `tokens.ts`
only if adding a token for the amber dot.

### 3.3 Main content shell

- `AppShell` `main` = `bg-surface-sunken`, scrollable. ✔ keep.
- **Module header pattern (GHL is intentionally split):**
  - **Dark-banner subnav** (white H1 + white tabs + white underline, connected to the
    topbar's dark banner): **Opportunities** (✔ already) and **Automation** (needs it).
  - **White subnav** (white strip, brand-underline tabs): **Conversations** (✔ already).
- Page padding: content area uses `px-5 pt-4` consistently (Opportunities already does).
  Apply the same to Automation once rebuilt.
- Responsive: keep the existing mobile drawer + `lg:` breakpoints in `AppShell`.

---

## 4. Conversations Blueprint

Maps to img 10–13. Files: `Conversations.tsx`, `components/{ConversationList, MessageThread,
Composer, ContactPanel}.tsx`, `utils.ts`. Already a strong 3-pane rebuild.

- **Module subnav (white strip):** `Conversations · Manual Actions · Snippets · Trigger
  Links · Analytics · Settings`. ✔ present; only the active `Conversations` tab is real,
  the rest are cosmetic toasts (acceptable, demo-safe).
- **Inbox left rail:** filter tabs `Unread · All · Recents · Starred` + `Select all`. ✔
- **Conversation list rows:** avatar `34px` with a small channel badge (sms/email/call/
  whatsapp), name (13–14px semibold), one-line preview (`text-ink-muted`, truncate),
  timestamp top-right, star toggle, unread count as an `18px` blue pill. Row height `~72px`,
  active row = white card with subtle border + shadow. Verify against img 10/13.
- **Thread header:** contact avatar + name + action icons (reply-channel, call, move-to-
  folder, star, mark-unread, delete) — img 12/13 top bar.
- **Message bubbles:** outbound = brand-tinted right-aligned; inbound = white/left. Date
  separators as centered chips (`Today`, `May 21`, `Yesterday`). ✔ verify.
- **Call cards (img 10/12):** card with a call icon + "Call completed", an audio player
  (play, scrubber, `0:00 / 0:24`, speed `1x`, volume, reload, download), and a `View
  Transcript` link. Requires a `Message` kind for calls (see §10).
- **System-event rows (img 10/12):** inline pill rows like `⤳ Opportunity {name} moved
  from {A} → {B}   Details   {date}` and `… updated → marked as open …`. Requires a
  `system_event` message kind (see §10). **This is a top gap.**
- **Composer:** channel selector (`SMS ▾`) + `Internal Comment` toggle; From/To phone
  selectors (SMS) or From Name + CC/BCC (Email); textarea; toolbar (emoji, attach, doc,
  lightning/snippets, tag, `$`, image, clear); char/seg counter; send split-button. ✔
  mostly present (`Composer.tsx`) — verify the full toolbar set.
- **Channel dropdown (img 11):** `SMS · WhatsApp · Email ✓ · — · Whatsapp Send Only ·
  Kleegr Whatsapp`. Verify the list matches; Email mode reveals From Name + CC/BCC.
- **Right panel — three modes via icon rail (TOP GAP):**
  - **Contact Details** (img 13): avatar, name, open-in-new, **Owner** (Unassigned) +
    **Followers** (avatars), **Tags** (+), tabs `All fields · DND · Actions`, "Search
    fields and folders", Contact section (First/Last name, Email, Phone w/ US flag, DOB,
    Contact source, Contact type). `ContactPanel.tsx` covers most — verify Followers + tabs.
  - **Activity** (img 12): timeline grouped by date — `Appointment booked`, `Appointment
    form submitted`, `Page visited`, each with `Source: …` + timestamp.
  - **Appointments** (img 10/11): `Upcoming · Past` toggle; empty state "No appointments
    yet / Keep things moving by creating your first appointment." + `Add Appointment`.
  - Add a **right icon rail** (contact, snippets, share, tasks, edit, calendar, doc, `$`,
    AI, clipboard) that switches the panel — present visually in img 10–13.
- **Dead buttons to fix:** subnav non-active tabs and right-rail icons should switch panels
  or toast, never no-op.
- **Data/model changes:** see §10 (Message kinds; `subject`; Conversation `subject`/
  `lastPreview`; activity events).
- **Files to change:** `MessageThread.tsx` (call cards + system events), `ContactPanel.tsx`
  → split into a right-panel host with Contact/Activity/Appointments tabs + icon rail,
  `Composer.tsx` (verify channels/toolbar), `utils.ts`, plus §10 type/seed changes.
- **Acceptance checklist:** ☐ three right panels switch via rail ☐ system-event rows render
  ☐ call cards w/ player + transcript ☐ channel dropdown matches img 11 ☐ unread pill is an
  18px blue pill ☐ no dead buttons ☐ Reset Demo restores threads.

---

## 5. Opportunities / Pipelines Blueprint

Maps to img 6/7/14/15/17/18/19. **Highest current fidelity (~85%).** Files:
`Opportunities.tsx`, `components/{OpportunityBoard, OpportunityCard, StageColumn,
PipelineSelect, PipelinesTable, CreatePipelineModal, OpportunityDetailModal, Overlay}.tsx`.

- **Header/banner:** dark `bg-banner` + white tabs `Opportunities · Pipelines · Bulk
  Actions`. ✔ matches.
- **Pipeline select + count:** `PipelineSelect` dropdown + `N opportunities` brand pill. ✔
  Pipeline dropdown (img 18) lists pipelines + `+ New pipeline`. ✔ — **rename seed
  pipelines** to `Kleegr Sales`, `Onboarding Process`, `Phone System`, `Archive` (§10).
- **Toolbar:** grid/list view toggle, `Import`, `Add opportunity` (brand), `⋮` menu
  (Export/Manage Fields/Pipeline settings). ✔
- **Saved views:** `Open opportunities` (active, brand underline) + `+ List`. ✔
- **Filters/Search:** `Advanced Filters (1)` (brand pill) + `Sort (1)` + `Search
  Opportunities` + `Manage Fields`. ✔ (filters cosmetic — acceptable).
- **Board columns (`StageColumn`):** width `296px`; header tint = **first stage green**
  (`#e7f6ee`/`#cdeede`), **rest tan** (`#fbf3e3`/`#f0e2c2`); header shows stage name (15px
  bold) + `N Opportunities  $total`; collapse chevron → vertical rail with count;
  per-column select-all in bulk mode; empty state "No opportunities" / "Drop here". ✔ All
  matches img 6/14/17.
- **Card (`OpportunityCard`):** rounded-lg, `border-line`, `shadow-card`; title (13px
  semibold) + owner avatar top-right; rows `Business Name:` / `Source:` / `Value:`;
  activity icon row (phone, sms, tag, doc, task, calendar) with brand count badges;
  selection checkbox top-right in bulk mode; drag via dnd-kit (distance-guarded click).
  Overlay card `w-[280px] rotate-1`. ✔
  - **Deltas:** (a) allow phone/sms icons to carry counts too (currently hardcoded 0) to
    match the denser badges in img 6/7. (b) `Business Name` currently derives from the
    contact's company; the edit modal (img 15/19) treats Business Name as an
    **opportunity field** — add `Opportunity.businessName` (§10) and render it directly.
    (c) seed `Source` should commonly read `Get started form` (§10).
- **Drag/drop:** dnd-kit move wired to `moveOpportunity`. ✔
- **Bulk selection (img 7):** `N opportunities selected` + `Edit` + `Delete`; column + card
  checkboxes. ✔ — **but `Edit`/`Delete` are cosmetic toasts.** Wire `Delete` to an in-memory
  remove (with Reset Demo restore) and `Edit` to a simple bulk-stage/owner change.
- **Pipelines table (`PipelinesTable`) + Create pipeline modal (`CreatePipelineModal`):**
  present. ✔ Keep create as in-memory/cosmetic.
- **Opportunity drawer/modal (img 15/19) — TOP GAP (~30%):** `OpportunityDetailModal` exists
  but Add/Edit are not truly wired. Target modal:
  - Left nav: `Opportunity Details · Book/Update Appointment · Tasks · Notes · Payments ·
    Associated Objects`.
  - **Contact details:** Primary Contact Name*, Primary Email, Primary Phone, Additional
    Contacts (Max: 10).
  - **Opportunity Details:** Opportunity Name*, Pipeline, Stage, Status (Open), Value (`$`),
    Owner, Followers, Business Name, Source, Tags, Client number (stepper).
  - Footer: `Add/Manage Fields`, delete (trash), Cancel, Update (brand). `Created By: Workflow`.
  - Wire `Update` to `updateOpportunity` and `Add opportunity` to `addOpportunity` (§10).
- **Required seed/stage changes:** rename pipeline → `Kleegr Sales`; stages → `New Lead,
  Called 1, Called 2, Called 3, Called 4, Contacted/Follow-Up` (§10).
- **Required store/type changes:** add `Opportunity.businessName`, `Opportunity.followers`,
  optional `activity` counts; add `addOpportunity` / `updateOpportunity` / bulk remove (§10).
- **Files to change:** `seed.ts`, `types/index.ts`, `useStore.ts`, `OpportunityCard.tsx`,
  `OpportunityDetailModal.tsx`, `Opportunities.tsx` (bulk actions).
- **Acceptance checklist:** ☐ stages read New Lead/Called 1–4/Follow-Up ☐ pipeline names
  match img 18 ☐ card shows Business Name + Source: Get started form ☐ edit modal saves via
  store ☐ Add opportunity creates an in-memory card ☐ bulk delete works + Reset restores.

---

## 6. Automations / Workflows Blueprint

Maps to img 1–5, 8, 9, 16. **Lowest fidelity (~35%) — biggest build.** Files:
`Automations.tsx`, `workflowNodes.ts`. Good primitives exist (node defs, trigger/action
catalogs, picker, node-settings modal) but the page shape is generic.

**Required structural change:** introduce a dark-banner subnav + sub-routes:

- Header: dark `bg-banner` + white H1 `Automation` + tabs `Workflows · Overview [Beta] ·
  Global Workflow Settings`. Suggest routes `/automations` (Workflows list),
  `/automations/overview`, `/automations/settings`. The PR #23 smoke test only requires
  `/automations` to exist — keep that as the default.

### 6.1 Workflows list (img 4/8)
- Buttons: `Create Folder`, `Build using AI` (purple), `Create Workflow` (brand) with a
  dropdown (img 8): `Start from Scratch · Build Using AI · Select from Template · Import
  from a campaign · Company based workflow · Urls based workflow`.
- Tabs: `All Workflows · Needs Review (1) · Deleted` + `+ New Smart List` + `Customize List`.
  `Advanced Filters` + view toggles + `Search`. Breadcrumb `Home`.
- **Table columns:** ☐(checkbox) `Name` · `Status` (Draft gray / Published green pill) ·
  `Total Enrolled` · `Active Enrolled` · `Last Updated` · `Created On` · `Stats(i)` ·
  `>` (open) · `⋮`.
- **Folders:** rows like `Archives`, `Stage Timing`, `Z.00 …` (fictional names) with a
  folder icon and only date columns. Requires `Workflow.isFolder`/`folderId` (§10).
- Current list (Card + pill tabs + single enrolled column) → replace with this table.

### 6.2 Builder canvas (img 2/3/5/9/16)
- **Full-bleed canvas**, not a 400px side card. Dotted radial grid (✔ pattern exists), zoom
  controls (`+ / − / 100% / fit`) bottom-left, **minimap** bottom-right, left **icon rail**
  (chat, check, chart, doc, share, search, clock, AI).
- **AI-first empty state (img 9):** centered card `What do you want to automate? BETA`, prompt
  textarea w/ mic + send, chips `Lead Nurturing · Form Automation · Email Campaigns · more`,
  `Or` divider, dashed `Add New Trigger`, connector, `END`.
- **Builder header (img 3):** `← Workflows list`, editable title (`Kleegr IVR ✏️`), tabs
  `Builder · Settings · Enrollment History · Execution Logs`, right: avatar, version icon,
  undo/redo, `Draft ⇄ Publish` toggle, `Saved`, `Test Workflow`; `Advanced Builder` dropdown.
- **Nodes:** trigger (top), action nodes (blue/green), **condition** nodes (purple Y-split),
  **branch** + **Go To** nodes, and `When none of the conditions are met / None` nodes; `+`
  add affordances on connectors; horizontal left→right branching with curved connectors.
  Current builder is a single vertical chain — extend `workflowNodes.ts` to support
  branches/conditions for at least one showcase workflow (e.g. an IVR).
- **Add Trigger / Actions as RIGHT DRAWERS (img 2/5/16):** drawer with search, `Triggers /
  Apps` (or `Actions / Apps`) tabs, **Recent** group, then grouped catalog (Contact: Birthday
  Reminder, Contact Changed/Created/DND/Tag, Custom Date Reminder, Note Added/Changed, Task
  Added…; Actions: Create Associated Record, Assign To User, Send Internal Notification, Log
  external call, Call, Create/Find/Update Contact, Add/Remove Tag…). Current picker is an
  inline panel — convert to a right drawer with Recent + Apps tab.

### 6.3 Overview dashboard (img 1)
- Three stat cards: `Total Workflows`, `Published Workflows`, `Total Enrollments` (`6.0K`).
- `Error Review Summary` panel (count + "Needs Review" button + a sample error row).
- `Workflow Enrollments — Last 7 Weeks` **line chart** (recharts is already a dep).
- `Trigger Analysis Filter` (Filter Type / is / Filter Value + date range) + three cards
  `Attempted / Matched / Unmatched Enrollments`.

### 6.4 Settings / logs / enrollment
- Keep cosmetic; rename "Logs" → `Execution Logs`, "Enrollment" → `Enrollment History` to
  match the builder tabs.

- **Files to change:** `Automations.tsx` (split into `AutomationOverview`, `WorkflowList`,
  `WorkflowBuilder`, `BuilderCanvas`, `TriggerActionDrawer`), `workflowNodes.ts`
  (branches/conditions), `src/App.tsx` (optional subroutes), `types/index.ts` + `seed.ts`
  (§10 workflow fields/folders).
- **Acceptance checklist:** ☐ dark-banner subnav ☐ Overview dashboard w/ chart ☐ workflow
  table w/ folders + Total/Active Enrolled + dates + Needs Review ☐ Create Workflow dropdown
  matches img 8 ☐ full-canvas builder w/ AI prompt + zoom + minimap ☐ trigger/action **right
  drawers** w/ Recent + grouped catalog ☐ all picks are demo-safe.

---

## 7. Contacts Blueprint

No dedicated screenshot (only the contact panel inside Conversations, img 13). Convention
level; deeper work needs a Contacts screenshot.

- Smart-list layout: header tabs/smart lists, bulk checkbox column, dense table (Name,
  Email, Phone, Tags, Created, Owner), filters, search.
- Contact drawer: mirror the Conversations Contact Details (Owner/Followers/Tags, All
  fields/DND/Actions). Add Contact modal already wired (`addContact`).
- **Missing exact GHL fields:** `followers`, `contactType` (Lead/Customer), DOB, `Contact
  source` label (`Kleegr Demo`). See §10.
- **Files to change:** `src/modules/contacts/Contacts.tsx` + `types/seed`.
- **Acceptance:** ☐ Add Contact works ☐ tags render ☐ no dead buttons. **Demo-critical: medium.**

---

## 8. Calendars Blueprint

No screenshot provided. Convention-level only.
- Month/week/agenda views; manage-calendar drawer; appointment cards colored by calendar;
  booking modal (`bookAppointment` exists); calendar selector; date-picker styling.
- **Files:** `src/modules/calendars/Calendars.tsx`. **Demo-critical: medium.**

---

## 9. Remaining Modules Blueprint

| Module | Match % (est.) | Top changes | Files | Demo-critical |
|---|--:|---|---|--:|
| Dashboard | 55% | GHL widget grid: KPI tiles, pipeline funnel, lead-source donut, revenue + lead-volume charts, activity feed, tasks-due, upcoming appts | `modules/dashboard/Dashboard.tsx` | High |
| Tasks | 50% | Smart-list table, due-date grouping, priority chips, `toggleTask` wired | `modules/tasks/Tasks.tsx` | Medium |
| Payments | 45% | Invoices table (number/contact/status/total), products, subscriptions tabs | `modules/payments/Payments.tsx` | Medium |
| Phone | 40% | Move out of main rail; dialer + call log + voicemail transcripts | `modules/phone/Phone.tsx` | Low |
| Reputation | 50% | Reviews list (Google/Facebook), star filters, reply composer | `modules/reputation/Reputation.tsx` | Medium |
| Marketing | 45% | Email/SMS campaign lists, metrics cards, builder stub | `modules/marketing/Marketing.tsx` | Medium |
| Reporting | 45% | Dashboards w/ recharts; attribution; agent leaderboard | `modules/reporting/Reporting.tsx` | Medium |
| Sites | 40% | Funnels/websites/forms cards grid | `modules/sites/Sites.tsx` | Low |
| Integrations | 40% | Rebrand to **App Marketplace** grid of connectable apps (cosmetic) | `modules/integrations/Integrations.tsx` | Low |
| Settings | 50% | Left settings nav + sections; cosmetic forms | `modules/settings/Settings.tsx` | Medium |
| Media | 40% | Media library grid + upload (cosmetic) | `modules/media/Media.tsx` | Low |
| Guides | n/a | Help/tutorials hub reachable from `?` | `modules/guides/Guides.tsx` | Low |

---

## 10. Data / Store / Types Blueprint

> Every change is in-memory; `resetDemo()` must restore. **Never seed real PII** — use the
> existing fictional generators in `seed.ts`.

| Area | File | Change | Why it matters | Risk |
|---|---|---|---|---|
| Pipelines | `seed.ts` | Rename `Sales Pipeline`→`Kleegr Sales`; add `Onboarding Process`, `Phone System`, `Archive` | Matches img 18 dropdown | Low |
| Stages | `seed.ts` | `Kleegr Sales` stages → `New Lead, Called 1, Called 2, Called 3, Called 4, Contacted/Follow-Up` | Matches board columns img 6/14 | Low |
| Opportunity fields | `types/index.ts`, `seed.ts` | Add `businessName: string`, `followers: ID[]`, optional `activity:{calls,sms,tags,notes,tasks,appts}` | Card rows + edit modal img 15/19 | Med |
| Sources | `seed.ts` | Add/prefer `Get started form` | Recurring card Source value | Low |
| Opportunity actions | `useStore.ts` | Add `addOpportunity`, `updateOpportunity`, bulk `removeOpportunities` | Add/Edit/Bulk are currently cosmetic | Med |
| Workflow fields | `types/index.ts`, `seed.ts` | Add `isFolder?`/`folderId?`, `activeEnrolled`, `lastUpdatedAt`, `createdAt`, `needsReview?` | Workflow list columns + folders img 4 | Med |
| Workflow seed | `seed.ts` | Add 2–3 folders + dates + 1 `needsReview` | Matches img 4/8 | Low |
| Workflow nodes | `workflowNodes.ts` | Add condition/branch/goto/none node kinds + 1 branching showcase | Advanced canvas img 3 | High |
| Message kinds | `types/index.ts`, `seed.ts` | `Message.kind: 'message'\|'internal_note'\|'call'\|'system_event'`; add `subject?`, `callDurationSec?`, `transcript?` | Call cards + system events img 10/12 | Med |
| Conversation | `types/index.ts`, `seed.ts` | Add `subject?`, `lastPreview?` | Email subjects + list previews | Low |
| Activity events | `types/index.ts`, `seed.ts` | Add `activity` events (booked/form/page-visited + Source) per contact | Activity panel img 12 | Med |
| Contact | `types/index.ts`, `seed.ts` | Add `followers: ID[]`, `contactType`, `dateOfBirth?`; `source` label `Kleegr Demo` | Contact panel img 13 | Low |
| Current user | `seed.ts` | Rename current user to a **fictional** name (cosmetic initials) | Topbar avatar | Low |
| PII fix | `Conversations.tsx` | Replace hardcoded `'Naftuli Horowitz'` fallback w/ fictional default | Removes real name from code | **Required** |
| Sidebar token | `tokens.ts` | `sidebar` token says white but component hardcodes dark navy — fix the comment/value or tokenize the dark navy | Removes misleading token | Low |
| Nav labels | `nav.ts` | Add missing entries (§3.1) | Sidebar parity | Med |

---

## 11. PR Strategy

> The brief listed PRs #27/#28/#29 + branch `w1/automations-screenshot-fidelity`.
> **Verified: those are not open.** The actual open PRs are #21 and #23.

| PR | Scope | Recommendation | Reason |
|---|---|---|---|
| **#23** Release safety (CI, smoke, checklist, lockfile) | `.github/workflows/ci.yml`, `scripts/smoke-routes.mjs`, `docs/release-checklist.md`, `package.json` | **Merge first** | Foundational; no `src/**`; its smoke test + no-PII checklist protect all later work. Watch: any new nav route must be added to `App.tsx` or smoke fails. |
| **#21** Docs reality audit `[Dev 26]` | `docs/project-current-status.md` | **Merge** (docs-only) | Useful context; no file overlap with this blueprint. Slight content overlap — keep both; this blueprint is the *forward* spec. |
| **This** GHL fidelity blueprint | `docs/ghl-fidelity-blueprint.md` | **Merge after #23** | Docs-only; spec for all builders. |
| #27 / #28 / #29 / `w1/automations-screenshot-fidelity` | — | **Closed/absent — confirm** | Re-check `state=all`; if they were merged, their work is already in `main` (Conversations/Opportunities being well-built is consistent with that). Do not assume. |

- **Merge order:** #23 → this blueprint → #21 (the two docs in any order).
- **Conflicts to watch:** future shell PRs vs. everything (touch `nav.ts`/`Sidebar`/`TopBar`);
  seed/types PRs vs. every module. Land §3 + §10 before fanning out.

---

## 12. Developer Work Plan (copy-ready)

Each block is a self-contained prompt. **Every block:** edit only the files listed; never
touch real PII; keep all behavior in-memory; ensure `npm run build` and `npm run smoke`
pass; attach the listed screenshots to the task.

### Developer #38 — Shell Fidelity
- **Scope:** §3. Sidebar background → dark navy, remove group-label text, add missing nav
  entries (cosmetic routes/toasts, no dead links), icon swaps; TopBar height 64px, "What's
  new" pill, action-cluster dots, quiet the demo chrome; fictional current-user.
- **Files owned:** `nav.ts`, `Sidebar.tsx`, `TopBar.tsx`, `AppShell.tsx`, `App.tsx` (new
  routes only), `seed.ts` (current-user name only), `tokens.ts` (sidebar token note).
- **Forbidden:** module internals; opportunity/conversation/automation files.
- **Screenshots:** 1, 4, 6, 14. **Acceptance:** §3 checklists; smoke passes.
- **Auto-merge:** no — visual review required.

### Developer #39 — Data & Types Foundation
- **Scope:** §10 (all). Pipeline/stage/source renames; Opportunity/Workflow/Message/
  Conversation/Contact field additions; new store actions; PII fallback fix.
- **Files owned:** `types/index.ts`, `data/seed.ts`, `store/useStore.ts`, the one-line fix
  in `Conversations.tsx`.
- **Forbidden:** UI/layout files beyond that one fix.
- **Screenshots:** 4, 6, 10, 12, 13, 15. **Acceptance:** §10 table; build passes; Reset restores.
- **Auto-merge:** no — blocks downstream; review for contract correctness.

### Developer #40 — Opportunities Polish + Edit Modal
- **Scope:** §5 deltas. Render `businessName`/denser badges; wire Add/Edit via store; wire
  bulk Edit/Delete; confirm pipeline dropdown names.
- **Files owned:** `modules/opportunities/**`.
- **Forbidden:** shell; types/seed/store (consume #39's contracts).
- **Depends on:** #39. **Screenshots:** 6, 7, 15, 17, 18, 19.
- **Acceptance:** §5 checklist. **Auto-merge:** no.

### Developer #41 — Conversations Right Panels + Thread Events
- **Scope:** §4. Right-panel host with Contact/Activity/Appointments + icon rail;
  system-event rows + call cards in thread; verify channel dropdown/composer toolbar.
- **Files owned:** `modules/conversations/**`.
- **Forbidden:** shell; types/seed/store (consume #39's contracts).
- **Depends on:** #39. **Screenshots:** 10, 11, 12, 13.
- **Acceptance:** §4 checklist. **Auto-merge:** no.

### Developer #42 — Automation Rebuild (largest; split if needed)
- **Scope:** §6. Dark-banner subnav; Overview dashboard (recharts); workflow table w/ folders
  + Total/Active Enrolled + dates + Needs Review; Create Workflow dropdown; full-canvas
  builder (AI prompt, zoom, minimap, branching nodes); trigger/action right drawers.
- **Files owned:** `modules/automations/**`, `App.tsx` (optional subroutes).
- **Forbidden:** shell; other modules; types/seed/store beyond §10 workflow fields.
- **Depends on:** #39 (workflow fields). **Screenshots:** 1, 2, 3, 4, 5, 8, 9, 16.
- **Acceptance:** §6 checklist. **Auto-merge:** no.

### Developer #43 — Remaining Modules + Dashboard (optional, parallel)
- **Scope:** §9 per-module top changes (Dashboard first — demo-critical).
- **Files owned:** the specific `modules/*` file per task (one module per task).
- **Depends on:** #38/#39. **Auto-merge:** no.

---

## 13. Acceptance Criteria for "Close Enough"

- **Visual similarity target:** a GHL-familiar viewer recognizes each rebuilt screen as "a
  GHL-style portal" at a glance; shell, Opportunities, Conversations, and Automation reach
  ≥ 85% layout match to their screenshots.
- **No dead buttons:** every visible control either performs an in-memory action, switches a
  panel/tab, or shows an explicit demo toast. No silent no-ops; no `NavLink` to a
  nonexistent route.
- **Route behavior:** all routes in `App.tsx` resolve; no `/appointments`; deep links work
  via the `vercel.json` SPA rewrite.
- **Reset Demo:** restores the exact seed, discarding sent messages, moved/added/edited
  opportunities, toggled tasks, etc.
- **Fake data safety:** zero real names/emails/phones in seed, code, comments, or committed
  assets (PR #23 checklist item).
- **Build:** `npm ci` clean against the lockfile; `npm run build` (tsc + vite) green.
- **Preview/Production:** PR preview loads with no blank screen / console errors; production
  keeps serving `main` (per PR #21).

---

## 14. Risks and Warnings

- **Cannot legally copy:** GHL logos, marketing/UI copy, exported CSS, GHL icon SVGs,
  GHL screenshots-as-assets, real customer data, real integrations. We replicate
  *layout/IA conventions* with Kleegr branding + Lucide icons + our own tokens only.
- **Protected files that must be opened up to match screenshots:** the brief lists `src/**`,
  `package.json`, configs, `vercel.json` as untouchable **for this docs PR** — correct, this
  PR changes only `docs/`. But the *build* work in §12 necessarily edits `src/**` (shell,
  modules, seed, types, store) and may add routes to `App.tsx`. Those edits belong to the
  per-developer PRs in §12, not here, and must respect PR #23's smoke test.
- **`nav.ts` + seed are shared chokepoints:** controlled, sequenced edits only (§3, §10 land
  first) or parallel UI PRs will conflict.
- **Broad "UI cleanup" PRs will collide** with the targeted module PRs — keep each developer
  to the files they own.
- **Attach screenshots to every fidelity task.** "Match %" and exact specs are meaningless
  without the reference image in the task; the brief's own (incorrect) PR list is the
  cautionary example — always verify against source + screenshots, never a prior report.
