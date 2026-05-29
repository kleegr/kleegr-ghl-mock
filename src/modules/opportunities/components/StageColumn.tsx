import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Stage, Opportunity, Contact, User, Company } from '@/types';
import { moneyCents, cx } from '@/utils';
import { OpportunityCard } from './OpportunityCard';

interface Props {
  stage: Stage;
  index?: number;
  /** All stages in this pipeline — threaded to each card for the quick-move picker. */
  allStages: Stage[];
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  companies: Company[];
  isAnyDragging: boolean;
  onCardClick: (id: string) => void;
  /** Called (by card quick-move OR drag-and-drop) when a card changes stage. */
  onMove: (oppId: string, stageId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleCard?: (id: string) => void;
  onToggleAll?: (ids: string[], next: boolean) => void;
}

/**
 * Six GHL-style header tints — cycles so adjacent columns always contrast.
 * Palette: green → amber → blue → rose → violet → orange → repeat.
 */
const STAGE_TINTS = [
  'bg-[#e7f6ee] border-[#b4e8cc]',  // 0 green
  'bg-[#fbf3e3] border-[#eddbad]',  // 1 amber
  'bg-[#eef2fb] border-[#bfcef5]',  // 2 blue
  'bg-[#fde8f3] border-[#f5b8de]',  // 3 rose
  'bg-[#f2ecfb] border-[#d4bef5]',  // 4 violet
  'bg-[#fef0e7] border-[#f5ccaa]',  // 5 orange
];

function headerTint(index: number): string {
  return STAGE_TINTS[index % STAGE_TINTS.length];
}

export function StageColumn({
  stage,
  index = 0,
  allStages,
  opportunities,
  contacts,
  users,
  companies,
  isAnyDragging,
  onCardClick,
  onMove,
  collapsed = false,
  onToggleCollapse,
  selectable = false,
  selectedIds,
  onToggleCard,
  onToggleAll,
}: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  const total = opportunities.reduce((sum, o) => sum + o.monetaryValue, 0);
  const count = opportunities.length;
  const tint = headerTint(index);
  const ids = opportunities.map((o) => o.id);
  const allSelected = selectable && ids.length > 0 && ids.every((id) => selectedIds?.has(id));

  /* ── Collapsed rail ─────────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        title={`Expand ${stage.name}`}
        aria-label={`Expand ${stage.name}`}
        className={cx(
          'flex h-full w-11 shrink-0 flex-col items-center gap-3 rounded-xl border pt-3 transition-colors hover:brightness-[0.97]',
          tint,
        )}
      >
        <ChevronRight size={15} className="text-ink-muted" />
        <span className="grid min-w-5 place-items-center rounded-full bg-surface/70 px-1.5 py-0.5 text-[11px] font-bold text-ink">
          {count}
        </span>
        <span
          className="mt-1 whitespace-nowrap text-[12px] font-semibold text-ink"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {stage.name}
        </span>
      </button>
    );
  }

  /* ── Expanded column ────────────────────────────────────────────────────── */
  return (
    <div
      className="flex w-[296px] shrink-0 flex-col rounded-xl border border-line bg-surface-sunken"
      data-tour="opportunities.stageColumn"
    >
      {/* Stage header */}
      <div className={cx('flex items-start justify-between gap-2 rounded-t-xl border-b px-3 py-2.5', tint)}>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-ink">{stage.name}</span>
          <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
            {count}&nbsp;Opportunit{count === 1 ? 'y' : 'ies'}
            <span className="ml-2.5 font-bold text-ink">{moneyCents(total)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {selectable && (
            <button
              onClick={() => onToggleAll?.(ids, !allSelected)}
              aria-label={`Select all in ${stage.name}`}
              className={cx(
                'grid h-5 w-5 place-items-center rounded border transition-colors',
                allSelected
                  ? 'border-brand bg-brand text-brand-fg'
                  : 'border-ink-subtle/40 bg-surface/70 text-transparent',
              )}
            >
              <Check size={13} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="rounded p-0.5 text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
            aria-label={`Collapse ${stage.name}`}
            title="Collapse"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/*
        Drop zone — the full card-list area is registered as droppable via
        setNodeRef. Only StageColumn calls useDroppable, so over.id in
        handleDragEnd is always a stage id.
      */}
      <div
        ref={setNodeRef}
        className={cx(
          'flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 transition-all',
          isOver
            ? 'rounded-b-xl bg-brand/5 ring-2 ring-inset ring-brand/40'
            : isAnyDragging
              ? 'rounded-b-xl ring-1 ring-inset ring-brand/10'
              : '',
        )}
        style={{ minHeight: 160 }}
      >
        {count === 0 ? (
          <div
            className={cx(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-10 text-xs transition-colors',
              isOver
                ? 'border-brand/60 bg-brand/5 text-brand'
                : isAnyDragging
                  ? 'border-brand/25 text-brand/60'
                  : 'border-line text-ink-subtle',
            )}
          >
            {isAnyDragging ? (
              <>
                <span className="text-[13px] font-semibold text-brand">Drop here</span>
                <span className="text-[11px] text-brand/60">→ {stage.name}</span>
              </>
            ) : (
              <span>No opportunities</span>
            )}
          </div>
        ) : (
          opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              contacts={contacts}
              users={users}
              companies={companies}
              onClick={() => onCardClick(opp.id)}
              allStages={allStages}
              onMove={onMove}
              selectable={selectable}
              selected={selectedIds?.has(opp.id)}
              onToggleSelect={() => onToggleCard?.(opp.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
