import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Copy, Trash2, GitBranch } from 'lucide-react';
import type { Pipeline, Stage } from '@/types';
import { useStore } from '@/store/useStore';
import { Button, Badge, EmptyState } from '@/components/ui/primitives';
import { Kebab, Select, INPUT_CX } from './ui';
import { PipelineStageEditor } from './PipelineStageEditor';
import { cx, money, dateLabel } from '@/utils';

/**
 * Settings → Pipelines.
 *
 * Polished list of pipelines with stage counts, live opportunity counts + total
 * value (read from the store), status, and an action menu (Edit · Duplicate ·
 * Delete). Edit opens the PipelineStageEditor. The list is a LOCAL working copy
 * seeded from the store, so editing/duplicating/deleting here never disturbs the
 * Opportunities board.
 */

type StatusFilter = 'all' | 'active' | 'archived';

interface PipelineRow {
  id: string;
  name: string;
  stages: Stage[];
  status: 'active' | 'archived';
  updatedAt: string;
}

const cloneStages = (stages: Stage[], pid: string): Stage[] =>
  stages.map((s, i) => ({ id: `st_${pid}_${i}`, name: s.name, order: i }));

const DEFAULT_STAGES: Stage[] = [
  { id: 's0', name: 'New Lead', order: 0 },
  { id: 's1', name: 'Contacted', order: 1 },
  { id: 's2', name: 'Proposal Sent', order: 2 },
  { id: 's3', name: 'Closed', order: 3 },
];

export function PipelinesSection() {
  const seedPipelines = useStore((s) => s.pipelines);
  const opportunities = useStore((s) => s.opportunities);
  const pushToast = useStore((s) => s.pushToast);

  const [rows, setRows] = useState<PipelineRow[]>(() =>
    seedPipelines.map((p, i) => ({
      id: p.id,
      name: p.name,
      stages: [...p.stages].sort((a, b) => a.order - b.order),
      status: /archive/i.test(p.name) ? 'archived' : 'active',
      updatedAt: new Date(Date.now() - (i * 4 + 2) * 86400000).toISOString(),
    })),
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);

  // Live opportunity stats per pipeline (read-only from the store).
  const stats = useMemo(() => {
    const m: Record<string, { count: number; value: number }> = {};
    for (const o of opportunities) {
      const e = (m[o.pipelineId] ??= { count: 0, value: 0 });
      e.count += 1;
      e.value += o.monetaryValue || 0;
    }
    return m;
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return !q || r.name.toLowerCase().includes(q);
    });
  }, [rows, query, statusFilter]);

  const openEdit = (row: PipelineRow) => {
    setActivePipeline({ id: row.id, name: row.name, stages: row.stages });
    setEditorOpen(true);
  };

  const addPipeline = () => {
    const id = `pipe_new_${Date.now()}`;
    const row: PipelineRow = {
      id,
      name: 'New Pipeline',
      stages: cloneStages(DEFAULT_STAGES, id),
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    setRows((list) => [row, ...list]);
    setActivePipeline({ id: row.id, name: row.name, stages: row.stages });
    setEditorOpen(true);
  };

  const duplicate = (row: PipelineRow) => {
    const id = `pipe_copy_${Date.now()}`;
    const copy: PipelineRow = {
      id,
      name: `${row.name} (Copy)`,
      stages: cloneStages(row.stages, id),
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    setRows((list) => {
      const idx = list.findIndex((r) => r.id === row.id);
      const next = [...list];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    pushToast({ title: 'Pipeline duplicated', description: `“${copy.name}” was created (demo session).`, variant: 'success' });
  };

  const remove = (row: PipelineRow) => {
    setRows((list) => list.filter((r) => r.id !== row.id));
    pushToast({ title: 'Pipeline deleted (demo)', description: `“${row.name}” was removed. The Opportunities board is unaffected.`, variant: 'success' });
  };

  const handleSave = (id: string, patch: { name: string; stages: Stage[] }) => {
    setRows((list) =>
      list.map((r) => (r.id === id ? { ...r, name: patch.name, stages: patch.stages, updatedAt: new Date().toISOString() } : r)),
    );
    pushToast({ title: 'Pipeline saved', description: `“${patch.name}” now has ${patch.stages.length} stages (demo session).`, variant: 'success' });
    setEditorOpen(false);
  };

  return (
    <div data-tour="settings.configSection" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Pipelines</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{rows.length} pipelines · counts and value are live from Opportunities.</p>
        </div>
        <Button size="sm" data-tour="settings.addConfig" onClick={addPipeline}>
          <Plus size={13} /> Add Pipeline
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pipelines"
            className={cx(INPUT_CX, 'pl-9')}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-auto">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-2.5">Pipeline</th>
                <th className="px-4 py-2.5 text-right">Stages</th>
                <th className="px-4 py-2.5 text-right">Opportunities</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((r) => {
                const st = stats[r.id] ?? { count: 0, value: 0 };
                return (
                  <tr key={r.id} className="transition-colors hover:bg-surface-sunken/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                          <GitBranch size={15} />
                        </span>
                        <span className="font-semibold text-ink">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-muted">{r.stages.length}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-muted">{st.count}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{money(st.value)}</td>
                    <td className="px-4 py-3 text-ink-muted">{dateLabel(r.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === 'active' ? 'good' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(r)}>
                          <Pencil size={12} /> Edit
                        </Button>
                        <Kebab
                          items={[
                            { label: 'Edit stages', icon: <Pencil size={14} />, onClick: () => openEdit(r) },
                            { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicate(r) },
                            { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => remove(r), danger: true },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<GitBranch size={26} />}
            title="No pipelines found"
            body="Try a different search or filter, or create a new pipeline."
            action={
              <Button size="sm" onClick={addPipeline}>
                <Plus size={13} /> Add Pipeline
              </Button>
            }
          />
        )}
      </div>

      <PipelineStageEditor
        pipeline={activePipeline}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
