# Pipeline Scenario Generation

Generate a realistic set of opportunities distributed across the stages of a sales
pipeline, so the Opportunities Kanban board looks like a real, in-motion pipeline.

## Purpose

Populate the `opportunities` (and supporting `pipelines` / `stages`) generators in
`src/data/seed.ts` with a believable spread of deals: a healthy top of funnel, fewer
deals near the close, realistic values, and aging that makes some deals look stale.

## Inputs

- `{{niche}}` = `"dental"` | `"fitness"` | `"real estate"` | `"home services"`
- `{{pipeline_name}}` — e.g. `"Sales Pipeline"`
- `{{stages}}` — ordered stage names, e.g. `["New Lead","Contacted","Qualified","Proposal","Won","Lost"]`
- `{{deal_count}}` — total opportunities to generate (e.g. `24`)
- `{{value_range}}` — min/max deal value, e.g. `[500, 12000]`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Each opportunity object must include: `id`, `name`, `contactId` (an existing contact), `pipelineId`, `stage` (one of `{{stages}}`), `value` (number within `{{value_range}}`), `createdAt`, `updatedAt` (ISO, today-relative), and `status` (`"open"`/`"won"`/`"lost"`).


## Distribution guidance

- Weight counts toward earlier stages (funnel shape); only a few in Won/Lost.
- Vary `updatedAt` so 2–4 deals look stale (untouched 14+ days).
- Keep the sum of open-stage `value` in a believable total for `{{niche}}`.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Generate {deal_count}=24 opportunities for {niche}="home services" in
{pipeline_name}="Sales Pipeline" across {stages}=["New Lead","Contacted",
"Qualified","Proposal","Won","Lost"] with {value_range}=[500, 12000].
```
