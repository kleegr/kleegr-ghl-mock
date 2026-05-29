import { useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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

  /**
   * PointerSensor: mouse + stylus, 6 px distance guard so a plain click still
   * opens the detail drawer without starting a drag.
   *
   * TouchSensor: finger-touch with a 250 ms hold + 8 px tolerance so vertical
   * scroll gestures aren't intercepted by the drag handler.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
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
    // Guard: only accept drops onto known stage columns (over.id is always a stageId
    // because only StageColumn registers useDroppable).
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
      {/*
        Horizontal scroller. On iOS the inertia/momentum scroll is already
        handled by the browser since iOS 13 — no vendor prefix needed.
        min-w-max prevents columns from shrinking below 296 px on narrow views.
      */}
      <div
        className="flex h-full min-w-max items-stretch gap-3 overflow-x-auto px-5 py-4"
        data-tour="opportunities.board"
      >
        {sortedStages.map((stage, idx) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            index={idx}
            allStages={sortedStages}
            opportunities={opportunities.filter((o) => o.stageId === stage.id)}
            contacts={contacts}
            users={users}
            companies={companies}
            isAnyDragging={activeOppId !== null}
            onCardClick={onCardClick}
            onMove={onMove}
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
