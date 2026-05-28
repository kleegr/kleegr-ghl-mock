# `data-tour` Attribute Registry

Single source of truth for every `data-tour` key used across the Kleegr mock GoHighLevel platform.
The Tutorial engine (Wave 3) uses these stable attributes to locate DOM elements for spotlight
overlays and guided walkthroughs. **Do not use fragile CSS classes or nth-child selectors as
tutorial targets.**

---

## 1. Purpose

GoHighLevel's Tutorial Mode (modelled on [Arcade](https://www.arcade.software/)) needs to reliably
find elements after navigation, scroll, and resize events. A `data-tour` attribute attached to a
stable semantic element is the only safe way to do that.

- **Stable:** survives Tailwind class changes, DOM restructuring, and Vite HMR.
- **Explicit:** the registry is the contract between module authors and the Tutorial engine.
- **Typed:** `src/tutorials/registry.ts` exports a `TourKey` union type — IDE autocomplete
  prevents typos when writing tutorial configs.

---

## 2. Naming Convention

All keys follow the pattern:

```
area.element
```

| Part | Rule | Example |
|------|------|---------|
| `area` | Lowercase module name | `contacts` |
| `element` | camelCase description of the element | `addButton` |
| Separator | Single period `.` | `contacts.addButton` |

### Examples

| Key | Target element |
|-----|----------------|
| `contacts.addButton` | The "+ Add Contact" primary CTA |
| `conversations.composer` | The reply text area in the inbox |
| `opportunities.moveCard` | The drag handle / simulated drop target on a pipeline card |
| `topbar.resetDemo` | The Reset Demo button in the top bar |

### Prohibited patterns

```tsx
// ❌ Never use class names as targets
document.querySelector('.bg-brand.rounded-lg');

// ❌ Never use nth-child
document.querySelector('ul > li:nth-child(3)');

// ❌ Never use generated IDs
document.querySelector('#radix-panel-32');

// ✅ Always use data-tour
document.querySelector('[data-tour="contacts.addButton"]');
```

---

## 3. Module Agent Instructions

Each Wave agent owns their module files. Here is what you must do:

1. **Read `src/tutorials/registry.ts`** to find every key assigned to your area.
2. **Add `data-tour={key}` to the correct element** in your module JSX. One element per key.
3. **Use the exact key string** — copy it from the registry; do not invent variations.
4. **Target stable, semantically meaningful elements** — the main page wrapper, CTAs, modals,
   tables, and key interactive elements. Do not add `data-tour` to purely decorative elements,
   tooltips, or loading skeletons.
5. **Do not edit `src/tutorials/registry.ts`** unless you are assigned to do so.
6. **Do not break existing `data-tour` attributes** already placed by earlier agents.

### Which elements to tag

| Add `data-tour` | Skip |
|-----------------|------|
| Page root wrappers | Decorative icons |
| Primary CTA buttons | Loading/skeleton states |
| Modal/drawer containers | Tooltip triggers |
| Form submit buttons | Purely layout divs |
| Table/list containers | Individual cell content |
| Filter/toggle controls | Hover states |

---

## 4. Required V1 Tutorials

These 10 tutorials must be fully functional before Wave 3 ships. Each depends on the `data-tour`
keys listed beside it.

| # | Tutorial ID | Key selectors needed |
|---|-------------|---------------------|
| 1 | `add-contact` | `contacts.addButton`, `contacts.addModal`, `contacts.addSubmit`, `contacts.table`, `contacts.row` |
| 2 | `reply-to-conversation` | `conversations.threadItem`, `conversations.thread`, `conversations.composer`, `conversations.sendButton` |
| 3 | `move-pipeline-lead` | `opportunities.board`, `opportunities.card`, `opportunities.moveCard`, `opportunities.stageColumn` |
| 4 | `book-appointment` | `calendars.bookButton`, `calendars.bookModal`, `calendars.bookSubmit`, `calendars.appointmentChip` |
| 5 | `create-workflow` | `automations.addButton`, `automations.canvas`, `automations.triggerNode`, `automations.addNodeButton`, `automations.publishToggle` |
| 6 | `view-campaign-performance` | `marketing.emailList`, `marketing.emailRow`, `marketing.emailDetail`, `marketing.emailMetrics` |
| 7 | `send-review-request` | `reputation.sendRequestButton`, `reputation.requestModal`, `reputation.requestContactPicker`, `reputation.requestChannelToggle`, `reputation.requestSubmit` |
| 8 | `check-missed-calls` | `phone.callLog`, `phone.missedCallFilter`, `phone.callRow`, `phone.callDetail` |
| 9 | `create-invoice` | `payments.createButton`, `payments.invoiceModal`, `payments.invoiceClientPicker`, `payments.invoiceLineItems`, `payments.invoiceSend` |
| 10 | `view-outlook-inbox` | `integrations.outlookCard`, `integrations.connectButton`, `integrations.connectModal`, `integrations.connectConfirm`, `integrations.outlookInbox` |

