import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Stage, Opportunity, Contact, User, Company } from '@/types';
import { moneyCents, cx } from '@/utils';
import { OpportunityCard } from './OpportunityCard';

interface Props {
  stage: Stage;
  index?: number;
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  companies: Company[];
  isAnyDragging: boolean;
  onCardClick: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleCard?: (id: string) => void;
  onToggleAll?: (ids: string[], next: boolean) => void;
}

/** First stage gets a green tint; the rest use the warm tan GHL uses for "Called" stages. */
function headerTint(index: number): string {
  return index === 0
    ? 'bg-[#e7f6ee] border-[#cdeede]'
    : 'bg-[#fbf3e3] border-[#f0e2c2]';
}

export function StageColumn({
  stage,
  index = 1,
  opportunities,
  contacts,
  users,
  companies,
  isAnyDragging,
  onCardClick,
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

  /* Collapsed rail */
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        title={`Expand ${stage.name}`}
        aria-label={`Expand ${stage.name}`}
        className={cx(
          'flex h-full w-11 shrink-0 flex-col items-center gap-3 rounded-xl border pt-3 transition-colors hover:brightness-[0.98]',
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

  return (
    <div
      className="flex w-[296px] shrink-0 flex-col rounded-xl border border-line bg-surface-sunken"
      data-tour="opportunities.stageColumn"
    >
      {/* Header */}
      <div className={cx('flex items-start justify-between gap-2 rounded-t-xl border-b px-3 py-2.5', tint)}>
        <div className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-ink">{stage.name}</span>
          <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
            {count} Opportunit{count === 1 ? 'y' : 'ies'}
            <span className="ml-3 font-semibold text-ink">{moneyCents(total)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selectable && (
            <button
              onClick={() => onToggleAll?.(ids, !allSelected)}
              aria-label={`Select all in ${stage.name}`}
              className={cx(
                'grid h-5 w-5 place-items-center rounded border transition-colors',
                allSelected ? 'border-brand bg-brand text-brand-fg' : 'border-ink-subtle/40 bg-surface/70 text-transparent',
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

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cx(
          'flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 transition-all',
          isOver
            ? 'rounded-b-xl bg-brand/5 ring-1 ring-inset ring-brand/30'
            : isAnyDragging
              ? 'rounded-b-xl ring-1 ring-inset ring-line/80'
              : '',
        )}
        style={{ minHeight: 140 }}
      >
        {count === 0 ? (
          <div
            className={cx(
              'flex flex-1 items-center justify-center rounded-lg border border-dashed py-10 text-xs transition-colors',
              isOver ? 'border-brand/50 bg-brand/5 text-brand' : 'border-line text-ink-subtle',
            )}
          >
            {isAnyDragging ? 'Drop here' : 'No opportunities'}
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
