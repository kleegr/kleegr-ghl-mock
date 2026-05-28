import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { Pipeline, Opportunity, Contact, User } from '@/types';
import { StageColumn } from './StageColumn';
import { OpportunityCardOverlay } from './OpportunityCard';

interface Props {
  pipeline: Pipeline;
  opportunities: Opportunity[];
  contacts: Contact[];
  users: User[];
  onCardClick: (id: string) => void;
  onMove: (oppId: string, stageId: string) => void;
}

export function OpportunityBoard({
  pipeline,
  opportunities,
  contacts,
  users,
  onCardClick,
  onMove,
}: Props) {
  const [activeOppId, setActiveOppId] = useState<string | null>(null);

  const activeOpp = activeOppId
    ? (opportunities.find((o) => o.id === activeOppId) ?? null)
    : null;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveOppId(null);
    if (!over) return;
    const oppId = String(active.id);
    const toStageId = String(over.id);
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    if (opp.stageId === toStageId) return;
    // Verify target is a valid stage in this pipeline
    const validStage = pipeline.stages.some((s) => s.id === toStageId);
    if (!validStage) return;
    onMove(oppId, toStageId);
  }

  const sortedStages = pipeline.stages.slice().sort((a, b) => a.order - b.order);

  return (
    <DndContext
      onDragStart={({ active }) => setActiveOppId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveOppId(null)}
    >
      <div
        className="flex h-full gap-3 overflow-x-auto p-4"
        data-tour="opportunities.board"
      >
        {sortedStages.map((stage, idx) => {
          const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
          return (
            <StageColumn
              key={stage.id}
              stage={stage}
              index={idx}
              opportunities={stageOpps}
              contacts={contacts}
              users={users}
              isAnyDragging={activeOppId !== null}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeOpp ? (
          <OpportunityCardOverlay
            opportunity={activeOpp}
            contacts={contacts}
            users={users}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
