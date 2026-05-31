/**
 * threadModel — builds the interleaved item stream rendered in a conversation
 * thread: plain messages, completed-call cards, and inline system-event rows
 * (e.g. "Opportunity moved to Proposal Sent", "Conversation marked as open").
 *
 * Everything here is *derived* from the existing in-memory seed (messages, the
 * contact's calls, and the contact's opportunities) — there are no new data
 * models and no network calls, so Reset Demo restores the thread exactly. GHL
 * threads (img 10/12) interleave call cards and system events with messages;
 * this reproduces that without inventing shared types.
 */
import type { Call, Contact, Conversation, Message, Opportunity } from '@/types';

export type ThreadItem =
  | { kind: 'message'; key: string; at: number; iso: string; message: Message }
  | { kind: 'call'; key: string; at: number; iso: string; call: Call }
  | {
      kind: 'event';
      key: string;
      at: number;
      iso: string;
      title: string;
      detail?: string;
    };

const ms = (iso: string) => +new Date(iso);

interface BuildArgs {
  conv: Conversation;
  contact: Contact;
  /** Messages for this conversation, ascending by createdAt. */
  messages: Message[];
  /** This contact's calls (any order). */
  calls: Call[];
  /** This contact's opportunities (any order). */
  opportunities: Opportunity[];
  /** Resolve an opportunity's current stage name for the event copy. */
  stageNameOf: (opp: Opportunity) => string | undefined;
}

/**
 * Merge messages with up-to-two real call cards and a small, deterministic set
 * of system-event rows, sorted ascending by time. Event content prefers the
 * contact's real opportunities; a baseline lifecycle event is always present so
 * the system-event row renders in every thread.
 */
export function buildThreadItems({
  conv,
  contact,
  messages,
  calls,
  opportunities,
  stageNameOf,
}: BuildArgs): ThreadItem[] {
  const items: ThreadItem[] = [];

  // 1) Messages (real)
  for (const m of messages) {
    items.push({ kind: 'message', key: `m_${m.id}`, at: ms(m.createdAt), iso: m.createdAt, message: m });
  }

  // 2) Call cards — the contact's two most-recent real calls (if any)
  const contactCalls = [...calls]
    .sort((a, b) => ms(b.createdAt) - ms(a.createdAt))
    .slice(0, 2);
  for (const c of contactCalls) {
    items.push({ kind: 'call', key: `call_${c.id}`, at: ms(c.createdAt), iso: c.createdAt, call: c });
  }

  // Thread time bounds (used to place the inline status event near the bottom).
  const lastIso = messages.length ? messages[messages.length - 1].createdAt : conv.lastMessageAt;
  const lastAt = ms(lastIso);

  // 3) System events
  const oppsByRecent = [...opportunities].sort((a, b) => ms(b.updatedAt) - ms(a.updatedAt));

  // 3a) Inline "recent activity" event, placed just before the last message so
  //     it is visible without scrolling. Prefer a real opportunity move.
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

  // 3b) A second, historical opportunity event at its real update time.
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

  // 3c) Contact-created lifecycle event (always), at its real time.
  items.push({
    kind: 'event',
    key: `evt_created_${contact.id}`,
    at: ms(contact.createdAt),
    iso: contact.createdAt,
    title: 'Contact created',
    detail: `Source: ${contact.source}`,
  });

  // Sort ascending; stable tiebreak so events never jitter between renders.
  return items.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
}

/** Format a call duration (seconds) as `m:ss` for the call card. */
export function formatCallDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
