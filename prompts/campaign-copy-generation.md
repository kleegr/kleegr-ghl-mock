# Campaign Copy Generation

Generate marketing campaign copy (email subject + body, or SMS text) for the Marketing
module's email/SMS campaign records and detail view.

## Purpose

Populates campaign `subject`/`previewText`/`body` (email) or `body` (SMS) in
`src/data/seed.ts`, plus believable copy for the campaign wizard preview.

## Inputs

- `{{channel}}` = `"email"` | `"sms"`
- `{{niche}}` = `"dental"` | `"fitness"` | `"real estate"` | `"home services"`
- `{{goal}}` = `"promotion"` | `"reactivation"` | `"newsletter"` | `"event"`
- `{{offer}}` — optional, e.g. `"20% off first cleaning"`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Email: `{ subject (<60 chars), previewText (<90 chars), body }`. SMS: `{ body (<160 chars, includes "Reply STOP to opt out") }`.


## Style

- One clear call-to-action; link as `https://example.com/...` only.
- SMS must include an opt-out line and stay under 160 chars.
- Demo-safe: copy may describe an offer but nothing is actually sent.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Generate {channel}="email" copy for {niche}="fitness", {goal}="reactivation",
{offer}="2 weeks free".
```
