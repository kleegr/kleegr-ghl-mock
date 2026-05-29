# Contact Profile Generation

Generate realistic contact records for the Contacts/CRM module, including the
denormalized fields the contact table and detail drawer display.

## Purpose

Populate the `contacts` generator in `src/data/seed.ts` with believable leads and
clients: varied sources, tags, owners, lifecycle stages, and recent-activity hints.

## Inputs

- `{{niche}}` = `"dental"` | `"fitness"` | `"real estate"` | `"home services"`
- `{{count}}` — number of contacts (e.g. `40`)
- `{{tag_pool}}` — allowed tags, e.g. `["VIP","New Lead","Past Client","Cold"]`
- `{{source_pool}}` — e.g. `["Website Form","Facebook Ad","Referral","Walk-in"]`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Each contact: `id`, `firstName`, `lastName`, `email` (`@example.com`), `phone` (`+1 (555) ...`), `tags` (subset of `{{tag_pool}}`), `source` (from `{{source_pool}}`), `ownerId` (existing user), `lifecycleStage`, `createdAt`, `lastActivityAt` (ISO, today-relative).


## Realism guidance

- Mix names across genders/cultures; never reuse a real public figure.
- 10–20% should be tagged VIP or Past Client; the rest leads.
- Spread `createdAt` over the last 90 days; recent ones cluster nearer today.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Generate {count}=40 contacts for {niche}="dental" using {tag_pool}=["VIP",
"New Lead","Past Client","Cold"] and {source_pool}=["Website Form","Facebook Ad","Referral"].
```
