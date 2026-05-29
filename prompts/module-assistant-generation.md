# Module Assistant Generation

Generate the contextual helper text / empty-state copy for a given module — the short
guidance shown when a screen first loads or has no data yet.

## Purpose

Gives each module a helpful empty state and header subtitle, so the demo never shows a
blank or confusing screen. Used across module components (e.g. Tasks, Media, Sites).

## Inputs

- `{{module}}` — e.g. `"Tasks"`, `"Media"`, `"Sites"`
- `{{primary_action}}` — e.g. `"Add Task"`
- `{{state}}` = `"empty"` | `"populated"`

## Output format

Return **valid JSON only** — no prose, no markdown fences, no preamble. Return `{ headerSubtitle, emptyStateTitle, emptyStateBody, primaryActionLabel }`. `primaryActionLabel` should echo `{{primary_action}}`.


## Style

- Explain what the module is *for* in one line, then what to do next.
- Empty-state body points at `{{primary_action}}`.
- Demo-safe: never claim real sends/charges/integrations.

## Constraints

- **Fake data only** — no real people, businesses, or customers.
- **`@example.com` emails**, **`+1 (555) XXX-XXXX` phone numbers** only.
- **No real integrations** — never assume a backend, live API, or external service.
- **Cross-link by existing IDs** — reference records that already exist in `src/data/seed.ts`.
- **Today-relative ISO dates** so the demo always looks current.

## Example usage

```
Generate helper copy for {module}="Tasks" with {primary_action}="Add Task" in the {state}="empty" state.
```