**Note on tutorial 7 (send-review-request):** the `reputation.requestChannelToggle` key is required
for the branching step (SMS vs Email) documented in §18 of the product plan.

---

## 5. Key Tables by Area

### TopBar

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `topbar` | Entire `<header>` bar | ✅ | — |
| `topbar.accountSwitcher` | Demo account switcher button | ✅ | — |
| `topbar.search` | Global search button | ✅ | — |
| `topbar.notifications` | Notification bell button | ✅ | — |
| `topbar.quickAdd` | Quick-add (+) menu button | — | — |
| `topbar.modeToggle` | Demo / Tutorial mode toggle | ✅ | — |
| `topbar.resetDemo` | Reset Demo button | ✅ | — |
| `topbar.guides` | Guides launcher button | ✅ | — |
| `topbar.userMenu` | User avatar / menu button | ✅ | — |
| `topbar.mobileNav` | Mobile hamburger button | ✅ | — |

> **Status:** `topbar`, `topbar.accountSwitcher`, `topbar.search`, `topbar.modeToggle`,
> `topbar.resetDemo`, `topbar.guides`, `topbar.notifications`, `topbar.userMenu` are **already
> placed** in `src/components/shell/TopBar.tsx` (Wave 0).

---

### Dashboard

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `dashboard.page` | Root `<div>` of Dashboard | ✅ | — |
| `dashboard.kpis` | KPI cards `<section>` | ✅ | — |
| `dashboard.kpi.pipelineValue` | Pipeline value KPI card | ✅ | — |
| `dashboard.kpi.openOpps` | Open opportunities KPI | — | — |
| `dashboard.kpi.newContacts` | New contacts KPI | — | — |
| `dashboard.kpi.unreadConvs` | Unread conversations KPI | — | — |
| `dashboard.kpi.upcomingAppts` | Upcoming appointments KPI | — | — |
| `dashboard.kpi.revenue` | Revenue collected KPI | — | — |
| `dashboard.kpi.tasksDue` | Open tasks KPI | — | — |
| `dashboard.kpi.reviews` | Avg review rating KPI | — | — |
| `dashboard.pipelineChart` | Pipeline by stage bar chart | ✅ | — |
| `dashboard.leadSources` | Lead sources donut chart | ✅ | — |
| `dashboard.revenueChart` | Revenue by month bar chart | — | — |
| `dashboard.leadTrend` | Lead volume line chart | — | — |
| `dashboard.activity` | Recent activity feed card | ✅ | — |
| `dashboard.tasksDue` | Tasks due card | ✅ | — |
| `dashboard.appointments` | Upcoming appointments card | ✅ | — |
| `dashboard.onboardingChecklist` | Getting-started checklist card | ✅ | `add-contact`, `reply-to-conversation`, `move-pipeline-lead`, `book-appointment`, `create-invoice` |

> **Status:** All dashboard keys are **already placed** in
> `src/modules/dashboard/Dashboard.tsx` (Wave 1, `w1/dashboard-module` branch).

---

