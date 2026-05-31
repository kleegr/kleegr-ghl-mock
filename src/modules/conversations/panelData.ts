/**
 * Conversations — module-local panel data (Notes & Documents).
 *
 * Notes and Documents have no shared seed in the store, so they are generated
 * here, deterministically per contact, and kept demo-safe. Payments reuses the
 * real seeded `invoices` from the store (filtered by contact) and so needs no
 * generator. Session edits (adding a note / uploading a doc) are held in the
 * panel's own in-memory state.
 */
import type { Contact } from '@/types';
import { fullName } from '@/utils';

export interface ContactNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  pinned?: boolean;
}

export interface DemoDocument {
  id: string;
  name: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed';
  kind: 'Proposal' | 'Contract' | 'Estimate' | 'Form';
  createdAt: string;
}

function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

const NOTE_TEMPLATES = [
  'Left a voicemail and sent a follow-up text. Waiting to hear back on timing.',
  'Prefers to be contacted in the afternoons. Mentioned a budget around the mid range.',
  'Referred by an existing client — flagged for priority follow-up.',
  'Asked for a written estimate before booking. Sending the proposal today.',
  'Rescheduled once already; confirm the new time the day before.',
];

/** 0–2 deterministic notes for a contact (most contacts have at least one). */
export function seedNotesForContact(contact: Contact, fallbackAuthor: string): ContactNote[] {
  const rnd = seeded(`notes_${contact.id}`);
  const count = rnd() < 0.25 ? 0 : rnd() < 0.7 ? 1 : 2;
  const notes: ContactNote[] = [];
  for (let i = 0; i < count; i++) {
    const body = NOTE_TEMPLATES[Math.floor(rnd() * NOTE_TEMPLATES.length)];
    notes.push({
      id: `note_seed_${contact.id}_${i}`,
      author: fallbackAuthor,
      body,
      createdAt: new Date(Date.now() - (1 + Math.floor(rnd() * 18)) * DAY).toISOString(),
      pinned: i === 0 && rnd() < 0.3,
    });
  }
  return notes.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** 0–2 deterministic documents; ~45% of contacts have none (exercises empty state). */
export function seedDocumentsForContact(contact: Contact): DemoDocument[] {
  const rnd = seeded(`docs_${contact.id}`);
  if (rnd() < 0.45) return [];
  const count = rnd() < 0.6 ? 1 : 2;
  const kinds: DemoDocument['kind'][] = ['Proposal', 'Contract', 'Estimate', 'Form'];
  const statuses: DemoDocument['status'][] = ['draft', 'sent', 'viewed', 'signed'];
  const name = fullName(contact);
  const docs: DemoDocument[] = [];
  for (let i = 0; i < count; i++) {
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    docs.push({
      id: `doc_seed_${contact.id}_${i}`,
      name: `${kind} — ${name}`,
      status: statuses[Math.floor(rnd() * statuses.length)],
      kind,
      createdAt: new Date(Date.now() - (1 + Math.floor(rnd() * 30)) * DAY).toISOString(),
    });
  }
  return docs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
