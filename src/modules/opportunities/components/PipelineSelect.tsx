import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import type { Pipeline } from '@/types';
import { cx } from '@/utils';

interface Props {
  pipelines: Pipeline[];
  value: string;
  onChange: (id: string) => void;
  onNewPipeline: () => void;
}

export function PipelineSelect({ pipelines, value, onChange, onNewPipeline }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = pipelines.find((p) => p.id === value) ?? pipelines[0];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref} data-tour="opportunities.pipelineSelector">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Pipeline - ${current?.name ?? ''}`}
        className="flex h-10 w-64 items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current?.name ?? 'Select pipeline'}</span>
        <ChevronDown size={16} className="shrink-0 text-ink-subtle" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
          role="listbox"
        >
          {pipelines.map((p) => {
            const active = p.id === value;
            return (
              <button
                key={p.id}
                role="option"
                aria-selected={active}
                onClick={() => { onChange(p.id); setOpen(false); }}
                className={cx(
                  'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-surface-sunken',
                  active ? 'font-semibold text-brand' : 'text-ink',
                )}
              >
                <span className="truncate">{p.name}</span>
                {active && <Check size={15} className="shrink-0 text-brand" />}
              </button>
            );
          })}
          <div className="my-1 border-t border-line" />
          <button
            onClick={() => { setOpen(false); onNewPipeline(); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft/50"
          >
            <Plus size={15} /> New pipeline
          </button>
        </div>
      )}
    </div>
  );
}
