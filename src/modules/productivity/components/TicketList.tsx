/**
 * Ticket list view + bulk actions — adapts Ticketing's TicketListView and
 * BulkActionsBar. Rows open the detail drawer; a checkbox column drives
 * multi-select, and the floating bulk bar applies stage changes / mark-read to
 * the in-memory store.
 */

import { useMemo, useState } from 'react';
import { Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx, dateLabel, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { Ticket, TicketStage } from '../types';
import { TICKET_STAGES } from '../data';
import { AssigneePill, ChannelIcon, PriorityBadge, TicketStageBadge } from './shared';

export function TicketList({
  tickets,
  onOpen,
}: {
  tickets: Ticket[];
  onOpen: (id: string) => void;
}) {
  const { bulkUpdateTickets } = useProductivity();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<TicketStage>('resolved');

  const visibleIds = useMemo(() => tickets.map((t) => t.id), [tickets]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(visibleIds));

  const clear = () => setSelected(new Set());

  const applyStage = () => {
    bulkUpdateTickets([...selected], { stage: bulkStage }, `Moved to ${TICKET_STAGES.find((s) => s.id === bulkStage)?.label}`);
    clear();
  };
  const markRead = () => {
    bulkUpdateTickets([...selected], { unread: false }, 'Marked as read');
    clear();
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-line">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line bg-surface-sunken px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          <button
            onClick={toggleAll}
            aria-label="Select all"
            className={cx(
              'grid h-4 w-4 place-items-center rounded border transition-colors',
              allSelected ? 'border-brand bg-brand text-brand-fg' : 'border-ink-subtle/40 text-transparent hover:border-ink-subtle',
            )}
          >
            <Check size={11} strokeWidth={3} />
          </button>
          <span className="flex-1">Subject</span>
          <span className="hidden w-28 sm:block">Stage</span>
          <span className="hidden w-24 md:block">Assignee</span>
          <span className="hidden w-24 lg:block text-right">Updated</span>
        </div>

        {tickets.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-ink-subtle">No tickets match your filters.</div>
        ) : (
          <ul className="divide-y divide-line">
            {tickets.map((t) => {
              const isSel = selected.has(t.id);
              return (
                <li
                  key={t.id}
                  className={cx('flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-surface-sunken/60', isSel && 'bg-brand/5')}
                >
                  <button
                    onClick={() => toggle(t.id)}
                    aria-label={`Select ${t.number}`}
                    className={cx(
                      'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
                      isSel ? 'border-brand bg-brand text-brand-fg' : 'border-ink-subtle/40 text-transparent hover:border-ink-subtle',
                    )}
                  >
                    <Check size={11} strokeWidth={3} />
                  </button>

                  <button onClick={() => onOpen(t.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    {t.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    <ChannelIcon channel={t.channel} size={13} />
                    <span className="min-w-0">
                      <span className={cx('block truncate', t.unread ? 'font-bold text-ink' : 'font-medium text-ink')}>{t.subject}</span>
                      <span className="block truncate text-[11px] text-ink-subtle">
                        <span className="font-mono">{t.number}</span> · {t.requester}
                      </span>
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </button>

                  <span className="hidden w-28 shrink-0 sm:block"><TicketStageBadge stage={t.stage} /></span>
                  <span className="hidden w-24 shrink-0 md:block"><AssigneePill id={t.assigneeId} /></span>
                  <span className="hidden w-24 shrink-0 text-right text-[11px] text-ink-subtle lg:block">{relativeTime(t.updatedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="animate-pop sticky bottom-3 z-10 mx-auto mt-3 flex max-w-2xl flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
          <span className="text-[13px] font-semibold text-ink">{selected.size} selected</span>
          <span className="h-4 w-px bg-line" />
          <select
            value={bulkStage}
            onChange={(e) => setBulkStage(e.target.value as TicketStage)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {TICKET_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Button size="xs" variant="secondary" onClick={applyStage}>Apply stage</Button>
          <Button size="xs" variant="ghost" onClick={markRead}><CheckCheck size={13} /> Mark read</Button>
          <button onClick={clear} aria-label="Clear selection" className="ml-auto rounded-lg p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
