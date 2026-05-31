/**
 * Conversations — module-local rich-thread model.
 *
 * The shared `Message` type (src/types) is intentionally minimal (id, direction,
 * channel, body, time, status). To render a GoHighLevel-style mixed timeline
 * (internal notes, call recordings, appointment / opportunity / task event
 * cards, collapsed emails, and system-event rows) without editing the shared
 * data contract, this module derives a richer `ThreadItem[]` locally — layering
 * demo-safe, deterministic events on top of the seeded messages and pulling in
 * the contact's REAL linked records (appointments / opportunities / tasks /
 * calls) from the store where they exist.
 *
 * Everything here is in-memory and seeded deterministically by conversation id,
 * so the same thread always renders the same timeline.
 */
import type {
  Appointment,
  Conversation,
  Contact,
  Message,
  Opportunity,
  Task,
  Call,
} from '@/types';
import { fullName } from '@/utils';

/** A single rendered item in the message thread. */
export type ThreadItem =
  | { kind: 'message'; id: string; at: string; msg: Message }
  | { kind: 'note'; id: string; at: string; author: string; body: string }
  | {
      kind: 'call';
      id: string;
      at: string;
      direction: 'inbound' | 'outbound' | 'missed';
      durationSec: number;
      transcript?: string;
    }
  | {
      kind: 'appointment';
      id: string;
      at: string;
      title: string;
      startTime: string;
      status: Appointment['status'];
      location?: string;
    }
  | {
      kind: 'opportunity';
      id: string;
      at: string;
      title: string;
      value: number;
      stage: string;
      status: string;
    }
  | { kind: 'task'; id: string; at: string; title: string; dueDate: string; done: boolean }
  | {
      kind: 'email';
      id: string;
      at: string;
      direction: 'inbound' | 'outbound';
      from: string;
      to: string;
      subject: string;
      body: string;
    }
  | { kind: 'system'; id: string; at: string; text: string; detail?: string };

/** A session-added internal note (from the composer's Internal Comment toggle). */
export interface LocalNote {
  id: string;
  at: string;
  author: string;
  body: string;
}

const BUSINESS_EMAIL = 'team@example.com';

/** Small deterministic PRNG so a thread's injected events never shuffle. */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BuildCtx {
  appointments: Appointment[];
  opportunities: Opportunity[];
  tasks: Task[];
  calls: Call[];
  /** Current agent / assignee name, for note authorship + outbound labels. */
  agentName: string;
  /** Teammate first names available to @mention inside internal notes. */
  teamFirstNames: string[];
  /** Stage names for the contact's pipeline, for a believable "moved" event. */
  stageNames: string[];
}

const SERVICE_WORDS = ['consultation', 'proposal', 'quote', 'onboarding', 'service plan'];

/**
 * Build the full ordered timeline for a conversation.
 *
 * @param rich  When true, the thread is enriched into a full mixed timeline
 *              (note + call + appointment + opportunity + task + email + system
 *              events). Non-rich threads still get light touches (an assignment
 *              system row + delivered/seen receipts already live on the messages).
 * @param localNotes  Internal notes added this session via the composer.
 */
