/**
 * threadModel — builds the interleaved item stream rendered in a conversation
 * thread: messages, real completed-call cards, and inline system-event rows
 * (e.g. "Opportunity moved to Proposal Sent", "Contact created"), PLUS — for
 * showcase threads — an internal note with an @mention, a collapsed email card,
 * and appointment / opportunity / task event cards.
 *
 * Everything here is *derived* from the existing in-memory seed (messages, the
 * contact's calls / opportunities / appointments / tasks) — there are no new
 * shared data models and no network calls, so Reset Demo restores the thread
 * exactly. The richer demo items are layered deterministically on top so at
 * least one thread shows the full GHL-style mixed timeline (img 10/12).
 */
import type { Appointment, Call, Contact, Conversation, Message, Opportunity, Task } from '@/types';
import { fullName } from '@/utils';

export type ThreadItem =
  | { kind: 'message'; key: string; at: number; iso: string; message: Message }
  | { kind: 'call'; key: string; at: number; iso: string; call: Call }
  | { kind: 'event'; key: string; at: number; iso: string; title: string; detail?: string }
  | { kind: 'note'; key: string; at: number; iso: string; author: string; body: string; localNoteId?: string }
  | {
      kind: 'email';
      key: string;
      at: number;
      iso: string;
      direction: 'inbound' | 'outbound';
      from: string;
      to: string;
      subject: string;
      body: string;
    }
  | {
      kind: 'appointment';
      key: string;
      at: number;
      iso: string;
      title: string;
      startTime: string;
      status: Appointment['status'];
      location?: string;
    }
  | {
      kind: 'opportunity';
      key: string;
      at: number;
      iso: string;
      title: string;
      value: number;
      stage: string;
      status: string;
    }
  | { kind: 'task'; key: string; at: number; iso: string; title: string; dueDate: string; done: boolean };

/** A session-added internal comment (from the composer's Internal Comment toggle). */
export interface LocalNote {
  id: string;
  at: string;
  author: string;
  body: string;
}

const ms = (iso: string) => +new Date(iso);
const BUSINESS_EMAIL = 'team@example.com';
const SERVICE_WORDS = ['consultation', 'proposal', 'quote', 'onboarding', 'service plan'];

/** Small deterministic PRNG so a thread's injected demo items never shuffle. */
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

interface BuildArgs {
  conv: Conversation;
  contact: Contact;
  /** Messages for this conversation, ascending by createdAt. */
  messages: Message[];
  /** This contact's calls (any order). */
  calls: Call[];
  /** This contact's opportunities (any order). */
  opportunities: Opportunity[];
  /** This contact's appointments (any order). */
  appointments: Appointment[];
  /** This contact's tasks (any order). */
  tasks: Task[];
  /** Resolve an opportunity's current stage name for the event copy. */
  stageNameOf: (opp: Opportunity) => string | undefined;
  /** Current agent / assignee name, for note authorship + outbound labels. */
  agentName: string;
  /** Teammate first names available to @mention inside internal notes. */
  teamFirstNames: string[];
  /** When true, layer the full demo timeline (note, email, appt/opp/task cards). */
  rich: boolean;
  /** Internal comments added this session via the composer. */
  localNotes?: LocalNote[];
}

/**
 * Merge messages with the contact's real call cards and a small, deterministic
 * set of system-event rows (preferring real opportunity moves), then — for
 * showcase threads — layer richer demo items. Sorted ascending by time with a
 * stable tiebreak so nothing jitters between renders.
 */
