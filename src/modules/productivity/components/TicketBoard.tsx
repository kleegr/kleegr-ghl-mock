/**
 * Ticket board (stage columns) — adapts Ticketing's WorkspaceView/board.
 * Cards are draggable between stages via the shared KanbanBoard primitive;
 * dropping a card moves the ticket's stage in the in-memory store. Cards show
 * the support-desk signal set: unread dot, ticket number + channel, priority,
 * category, requester/company, tags, assignee, and a clear overdue/SLA chip.
 */

import { AlertCircle, Clock } from 'lucide-react';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Ticket } from '../types';
import { TICKET_STAGES } from '../data';
import { ticketCategory } from '../ticketMeta';
import { AssigneePill, ChannelIcon, PriorityBadge, TagChip } from './shared';
import { KanbanBoard } from './Board';

function isOverdue(t: Ticket): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.stage !== 'resolved' && t.stage !== 'closed';
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const overdue = isOverdue(ticket);
  const tags = ticket.tags.slice(0, 3);
  const extra = ticket.tags.length - tags.length;

  return (
    <div
      className={cx(
        'rounded-lg border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-brand/40',
        ticket.unread ? 'border-brand/50' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-subtle">
          {ticket.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
          <span className="font-mono">{ticket.number}</span>
          <ChannelIcon channel={ticket.channel} size={12} />
          <span className="truncate rounded bg-surface-sunken px-1.5 py-px text-[10px] font-medium text-ink-muted">
            {ticketCategory(ticket)}
          </span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className={cx('mt-1.5 line-clamp-2 text-[13px] leading-snug', ticket.unread ? 'font-bold text-ink' : 'font-semibold text-ink')}>
        {ticket.subject}
      </p>

      <p className="mt-1 truncate text-[12px] text-ink-muted">
        {ticket.requester}{ticket.company ? ` · ${ticket.company}` : ''}
      </p>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {tags.map((t) => <TagChip key={t}>{t}</TagChip>)}
          {extra > 0 && <span className="text-[10.5px] text-ink-subtle">+{extra}</span>}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <AssigneePill id={ticket.assigneeId} />
        {overdue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-bad/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-bad">
            <AlertCircle size={11} /> Overdue
          </span>
        ) : ticket.dueAt ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
            <Clock size={11} /> {dateLabel(ticket.dueAt)}
          </span>
        ) : null}
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
