# Prompt: Demo Script Generation

**Category:** `demoScript`  
**Output target:** Future `DemoScriptPanel` component (Wave 1 optional / Wave 5)
**Schema ref:** `DemoScript` (planned type)

---

## Variables

| Variable | Description | Example values |
|---|---|---|
| `{{module}}` | The module being demoed | `"Conversations"`, `"Pipeline"`, `"Reporting"` |
| `{{audience}}` | Prospect type | `"dental practice owner"`, `"gym owner"`, `"real estate agent"` |
| `{{duration_sec}}` | Approx time for this module section | `60`, `90`, `120` |
| `{{next_module}}` | The next module in the demo flow | `"Contacts"`, `"Automations"` |

---

## 19.8 — Generate a Module Demo Script

```
Return VALID JSON ONLY — no prose, no markdown code fences, no preamble.

Variables:
  module = "{{module}}"
  audience = "{{audience}}"
  durationSec = {{duration_sec}}
  nextModule = "{{next_module}}"

Return ONE object:
{
  module: string;
  audience: string;
  talkingPoints: string[];   // 3–5 benefit-led talking points for this module
  demoActions: string[];     // 2–4 specific things to click/show during the demo
  transitions: string[];     // 1–2 bridge lines to move from this module to nextModule
}

Tone rules:
- Confident, benefit-led, concise — like a polished sales rep, not a manual
- Speak to the {{audience}} pain points
- Highlight the "wow" moment for this module
- demoActions must be achievable in the mock platform (no real integrations)
- Avoid jargon; use plain language a business owner understands
- Keep each talking point to 1–2 sentences

Guardrails:
- No claims about real API calls, real sends, or real payments
- This is a DEMO environment — describe everything as if it just works
- Do not mention GoHighLevel by name — use the platform name "Kleegr"
```

**Expected output shape:**
```json
{
  "module": "Conversations",
  "audience": "dental practice owner",
  "talkingPoints": [
    "Every patient message — SMS, email, web chat — lands in one inbox. Your front desk never misses a message again.",
    "Reply directly from here in seconds. No more switching between apps or phone systems.",
    "Unread messages are flagged automatically so your team always knows what needs attention."
  ],
  "demoActions": [
    "Open an unread SMS thread and show the conversation history",
    "Type a reply in the composer and click Send",
    "Switch the channel filter to Email and show a different thread"
  ],
  "transitions": [
    "Now that you can see how easy it is to respond to leads, let me show you where those leads come from — your Contacts."
  ]
}
```

---

## Full Demo Flow Script

For a complete 20–30 minute demo, run this prompt once per module in order:

1. Dashboard → `{{next_module}}` = Conversations
2. Conversations → Contacts
3. Contacts → Opportunities
4. Opportunities → Calendars
5. Calendars → Automations
6. Automations → Reporting
7. Reporting → Payments

Then compile all outputs into a `demoScripts` array and store in a config file.
The `DemoScriptPanel` component (Wave 5) will render the relevant script for the current route.

---

## Onboarding Guidance Prompt (bonus)

```
Return VALID JSON ONLY — no prose, no markdown fences.

Variables: screen="{{screen}}", userGoal="{{goal}}"

Return:
{
  context: string;       // 1-sentence summary of what this screen does
  nextSteps: string[];   // 2–4 plain-English next actions the user should take
  tip: string;           // 1 helpful tip specific to this screen
}

Tone: friendly, plain, matches a helpful onboarding guide.
Do not assume any real integrations. Everything happens in the demo.
```
