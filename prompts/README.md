# Kleegr Mock GHL Platform — Prompt Library

This directory contains structured prompt templates for generating the fake data, tutorial scripts, conversation threads, and demo copy used by the Kleegr mock GoHighLevel demo platform.

## Purpose

All seed content in `src/data/seed.ts` was authored using templates like these. Maintainers use these prompts to:

1. **Regenerate seed data** — run a prompt in any LLM, paste the JSON output into `seed.ts`, rebuild.
2. **Author tutorial step arrays** — generate a typed `TutorialDef.plannedSteps` array for a new tutorial.
3. **Simulate conversations** — populate realistic multi-turn thread data for the Conversations inbox.
4. **Create demo scripts** — generate per-module talking points for Kleegr sales reps.

## Operating Model — V1 (Offline / Manual)

All prompts run **outside the app** in any LLM tool (Claude, ChatGPT, Gemini, etc.). Output is pasted directly into the relevant seed or config file and committed.

> **Future (Model B):** A staff-only in-app panel may run these prompts live via the Anthropic API (`claude-sonnet-4-20250514`). See plan §10. Not built in V1.

## Files

| File | Purpose | Output target |
|---|---|---|
| `fake-data-generation.md` | Contacts, companies, pipelines, invoices, reviews, workflows | `src/data/seed.ts` |
| `tutorial-script-generation.md` | Step arrays for tutorial configs | `src/modules/guides/tutorialDefs.ts` |
| `conversation-simulation.md` | Multi-turn inbox threads | `src/data/seed.ts` (conversations/messages) |
| `demo-script-generation.md` | Per-module rep talking points | Future `DemoScriptPanel` component |

## Universal Guardrails

Every prompt in this library must enforce the following:

- **Fake data only** — no real PII, no real businesses, no real customers.
- **`@example.com` emails always** — never real email domains.
- **Fictional phone numbers** — format `+1 (555) XXX-XXXX` with clearly demo-safe numbers.
- **No real integrations** — prompts never assume backend, live API, or external service access.
- **Return valid JSON only** — no prose, no markdown code fences (` ```json `), no preamble.
- **Cross-link entities** — generated records must reference IDs that already exist in the seed (e.g. `contactId` points to a real contact `id`).
- **Today-relative dates** — use ISO 8601 offsets from "today" so the demo always looks current.
- **Determinism-friendly** — avoid system calls or random seeds the app can't reproduce.

## How to Update Seed Data

```
1. Open the relevant prompt file (e.g. fake-data-generation.md)
2. Copy the prompt template for the entity you want to generate
3. Fill in the variable values ({{niche}}, {{count}}, etc.)
4. Paste into your LLM tool
5. Copy the JSON output
6. Validate it matches the TypeScript interface in src/types/index.ts
7. Paste into src/data/seed.ts in the appropriate generator section
8. Run: npm run build   (confirms no type errors)
9. Commit the updated seed file
```

## Prompt Variables Convention

Variables are declared as `{{variable_name}}` in the template body. Each prompt file lists its variables and their accepted values at the top.

Example: `{{niche}}` = `"dental"` | `"fitness"` | `"real estate"` | `"home services"`
