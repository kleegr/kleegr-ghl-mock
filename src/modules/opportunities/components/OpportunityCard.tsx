import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Opportunity, Contact, User } from '@/types';
import { money, relativeTime, fullName, cx } from '@/utils';
import { Badge, Avatar } from '@/components/ui/primitives';

type StatusTone = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';

function statusTone(status: Opportunity['status']): StatusTone {
  const map: Record<Opportunity['status'], StatusTone> = {
    open: 'brand',
    won: 'good',
    lost: 'bad',
    abandoned: 'warn',
  };
  return map[status];
}

interface SharedProps {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
}

/** Inline card body — reused inside the drag-active card and the DragOverlay. */
function CardBody({ opportunity: opp, contacts, users }: SharedProps) {
  const contact = contacts.find((c) => c.id === opp.contactId);
  const owner = users.find((u) => u.id === opp.ownerId);

  return (
    <div className="p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-xs font-semibold leading-snug text-ink line-clamp-2">
          {opp.name}
        </p>
        <Badge tone={statusTone(opp.status)} size="sm">
          {opp.status}
        </Badge>
      </div>

      {contact && (
        <p className="mt-1 text-[11px] text-ink-muted">{fullName(contact)}</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{money(opp.monetaryValue)}</span>
        {owner && <Avatar name={owner.name} size="xs" />}
      </div>

      <p className="mt-1.5 text-[11px] text-ink-subtle">
        {opp.source ? `${opp.source} · ` : ''}
        {relativeTime(opp.createdAt)} ago
      </p>
    </div>
  );
}

/**
 * Floating preview rendered inside DragOverlay while a card is being dragged.
 * No drag listeners — pure visual.
 */
export function OpportunityCardOverlay({ opportunity, contacts, users }: SharedProps) {
  return (
    <div className="w-60 rotate-1 rounded-xl border-2 border-brand bg-surface opacity-95 shadow-pop">
      <div className="flex cursor-grabbing items-center gap-1 rounded-t-xl border-b border-line/50 bg-surface-sunken px-2 py-1">
        <GripVertical size={12} className="text-brand" />
        <span className="text-[10px] font-medium text-brand">Moving…</span>
      </div>
      <CardBody opportunity={opportunity} contacts={contacts} users={users} />
    </div>
  );
}

interface CardProps extends SharedProps {
  onClick: () => void;
}

/** Interactive kanban card — draggable via grip handle, clickable body opens detail. */
export function OpportunityCard({ opportunity, contacts, users, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        'rounded-lg border border-line bg-surface shadow-card transition-opacity',
        isDragging ? 'opacity-30 shadow-none' : 'hover:border-brand/30',
      )}
      data-tour="opportunities.card"
    >
      {/* Grip drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-1 rounded-t-lg border-b border-line/50 px-2 py-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink active:cursor-grabbing"
        data-tour="opportunities.moveCard"
        aria-label="Drag to move deal between stages"
      >
        <GripVertical size={12} />
        <span className="text-[10px] font-medium">Drag to move</span>
      </div>

      {/* Card body — click opens detail */}
      <button
        type="button"
        className={cx(
          'w-full cursor-pointer text-left transition-colors',
          !isDragging && 'hover:bg-surface-sunken/50',
        )}
        onClick={onClick}
        tabIndex={0}
        aria-label={`Open ${opportunity.name}`}
      >
        <CardBody opportunity={opportunity} contacts={contacts} users={users} />
      </button>
    </div>
  );
}
