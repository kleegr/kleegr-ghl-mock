import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft } from 'lucide-react';
import type { Stage, Opportunity, Contact, User } from '@/types';
import { money, cx } from '@/utils';
import { OpportunityCard } from './OpportunityCard';

interface Props {
  stage: Stage;
  index?: number;
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  isAnyDragging: boolean;
  onCardClick: (id: string) => void;
}

/** Pastel header tints — first stage green ("New Lead"), the rest warm tan. */
const HEADER_TINTS = [
  'bg-[#e7f6ee] border-[#cdeede]', // green
  'bg-[#fbf3e3] border-[#f0e2c2]', // tan
  'bg-[#fbf0e3] border-[#f1ddc2]', // amber
  'bg-[#f3eefb] border-[#e3d6f4]', // violet
  'bg-[#e9f1fb] border-[#cfe0f6]', // blue
];

export function StageColumn({
  stage,
  index = 1,
  opportunities,
  contacts,
  users,
  isAnyDragging,
  onCardClick,
}: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  // Only sum open opps for the value total
  const openOpps = opportunities.filter((o) => o.status === 'open');
  const total = openOpps.reduce((sum, o) => sum + o.monetaryValue, 0);
  const openCount = openOpps.length;
  const tint = HEADER_TINTS[index % HEADER_TINTS.length];

  return (
    <div
      className="flex w-[270px] shrink-0 flex-col rounded-xl border border-line bg-surface-sunken"
      data-tour="opportunities.stageColumn"
    >
      {/* Stage header — pastel tinted */}
      <div className={cx('flex items-start justify-between rounded-t-xl border-b px-3 py-2.5', tint)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-ink">{stage.name}</span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
            {opportunities.length} Opportunit{opportunities.length === 1 ? 'y' : 'ies'}
            <span className="mx-1 text-ink-subtle">·</span>
            <span className="text-ink">{money(total)}</span>
          </p>
        </div>
        <button
          className="shrink-0 rounded p-0.5 text-ink-subtle transition-colors hover:bg-black/5 hover:text-ink-muted"
          aria-label={`Collapse ${stage.name}`}
          title="Collapse"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cx(
          'flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-all',
          isOver
            ? 'rounded-b-xl bg-brand/5 ring-1 ring-inset ring-brand/30'
            : isAnyDragging
            ? 'rounded-b-xl ring-1 ring-inset ring-line/80'
            : '',
        )}
        style={{ minHeight: 120 }}
      >
        {opportunities.length === 0 ? (
          <div
            className={cx(
              'flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-xs transition-colors',
              isOver
                ? 'border-brand/50 bg-brand/5 text-brand'
                : 'border-line text-ink-subtle',
            )}
          >
            {isAnyDragging ? 'Drop here' : 'No deals'}
          </div>
        ) : (
          <>
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                contacts={contacts}
                users={users}
                onClick={() => onCardClick(opp.id)}
              />
            ))}
            {/* Always show a drop hint at the bottom when dragging */}
            {isAnyDragging && (
              <div
                className={cx(
                  'flex items-center justify-center rounded-lg border border-dashed py-2 text-[10px] transition-colors',
                  isOver
                    ? 'border-brand/50 bg-brand/5 text-brand'
                    : 'border-line/60 text-ink-subtle',
                )}
              >
                Drop here
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: open deal count only (non-zero) */}
      {openCount > 0 && (
        <div className="rounded-b-xl border-t border-line px-3 py-1.5">
          <span className="text-[10px] text-ink-subtle">
            {openCount} open deal{openCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
