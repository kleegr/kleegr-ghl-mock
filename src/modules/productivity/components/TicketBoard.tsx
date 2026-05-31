/**
 * Ticket board (stage columns) — adapts Ticketing's WorkspaceView/board.
 * Cards are draggable between stages via the shared KanbanBoard primitive;
 * dropping a card moves the ticket's stage in the in-memory store.
 */

import { Clock } from 'lucide-react';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Ticket } from '../types';
import { TICKET_STAGES } from '../data';
import { AssigneePill, ChannelIcon, PriorityBadge } from './shared';
import { KanbanBoard } from './Board';

function isOverdue(t: Ticket): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.stage !== 'resolved' && t.stage !== 'closed';
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div
      className={cx(
        'rounded-lg border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-brand/40',
        ticket.unread ? 'border-brand/50' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
          {ticket.unread && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />}
          <span className="font-mono">{ticket.number}</span>
          <ChannelIcon channel={ticket.channel} size={12} />
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className={cx('mt-1.5 line-clamp-2 text-[13px] leading-snug', ticket.unread ? 'font-bold text-ink' : 'font-semibold text-ink')}>
        {ticket.subject}
      </p>

      <p className="mt-1 truncate text-[12px] text-ink-muted">{ticket.requester}{ticket.company ? ` · ${ticket.company}` : ''}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <AssigneePill id={ticket.assigneeId} />
        {ticket.dueAt && (
          <span className={cx('inline-flex items-center gap-1 text-[11px]', isOverdue(ticket) ? 'font-semibold text-bad' : 'text-ink-subtle')}>
            <Clock size={11} /> {dateLabel(ticket.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function TicketBoard({
  tickets,
  onOpen,
}: {
  tickets: Ticket[];
  onOpen: (id: string) => void;
}) {
  const { moveTicket } = useProductivity();

  return (
    <KanbanBoard<Ticket>
      columns={TICKET_STAGES}
      items={tickets}
      columnOf={(t) => t.stage}
      onMove={(id, stage) => moveTicket(id, stage as Ticket['stage'])}
      onCardClick={onOpen}
      renderCard={(t) => <TicketCard ticket={t} />}
      tour="productivity.ticket-board"
      emptyHint="No tickets"
    />
  );
}
