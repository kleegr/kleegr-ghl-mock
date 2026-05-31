/**
 * WidgetGrid.tsx — the responsive, reorderable grid of widget cards.
 *
 * Layout is a 1/2/3-column CSS grid; each widget spans 1–3 columns via the
 * purge-safe SPAN_CLASS map. In edit mode, cards become drag-sortable
 * (@dnd-kit/sortable) and an "Add widget" tile is appended. Outside edit mode
 * the same cards render statically. All mutations are delegated upward — the
 * grid is presentational and owns no widget state.
 */
import { useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { Pipeline } from '@/types';
import { cx } from '@/utils';
import {
  SPAN_CLASS, type DashWidget, type WidgetSpan,
} from './dashboardData';
import type { MetricsCtx } from './metrics';
import { WidgetCard } from './WidgetCard';

export interface WidgetGridProps {
  widgets: DashWidget[];
  ctx: MetricsCtx;
  pipelines: Pipeline[];
  editing: boolean;
  onReorder: (next: DashWidget[]) => void;
  onSetPipeline: (id: string, pipelineId: string) => void;
  onToggleCollapse: (id: string) => void;
  onSetSpan: (id: string, span: WidgetSpan) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function WidgetGrid(props: WidgetGridProps) {
  const { widgets, ctx, pipelines, editing, onReorder, onAdd } = props;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = widgets.findIndex((w) => w.id === active.id);
    const to = widgets.findIndex((w) => w.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(widgets, from, to));
  }

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) ?? null : null;

  const gridCls = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  if (!editing) {
    return (
      <div className={gridCls}>
        {widgets.map((w) => (
          <div key={w.id} className={SPAN_CLASS[w.span]}>
            <WidgetCard
              widget={w}
              ctx={ctx}
              pipelines={pipelines}
              editing={false}
              onSetPipeline={(pid) => props.onSetPipeline(w.id, pid)}
              onToggleCollapse={() => props.onToggleCollapse(w.id)}
              onSetSpan={(s) => props.onSetSpan(w.id, s)}
              onRemove={() => props.onRemove(w.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className={gridCls}>
          {widgets.map((w) => (
            <SortableCell key={w.id} id={w.id} span={w.span}>
              {(handleProps, dragging) => (
                <WidgetCard
                  widget={w}
                  ctx={ctx}
                  pipelines={pipelines}
                  editing
                  dragHandleProps={handleProps}
                  dragging={dragging}
                  onSetPipeline={(pid) => props.onSetPipeline(w.id, pid)}
                  onToggleCollapse={() => props.onToggleCollapse(w.id)}
                  onSetSpan={(s) => props.onSetSpan(w.id, s)}
                  onRemove={() => props.onRemove(w.id)}
                />
              )}
            </SortableCell>
          ))}
          <button
            onClick={onAdd}
            className="flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-ink-muted transition-colors hover:border-brand/50 hover:bg-brand-soft/40 hover:text-brand"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-sunken">
              <Plus size={18} />
            </span>
            <span className="text-sm font-semibold">Add widget</span>
          </button>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeWidget && (
          <div className="rotate-1 cursor-grabbing">
            <WidgetCard
              widget={activeWidget}
              ctx={ctx}
              pipelines={pipelines}
              editing
              onSetPipeline={() => {}}
              onToggleCollapse={() => {}}
              onSetSpan={() => {}}
              onRemove={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/* ──── Sortable grid cell ──── */

function SortableCell({
  id, span, children,
}: {
  id: string;
  span: WidgetSpan;
  children: (
    handleProps: React.HTMLAttributes<HTMLButtonElement>,
    dragging: boolean,
  ) => React.ReactNode;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(SPAN_CLASS[span], isDragging && 'opacity-50')}
    >
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  );
}
