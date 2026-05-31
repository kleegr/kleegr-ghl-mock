/**
 * Generic kanban board used by both the Tickets and Tasks tabs.
 *
 * Adapts the dnd-kit pattern from the portal's Opportunities board
 * (MouseSensor distance-guard + TouchSensor press-hold + DragOverlay) into a
 * reusable, typed primitive so the ticket board and task board share identical
 * drag mechanics. Columns are demo-stage definitions; moving a card calls back
 * into the in-memory store. Nothing here touches the network.
 */

import { useRef, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cx } from '@/utils';
import type { Tone } from '../data';

export interface BoardColumn {
  id: string;
  label: string;
  tone: Tone;
  accent: string;
}

interface BoardProps<T extends { id: string }> {
  columns: BoardColumn[];
  items: T[];
  /** Returns the column id an item currently belongs to. */
  columnOf: (item: T) => string;
  onMove: (itemId: string, columnId: string) => void;
  renderCard: (item: T) => React.ReactNode;
  onCardClick: (id: string) => void;
  tour?: string;
  emptyHint?: string;
}

/** Droppable column with a colored accent header. */
function Column({
  column,
  count,
  isAnyDragging,
  children,
  emptyHint,
}: {
  column: BoardColumn;
  count: number;
  isAnyDragging: boolean;
  children: React.ReactNode;
  emptyHint?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-xl border border-line bg-surface-sunken">
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.accent }} aria-hidden="true" />
          <span className="truncate text-[14px] font-bold text-ink">{column.label}</span>
        </div>
        <span className="grid min-w-5 place-items-center rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">
          {count}
        </span>
      </div>

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
        style={{ minHeight: 120 }}
      >
        {count === 0 ? (
          <div
            className={cx(
              'flex flex-1 items-center justify-center rounded-lg border border-dashed py-10 text-center text-xs transition-colors',
              isOver ? 'border-brand/50 bg-brand/5 text-brand' : 'border-line text-ink-subtle',
            )}
          >
            {isAnyDragging ? 'Drop here' : (emptyHint ?? 'Nothing here')}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/** Draggable wrapper with a 6px distance-guard so a plain click still opens the card. */
function DraggableCard({
  id,
  onClick,
  children,
}: {
  id: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        downAt.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        const s = downAt.current;
        const dist = s ? Math.hypot(e.clientX - s.x, e.clientY - s.y) : 0;
        if (dist < 6) onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={cx(
        'cursor-grab active:cursor-grabbing rounded-lg outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-brand/60',
        isDragging ? 'opacity-30' : '',
      )}
    >
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  columnOf,
  onMove,
  renderCard,
  onCardClick,
  tour,
  emptyHint,
}: BoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeItem = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const itemId = String(active.id);
    const toColumn = String(over.id);
    const item = items.find((i) => i.id === itemId);
    if (!item || columnOf(item) === toColumn) return;
    if (!columns.some((c) => c.id === toColumn)) return;
    onMove(itemId, toColumn);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full items-stretch gap-3 overflow-x-auto pb-2" data-tour={tour}>
        {columns.map((column) => {
          const colItems = items.filter((i) => columnOf(i) === column.id);
          return (
            <Column
              key={column.id}
              column={column}
              count={colItems.length}
              isAnyDragging={activeId !== null}
              emptyHint={emptyHint}
            >
              {colItems.map((item) => (
                <DraggableCard key={item.id} id={item.id} onClick={() => onCardClick(item.id)}>
                  {renderCard(item)}
                </DraggableCard>
              ))}
            </Column>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[256px] rotate-1 opacity-95">{renderCard(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
