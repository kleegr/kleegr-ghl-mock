/**
 * Tickets tab — the support-desk workspace. A clickable KPI stat strip sits
 * above a board/list toggle with search + stage/priority/assignee filters and
 * an overdue/unread quick-filter (driven by the stat cards). Hosts the Create
 * Ticket modal and the detail drawer. Adapts Ticketing's dashboard stats +
 * workspace toggle + filter header + NEW TICKET CTA.
 */

import { useMemo, useState } from 'react';
import { KanbanSquare, List, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, Ticket, TicketStage } from '../types';
import { PRIORITIES, TEAM, TICKET_STAGES } from '../data';
import { SelectInput, inputCls } from './shared';
import { TicketStats } from './TicketStats';
import { TicketBoard } from './TicketBoard';
import { TicketList } from './TicketList';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketDetailDrawer } from './TicketDetailDrawer';

type View = 'board' | 'list';

function isOverdue(t: Ticket): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.stage !== 'resolved' && t.stage !== 'closed';
}

export function TicketsView({ onOpenTask }: { onOpenTask?: (taskId: string) => void }) {
  const { tickets } = useProductivity();
  const [view, setView] = useState<View>('board');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<TicketStage | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [assignee, setAssignee] = useState<string>('all'); // 'all' | 'unassigned' | userId
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (stage !== 'all' && t.stage !== stage) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (assignee === 'unassigned' && t.assigneeId) return false;
      if (assignee !== 'all' && assignee !== 'unassigned' && t.assigneeId !== assignee) return false;
      if (unreadOnly && !t.unread) return false;
      if (overdueOnly && !isOverdue(t)) return false;
      if (q) {
        const hay = `${t.number} ${t.subject} ${t.requester} ${t.company ?? ''} ${t.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, query, stage, priority, assignee, unreadOnly, overdueOnly]);

  const filtersActive =
    query.trim() !== '' || stage !== 'all' || priority !== 'all' || assignee !== 'all' || unreadOnly || overdueOnly;

  const clearFilters = () => {
    setQuery(''); setStage('all'); setPriority('all'); setAssignee('all'); setUnreadOnly(false); setOverdueOnly(false);
  };

  // Stat-card → filter wiring (a card toggles its own filter on/off).
  const pickStage = (s: TicketStage) => setStage((cur) => (cur === s ? 'all' : s));

  return (
    <div className="flex h-full flex-col">
      {/* KPI stat strip (clickable quick filters) */}
      <TicketStats
        tickets={tickets}
        activeStage={stage}
        unreadOnly={unreadOnly}
        overdueOnly={overdueOnly}
        onPickStage={pickStage}
        onToggleUnread={() => setUnreadOnly((v) => !v)}
        onToggleOverdue={() => setOverdueOnly((v) => !v)}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets\u2026"
            className={`${inputCls} pl-8`}
          />
        </div>

        <div className="w-32">
          <SelectInput value={stage} onChange={(v) => setStage(v as TicketStage | 'all')}>
            <option value="all">All stages</option>
            {TICKET_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </SelectInput>
        </div>
        <div className="w-32">
          <SelectInput value={priority} onChange={(v) => setPriority(v as Priority | 'all')}>
            <option value="all">All priority</option>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </SelectInput>
        </div>
        <div className="w-36">
          <SelectInput value={assignee} onChange={setAssignee}>
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </SelectInput>
        </div>

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft"
          >
            <X size={13} /> Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[12px] text-ink-subtle tabular-nums sm:inline">
            {filtered.length} of {tickets.length}
          </span>
          {/* View toggle */}
          <div className="flex rounded-lg border border-line p-0.5">
            <button
              onClick={() => setView('board')}
              className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors', view === 'board' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')}
              aria-label="Board view"
              aria-pressed={view === 'board'}
            >
              <KanbanSquare size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors', view === 'list' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')}
              aria-label="List view"
              aria-pressed={view === 'list'}
            >
              <List size={15} />
            </button>
          </div>

          <Button size="sm" onClick={() => setCreateOpen(true)} data-tour="productivity.create-ticket">
            <Plus size={15} /> New Ticket
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'board' ? (
          <TicketBoard tickets={filtered} onOpen={setOpenId} />
        ) : (
          <div className="h-full overflow-y-auto pr-0.5">
            <TicketList tickets={filtered} onOpen={setOpenId} />
          </div>
        )}
      </div>

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TicketDetailDrawer ticketId={openId} onClose={() => setOpenId(null)} onOpenTask={onOpenTask} />
    </div>
  );
}
