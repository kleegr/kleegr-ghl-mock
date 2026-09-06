import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Phone, MessageSquare, Mail, FileText, CheckSquare, Calendar, UserX, Check,
} from 'lucide-react';
import type { Opportunity, OpportunityActivity, Contact, User, Company } from '@/types';
import { moneyCents, fullName, cx } from '@/utils';
import { Avatar } from '@/components/ui/primitives';

interface SharedProps {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
  companies: Company[];
}

/** Real activity affordance row (calls, sms, emails, notes, tasks, appts) — driven by the record. */
function ActivityRow({ activity }: { activity: OpportunityActivity }) {
  const items = [
    { Icon: Phone, badge: activity.calls },
    { Icon: MessageSquare, badge: activity.sms },
    { Icon: Mail, badge: activity.emails },
    { Icon: FileText, badge: activity.notes },
    { Icon: CheckSquare, badge: activity.tasks },
    { Icon: Calendar, badge: activity.appointments },
  ];
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[#98a2b3]">
      {items.map(({ Icon, badge }, i) => (
        <span key={i} className="relative grid h-5 w-5 place-items-center rounded-full border border-[#e1e6ed] bg-[#fbfcfd]">
          <Icon size={10} strokeWidth={1.8} />
          {badge > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#1689f4] px-0.5 text-[8px] font-bold leading-none text-white">
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
  const businessName = opp.businessName ?? company?.name;

  return (
    <div className="px-2.5 py-2.5">
      {/* Title + owner */}
      <div className={cx('flex items-start justify-between gap-2', reserveCorner && 'pr-7')}>
        <p className="flex-1 truncate text-[12px] font-semibold leading-[17px] text-[#344054]">
          {opp.name || (contact ? fullName(contact) : 'Untitled')}
        </p>
        {owner ? (
          <Avatar name={owner.name} size="xs" />
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef1f5] text-[#98a2b3]">
            <UserX size={12} />
          </span>
        )}
      </div>

      {/* Field rows */}
      <dl className="mt-2 space-y-1 text-[11px] leading-4">
        {businessName && (
          <div className="flex items-baseline gap-2">
            <dt className="w-[82px] shrink-0 text-[#98a2b3]">Business:</dt>
            <dd className="min-w-0 truncate text-[#667085]">{businessName}</dd>
          </div>
        )}
        {opp.source && (
          <div className="flex items-baseline gap-2">
            <dt className="w-[82px] shrink-0 text-[#98a2b3]">Source:</dt>
            <dd className="min-w-0 truncate text-[#667085]">{opp.source}</dd>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <dt className="w-[82px] shrink-0 text-[#98a2b3]">Value:</dt>
          <dd className="font-semibold text-[#344054]">{moneyCents(opp.monetaryValue)}</dd>
        </div>
      </dl>

      {opp.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {opp.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-[4px] bg-[#eef1f4] px-1.5 py-0.5 text-[9px] font-medium text-[#667085]">
              {t}
            </span>
          ))}
          {opp.tags.length > 3 && (
            <span className="self-center text-[9px] text-[#98a2b3]">+{opp.tags.length - 3}</span>
          )}
        </div>
      )}

      <ActivityRow activity={opp.activity} />
    </div>
  );
}

/** Floating preview rendered inside DragOverlay while dragging. */
export function OpportunityCardOverlay(props: SharedProps) {
  return (
    <div className="w-[266px] rotate-1 rounded-lg border border-[#1689f4] bg-white opacity-95 shadow-pop">
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
        'group relative rounded-lg border bg-white transition-all',
        selectable ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-30' : 'hover:border-[#9ecbfb] hover:shadow-[0_2px_8px_rgba(16,24,40,0.08)]',
        selected ? 'border-[#1689f4] ring-1 ring-[#1689f4]' : 'border-[#dfe4eb]',
      )}
    >
      {/* Selection checkbox (selection mode only) */}
      {selectable && (
        <span
          className={cx(
            'absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded border transition-colors',
            selected ? 'border-[#1689f4] bg-[#1689f4] text-white' : 'border-[#cbd3df] bg-white text-transparent',
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
