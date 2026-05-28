# Prompt: Fake Data Generation

**Category:** `fakeData`  
**Output target:** `src/data/seed.ts`  
**Schema refs:** `Contact`, `Company`, `Pipeline`, `Opportunity`, `Invoice`, `Review`, `Workflow` (see `src/types/index.ts`)

---

## Variables

| Variable | Description | Example values |
|---|---|---|
| `{{niche}}` | Business niche for the demo | `dental`, `fitness`, `real estate`, `home services`, `legal` |
| `{{count}}` | Number of records to generate | `50`, `100`, `200` |
| `{{tone}}` | Name/copy tone | `professional`, `friendly`, `casual` |
| `{{pipeline_name}}` | Name for the pipeline | `Sales Pipeline`, `Reactivation` |
| `{{stage_count}}` | Number of pipeline stages | `4`, `5` |
| `{{deal_count}}` | Number of opportunity cards | `20`, `40` |

---

## 19.1 — Generate Fake Contacts

```
You generate fake CRM contact records for a DEMO application.
Return VALID JSON ONLY — no prose, no markdown code fences, no preamble.

Variables: niche="{{niche}}", count={{count}}, tone="{{tone}}"

Return an array of {{count}} objects, each matching this TypeScript shape exactly:
{
  id: string;           // format: "c_N" where N is sequential from 1
  firstName: string;
  lastName: string;
  email: string;        // ALWAYS "firstname.lastname@example.com" — no real domains
  phone: string;        // format: "+1 (555) XXX-XXXX" — clearly demo-safe
  companyId?: string;   // reference "co_N" IDs that exist in the seed
  tags: string[];       // 1–2 tags from: lead, hot, vip, nurture, newsletter, past-client, follow-up
  source: string;       // one of: Facebook Ads, Google Ads, Website Form, Referral, Instagram, Walk-in
  ownerId: string;      // one of: u_me, u_2, u_3, u_4
  dnd: boolean;         // true ~7% of the time
  createdAt: string;    // ISO 8601, within the last 180 days
  lastActivityAt: string; // ISO 8601, createdAt + 0–30 days
  customFields: { leadScore: number; preferredChannel: "SMS" | "Email" | "Phone" }
}

Rules:
- Use clearly fictional names. No real public figures.
- Vary source, ownerId, and tags.
- Make names feel appropriate for the {{niche}} niche.
- No real PII.
```

**Expected output shape:**
```json
[
  {
    "id": "c_1",
    "firstName": "Hazel",
    "lastName": "Weston",
    "email": "hazel.weston@example.com",
    "phone": "+1 (555) 312-4901",
    "companyId": "co_3",
    "tags": ["lead", "hot"],
    "source": "Google Ads",
    "ownerId": "u_2",
    "dnd": false,
    "createdAt": "2026-01-15T10:22:00.000Z",
    "lastActivityAt": "2026-02-02T14:10:00.000Z",
    "customFields": { "leadScore": 74, "preferredChannel": "SMS" }
  }
]
```

---

## 19.2 — Generate Fake Companies

```
Return VALID JSON ONLY — no prose, no markdown fences.

Variables: niche="{{niche}}", count={{count}}

Return an array of {{count}} Company objects:
{
  id: string;        // "co_N" sequential
  name: string;      // believable local business name for the {{niche}} niche
  industry?: string;
  website?: string;  // "https://companynamenospecialchars.example.com"
  phone?: string;    // "+1 (555) XXX-XXXX"
  contactIds: [];    // always empty array — the seeder links contacts
  createdAt: string; // ISO 8601, 120–700 days ago
}

No real business names. Use clearly fictional names.
```

---

## 19.3 — Generate a Pipeline Scenario

```
Return VALID JSON ONLY — no prose, no markdown fences.

Variables: pipelineName="{{pipeline_name}}", stageCount={{stage_count}}, dealCount={{deal_count}}, niche="{{niche}}"

Return an object:
{
  pipeline: Pipeline;         // { id, name, stages: [{ id, name, order }] }
  opportunities: Opportunity[] // dealCount records
}

Pipeline rules:
- id format: "pipe_X"
- stage id format: "st_X_N" (N = stage order)
- Stages must be ordered 0..N

Opportunity rules:
- id format: "opp_N" sequential
- contactId: reference a real contact id from the seed (e.g. "c_1" through "c_200")
- pipelineId: the pipeline id above
- stageId: one of the stage ids above
- Distribute deals realistically: more in early stages, fewer in later stages
- monetaryValue: realistic for {{niche}} (e.g. $500–$15,000)
- status: mostly "open", ~10% "won" or "lost"
- ownerId: one of u_me, u_2, u_3, u_4
- All dates ISO 8601, within last 90 days
```

---

## 19.4 — Generate Fake Invoices

```
Return VALID JSON ONLY — no prose, no markdown fences.

Variables: count={{count}}, niche="{{niche}}"

Return an array of {{count}} Invoice objects:
{
  id: "inv_N",
  number: "INV-100N",
  contactId: string;   // real contact id e.g. "c_1" through "c_200"
  status: "draft" | "sent" | "paid" | "overdue"; // weight toward paid and sent
  issuedAt: string;    // ISO 8601, within last 60 days
  dueAt: string;       // issuedAt + 14 days
  lineItems: [{ productId: string; name: string; qty: number; unitPrice: number }];
  subtotal: number;    // sum of qty*unitPrice
  tax: number;         // subtotal * 0.08 rounded
  total: number;       // subtotal + tax
}

Use product IDs from prod_1 through prod_15. Make amounts realistic for {{niche}}.
```

---

## 19.5 — Generate Fake Reviews

```
Return VALID JSON ONLY — no prose, no markdown fences.

Variables: count={{count}}, niche="{{niche}}"

Return an array of {{count}} Review objects:
{
  id: "rev_N",
  source: "google" | "facebook",
  rating: 1 | 2 | 3 | 4 | 5,   // weight: 5-star ~55%, 4-star ~25%, 3-star ~12%, 1-2 ~8%
  author: string,               // "FirstName L." format — fictional names only
  text: string,                 // 1–2 sentences, appropriate to the rating
  createdAt: string,            // ISO 8601, within last 120 days
  replied: boolean,
  replyText?: string            // only if replied=true; brief, professional
}
```
