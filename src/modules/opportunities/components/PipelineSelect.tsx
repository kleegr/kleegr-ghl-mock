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
        className="flex h-9 w-[255px] items-center justify-between gap-2 rounded-md border border-[#d7dde6] bg-white px-3 text-[12px] font-semibold text-[#344054] transition-colors hover:border-[#aeb8c6]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current?.name ?? 'Select pipeline'}</span>
        <ChevronDown size={14} className="shrink-0 text-[#98a2b3]" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 w-[255px] overflow-hidden rounded-lg border border-[#dfe4eb] bg-white py-1 shadow-pop"
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
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-[#f5f7fa]',
                  active ? 'font-semibold text-[#1689f4]' : 'text-[#344054]',
                )}
              >
                <span className="truncate">{p.name}</span>
                {active && <Check size={14} className="shrink-0 text-[#1689f4]" />}
              </button>
            );
          })}
          <div className="my-1 border-t border-line" />
          <button
            onClick={() => { setOpen(false); onNewPipeline(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] font-semibold text-[#1689f4] hover:bg-[#eef6ff]"
          >
            <Plus size={15} /> New pipeline
          </button>
        </div>
      )}
    </div>
  );
}
