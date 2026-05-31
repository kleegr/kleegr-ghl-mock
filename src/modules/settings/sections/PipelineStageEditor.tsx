import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GitBranch, GripVertical, Plus, Trash2, Filter, PieChart, Tag, X } from 'lucide-react';
import type { Pipeline, Stage } from '@/types';
import { useStore } from '@/store/useStore';
import { Button, Tabs } from '@/components/ui/primitives';
import { Drawer, Field, TextInput, SaveBar } from './ui';
import { Toggle } from './Toggle';
import { cx } from '@/utils';

/**
 * Pipeline stage editor — opens from the Pipelines list action menu (Edit).
 *
 * A right-side drawer with two tabs: Stages and Smart Tags. Stages are
 * drag-reorderable (@dnd-kit/sortable), each with an editable name, a color, a
 * "show in funnel" + "show in reports" toggle, and delete. Add Stage appends a
 * row. Everything operates on a LOCAL working copy seeded from the pipeline, so
 * the live Opportunities board (which reads the store) is never mutated.
 */

const STAGE_COLORS = ['#64748b', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface StageDraft {
  key: string;
  name: string;
  color: string;
  showInFunnel: boolean;
  showInReports: boolean;
}

let seq = 0;
const makeStage = (name = 'New Stage'): StageDraft => ({
  key: `sd_${++seq}`,
  name,
  color: STAGE_COLORS[seq % STAGE_COLORS.length],
  showInFunnel: true,
  showInReports: true,
});

const TABS = [
  { id: 'stages', label: 'Stages' },
  { id: 'tags', label: 'Smart Tags' },
];

export function PipelineStageEditor({
  pipeline,
  open,
  onClose,
  onSave,
}: {
  pipeline: Pipeline | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; stages: Stage[] }) => void;
}) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState('stages');
  const [name, setName] = useState('');
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [colorKey, setColorKey] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (open && pipeline) {
      setTab('stages');
      setName(pipeline.name);
      setStages(
        [...pipeline.stages]
          .sort((a, b) => a.order - b.order)
          .map((s, i) => ({
            key: `sd_seed_${s.id}`,
            name: s.name,
            color: STAGE_COLORS[i % STAGE_COLORS.length],
            showInFunnel: true,
            showInReports: true,
          })),
      );
      setTags(['hot-lead', 'follow-up']);
      setTagInput('');
      setColorKey(null);
    }
  }, [open, pipeline]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setStages((list) => {
      const from = list.findIndex((s) => s.key === active.id);
      const to = list.findIndex((s) => s.key === over.id);
      return from === -1 || to === -1 ? list : arrayMove(list, from, to);
    });
  };

  const patchStage = (key: string, patch: Partial<StageDraft>) =>
    setStages((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const deleteStage = (key: string) =>
    setStages((list) => (list.length > 1 ? list.filter((s) => s.key !== key) : list));

  const addStage = () => setStages((list) => [...list, makeStage()]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || tags.includes(t)) {
      setTagInput('');
      return;
    }
    setTags((list) => [...list, t]);
    setTagInput('');
  };

  const handleSave = () => {
    if (!pipeline) return;
    if (name.trim() === '') {
      pushToast({ title: 'Pipeline name required', variant: 'info' });
      setTab('stages');
      return;
    }
    onSave(pipeline.id, {
      name: name.trim(),
      stages: stages.map((s, i) => ({ id: `st_${pipeline.id}_${i}`, name: s.name.trim() || `Stage ${i + 1}`, order: i })),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={<GitBranch size={18} />}
      title={pipeline ? `Edit ${pipeline.name}` : 'Edit Pipeline'}
      subtitle="Reorder, rename, and configure stages"
      width="max-w-2xl"
      tabBar={
        <div className="px-5">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
      }
      footer={<SaveBar onCancel={onClose} onSave={handleSave} saveLabel="Save Pipeline" dirty />}
    >
      {tab === 'stages' && (
        <div className="space-y-5">
          <Field label="Pipeline name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Pipeline name" />
          </Field>

          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">
              Stages <span className="font-normal text-ink-muted">({stages.length})</span>
            </p>
            <Button variant="ghost" size="xs" onClick={addStage}>
              <Plus size={13} /> Add stage
            </Button>
          </div>

          <div className="rounded-xl border border-line">
            <div className="flex items-center gap-3 border-b border-line px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
              <span className="w-4" />
              <span className="w-5" />
              <span className="flex-1">Stage name</span>
              <span className="flex items-center gap-1" title="Show in funnel"><Filter size={13} /></span>
              <span className="flex items-center gap-1" title="Show in reports"><PieChart size={13} /></span>
              <span className="w-7" />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={stages.map((s) => s.key)} strategy={verticalListSortingStrategy}>
                {stages.map((stage) => (
                  <SortableStageRow
                    key={stage.key}
                    stage={stage}
                    canDelete={stages.length > 1}
                    colorOpen={colorKey === stage.key}
                    onToggleColor={() => setColorKey((k) => (k === stage.key ? null : stage.key))}
                    onPickColor={(c) => {
                      patchStage(stage.key, { color: c });
                      setColorKey(null);
                    }}
                    onName={(v) => patchStage(stage.key, { name: v })}
                    onFunnel={(v) => patchStage(stage.key, { showInFunnel: v })}
                    onReports={(v) => patchStage(stage.key, { showInReports: v })}
                    onDelete={() => deleteStage(stage.key)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <p className="text-xs text-ink-muted">
            Drag the handle to reorder stages. Changes here apply to this demo session and don't affect the live
            Opportunities board.
          </p>
        </div>
      )}

      {tab === 'tags' && (
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            Smart Tags are applied automatically when an opportunity enters this pipeline. Useful for triggering
            automations (demo).
          </p>
          <div className="flex gap-2">
            <TextInput
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag and press Enter"
            />
            <Button size="sm" onClick={addTag}>
              <Plus size={13} /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && <p className="text-sm text-ink-subtle">No smart tags yet.</p>}
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
              >
                <Tag size={12} />
                {t}
                <button
                  onClick={() => setTags((list) => list.filter((x) => x !== t))}
                  className="rounded-full p-0.5 hover:bg-brand/10"
                  aria-label={`Remove ${t}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ── Sortable stage row ──────────────────────────────────────────────────── */

function SortableStageRow({
  stage,
  canDelete,
  colorOpen,
  onToggleColor,
  onPickColor,
  onName,
  onFunnel,
  onReports,
  onDelete,
}: {
  stage: StageDraft;
  canDelete: boolean;
  colorOpen: boolean;
  onToggleColor: () => void;
  onPickColor: (c: string) => void;
  onName: (v: string) => void;
  onFunnel: (v: boolean) => void;
  onReports: (v: boolean) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.key });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        'flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0',
        isDragging ? 'bg-surface-raised shadow-pop' : 'bg-surface',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-ink-subtle hover:text-ink active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Color */}
      <div className="relative shrink-0">
        <button
          onClick={onToggleColor}
          className="h-4 w-4 rounded-full ring-2 ring-surface ring-offset-1 ring-offset-line"
          style={{ backgroundColor: stage.color }}
          aria-label="Stage color"
          title="Change color"
        />
        {colorOpen && (
          <div className="absolute left-0 top-6 z-30 flex w-40 flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-2 shadow-pop">
            {STAGE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onPickColor(c)}
                className={cx('h-5 w-5 rounded-full', stage.color === c && 'ring-2 ring-ink ring-offset-1')}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        )}
      </div>

      <input
        value={stage.name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Stage name"
        className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
      />

      <div className="shrink-0"><Toggle checked={stage.showInFunnel} onChange={onFunnel} /></div>
      <div className="shrink-0"><Toggle checked={stage.showInReports} onChange={onReports} /></div>

      <button
        onClick={onDelete}
        disabled={!canDelete}
        className="shrink-0 rounded p-1 text-ink-subtle hover:text-bad disabled:opacity-30 disabled:hover:text-ink-subtle"
        aria-label="Delete stage"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
