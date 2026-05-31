/**
 * Ticket list / workspace + bulk actions — adapts Ticketing's TicketListView
 * and BulkActionsBar. A dense, sortable table (sticky header) whose rows open
 * the detail drawer. A checkbox column drives multi-select; the floating bulk
 * bar applies stage / assignee / priority changes and mark-read to the
 * in-memory store. All sorting/selection is local; no network.
 */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, CheckCheck, Clock, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, Ticket, TicketStage } from '../types';
import { PRIORITIES, TEAM, TICKET_STAGES, personName, ticketStageMeta } from '../data';
import { ticketCategory } from '../ticketMeta';
import { AssigneePill, ChannelIcon, PriorityBadge } from './shared';

type SortField = 'number' | 'subject' | 'priority' | 'updated';
const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function isOverdue(t: Ticket): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.stage !== 'resolved' && t.stage !== 'closed';
}

const headCls = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-subtle';

export function TicketList({
  tickets,
  onOpen,
}: {
  tickets: Ticket[];
  onOpen: (id: string) => void;
}) {
  const { bulkUpdateTickets } = useProductivity();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [bulkStage, setBulkStage] = useState<TicketStage>('resolved');
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [bulkPriority, setBulkPriority] = useState<Priority>('high');

  const sorted = useMemo(() => {
    const list = [...tickets];
    list.sort((a, b) => {
      let c = 0;
      if (sortField === 'number') c = a.number.localeCompare(b.number);
      else if (sortField === 'subject') c = a.subject.localeCompare(b.subject);
      else if (sortField === 'priority') c = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else c = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDir === 'desc' ? -c : c;
    });
    return list;
  }, [tickets, sortField, sortDir]);

  const visibleIds = useMemo(() => sorted.map((t) => t.id), [sorted]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visibleIds));
  const clear = () => setSelected(new Set());

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir(field === 'subject' || field === 'number' ? 'asc' : 'desc'); }
  };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={11} className="text-ink-subtle/50" />;
    return sortDir === 'asc' ? <ArrowUp size={11} className="text-brand" /> : <ArrowDown size={11} className="text-brand" />;
  };
  const SortHead = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th className={cx(headCls, 'cursor-pointer select-none hover:text-ink', className)} onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label} <SortIcon field={field} /></span>
    </th>
  );

  const applyStage = () => {
    bulkUpdateTickets([...selected], { stage: bulkStage }, `Moved to ${ticketStageMeta(bulkStage).label}`);
    clear();
  };
  const applyAssignee = () => {
    bulkUpdateTickets([...selected], { assigneeId: bulkAssignee || undefined }, bulkAssignee ? `Assigned to ${personName(bulkAssignee)}` : 'Unassigned');
    clear();
  };
  const applyPriority = () => {
    bulkUpdateTickets([...selected], { priority: bulkPriority }, `Priority set to ${PRIORITIES.find((p) => p.id === bulkPriority)?.label}`);
    clear();
  };
  const markRead = () => {
    bulkUpdateTickets([...selected], { unread: false }, 'Marked as read');
    clear();
  };

  const CheckBox = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className={cx(
        'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
        on ? 'border-brand bg-brand text-brand-fg' : 'border-ink-subtle/40 text-transparent hover:border-ink-subtle',
      )}
    >
      <Check size={11} strokeWidth={3} />
    </button>
  );

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-sunken">
              <tr className="border-b border-line">
                <th className="w-10 px-3 py-2">
                  <CheckBox on={allSelected} label="Select all" onClick={toggleAll} />
                </th>
                <SortHead field="number" label="Ticket" className="w-[110px]" />
                <SortHead field="subject" label="Subject" />
                <th className={cx(headCls, 'hidden w-[190px] lg:table-cell')}>From</th>
                <th className={cx(headCls, 'hidden w-[120px] xl:table-cell')}>Category</th>
                <th className={cx(headCls, 'hidden w-[130px] sm:table-cell')}>Stage</th>
                <SortHead field="priority" label="Priority" className="hidden w-[96px] sm:table-cell" />
                <th className={cx(headCls, 'hidden w-[150px] md:table-cell')}>Assignee</th>
                <SortHead field="updated" label="Updated" className="hidden w-[96px] lg:table-cell" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-ink-subtle">
                    No tickets match your filters.
                  </td>
                </tr>
              ) : (
                sorted.map((t) => {
                  const isSel = selected.has(t.id);
                  const stageMeta = ticketStageMeta(t.stage);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onOpen(t.id)}
                      className={cx(
                        'cursor-pointer border-b border-line/70 text-sm transition-colors hover:bg-surface-sunken/60',
                        isSel ? 'bg-brand/5' : !t.unread ? '' : 'bg-brand/[0.025]',
                      )}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); toggle(t.id); }}>
                        <CheckBox on={isSel} label={`Select ${t.number}`} onClick={() => toggle(t.id)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          {t.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                          <span className={cx('font-mono text-xs', t.unread ? 'font-semibold text-ink' : 'text-ink-muted')}>{t.number}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <ChannelIcon channel={t.channel} size={13} />
                          <span className="min-w-0">
                            <span className={cx('block truncate text-[13px]', t.unread ? 'font-bold text-ink' : 'font-medium text-ink')}>{t.subject}</span>
                            <span className="block truncate text-[11px] text-ink-subtle lg:hidden">{t.requester}</span>
                          </span>
                          {isOverdue(t) && <span className="ml-0.5 hidden shrink-0 rounded-full bg-bad/10 px-1.5 py-px text-[10px] font-semibold text-bad sm:inline">Overdue</span>}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">
                        {t.requesterEmail ? (
                          <span className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
                            <Mail size={12} className="shrink-0 text-ink-subtle" />
                            <span className="truncate" title={t.requesterEmail}>{t.requesterEmail}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">{t.requester}</span>
                        )}
                      </td>
                      <td className="hidden px-3 py-2.5 xl:table-cell">
                        <span className="text-[12px] text-ink-muted">{ticketCategory(t)}</span>
                      </td>
                      <td className="hidden px-3 py-2.5 sm:table-cell">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stageMeta.accent }} />
                          <span className="text-xs font-medium text-ink-muted">{stageMeta.label}</span>
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 sm:table-cell"><PriorityBadge priority={t.priority} /></td>
                      <td className="hidden px-3 py-2.5 md:table-cell"><AssigneePill id={t.assigneeId} /></td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
                          <Clock size={11} /> {relativeTime(t.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="animate-pop sticky bottom-3 z-10 mx-auto mt-3 flex max-w-4xl flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
          <span className="text-[13px] font-semibold text-ink">{selected.size} selected</span>
          <span className="h-4 w-px bg-line" />

          <div className="flex items-center gap-1">
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value as TicketStage)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-label="Bulk stage"
            >
              {TICKET_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <Button size="xs" variant="secondary" onClick={applyStage}>Move</Button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-label="Bulk assignee"
            >
              <option value="">Unassigned</option>
              {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <Button size="xs" variant="secondary" onClick={applyAssignee}>Assign</Button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={bulkPriority}
              onChange={(e) => setBulkPriority(e.target.value as Priority)}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-label="Bulk priority"
            >
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <Button size="xs" variant="secondary" onClick={applyPriority}>Set priority</Button>
          </div>

          <Button size="xs" variant="ghost" onClick={markRead}><CheckCheck size={13} /> Mark read</Button>
          <button onClick={clear} aria-label="Clear selection" className="ml-auto rounded-lg p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
