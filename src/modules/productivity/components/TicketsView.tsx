/**
 * Tickets tab — board/list toggle, search, and filters over the in-memory
 * ticket set. Hosts the Create Ticket modal and the detail drawer. Adapts
 * Ticketing's workspace toggle + filter/search header + NEW TICKET CTA.
 */

import { useMemo, useState } from 'react';
import { KanbanSquare, List, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, TicketStage } from '../types';
import { PRIORITIES, TICKET_STAGES } from '../data';
import { SelectInput, inputCls } from './shared';
import { TicketBoard } from './TicketBoard';
import { TicketList } from './TicketList';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketDetailDrawer } from './TicketDetailDrawer';

type View = 'board' | 'list';

export function TicketsView({ onOpenTask }: { onOpenTask?: (taskId: string) => void }) {
  const { tickets } = useProductivity();
  const [view, setView] = useState<View>('board');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<TicketStage | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (stage !== 'all' && t.stage !== stage) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (unreadOnly && !t.unread) return false;
      if (q) {
        const hay = `${t.number} ${t.subject} ${t.requester} ${t.company ?? ''} ${t.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, query, stage, priority, unreadOnly]);

  const unreadCount = tickets.filter((t) => t.unread).length;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets…"
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

        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={cx(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors',
            unreadOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken',
          )}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-line p-0.5">
            <button
              onClick={() => setView('board')}
              className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors', view === 'board' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')}
              aria-label="Board view"
            >
              <KanbanSquare size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors', view === 'list' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')}
              aria-label="List view"
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