### Contacts

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `contacts.page` | Root `<div>` of Contacts page | ✅ | `add-contact` |
| `contacts.addButton` | "+ Add Contact" button | ✅ | `add-contact` |
| `contacts.search` | Search input field | ✅ | `add-contact` |
| `contacts.smartLists` | Smart List tabs | ✅ | `add-contact` |
| `contacts.filters` | Filter bar | ✅ | `add-contact` |
| `contacts.table` | Contacts data table | ✅ | `add-contact` |
| `contacts.row` | Single contact table row | ✅ | `add-contact` |
| `contacts.detail` | Contact detail page/drawer | ✅ | `add-contact` |
| `contacts.detailTabs` | Contact detail tab bar | ✅ | `add-contact` |
| `contacts.addModal` | Add Contact modal | ✅ | `add-contact` |
| `contacts.addSubmit` | Save button inside modal | ✅ | `add-contact` |

---

### Conversations

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `conversations.page` | Root `<div>` of Conversations page | ✅ | `reply-to-conversation` |
| `conversations.inbox` | Three-pane inbox container | ✅ | `reply-to-conversation` |
| `conversations.filters` | Channel tabs / filter bar | ✅ | `reply-to-conversation` |
| `conversations.list` | Conversation list pane | ✅ | `reply-to-conversation` |
| `conversations.threadItem` | Single thread preview item | ✅ | `reply-to-conversation` |
| `conversations.thread` | Open thread / message view | ✅ | `reply-to-conversation` |
| `conversations.composer` | Reply text composer | ✅ | `reply-to-conversation` |
| `conversations.sendButton` | Send button | ✅ | `reply-to-conversation` |
| `conversations.contactContext` | Right-pane contact context | ✅ | `reply-to-conversation` |

---

### Opportunities

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `opportunities.page` | Root `<div>` of Opportunities page | ✅ | `move-pipeline-lead` |
| `opportunities.pipelineSelector` | Pipeline selector dropdown | ✅ | `move-pipeline-lead` |
| `opportunities.viewToggle` | Board / List toggle | ✅ | `move-pipeline-lead` |
| `opportunities.board` | Kanban board container | ✅ | `move-pipeline-lead` |
| `opportunities.stageColumn` | Stage column (per column) | ✅ | `move-pipeline-lead` |
| `opportunities.card` | Opportunity card | ✅ | `move-pipeline-lead` |
| `opportunities.moveCard` | Drag handle / simulated drop target | ✅ | `move-pipeline-lead` |
| `opportunities.detail` | Opportunity detail modal/drawer | ✅ | `move-pipeline-lead` |
| `opportunities.list` | List view table | — | — |

---

### Calendars

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `calendars.page` | Root `<div>` of Calendars page | ✅ | `book-appointment` |
| `calendars.bookButton` | "Book Appointment" CTA | ✅ | `book-appointment` |
| `calendars.selector` | Calendar filter dropdown | ✅ | `book-appointment` |
| `calendars.viewToggle` | Month/Week/Day/Agenda toggle | ✅ | `book-appointment` |
| `calendars.monthGrid` | Month grid container | ✅ | `book-appointment` |
| `calendars.weekView` | Week/day time-grid | — | — |
| `calendars.agenda` | Agenda list | — | — |
| `calendars.appointmentChip` | Appointment event chip | ✅ | `book-appointment` |
| `calendars.appointmentDetail` | Appointment detail modal | ✅ | `book-appointment` |
| `calendars.bookModal` | Booking modal | ✅ | `book-appointment` |
| `calendars.bookSubmit` | Confirm booking button | ✅ | `book-appointment` |

---

### Tasks

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `tasks.page` | Root `<div>` of Tasks page | ✅ | — |
| `tasks.addButton` | "+ Add Task" button | ✅ | — |
| `tasks.summary` | Summary counts bar | — | — |
| `tasks.filters` | Filter controls | ✅ | — |
| `tasks.list` | Task list container | ✅ | — |
| `tasks.groupedList` | Grouped-by-date list | — | — |
| `tasks.row` | Single task row | ✅ | — |
| `tasks.toggle` | Complete/incomplete checkbox | ✅ | — |
| `tasks.detail` | Task detail modal | — | — |
| `tasks.addModal` | Add Task modal | ✅ | — |
| `tasks.addSubmit` | Save button in modal | ✅ | — |

---

