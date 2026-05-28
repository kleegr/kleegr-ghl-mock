import { useMemo, useState } from 'react';
import { Plus, Search, MoreVertical, Type, Hash, CalendarDays } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Pipeline, Opportunity } from '@/types';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { CreatePipelineModal } from './CreatePipelineModal';

interface Props {
  pipelines: Pipeline[];
  opportunities: Opportunity[];
}

function updatedLabel(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} / ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function PipelinesTable({ pipelines, opportunities }: Props) {
  const pushToast = useStore((s) => s.pushToast);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // Proxy "Updated on" = most recent opportunity activity within the pipeline.
  const lastUpdated = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of opportunities) {
      if (!map[o.pipelineId] || o.updatedAt > map[o.pipelineId]) map[o.pipelineId] = o.updatedAt;
    }
    return map;
  }, [opportunities]);

  const rows = pipelines.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="px-5 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Pipelines</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Pipelines help you manage Opportunities step by step, giving you a clear view of progress and sales outcomes.
          </p>
        </div>
        <Button size="md" onClick={() => setCreateOpen(true)} data-tour="opportunities.createPipelineBtn">
          <Plus size={16} /> Create Pipeline
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface">
        <div className="p-3">
          <div className="relative w-72 max-w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-[13px] font-semibold text-ink-muted">
              <th className="px-4 py-2.5"><span className="flex items-center gap-2"><Type size={15} className="text-ink-subtle" /> Pipeline name</span></th>
              <th className="px-4 py-2.5"><span className="flex items-center gap-2"><Hash size={15} className="text-ink-subtle" /> No. of Stages</span></th>
              <th className="px-4 py-2.5"><span className="flex items-center gap-2"><CalendarDays size={15} className="text-ink-subtle" /> Updated on</span></th>
              <th className="w-24 px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-b-0 hover:bg-surface-sunken/60">
                <td className="px-4 py-3.5 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3.5 text-ink-muted">{p.stages.length}</td>
                <td className="px-4 py-3.5 text-ink-muted">{updatedLabel(lastUpdated[p.id])}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setMenuFor((m) => (m === p.id ? null : p.id))}
                      className="rounded p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                      aria-label={`Actions for ${p.name}`}
                    >
                      <MoreVertical size={17} />
                    </button>
                    {menuFor === p.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-surface py-1 text-left shadow-pop">
                          {['Edit pipeline', 'Duplicate', 'Delete'].map((a) => (
                            <button
                              key={a}
                              onClick={() => {
                                setMenuFor(null);
                                pushToast({ title: `Demo: ${a}`, description: 'This action is simulated in the demo.', variant: 'info' });
                              }}
                              className={cx('block w-full px-3 py-2 text-sm hover:bg-surface-sunken', a === 'Delete' ? 'text-bad' : 'text-ink')}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-subtle">No pipelines match “{query}”.</td></tr>
            )}
          </tbody>
        </table>

        {/* Cosmetic pagination */}
        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-line px-4 py-3 text-[13px] text-ink-muted">
          <span className="flex items-center gap-2">Rows per page <span className="rounded border border-line px-2 py-0.5">20</span></span>
          <span>1 - {rows.length} of {rows.length}</span>
          <div className="flex items-center gap-2">
            <button className="cursor-default text-ink-subtle/60" disabled>Previous</button>
            <span className="grid h-7 w-7 place-items-center rounded border border-line font-semibold text-ink">1</span>
            <button className="cursor-default text-ink-subtle/60" disabled>Next</button>
          </div>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {createOpen && <CreatePipelineModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
