import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Phone, MessageSquare, Tag, FileText, CheckSquare, Calendar,
  UserX, Check, GripVertical, ChevronRight,
} from 'lucide-react';
import type { Opportunity, Contact, User, Company, Stage } from '@/types';
import { moneyCents, fullName, cx } from '@/utils';
import { Avatar } from '@/components/ui/primitives';

interface SharedProps {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
  companies: Company[];
}

/** Stable pseudo-counts so each card shows the same activity badges across renders. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Cosmetic activity-icon row (calls, sms, tags, notes, tasks, appts) — mirrors GHL. */
function ActivityRow({ id }: { id: string }) {
  const h = hash(id);
  const icons = [
    { Icon: Phone,       badge: 0 },
    { Icon: MessageSquare, badge: 0 },
    { Icon: Tag,         badge: (h >> 2) % 3 === 0 ? ((h >> 3) % 3) + 1 : 0 },
    { Icon: FileText,    badge: (h >> 4) % 2 === 0 ? ((h >> 5) % 4) + 1 : 0 },
    { Icon: CheckSquare, badge: (h >> 6) % 3 === 0 ? ((h >> 7) % 2) + 1 : 0 },
    { Icon: Calendar,    badge: 0 },
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

/** Body shared between the live card and the drag overlay. */
function CardBody({
  opportunity: opp,
  contacts,
  users,
  companies,
  reserveCorner = false,
}: SharedProps & { reserveCorner?: boolean }) {
  const contact = contacts.find((c) => c.id === opp.contactId);
  const owner   = users.find((u) => u.id === opp.ownerId);
  const company = contact?.companyId
    ? companies.find((co) => co.id === contact.companyId)
    : undefined;

  return (
    <div className="px-3.5 py-3">
      {/* Title + owner avatar */}
      <div className={cx('flex items-start justify-between gap-2', reserveCorner && 'pr-7')}>
        <p className="flex-1 truncate text-[13px] font-semibold leading-snug text-ink">
          {opp.name || (contact ? fullName(contact) : 'Untitled')}
        </p>
        {owner ? (
          <Avatar name={owner.name} size="xs" className="mt-0.5 shrink-0" />
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

/** Ghost card rendered inside DragOverlay while a drag is in progress. */
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
  /**
   * All stages in the current pipeline — used to populate the quick-move
   * stage picker.  Omitting this prop disables the move button.
   */
  allStages?: Stage[];
  /**
   * Called when the user picks a destination stage from the quick-move
   * picker.  Should forward to store.moveOpportunity.
   */
  onMove?: (oppId: string, stageId: string) => void;
}

/**
 * Kanban opportunity card.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DESKTOP DRAG:
 *   The whole card surface is the drag handle (PointerSensor, 6 px guard).
 *   A GripVertical icon fades in on hover as an affordance hint.
 *   A plain click (< 6 px movement) opens the detail drawer.
 *
 * MOBILE / TOUCH FALLBACK:
 *   The "Move →" chip is always visible on narrow screens (< sm breakpoint).
 *   On wider screens it appears only on hover so the card stays clean.
 *   Clicking the chip opens a fixed-positioned stage picker — fixed so it
 *   is never clipped by the column's overflow-y-auto scroll container.
 *   The chip's pointer events are stopped before bubbling so it can never
 *   accidentally start a drag or open the detail drawer.
 *
 *   The detail modal (opened by tapping the card body) also provides a
 *   stage-change dropdown wired to moveOpportunity as a secondary path.
 *
 * SELECTION MODE:
 *   Checkbox replaces drag; the whole card is a toggle target.
 * ──────────────────────────────────────────────────────────────────────────
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
  allStages,
  onMove,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    disabled: selectable,
  });

  const downAt = useRef<{ x: number; y: number } | null>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const dragProps = selectable ? {} : { ...attributes, ...listeners };

  // Stages the card can be moved TO (excludes its current stage).
  const moveTargets = allStages?.filter((s) => s.id !== opportunity.stageId) ?? [];
  const showMoveButton = !selectable && !!onMove && moveTargets.length > 0;

  function openMovePicker() {
    if (!moveButtonRef.current) return;
    const rect = moveButtonRef.current.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
    setMoveOpen(true);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onPointerDown={(e) => {
        downAt.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (selectable) { onToggleSelect?.(); return; }
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
        isDragging ? 'opacity-25 shadow-none' : 'hover:border-brand/40 hover:shadow-pop/40',
        selected ? 'border-brand ring-1 ring-brand' : 'border-line',
      )}
    >
      {/* Drag-affordance grip — appears on group-hover as a subtle desktop hint */}
      {!selectable && (
        <span
          className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-subtle/25 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <GripVertical size={14} />
        </span>
      )}

      {/* Selection checkbox — only in bulk-select mode */}
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

      {/*
        ── Quick-move chip ────────────────────────────────────────────────────
        Visibility contract:
          • Narrow screens (< 640 px / sm):  always visible — touch users
            cannot reliably long-press-drag, so the chip is the primary path.
          • Wider screens (≥ 640 px):         opacity-0 by default, fades in
            on group-hover so the card stays uncluttered at a glance.

        The chip and its dropdown stop pointer-event propagation so they
        never trigger drag activation or the card-body click handler.

        The dropdown is rendered with position:fixed so it escapes the
        column's overflow-y-auto scroll container without needing a portal.
       ────────────────────────────────────────────────────────────────────── */}
      {showMoveButton && (
        <div
          className="flex items-center justify-end border-t border-line/30 px-3 pb-2 pt-1.5"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={moveButtonRef}
            type="button"
            aria-label="Move to another stage"
            title="Move to another stage"
            onClick={openMovePicker}
            className={cx(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none transition-all',
              moveOpen
                ? 'border-brand bg-brand text-brand-fg'
                : 'border-line bg-surface-sunken text-ink-muted hover:border-brand/40 hover:text-brand opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            )}
          >
            Move <ChevronRight size={9} />
          </button>
        </div>
      )}

      {/* Fixed-positioned stage picker — escapes column overflow */}
      {moveOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200]"
            onClick={(e) => { e.stopPropagation(); setMoveOpen(false); }}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            style={{
              position: 'fixed',
              top:   dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 201,
            }}
            className="min-w-[11rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
          >
            <p className="border-b border-line/60 px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Move to stage
            </p>
            {moveTargets.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove!(opportunity.id, stage.id);
                  setMoveOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-sunken hover:text-brand"
              >
                <ChevronRight size={12} className="shrink-0 text-brand" />
                <span className="truncate">{stage.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