export function buildThreadItems({
  conv,
  contact,
  messages,
  calls,
  opportunities,
  appointments,
  tasks,
  stageNameOf,
  agentName,
  teamFirstNames,
  rich,
  localNotes = [],
}: BuildArgs): ThreadItem[] {
  const items: ThreadItem[] = [];

  // 1) Messages (real)
  for (const m of messages) {
    items.push({ kind: 'message', key: `m_${m.id}`, at: ms(m.createdAt), iso: m.createdAt, message: m });
  }

  // 2) Call cards — the contact's two most-recent real calls (if any)
  const contactCalls = [...calls].sort((a, b) => ms(b.createdAt) - ms(a.createdAt)).slice(0, 2);
  for (const c of contactCalls) {
    items.push({ kind: 'call', key: `call_${c.id}`, at: ms(c.createdAt), iso: c.createdAt, call: c });
  }

  // Thread time bounds (used to place injected demo items within the real
  // message span). Never extend a short exchange with an artificial minimum
  // span: that could place demo cards after the conversation's latest message.
  const messageTimes = messages.map((message) => ms(message.createdAt)).filter(Number.isFinite).sort((a, b) => a - b);
  const fallbackLastAt = ms(conv.lastMessageAt);
  const lastAt = messageTimes[messageTimes.length - 1] ?? fallbackLastAt;
  const firstAt = messageTimes[0] ?? lastAt;
  const syntheticEndAt = Math.min(lastAt, Date.now());
  const syntheticStartAt = Math.min(firstAt, syntheticEndAt);
  const span = Math.max(0, syntheticEndAt - syntheticStartAt);
  const frac = (f: number) => Math.min(syntheticEndAt, syntheticStartAt + span * f);

  // 3) System events — prefer real opportunity moves; always include lifecycle.
  const oppsByRecent = [...opportunities].sort((a, b) => ms(b.updatedAt) - ms(a.updatedAt));
  const primary = oppsByRecent[0];
  const inlineAt = lastAt - 60_000;
  if (primary) {
    const stage = stageNameOf(primary) ?? 'a new stage';
    items.push({
      kind: 'event',
      key: `evt_opp_${primary.id}`,
      at: inlineAt,
      iso: new Date(inlineAt).toISOString(),
      title: `Opportunity "${primary.name}" moved to ${stage}`,
      detail: `Marked as ${primary.status}`,
    });
  } else {
    items.push({
      kind: 'event',
      key: `evt_status_${conv.id}`,
      at: inlineAt,
      iso: new Date(inlineAt).toISOString(),
      title: 'Conversation status updated',
      detail: 'Marked as open',
    });
  }
  const secondary = oppsByRecent[1];
  if (secondary) {
    const stage = stageNameOf(secondary) ?? 'a new stage';
    items.push({
      kind: 'event',
      key: `evt_opp_${secondary.id}`,
      at: ms(secondary.updatedAt),
      iso: secondary.updatedAt,
      title: `Opportunity "${secondary.name}" moved to ${stage}`,
    });
  }
  items.push({
    kind: 'event',
    key: `evt_created_${contact.id}`,
    at: ms(contact.createdAt),
    iso: contact.createdAt,
    title: 'Contact created',
    detail: `Source: ${contact.source}`,
  });

  // 4) Richer demo items (showcase threads only) — internal note w/ @mention,
  //    collapsed email, and appointment / opportunity / task cards. These reuse
  //    real linked records where the contact has them.
  // Rich cards belong to the populated, seeded showcase histories. A newly
  // composed conversation can quickly gain a reply or two, but should remain
  // an honest short exchange instead of suddenly acquiring invented history.
  const hasSeededHistory =
    messages.length >= 4 &&
    messages.some((message) => message.id.startsWith(`msg_${conv.id}_`));

  if (rich && hasSeededHistory) {
    const rnd = seeded(conv.id);
    const contactName = fullName(contact);
    const service = SERVICE_WORDS[Math.floor(rnd() * SERVICE_WORDS.length)];
    const mate = teamFirstNames.find((n) => n && n !== agentName.split(' ')[0]) ?? 'team';

    const noteAt = frac(0.34);
    items.push({
      kind: 'note',
      key: `note_seed_${conv.id}`,
      at: noteAt,
      iso: new Date(noteAt).toISOString(),
      author: agentName,
      body: `Spoke with ${contact.firstName} about the ${service}. @${mate} can you confirm availability before I send the quote?`,
    });

    const emailAt = frac(0.44);
    items.push({
      kind: 'email',
      key: `email_${conv.id}`,
      at: emailAt,
      iso: new Date(emailAt).toISOString(),
      direction: 'inbound',
      from: contact.email,
      to: BUSINESS_EMAIL,
      subject: `Re: Your ${service} — a couple of questions`,
      body: `Hi, thanks for the details on the ${service}. Before we move ahead I had a couple of quick questions about timing and next steps. Could you let me know what works this week?`,
    });

    const oppAt = frac(0.6);
    items.push({
      kind: 'opportunity',
      key: `oppcard_${conv.id}`,
      at: oppAt,
      iso: new Date(oppAt).toISOString(),
      title: primary?.name ?? `${contactName} — ${service}`,
      value: primary?.monetaryValue ?? 500 + Math.floor(rnd() * 4500),
      stage: (primary && stageNameOf(primary)) ?? 'Proposal Sent',
      status: primary?.status ?? 'open',
    });

    const linkedAppt = appointments[0];
    const apptAt = frac(0.72);
    items.push({
      kind: 'appointment',
      key: `appt_${conv.id}`,
      at: apptAt,
      iso: new Date(apptAt).toISOString(),
      title: linkedAppt?.title ?? `${service.replace(/^\w/, (ch) => ch.toUpperCase())} with ${contactName}`,
      startTime: linkedAppt?.startTime ?? new Date(lastAt + 2 * 24 * 3600_000).toISOString(),
      status: linkedAppt?.status ?? 'confirmed',
      location: linkedAppt?.location ?? 'Google Meet',
    });

    const linkedTask = tasks[0];
    const taskAt = frac(0.82);
    items.push({
      kind: 'task',
      key: `task_${conv.id}`,
      at: taskAt,
      iso: new Date(taskAt).toISOString(),
      title: linkedTask?.title ?? `Send ${service} follow-up to ${contact.firstName}`,
      dueDate: linkedTask?.dueDate ?? new Date(lastAt + 24 * 3600_000).toISOString(),
      done: linkedTask?.status === 'completed',
    });
  }

  // 5) Session internal comments (always) — appended in distinct note styling.
  for (const n of localNotes) {
    items.push({ kind: 'note', key: n.id, at: ms(n.at), iso: n.at, author: n.author, body: n.body, localNoteId: n.id });
  }

  // Sort ascending; stable tiebreak so items never jitter between renders.
  return items.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
}

/** Format a call duration (seconds) as `m:ss` for the call card. */
export function formatCallDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
