import { useDroppable } from '@dnd-kit/core';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Company, Contact, Opportunity, Stage, User } from '@/types';
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

export function StageColumn({
  stage,
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
  const total = opportunities.reduce((sum, opportunity) => sum + opportunity.monetaryValue, 0);
  const ids = opportunities.map((opportunity) => opportunity.id);
  const allSelected = selectable && ids.length > 0 && ids.every((id) => selectedIds?.has(id));

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        title={`Expand ${stage.name}`}
        aria-label={`Expand ${stage.name}`}
        className="flex h-full w-10 shrink-0 flex-col items-center gap-3 rounded-lg border border-[#dfe4eb] bg-white pt-3 text-[#667085] transition-colors hover:border-[#b9c2cf]"
      >
        <ChevronRight size={14} />
        <span className="grid min-w-5 place-items-center rounded-full bg-[#eef1f5] px-1.5 py-0.5 text-[10px] font-semibold text-[#475467]">
          {opportunities.length}
        </span>
        <span className="mt-1 whitespace-nowrap text-[11px] font-semibold text-[#344054]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {stage.name}
        </span>
      </button>
    );
  }

  return (
    <section className="flex h-full w-[276px] shrink-0 flex-col" data-tour="opportunities.stageColumn">
      <header className="h-[62px] shrink-0 rounded-lg border border-[#dfe4eb] bg-white px-3 py-2 shadow-[0_1px_1px_rgba(16,24,40,0.03)]">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#344054]">{stage.name}</span>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#eef1f5] px-1.5 text-[10px] font-semibold text-[#475467]">
            {opportunities.length}
          </span>
          {selectable && (
            <button
              onClick={() => onToggleAll?.(ids, !allSelected)}
              aria-label={`Select all in ${stage.name}`}
              className={cx(
                'grid h-5 w-5 place-items-center rounded border transition-colors',
                allSelected ? 'border-[#1689f4] bg-[#1689f4] text-white' : 'border-[#cbd3df] bg-white text-transparent',
              )}
            >
              <Check size={12} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="grid h-5 w-5 place-items-center rounded text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]"
            aria-label={`Collapse ${stage.name}`}
            title="Collapse"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-[#667085]">{moneyCents(total)}</p>
      </header>

      <div
        ref={setNodeRef}
        className={cx(
          'mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-color:#cbd3df_transparent] [scrollbar-width:thin]',
          isOver ? 'rounded-lg bg-[#eaf4ff] ring-1 ring-inset ring-[#1689f4]/30' : '',
          isAnyDragging && !isOver ? 'rounded-lg ring-1 ring-inset ring-[#dfe4eb]' : '',
        )}
      >
        {opportunities.length === 0 ? (
          <div
            className={cx(
              'flex min-h-[108px] items-center justify-center rounded-lg border border-dashed bg-white/60 text-[11px]',
              isOver ? 'border-[#1689f4] text-[#1689f4]' : 'border-[#d7dde6] text-[#98a2b3]',
            )}
          >
            {isAnyDragging ? 'Drop here' : 'No opportunities'}
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              contacts={contacts}
              users={users}
              companies={companies}
              onClick={() => onCardClick(opportunity.id)}
              selectable={selectable}
              selected={selectedIds?.has(opportunity.id)}
              onToggleSelect={() => onToggleCard?.(opportunity.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
