/**
 * Productivity module — ticket triage helpers (category inference + SLA refs).
 *
 * Kept separate from data.ts (the protected seed/catalog source) so the new
 * ticket-fidelity work doesn't churn the large seed file. Everything here is
 * pure, in-memory, demo-safe metadata derived from the local Ticket shapes.
 */

import type { Priority, Ticket } from './types';

/**
 * SLA first-response / resolution targets per priority (hours). Demo reference
 * surfaced in Settings — not enforced. Mirrors Ticketing's StageTimer/SLA idea.
 */
export const SLA_TARGETS: { priority: Priority; firstResponseH: number; resolutionH: number }[] = [
  { priority: 'urgent', firstResponseH: 1, resolutionH: 8 },
  { priority: 'high', firstResponseH: 4, resolutionH: 24 },
  { priority: 'medium', firstResponseH: 8, resolutionH: 72 },
  { priority: 'low', firstResponseH: 24, resolutionH: 120 },
];

/** Map a ticket's tags to a triage category when no explicit category is set. */
export function inferTicketCategory(tags: string[]): string {
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes('billing') || x.includes('refund'))) return 'Billing';
  if (t.some((x) => x.includes('feature'))) return 'Feature Request';
  if (t.some((x) => x.includes('onboarding') || x.includes('how-to'))) return 'Onboarding';
  if (t.some((x) => ['bug', 'login', 'auth', 'integration', 'webhook', 'calendar', 'form', 'spam', 'ui', 'security'].some((k) => x.includes(k)))) return 'Technical';
  return 'General';
}

/** A ticket's category — explicit value if present, otherwise inferred from tags. */
export function ticketCategory(t: Pick<Ticket, 'category' | 'tags'>): string {
  return t.category?.trim() || inferTicketCategory(t.tags);
}