export function buildThreadItems(
  conv: Conversation,
  contact: Contact,
  messages: Message[],
  ctx: BuildCtx,
  rich: boolean,
  localNotes: LocalNote[] = [],
): ThreadItem[] {
  const rnd = seeded(conv.id);
  const items: ThreadItem[] = messages.map((m) => ({
    kind: 'message',
    id: `m_${m.id}`,
    at: m.createdAt,
    msg: m,
  }));

  // time helpers anchored to the real message span
  const stamps = messages
    .map((m) => +new Date(m.createdAt))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const end = stamps[stamps.length - 1] ?? +new Date(conv.lastMessageAt);
  const start = stamps[0] ?? end - 4 * 3600_000;
  const span = Math.max(end - start, 6 * 3600_000);
  const at = (f: number) => new Date(start + span * f).toISOString();

  const pick = <T,>(arr: T[]): T | undefined => (arr.length ? arr[Math.floor(rnd() * arr.length)] : undefined);
  const contactName = fullName(contact);
  const service = SERVICE_WORDS[Math.floor(rnd() * SERVICE_WORDS.length)];

  // Always-present, lightweight: an inbound conversation gets assigned.
  items.push({
    kind: 'system',
    id: `sys_assign_${conv.id}`,
    at: at(0.02),
    text: `Conversation assigned to ${ctx.agentName}`,
  });

  if (!rich) {
    return finalize(items, localNotes);
  }

  // --- internal note with an @mention (distinct styling on render) ----------
  const mate = ctx.teamFirstNames.find((n) => n && n !== ctx.agentName.split(' ')[0]) ?? 'team';
  items.push({
    kind: 'note',
    id: `note_${conv.id}`,
    at: at(0.34),
    author: ctx.agentName,
    body: `Spoke with ${contact.firstName} about the ${service}. @${mate} can you confirm availability before I send the quote?`,
  });

  // --- collapsed inbound email card -----------------------------------------
  items.push({
    kind: 'email',
    id: `email_${conv.id}`,
    at: at(0.44),
    direction: 'inbound',
    from: contact.email,
    to: BUSINESS_EMAIL,
    subject: `Re: Your ${service} — a couple of questions`,
    body: `Hi, thanks for the details on the ${service}. Before we move ahead I had a couple of quick questions about timing and next steps. Could you let me know what works this week?`,
  });

  // --- call recording card (real linked call if present) --------------------
  const linkedCall = ctx.calls.find((c) => c.contactId === contact.id);
  items.push({
    kind: 'call',
    id: `call_${conv.id}`,
    at: at(0.52),
    direction: linkedCall?.direction ?? (rnd() > 0.5 ? 'inbound' : 'outbound'),
    durationSec: linkedCall?.durationSec ?? 60 + Math.floor(rnd() * 240),
    transcript:
      linkedCall?.voicemailTranscript ??
      `Hi ${ctx.agentName.split(' ')[0]}, it's ${contact.firstName} — just following up on the ${service}. Give me a call back when you get a chance, thanks!`,
  });

  // --- opportunity: a "moved stage" system row + a deal card ----------------
  const linkedOpp = ctx.opportunities.find((o) => o.contactId === contact.id);
  const stages = ctx.stageNames.length >= 2 ? ctx.stageNames : ['New Lead', 'Contacted'];
  const fromStage = stages[0];
  const toStage = stages[Math.min(1 + Math.floor(rnd() * (stages.length - 1)), stages.length - 1)];
  items.push({
    kind: 'system',
    id: `sys_opp_${conv.id}`,
    at: at(0.66),
    text: `Opportunity ${linkedOpp?.name ?? `${contactName} — ${service}`} moved from ${fromStage} to ${toStage}`,
    detail: 'Pipeline automation',
  });
  items.push({
    kind: 'opportunity',
    id: `opp_${conv.id}`,
    at: at(0.67),
    title: linkedOpp?.name ?? `${contactName} — ${service}`,
    value: linkedOpp?.monetaryValue ?? 500 + Math.floor(rnd() * 4500),
    stage: toStage,
    status: linkedOpp?.status ?? 'open',
  });

  // --- appointment event card (real linked appt if present) -----------------
  const linkedAppt = ctx.appointments.find((a) => a.contactId === contact.id);
  if (linkedAppt) {
    items.push({
      kind: 'appointment',
      id: `appt_${conv.id}`,
      at: at(0.74),
      title: linkedAppt.title,
      startTime: linkedAppt.startTime,
      status: linkedAppt.status,
      location: linkedAppt.location,
    });
  } else {
    const apptStart = new Date(end + 2 * 24 * 3600_000).toISOString();
    items.push({
      kind: 'appointment',
      id: `appt_${conv.id}`,
      at: at(0.74),
      title: `${service.replace(/^\w/, (c) => c.toUpperCase())} with ${contactName}`,
      startTime: apptStart,
      status: 'confirmed',
      location: 'Google Meet',
    });
  }

  // --- task event card (real linked task if present) ------------------------
  const linkedTask = ctx.tasks.find((t) => t.contactId === contact.id);
  items.push({
    kind: 'task',
    id: `task_${conv.id}`,
    at: at(0.82),
    title: linkedTask?.title ?? `Send ${service} follow-up to ${contact.firstName}`,
    dueDate: linkedTask?.dueDate ?? new Date(end + 24 * 3600_000).toISOString(),
    done: linkedTask?.status === 'completed',
  });

  return finalize(items, localNotes);
}

function finalize(items: ThreadItem[], localNotes: LocalNote[]): ThreadItem[] {
  const withLocal: ThreadItem[] = [
    ...items,
    ...localNotes.map<ThreadItem>((n) => ({
      kind: 'note',
      id: n.id,
      at: n.at,
      author: n.author,
      body: n.body,
    })),
  ];
  return withLocal.sort((a, b) => +new Date(a.at) - +new Date(b.at));
}
