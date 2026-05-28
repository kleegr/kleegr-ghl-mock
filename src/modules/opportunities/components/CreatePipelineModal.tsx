import { useState } from 'react';
import { X, Plus, Trash2, GripVertical, Filter, PieChart, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { Overlay } from './Overlay';

interface Props {
  onClose: () => void;
}

type ColorMode = 'none' | 'dot' | 'tint';
let stageSeq = 0;
const newStage = (name = '') => ({ key: `ns_${++stageSeq}`, name });

const COLOR_OPTIONS: { id: ColorMode; caption: string }[] = [
  { id: 'none', caption: 'Default (no color)' },
  { id: 'dot', caption: 'Colored dot' },
  { id: 'tint', caption: 'Background tint' },
];

export function CreatePipelineModal({ onClose }: Props) {
  const pushToast = useStore((s) => s.pushToast);
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('none');
  const [stages, setStages] = useState(() => [
    newStage('New Lead'),
    newStage('Contacted'),
    newStage('Proposal Sent'),
    newStage('Closed'),
  ]);

  const nameError = touched && name.trim() === '';

  const handleCreate = () => {
    setTouched(true);
    if (name.trim() === '') return;
    pushToast({
      title: 'Demo: Pipeline created',
      description: `“${name.trim()}” would be saved with ${stages.length} stages. (Demo only — not persisted.)`,
      variant: 'success',
    });
    onClose();
  };

  return (
    <Overlay onClose={onClose} maxWidth="max-w-3xl" tour="opportunities.createPipeline">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="text-lg font-bold text-ink">Create Pipeline</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-ink">Pipeline name <span className="text-bad">*</span></span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Marketing pipeline"
            className={cx(
              'h-11 w-full rounded-lg border bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:ring-2',
              nameError ? 'border-bad focus:border-bad focus:ring-bad/20' : 'border-line focus:border-brand/60 focus:ring-brand/20',
            )}
          />
          {nameError && <p className="mt-1 text-xs font-medium text-bad">Pipeline name is required</p>}
        </label>

        {/* Display colors */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Set pipeline display colors</p>
            <p className="mt-0.5 text-xs text-ink-muted">Choose how stage colors appear across your pipeline views</p>
          </div>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => setColorMode(o.id)}
                className={cx(
                  'flex w-28 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center transition-colors',
                  colorMode === o.id ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40',
                )}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                  {o.id === 'dot' && <span className="h-2 w-2 rounded-full bg-brand" />}
                  <span className={o.id === 'tint' ? 'rounded bg-brand-soft px-1.5' : ''}>Stage Name</span>
                </span>
                <span className={cx('text-[11px]', colorMode === o.id ? 'text-brand' : 'text-ink-subtle')}>{o.caption}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stages */}
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Pipeline stages ({stages.length})</h3>
          <button
            onClick={() => setStages((s) => [...s, newStage()])}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            <Plus size={15} /> Add stage
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-line">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">
            <span className="w-4" />
            <span className="flex-1">Stage Name</span>
            <span className="flex items-center gap-1">Show in Reports</span>
            <span className="w-16" />
          </div>
          {stages.map((st) => (
            <div key={st.key} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
              <GripVertical size={16} className="shrink-0 cursor-grab text-ink-subtle" />
              <input
                value={st.name}
                onChange={(e) => setStages((s) => s.map((x) => (x.key === st.key ? { ...x, name: e.target.value } : x)))}
                placeholder="Stage name"
                className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
              />
              <span className="flex items-center gap-3 text-ink-subtle">
                <Filter size={15} />
                <PieChart size={15} />
              </span>
              <button className="rounded p-1 text-ink-subtle hover:text-ink" aria-label="Stage options"><ChevronDown size={16} /></button>
              <button
                onClick={() => setStages((s) => (s.length > 1 ? s.filter((x) => x.key !== st.key) : s))}
                className="rounded p-1 text-ink-subtle hover:text-bad"
                aria-label="Delete stage"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-line px-6 py-3.5">
        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" onClick={handleCreate} disabled={name.trim() === ''}>Create</Button>
      </div>
    </Overlay>
  );
}