### Automations

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `automations.page` | Root `<div>` of Automations page | ✅ | `create-workflow` |
| `automations.list` | Workflow list table | ✅ | `create-workflow` |
| `automations.row` | Single workflow row | ✅ | `create-workflow` |
| `automations.addButton` | Create workflow button | ✅ | `create-workflow` |
| `automations.canvas` | Flow builder canvas | ✅ | `create-workflow` |
| `automations.triggerNode` | Trigger node | ✅ | `create-workflow` |
| `automations.actionNode` | Action node | ✅ | `create-workflow` |
| `automations.addNodeButton` | Add node (+) button | ✅ | `create-workflow` |
| `automations.nodeDrawer` | Node settings drawer | ✅ | `create-workflow` |
| `automations.publishToggle` | Publish/Draft toggle | ✅ | `create-workflow` |

---

### Marketing

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `marketing.emailPage` | Root `<div>` of Email Campaigns | ✅ | `view-campaign-performance` |
| `marketing.emailList` | Email campaign list/table | ✅ | `view-campaign-performance` |
| `marketing.emailRow` | Single email campaign row | ✅ | `view-campaign-performance` |
| `marketing.emailDetail` | Campaign detail/analytics page | ✅ | `view-campaign-performance` |
| `marketing.emailMetrics` | Open/click/bounce metrics section | ✅ | `view-campaign-performance` |
| `marketing.smsPage` | Root `<div>` of SMS Campaigns | — | — |
| `marketing.smsList` | SMS campaign list | — | — |
| `marketing.smsRow` | Single SMS campaign row | — | — |
| `marketing.smsDetail` | SMS campaign detail page | — | — |
| `marketing.smsMetrics` | Delivered/reply/opt-out metrics | — | — |

---

### Reputation

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `reputation.page` | Root `<div>` of Reputation page | ✅ | `send-review-request` |
| `reputation.overview` | Rating overview section | ✅ | `send-review-request` |
| `reputation.reviewsList` | Reviews list/table | ✅ | `send-review-request` |
| `reputation.reviewRow` | Single review row | ✅ | `send-review-request` |
| `reputation.sendRequestButton` | "Send Review Request" CTA | ✅ | `send-review-request` |
| `reputation.requestModal` | Review request modal | ✅ | `send-review-request` |
| `reputation.requestContactPicker` | Contact picker in modal | ✅ | `send-review-request` |
| `reputation.requestChannelToggle` | SMS/Email channel toggle | ✅ | `send-review-request` |
| `reputation.requestSubmit` | Send button in modal | ✅ | `send-review-request` |
| `reputation.replyModal` | Reply to review modal | — | — |

---

### Phone

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `phone.page` | Root `<div>` of Phone page | ✅ | `check-missed-calls` |
| `phone.callLog` | Call log table | ✅ | `check-missed-calls` |
| `phone.callRow` | Single call log row | ✅ | `check-missed-calls` |
| `phone.missedCallFilter` | Missed calls filter/tab | ✅ | `check-missed-calls` |
| `phone.dialerButton` | Open dialer button | — | — |
| `phone.dialer` | Dialer number pad | — | — |
| `phone.dialerInput` | Number display/input | — | — |
| `phone.dialerCall` | Call button | — | — |
| `phone.voicemailList` | Voicemail list | — | — |
| `phone.voicemailRow` | Voicemail row | — | — |
| `phone.callDetail` | Call detail page | ✅ | `check-missed-calls` |
| `phone.recordingPlayer` | Recording player UI | — | — |

---

### Payments

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `payments.page` | Root `<div>` of Payments page | ✅ | `create-invoice` |
| `payments.invoiceList` | Invoices table | ✅ | `create-invoice` |
| `payments.invoiceRow` | Single invoice row | ✅ | `create-invoice` |
| `payments.createButton` | "Create Invoice" CTA | ✅ | `create-invoice` |
| `payments.invoiceModal` | Invoice builder modal | ✅ | `create-invoice` |
| `payments.invoiceClientPicker` | Contact selector | ✅ | `create-invoice` |
| `payments.invoiceLineItems` | Line items section | ✅ | `create-invoice` |
| `payments.invoiceAddLine` | Add line item button | ✅ | `create-invoice` |
| `payments.invoiceTotals` | Subtotal/tax/total section | ✅ | `create-invoice` |
| `payments.invoiceSend` | Send invoice button | ✅ | `create-invoice` |
| `payments.invoiceDetail` | Invoice detail page | ✅ | `create-invoice` |
| `payments.transactionList` | Transactions table | — | — |

