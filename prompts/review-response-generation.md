# Review Response Generation

Generate suggested business replies to customer reviews shown in the Reputation module's
reply modal.

## Purpose

Provides realistic, on-brand draft replies (positive and negative) for the
`reputation.replyModal`, so the demo shows the "respond to a review" loop convincingly.

## Inputs

- `{{business_name}}` — e.g. `"Bright Smile Dental"` (fictional)
- `{{rating}}` — `1`–`5`
- `{{review_text}}` — the customer review being answered
- `{{tone}}` = `"warm"` | `"professional"` | `"apologetic"`

## Output format

Return **plain text** (a single reply, 2–4 sentences). No markdown, no preamble.

## Style

- 4–5 star: thank by name, reinforce one specific positive, invite them back.
- 1–3 star: acknowledge, apologize without admitting legal fault, move the
  conversation offline ("please reach us at hello@example.com").
- Never fabricate compensation or guarantees. Demo-only — nothing is published.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Draft a reply for {business_name}="Bright Smile Dental", {rating}=2,
{review_text}="Waited 40 minutes past my appointment time.", {tone}="apologetic".
```
