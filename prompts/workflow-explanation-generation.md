# Workflow Explanation Generation

Generate the short, plain-English explanation copy shown beside each automation in
the Automations module (workflow list subtitle + builder description + per-node hints).

## Purpose

Keep the Automations demo educational: every workflow and every step should be
self-explanatory to a first-time viewer. Feeds `automationData.ts` / `workflowNodes.ts`
display metadata (e.g. `summary`, node `description`).

## Inputs

- `{{workflow_name}}` — e.g. `"Missed Call Text Back"`
- `{{trigger}}` — e.g. `"Missed Call"`
- `{{steps}}` — ordered action/wait/condition node labels
- `{{audience}}` = `"prospect"` | `"new staff"` (controls reading level)

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Return an object with: `summary` (one sentence, <140 chars), `nodes` (array of `{ label, explanation, exampleUseCase }` aligned to `{{steps}}`).


## Style

- One idea per sentence; no jargon for `{{audience}}="prospect"`.
- Lead with the business outcome ("so fewer leads slip through the cracks").
- Never imply anything is really sent — this is a demo.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Explain {workflow_name}="Missed Call Text Back" with {trigger}="Missed Call" and
{steps}=["Send SMS","Notify Assigned User","Create Task","Add Tag"] for {audience}="prospect".
```
