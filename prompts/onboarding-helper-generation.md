# Onboarding Helper Generation

Generate the copy for the dashboard/guides onboarding checklist — the getting-started
items that link a new user into the 10 tutorials.

## Purpose

Feeds the onboarding checklist (`dashboard.onboardingChecklist` / `guides.onboardingChecklist`):
short, encouraging task titles plus the tutorial each maps to.

## Inputs

- `{{tutorial_ids}}` — subset of the 10 flow IDs (e.g. `["add-contact","reply-conversation","move-pipeline","book-appointment","create-invoice"]`)
- `{{tone}}` = `"friendly"` | `"concise"`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Return an array of `{ tutorialId, title, blurb }` where `tutorialId` is exactly one of `{{tutorial_ids}}`, `title` is an action phrase ("Add your first contact"), and `blurb` is <90 chars.


## Constraints (additional)

- `tutorialId` MUST match an existing flow ID in `src/tutorials/flows.ts` — these are
  validated by `npm run check:tutorials`.
- Titles are imperative and outcome-focused; no exclamation overload.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Generate onboarding items for {tutorial_ids}=["add-contact","book-appointment",
"create-invoice"] in a {tone}="friendly" voice.
```
