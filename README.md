# Kleegr — Business Platform (Mock GHL Demo)

A polished, **front-end-only** demo platform styled after a GoHighLevel sub-account, with **Kleegr** branding layered in. Built for sales demos, onboarding walkthroughs, and self-guided prospect exploration.

> ⚠️ **This is a mockup.** There is **no backend, no real APIs, and no integrations.** Nothing connects to GoHighLevel, email, SMS, phone, calendars, CRMs, or payment processors. All data is **fake, seeded, and in-memory** — it resets on refresh (or via the **Reset Demo** button). All emails use `@example.com`.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (token-driven theme via CSS variables)
- **React Router** for navigation
- **Zustand** for in-memory state
- **Recharts** for charts, **@dnd-kit** for the drag-and-drop pipeline, **lucide-react** for icons

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## What's inside

A GHL-style **app shell** (collapsible dark sidebar + top bar with global search, quick-add, notifications, account switcher, and a Demo/Tutorial mode toggle) wrapping these screens:

**Interactive modules:** Dashboard (KPIs + charts), Conversations (multi-channel inbox with reply), Contacts (table, filters, add-contact, detail drawer), Opportunities (drag-and-drop Kanban), Calendars (month grid + booking).

**Starter modules:** Marketing (Email & SMS), Automations, Sites & Funnels, Reputation, Reporting, Payments, Phone, Tasks, Integrations, Media, Settings, and a Guides launcher for the 10 core tutorials.

## Branding

All brand values live in [`src/theme/tokens.ts`](src/theme/tokens.ts) and are injected as CSS variables, so the whole app re-themes from one file.

> The current palette, font, and logo are **placeholders**. They must be replaced with Kleegr's verified brand tokens (see the plan in [`docs/`](docs/) for the extraction method).

## Project plan

The full product plan lives at [`docs/kleegr-mock-ghl-plan.md`](docs/kleegr-mock-ghl-plan.md).
