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

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function ActivityRow({ id }: { id: string }) {
  const h = hash(id);
  const icons = [
    { Icon: Phone,         badge: 0 },
    { Icon: MessageSquare, badge: 0 },
    { Icon: Tag,           badge: (h >> 2) % 3 === 0 ? ((h >> 3) % 3) + 1 : 0 },
    { Icon: FileText,      badge: (h >> 4) % 2 === 0 ? ((h >> 5) % 4) + 1 : 0 },
    { Icon: CheckSquare,   badge: (h >> 6) % 3 === 0 ? ((h >> 7) % 2) + 1 : 0 },
    { Icon: Calendar,      badge: 0 },
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
  allStages?: Stage[];
  onMove?: (oppId: string, stageId: string) => void;
}

/**
 * Kanban opportunity card.
 *
 * DESKTOP: full-card drag (PointerSensor 6 px guard). GripVertical hint on
 * hover. Plain click opens detail drawer.
 *
 * MOBILE / TOUCH — two paths:
 *   1. Hold 150 ms then drag to another column (TouchSensor).
 *   2. Tap the "Move to another stage" button (always visible on narrow
 *      screens).  This opens a fixed-position stage picker so it is never
 *      clipped by the column's overflow-y-auto scroll container.
 *      Button tap/touch events stop propagation before reaching the card
 *      root so drag-start and card-click are never triggered accidentally.
 *
 * SELECTION MODE: checkbox toggles; drag disabled.
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

  const downAt       = useRef<{ x: number; y: number } | null>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const [moveOpen, setMoveOpen]       = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0, left: -1 });

  const style    = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const dragProps = selectable ? {} : { ...attributes, ...listeners };

  const moveTargets   = allStages?.filter((s) => s.id !== opportunity.stageId) ?? [];
  const showMoveButton = !selectable && !!onMove && moveTargets.length > 0;

  /**
   * Calculate a fixed position for the stage-picker dropdown.
   * On narrow screens the dropdown is centred / full-width;
   * on wider screens it aligns to the button's right edge.
   */
  function openMovePicker() {
    if (!moveButtonRef.current) return;
    const rect   = moveButtonRef.current.getBoundingClientRect();
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;
    // Rough dropdown height (header + items)
    const estH   = 52 + moveTargets.length * 56;
    const spaceB = vh - rect.bottom - 10;
    const spaceA = rect.top - 10;
    const top    = spaceB >= estH || spaceB >= spaceA
      ? rect.bottom + 6
      : Math.max(10, rect.top - estH - 6);

    if (vw < 640) {
      // Mobile: pin to left edge with 12 px margin, near-full-width
      setDropdownPos({ top, left: 12, right: -1 });
    } else {
      // Desktop: right-align to the button
      setDropdownPos({ top, right: vw - rect.right, left: -1 });
    }
    setMoveOpen(true);
  }

  /** Block both pointer and touch so neither drag-start nor card-click fires. */
  function stopAll(e: React.SyntheticEvent) { e.stopPropagation(); }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onPointerDown={(e) => { downAt.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        if (selectable) { onToggleSelect?.(); return; }
        const s    = downAt.current;
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
      {/* Drag-affordance grip (hover hint on desktop) */}
      {!selectable && (
        <span
          className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-subtle/25 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <GripVertical size={14} />
        </span>
      )}

      {/* Bulk-select checkbox */}
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
        ── Quick-move affordance ─────────────────────────────────────────────

        MOBILE  (< 640 px):  Full-width button with a large tap target and
        a clear label.  Always visible so there is no need to hover or
        know about drag-and-drop.  Touch & pointer events are stopped on
        the wrapper so neither drag-start nor the card-click handler fires.

        DESKTOP (≥ 640 px):  A small "Move →" chip, opacity-0 at rest,
        fades in on group-hover.  Same fixed-position dropdown.
       ─────────────────────────────────────────────────────────────────────
      */}
      {showMoveButton && (
        <div
          // Mobile: plain block so the button fills full width
          // Desktop: flex row right-aligned so the chip floats right
          className="border-t border-line/30 px-3 pb-3 pt-2 sm:flex sm:items-center sm:justify-end sm:pb-2 sm:pt-1.5"
          onPointerDown={stopAll}
          onTouchStart={stopAll}
          onClick={stopAll}
        >
          <button
            ref={moveButtonRef}
            type="button"
            aria-label="Move to another stage"
            onClick={openMovePicker}
            className={cx(
              // ── Shared base ──────────────────────────────────────────────
              'flex items-center justify-center gap-1.5 rounded-lg border transition-all',

              // ── Mobile sizing (base — applies to all sizes unless overridden)
              // Large enough to tap comfortably (≥ 44 px tall)
              'w-full py-2.5 text-[14px] font-semibold',

              // ── Desktop sizing (sm and up) ───────────────────────────────
              'sm:w-auto sm:rounded-full sm:py-0.5 sm:px-2 sm:text-[10px] sm:font-bold sm:leading-none',

              // ── State colours ────────────────────────────────────────────
              moveOpen
                ? // Active (dropdown open) — same on all sizes
                  'border-brand bg-brand text-brand-fg'
                : [
                    // Mobile rest: prominent brand-tinted button
                    'border-brand/25 bg-brand-soft text-brand',
                    'active:bg-brand active:border-brand active:text-brand-fg',
                    // Desktop rest: hidden chip, hover-reveal
                    'sm:border-line sm:bg-surface-sunken sm:text-ink-muted',
                    'sm:opacity-0 sm:group-hover:opacity-100',
                    'sm:hover:border-brand/40 sm:hover:text-brand',
                  ].join(' '),
            )}
          >
            {/* Mobile label */}
            <ChevronRight size={15} className="sm:hidden" />
            <span className="sm:hidden">Move to another stage</span>
            {/* Desktop label */}
            <span className="hidden sm:inline">Move</span>
            <ChevronRight size={9} className="hidden sm:block" />
          </button>
        </div>
      )}

      {/* ── Fixed-position stage picker ─────────────────────────────────────
           Rendered with position:fixed so it is never clipped by the
           column's overflow-y-auto.  Positioning is recalculated on each
           open so it adjusts for scroll position and viewport constraints.
          ─────────────────────────────────────────────────────────────────── */}
      {moveOpen && (
        <>
          {/* Backdrop — closes picker on outside tap/click */}
          <div
            className="fixed inset-0 z-[200]"
            onClick={(e) => { e.stopPropagation(); setMoveOpen(false); }}
            aria-hidden="true"
          />

          {/* Picker panel */}
          <div
            style={{
              position: 'fixed',
              top:      dropdownPos.top,
              // On mobile left is set; on desktop right is set.
              ...(dropdownPos.left >= 0
                ? { left: dropdownPos.left, right: 'auto' }
                : { right: dropdownPos.right, left: 'auto' }),
              zIndex: 201,
              // Never overflow the viewport horizontally
              maxWidth: 'calc(100vw - 24px)',
            }}
            className="min-w-[13rem] overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          >
            <p className="border-b border-line/60 px-4 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-subtle sm:px-3 sm:pb-1.5 sm:pt-2 sm:text-[10px]">
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
                // Mobile: taller tap target (py-3.5), larger text
                // Desktop: compact (sm:py-2, sm:text-[13px])
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-ink transition-colors hover:bg-surface-sunken hover:text-brand active:bg-brand-soft sm:gap-2 sm:px-3 sm:py-2.5 sm:text-[13px]"
              >
                <ChevronRight size={15} className="shrink-0 text-brand sm:hidden" />
                <ChevronRight size={12} className="hidden shrink-0 text-brand sm:block" />
                <span className="truncate">{stage.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
