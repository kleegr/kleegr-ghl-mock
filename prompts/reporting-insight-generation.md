# Reporting Insight Generation

Generate the short "AI summary" insight blurbs shown above charts in the Reporting
module (e.g. `reporting.aiSummary`).

## Purpose

Turns the seeded reporting numbers into 1–3 plain-English takeaways, so the Reporting
demo feels analytical rather than just charts.

## Inputs

- `{{report_type}}` = `"attribution"` | `"calls"` | `"appointments"` | `"revenue"`
- `{{metrics}}` — the figures to summarize, e.g. `{ "leads": 312, "bookings": 47, "conversion": 0.15 }`
- `{{period}}` — e.g. `"last 30 days"`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Return `{ headline (<80 chars), bullets (1–3 strings, each <120 chars) }`. Reference only numbers present in `{{metrics}}`.


## Constraints (additional)

- Never invent a metric not provided in `{{metrics}}`.
- Phrase trends as observations, not promises ("bookings are up vs. the prior period").
- Round sensibly; show percentages as whole numbers where reasonable.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Summarize {report_type}="appointments" for {period}="last 30 days" given
{metrics}={ "booked": 47, "showed": 39, "noShow": 8 }.
```
