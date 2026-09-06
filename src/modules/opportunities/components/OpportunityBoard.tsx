import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Pipeline, Opportunity, Contact, User, Company } from '@/types';
import { StageColumn } from './StageColumn';
import { OpportunityCardOverlay } from './OpportunityCard';

interface Props {
  pipeline: Pipeline;
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  companies: Company[];
  onCardClick: (id: string) => void;
  onMove: (oppId: string, stageId: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleCard?: (id: string) => void;
  onToggleAll?: (ids: string[], next: boolean) => void;
}

export function OpportunityBoard({
  pipeline,
  opportunities,
  contacts,
  users,
  companies,
  onCardClick,
  onMove,
  selectable = false,
  selectedIds,
  onToggleCard,
  onToggleAll,
}: Props) {
  const [activeOppId, setActiveOppId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Mouse: a 6px move starts a drag (a plain click still opens the card).
  // Touch: a 200ms press-hold starts a drag, so a quick swipe scrolls the board
  // instead of fighting the drag — the touch fallback for moving a card between
  // stages (the detail drawer's stage dropdown is the secondary, all-viewport path).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeOpp = activeOppId
    ? (opportunities.find((o) => o.id === activeOppId) ?? null)
    : null;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveOppId(null);
    if (!over) return;
    const oppId = String(active.id);
    const toStageId = String(over.id);
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stageId === toStageId) return;
    if (!pipeline.stages.some((s) => s.id === toStageId)) return;
    onMove(oppId, toStageId);
  }

  const sortedStages = pipeline.stages.slice().sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveOppId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveOppId(null)}
    >
      <div
        className="flex h-full items-stretch gap-3 overflow-x-auto px-4 py-3"
        data-tour="opportunities.board"
      >
        {sortedStages.map((stage, idx) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            index={idx}
            opportunities={opportunities.filter((o) => o.stageId === stage.id)}
            contacts={contacts}
            users={users}
            companies={companies}
            isAnyDragging={activeOppId !== null}
            onCardClick={onCardClick}
            collapsed={!!collapsed[stage.id]}
            onToggleCollapse={() =>
              setCollapsed((c) => ({ ...c, [stage.id]: !c[stage.id] }))
            }
            selectable={selectable}
            selectedIds={selectedIds}
            onToggleCard={onToggleCard}
            onToggleAll={onToggleAll}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeOpp ? (
          <OpportunityCardOverlay
            opportunity={activeOpp}
            contacts={contacts}
            users={users}
            companies={companies}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
