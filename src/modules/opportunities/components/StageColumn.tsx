import { useDroppable } from '@dnd-kit/core';
import type { Stage, Opportunity, Contact, User } from '@/types';
import { money, cx } from '@/utils';
import { OpportunityCard } from './OpportunityCard';

interface Props {
  stage: Stage;
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  isAnyDragging: boolean;
  onCardClick: (id: string) => void;
}

export function StageColumn({
  stage,
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

  return (
    <div
      className="flex w-60 shrink-0 flex-col rounded-xl border border-line bg-surface-sunken"
      data-tour="opportunities.stageColumn"
    >
      {/* Stage header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-line bg-surface px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{stage.name}</span>
          <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-bold text-ink-subtle">
            {opportunities.length}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs font-semibold text-good">{money(total)}</span>
        )}
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
