# Prompt: Tutorial Script Generation

**Category:** `tutorial`  
**Output target:** `src/modules/guides/tutorialDefs.ts`  
**Schema ref:** `TutorialDef` (see `src/modules/guides/tutorialDefs.ts`)

---

## Variables

| Variable | Description | Example values |
|---|---|---|
| `{{task}}` | The task the tutorial teaches | `"add a contact"`, `"send an invoice"` |
| `{{area}}` | Module area | `"Contacts"`, `"Payments"`, `"Automations"` |
| `{{module_route}}` | Starting route | `"/contacts"`, `"/payments/invoices"` |
| `{{selector_registry}}` | Comma-separated list of available data-tour keys | `"contacts.addButton, contacts.table, modal.saveButton"` |
| `{{step_count}}` | Desired number of steps | `4`, `5`, `6` |

---

## 19.6 — Generate Tutorial Steps

```
Return VALID JSON ONLY — no prose, no markdown code fences, no preamble.

Variables:
  task = "{{task}}"
  area = "{{area}}"
  moduleRoute = "{{module_route}}"
  selectorRegistry = [{{selector_registry}}]
  stepCount = {{step_count}}

Return one object matching this shape exactly:
{
  id: string;              // kebab-case, e.g. "add-contact"
  title: string;           // short human title for the tutorial
  area: string;            // module area label
  module: string;          // starting route
  description: string;     // 1-sentence description for the tutorial card
  estMinutes: number;      // realistic estimate (2–7)
  plannedSteps: string[];  // ordered array of {{stepCount}} plain-English step instructions
  completionNote: string;  // 1-sentence message shown on the completion screen
}

Step rules:
- Each step is one action the user takes ("Click...", "Type...", "Drag...")
- Steps must be achievable inside the mock platform (no real integrations)
- Steps should reference UI elements that exist in the module
- Reference only data-tour selectors from the provided selectorRegistry — do not invent selectors
- Keep language friendly and encouraging
- No step should say "you will learn" — say what to do directly

Guardrails:
- No real API calls
- No real sending/calling/charging
- This is a demo environment — describe simulated actions as if they are real
```

**Expected output shape:**
```json
{
  "id": "add-contact",
  "title": "Add a new contact",
  "area": "Contacts",
  "module": "/contacts",
  "description": "Create a new contact record, assign tags, and link them to a pipeline.",
  "estMinutes": 3,
  "plannedSteps": [
    "Open the Contacts module from the sidebar",
    "Click the + Add Contact button in the top right",
    "Fill in the contact name, email, and phone number",
    "Add at least one tag to categorize the contact",
    "Click Save — the contact appears in your list"
  ],
  "completionNote": "You know how to add contacts. New leads and clients can be added any time."
}
```

---

## Notes for Tutorial Authors

- After generating the step array, add the `TutorialDef` entry to `TUTORIALS` in `src/modules/guides/tutorialDefs.ts`.
- Ensure each UI element referenced in `plannedSteps` has a `data-tour` attribute in the app.
- Register new `data-tour` keys in `src/tutorials/selectorRegistry.ts` (Wave 3 file) before running the tutorial engine.
- In Wave 3, each step will also need a `targetSelector` (the `data-tour` key), `advanceOn` setting, and optional `simulate` config.
  Use this prompt to generate the human-readable step text; a separate authoring pass adds engine config.
