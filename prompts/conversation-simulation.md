# Prompt: Conversation Simulation

**Category:** `conversation`  
**Output target:** `src/data/seed.ts` (conversations + messages arrays)  
**Schema refs:** `Conversation`, `Message` (see `src/types/index.ts`)

---

## Variables

| Variable | Description | Example values |
|---|---|---|
| `{{channel}}` | Conversation channel | `sms`, `email`, `webchat`, `facebook`, `instagram`, `whatsapp` |
| `{{contact_name}}` | Contact's full name | `"Hazel Weston"` |
| `{{contact_id}}` | Contact's id in the seed | `"c_14"` |
| `{{scenario}}` | What the conversation is about | `"booking a consultation"`, `"invoice question"`, `"pricing inquiry"` |
| `{{turns}}` | Number of messages (back-and-forth) | `8`, `10`, `12` |
| `{{tone}}` | Conversational tone | `professional`, `casual`, `friendly`, `urgent` |
| `{{owner_id}}` | Assigned staff member | `u_me`, `u_2`, `u_3`, `u_4` |

---

## 19.7 — Generate a Conversation Thread

```
Return VALID JSON ONLY — no prose, no markdown code fences, no preamble.

Variables:
  channel = "{{channel}}"
  contactName = "{{contact_name}}"
  contactId = "{{contact_id}}"
  scenario = "{{scenario}}"
  turns = {{turns}}
  tone = "{{tone}}"
  ownerId = "{{owner_id}}"

Return ONE object:
{
  conversation: Conversation;
  messages: Message[];
}

Conversation shape:
{
  id: "conv_N",             // use a unique N not already in the seed
  contactId: string,        // must match contactId variable
  channel: Channel,         // must match channel variable
  unread: boolean,          // true ~35% of the time
  starred: boolean,         // true ~15% of the time
  lastMessageAt: string,    // ISO 8601, timestamp of the last message
  assignedTo: string,       // ownerId variable
  messageIds: string[]      // array of all message ids in order
}

Message shape (one per turn, alternating inbound/outbound):
{
  id: "msg_conv_N_M",       // N = conv number, M = message index (0-based)
  conversationId: string,   // parent conv id
  direction: "inbound" | "outbound",  // alternate starting with inbound
  channel: Channel,
  body: string,             // realistic message text for the {{scenario}} in {{tone}} tone
  createdAt: string,        // ISO 8601, ascending from 0–6 days ago
  status?: "delivered" | "read"  // only for outbound messages
}

Rules:
- Timestamps must be ascending (each message later than the previous)
- Odd-indexed messages (0, 2, 4...) are inbound from the contact
- Even-indexed messages (1, 3, 5...) are outbound from staff
- Message bodies must be believable for the {{scenario}} — realistic, not generic
- Do not use real names other than {{contact_name}}
- Keep the conversation focused on {{scenario}}
- No real PII other than the provided contact name
```

**Expected output shape:**
```json
{
  "conversation": {
    "id": "conv_36",
    "contactId": "c_14",
    "channel": "sms",
    "unread": true,
    "starred": false,
    "lastMessageAt": "2026-05-27T14:32:00.000Z",
    "assignedTo": "u_2",
    "messageIds": ["msg_conv_36_0", "msg_conv_36_1", "msg_conv_36_2"]
  },
  "messages": [
    {
      "id": "msg_conv_36_0",
      "conversationId": "conv_36",
      "direction": "inbound",
      "channel": "sms",
      "body": "Hi! I wanted to ask about booking a consultation — is next week available?",
      "createdAt": "2026-05-26T09:15:00.000Z"
    },
    {
      "id": "msg_conv_36_1",
      "conversationId": "conv_36",
      "direction": "outbound",
      "channel": "sms",
      "body": "Hi Hazel! Absolutely — I have openings Tuesday and Thursday afternoon. Which works better for you?",
      "createdAt": "2026-05-26T09:42:00.000Z",
      "status": "delivered"
    }
  ]
}
```

---

## Batch Generation

To generate multiple threads at once, wrap in an array prompt:

```
Return VALID JSON ONLY — an array of {{count}} conversation objects.
Each item must be a { conversation, messages } pair using the same rules above.
Each conversation must use a unique id (conv_N) and a different contactId from c_1 to c_200.
Vary channels, scenarios, and tones across the batch.
```
