import { useState } from 'react';
import { GripVertical, Plus, Trash2, Filter, BarChart3, Tag, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Tabs, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import type { Pipeline } from '@/types';
import { ModalShell, Field, TextInput } from './_ui';

interface StageDraft {
  key: string;
  name: string;
  color: string; // '' = no color
  showInFunnel: boolean;
  showInReports: boolean;
}

const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

let seq = 0;
const stageKey = () => `sd_${++seq}`;

function toDrafts(p: Pipeline): StageDraft[] {
  return [...p.stages]
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({
      key: s.id,
      name: s.name,
      color: PALETTE[i % PALETTE.length],
      showInFunnel: true,
      showInReports: true,
    }));
}

interface Props {
  pipeline: Pipeline;
  onClose: () => void;
  onSave: (update: { name: string; stages: { id: string; name: string; order: number }[] }) => void;
}

type TabId = 'stages' | 'tags';

export function PipelineStageEditor({ pipeline, onClose, onSave }: Props) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<TabId>('stages');
  const [name, setName] = useState(pipeline.name);
  const [stages, setStages] = useState<StageDraft[]>(() => toDrafts(pipeline));
  const [tags, setTags] = useState<string[]>(['Hot Lead', 'Follow-up', 'VIP']);
  const [tagInput, setTagInput] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);

  const patch = (key: string, p: Partial<StageDraft>) =>
    setStages((list) => list.map((s) => (s.key === key ? { ...s, ...p } : s)));

  const addStage = () => setStages((list) => [...list, { key: stageKey(), name: '', color: PALETTE[list.length % PALETTE.length], showInFunnel: true, showInReports: true }]);
  const deleteStage = (key: string) => setStages((list) => (list.length > 1 ? list.filter((s) => s.key !== key) : list));

  /* Native HTML5 drag reorder - dependency-free. */
  const onDrop = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    setStages((list) => {
      const from = list.findIndex((s) => s.key === dragKey);
      const to = list.findIndex((s) => s.key === targetKey);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragKey(null);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    setTags((list) => (list.includes(t) ? list : [...list, t]));
    setTagInput('');
  };

  const save = () => {
    const cleaned = stages.filter((s) => s.name.trim() !== '');
    const mapped = (cleaned.length ? cleaned : stages).map((s, i) => ({
      id: s.key,
      name: s.name.trim() || `Stage ${i + 1}`,
      order: i,
    }));
    onSave({ name: name.trim() || pipeline.name, stages: mapped });
    pushToast({
      title: 'Pipeline saved',
      description: `"${name.trim() || pipeline.name}" updated with ${mapped.length} stage${mapped.length === 1 ? '' : 's'}. Demo only.`,
      variant: 'success',
    });
    onClose();
  };

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="sm" onClick={save}>Save Pipeline</Button>
    </>
  );

  return (
    <ModalShell onClose={onClose} title="Edit Pipeline" subtitle={`${pipeline.stages.length} stages - ${pipeline.name}`} footer={footer} maxWidth="max-w-3xl">
      <div className="px-6 pt-4">
        <Field label="Pipeline name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Pipeline" />
        </Field>
        <div className="mt-4">
          <Tabs
            variant="underline"
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            tabs={[
              { id: 'stages', label: 'Stages', count: stages.length },
              { id: 'tags', label: 'Smart Tags', count: tags.length },
            ]}
          />
        </div>
      </div>

      <div className="px-6 py-5">
        {tab === 'stages' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">Drag to reorder. Toggle where each stage appears.</p>
              <button onClick={addStage} className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                <Plus size={15} /> Add stage
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-3 border-b border-line bg-surface-sunken px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                <span className="w-4" />
                <span className="w-6 text-center">#</span>
                <span className="flex-1">Stage name</span>
                <span className="hidden w-20 text-center sm:block">Color</span>
                <span className="hidden w-14 items-center justify-center gap-1 sm:flex" title="Show in funnel"><Filter size={13} /></span>
                <span className="hidden w-14 items-center justify-center gap-1 sm:flex" title="Show in reports"><BarChart3 size={13} /></span>
                <span className="w-8" />
              </div>

              {stages.map((s, i) => (
                <div
                  key={s.key}
                  draggable
                  onDragStart={() => setDragKey(s.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s.key)}
                  className={cx(
                    'flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0',
                    dragKey === s.key ? 'bg-brand-soft/40' : 'bg-surface',
                  )}
                >
                  <GripVertical size={16} className="shrink-0 cursor-grab text-ink-subtle" />
                  <span className="w-6 text-center text-xs font-semibold text-ink-subtle">{i + 1}</span>
                  <input
                    value={s.name}
                    onChange={(e) => patch(s.key, { name: e.target.value })}
                    placeholder="Stage name"
                    className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                  />
                  {/* Color picker */}
                  <div className="hidden w-20 items-center justify-center gap-1 sm:flex">
                    <ColorPicker value={s.color} onChange={(c) => patch(s.key, { color: c })} />
                  </div>
                  <div className="hidden w-14 justify-center sm:flex">
                    <MiniToggle checked={s.showInFunnel} onChange={(v) => patch(s.key, { showInFunnel: v })} label="Show in funnel" />
                  </div>
                  <div className="hidden w-14 justify-center sm:flex">
                    <MiniToggle checked={s.showInReports} onChange={(v) => patch(s.key, { showInReports: v })} label="Show in reports" />
                  </div>
                  <button
                    onClick={() => deleteStage(s.key)}
                    disabled={stages.length === 1}
                    className="rounded p-1 text-ink-subtle transition-colors hover:text-bad disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Delete stage"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-subtle">Funnel and report visibility are demo-local and reset on reload.</p>
          </>
        )}

        {tab === 'tags' && (
          <div>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-sunken px-4 py-3">
              <Tag size={16} className="mt-0.5 shrink-0 text-ink-muted" />
              <p className="text-xs text-ink-muted">
                Smart Tags apply automatically as opportunities move through this pipeline - useful for segmenting and triggering automations. Demo-local only.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a smart tag..."
                className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
              />
              <Button variant="secondary" size="sm" onClick={addTag}><Plus size={14} /> Add</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.length === 0 && <p className="text-sm text-ink-subtle">No smart tags yet.</p>}
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink">
                  <Badge tone="brand">{t}</Badge>
                  <button onClick={() => setTags((list) => list.filter((x) => x !== t))} className="text-ink-subtle hover:text-bad" aria-label={`Remove ${t}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* --- color picker (dots) --- */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-5 w-5 rounded-full border border-line shadow-sm"
        style={{ backgroundColor: value || 'transparent' }}
        aria-label="Pick stage color"
      >
        {!value && <span className="block h-full w-full rounded-full bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:8px_8px]" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-pop absolute right-0 top-full z-20 mt-1 grid w-40 grid-cols-4 gap-2 rounded-lg border border-line bg-surface p-2 shadow-pop">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className={cx('h-6 w-6 rounded-full border', value === c ? 'ring-2 ring-brand ring-offset-1' : 'border-line')}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={cx('col-span-4 mt-1 rounded-md border border-line py-1 text-xs text-ink-muted hover:bg-surface-sunken', !value && 'ring-2 ring-brand')}
            >
              No color
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* --- compact toggle --- */
function MiniToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
    >
      <span className={cx('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-1')} />
    </button>
  );
}
