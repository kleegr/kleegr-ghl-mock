import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Phone, MessageSquare, Tag, FileText, CheckSquare, Calendar, UserX, Check,
} from 'lucide-react';
import type { Opportunity, Contact, User, Company } from '@/types';
import { moneyCents, fullName, cx } from '@/utils';
import { Avatar } from '@/components/ui/primitives';

interface SharedProps {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
  companies: Company[];
}

/** Stable pseudo-counts so each card shows the same little activity badges across renders. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** A muted activity affordance row (calls, sms, tags, notes, tasks, appts) — cosmetic, like GHL. */
function ActivityRow({ id }: { id: string }) {
  const h = hash(id);
  const icons = [
    { Icon: Phone, badge: 0 },
    { Icon: MessageSquare, badge: 0 },
    { Icon: Tag, badge: (h >> 2) % 3 === 0 ? ((h >> 3) % 3) + 1 : 0 },
    { Icon: FileText, badge: (h >> 4) % 2 === 0 ? ((h >> 5) % 4) + 1 : 0 },
    { Icon: CheckSquare, badge: (h >> 6) % 3 === 0 ? ((h >> 7) % 2) + 1 : 0 },
    { Icon: Calendar, badge: 0 },
  ];
  return (
    <div className="mt-3 flex items-center gap-3 text-ink-subtle">
      {icons.map(({ Icon, badge }, i) => (
        <span key={i} className="relative inline-flex">
          <Icon size={15} strokeWidth={1.8} />
          {badge > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand px-0.5 text-[8px] font-bold leading-none text-brand-fg">
              {badge}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Body shared by the live card and the drag overlay. */
function CardBody({
  opportunity: opp,
  contacts,
  users,
  companies,
  reserveCorner = false,
}: SharedProps & { reserveCorner?: boolean }) {
  const contact = contacts.find((c) => c.id === opp.contactId);
  const owner = users.find((u) => u.id === opp.ownerId);
  const company = contact?.companyId
    ? companies.find((co) => co.id === contact.companyId)
    : undefined;

  return (
    <div className="px-3.5 py-3">
      {/* Title + owner */}
      <div className={cx('flex items-start justify-between gap-2', reserveCorner && 'pr-7')}>
        <p className="flex-1 truncate text-[13px] font-semibold leading-snug text-ink">
          {opp.name || (contact ? fullName(contact) : 'Untitled')}
        </p>
        {owner ? (
          <Avatar name={owner.name} size="xs" className="mt-0.5" />
        ) : (
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-subtle">
            <UserX size={12} />
          </span>
        )}
      </div>

      {/* Field rows */}
      <dl className="mt-2.5 space-y-1.5 text-[12px]">
        {company && (
          <div className="flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-subtle">Business Name:</dt>
            <dd className="min-w-0 truncate text-ink-muted">{company.name}</dd>
          </div>
        )}
        {opp.source && (
          <div className="flex items-baseline gap-2">
            <dt className="w-24 shrink-0 text-ink-subtle">Source:</dt>
            <dd className="min-w-0 truncate text-ink-muted">{opp.source}</dd>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <dt className="w-24 shrink-0 text-ink-subtle">Value:</dt>
          <dd className="font-semibold text-ink">{moneyCents(opp.monetaryValue)}</dd>
        </div>
      </dl>

      <ActivityRow id={opp.id} />
    </div>
  );
}

/** Floating preview rendered inside DragOverlay while dragging. */
export function OpportunityCardOverlay(props: SharedProps) {
  return (
    <div className="w-[280px] rotate-1 rounded-lg border border-brand bg-surface opacity-95 shadow-pop">
      <CardBody {...props} />
    </div>
  );
}

interface CardProps extends SharedProps {
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

/**
 * Kanban card. Default mode: whole card is draggable (distance-guarded so a
 * click still opens the detail drawer). Selection mode: a checkbox toggles
 * selection and drag is disabled.
 */
export function OpportunityCard({
  opportunity,
  contacts,
  users,
  companies,
  onClick,
  selectable = false,
  selected = false,
  onToggleSelect,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    disabled: selectable,
  });
  const downAt = useRef<{ x: number; y: number } | null>(null);

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const dragProps = selectable ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onPointerDown={(e) => {
        downAt.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (selectable) {
          onToggleSelect?.();
          return;
        }
        const s = downAt.current;
        const dist = s ? Math.hypot(e.clientX - s.x, e.clientY - s.y) : 0;
        if (dist < 6) onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectable ? onToggleSelect?.() : onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${opportunity.name}`}
      data-tour="opportunities.card"
      className={cx(
        'group relative rounded-lg border bg-surface shadow-card transition-all',
        selectable ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-30' : 'hover:border-brand/40 hover:shadow-pop/40',
        selected ? 'border-brand ring-1 ring-brand' : 'border-line',
      )}
    >
      {/* Selection checkbox (selection mode only) */}
      {selectable && (
        <span
          className={cx(
            'absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded border transition-colors',
            selected ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-transparent',
          )}
          aria-hidden="true"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      <CardBody
        opportunity={opportunity}
        contacts={contacts}
        users={users}
        companies={companies}
        reserveCorner={selectable}
      />
    </div>
  );
}