---

### Integrations

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `integrations.page` | Root `<div>` of Integrations page | ✅ | `view-outlook-inbox` |
| `integrations.outlookCard` | Outlook integration card | ✅ | `view-outlook-inbox` |
| `integrations.connectButton` | "Connect" button on card | ✅ | `view-outlook-inbox` |
| `integrations.connectModal` | Mock OAuth consent modal | ✅ | `view-outlook-inbox` |
| `integrations.connectConfirm` | Allow/confirm button in modal | ✅ | `view-outlook-inbox` |
| `integrations.outlookInbox` | Outlook-style inbox view | ✅ | `view-outlook-inbox` |
| `integrations.outlookFolders` | Folder list pane | ✅ | `view-outlook-inbox` |
| `integrations.outlookList` | Message list pane | ✅ | `view-outlook-inbox` |
| `integrations.outlookThread` | Reading pane | ✅ | `view-outlook-inbox` |

---

### Guides

| Key | Intended element | V1 required? | Related tutorial |
|-----|-----------------|:------------:|------------------|
| `guides.page` | Root `<div>` of /guides | ✅ | — |
| `guides.launcher` | Tutorial launcher container | ✅ | — |
| `guides.list` | Tutorial card list/grid | ✅ | — |
| `guides.card` | Single tutorial card | ✅ | — |
| `guides.startButton` | Start tutorial button | ✅ | — |
| `guides.progressBar` | Overall progress bar | ✅ | — |
| `guides.completionCard` | Completion screen card | ✅ | — |

---

## 6. Guardrails

This file and `src/tutorials/registry.ts` are **documentation and types only**.

- ❌ No Tutorial engine implementation (overlays, coachmarks, spotlight) — that is Wave 3.
- ❌ No module edits — each module agent adds `data-tour` attributes only in their own files.
- ❌ No backend, no database, no API calls.
- ❌ No real GoHighLevel integration.
- ❌ No real CRM, email, SMS, phone, calendar, or payment behavior.
- ❌ No real customer data or PII.
- ❌ No new npm dependencies introduced by this task.

---

## 7. Already-Placed Keys (do not duplicate)

These keys were placed by earlier Wave agents and are already live on `main`:

**TopBar** (`src/components/shell/TopBar.tsx`):
`topbar`, `topbar.accountSwitcher`, `topbar.search`, `topbar.modeToggle`, `topbar.resetDemo`,
`topbar.guides`, `topbar.notifications`, `topbar.userMenu`

**Sidebar** (`src/components/shell/nav.ts` — used as `tour` prop):
`nav.dashboard`, `nav.conversations`, `nav.contacts`, `nav.opportunities`, `nav.calendars`,
`nav.marketing`, `nav.automations`, `nav.sites`, `nav.reputation`, `nav.reporting`,
`nav.payments`, `nav.phone`, `nav.tasks`, `nav.integrations`, `nav.media`, `nav.settings`,
`nav.guides`

**Dashboard** (`src/modules/dashboard/Dashboard.tsx` — `w1/dashboard-module` branch):
`dashboard.page`, `dashboard.kpis`, `dashboard.kpi.pipelineValue`, `dashboard.kpi.openOpps`,
`dashboard.kpi.newContacts`, `dashboard.kpi.unreadConvs`, `dashboard.kpi.upcomingAppts`,
`dashboard.kpi.revenue`, `dashboard.kpi.tasksDue`, `dashboard.kpi.reviews`,
`dashboard.pipelineChart`, `dashboard.leadSources`, `dashboard.revenueChart`,
`dashboard.leadTrend`, `dashboard.activity`, `dashboard.tasksDue`, `dashboard.appointments`,
`dashboard.onboardingChecklist`
