import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Copy, Archive, ArchiveRestore, Trash2, GitBranch } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, EmptyState } from '@/components/ui/primitives';
import { cx } from '@/utils';
import type { Pipeline, Stage } from '@/types';
import { fieldCls, KebabMenu, type MenuItem } from './_ui';
import { PipelineStageEditor } from './PipelineStageEditor';

/**
 * Settings -> Pipelines.
 *
 * Polished list of the account's pipelines with live opportunity/value stats
 * (read from the store, never mutated) wired to the PipelineStageEditor for
 * stage editing on existing pipelines. Edits, duplicates, archive, and delete
 * are held in a session-local mirror so the Opportunities board - which reads
 * pipelines straight from the store - is never affected.
 */

interface LocalPipeline extends Pipeline {
  status: 'active' | 'archived';
  updatedAt: string;
}

const money = (n: number) =>
  n >= 1000
    ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    : `$${n.toLocaleString()}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

let newSeq = 0;

export function PipelinesSection() {
  const storePipelines = useStore((s) => s.pipelines);
  const opportunities = useStore((s) => s.opportunities);
  const pushToast = useStore((s) => s.pushToast);

  const [pipelines, setPipelines] = useState<LocalPipeline[]>(() =>
    storePipelines.map((p, i) => ({
      ...p,
      status: 'active',
      updatedAt: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24 * 5).toISOString(),
    })),
  );
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<LocalPipeline | null>(null);

  /* Live opportunity stats per pipeline id (read-only from the store). */
  const stats = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    for (const o of opportunities) {
      const s = (map[o.pipelineId] ??= { count: 0, value: 0 });
      s.count += 1;
      s.value += o.monetaryValue || 0;
    }
    return map;
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pipelines.filter((p) => p.name.toLowerCase().includes(q)) : pipelines;
  }, [pipelines, query]);

  const applyEditorSave = (update: { name: string; stages: { id: string; name: string; order: number }[] }) => {
    if (!editing) return;
    const stages: Stage[] = update.stages.map((s) => ({ id: s.id, name: s.name, order: s.order }));
    setPipelines((list) => {
      const exists = list.some((p) => p.id === editing.id);
      const now = new Date().toISOString();
      if (exists) {
        return list.map((p) => (p.id === editing.id ? { ...p, name: update.name, stages, updatedAt: now } : p));
      }
      return [{ id: editing.id, name: update.name, stages, status: 'active', updatedAt: now }, ...list];
    });
    setEditing(null);
  };

  const duplicate = (p: LocalPipeline) => {
    const copy: LocalPipeline = {
      ...p,
      id: `pl_copy_${++newSeq}_${Date.now()}`,
      name: `${p.name} (copy)`,
      status: 'active',
      updatedAt: new Date().toISOString(),
      stages: p.stages.map((s, i) => ({ id: `${p.id}_dup_${i}_${++newSeq}`, name: s.name, order: i })),
    };
    setPipelines((list) => [copy, ...list]);
    pushToast({ title: 'Pipeline duplicated', description: `Created "${copy.name}" (demo only).`, variant: 'success' });
  };

  const toggleArchive = (p: LocalPipeline) => {
    const next = p.status === 'active' ? 'archived' : 'active';
    setPipelines((list) => list.map((x) => (x.id === p.id ? { ...x, status: next, updatedAt: new Date().toISOString() } : x)));
    pushToast({ title: next === 'archived' ? 'Pipeline archived' : 'Pipeline restored', variant: 'success' });
  };

  const remove = (p: LocalPipeline) => {
    setPipelines((list) => list.filter((x) => x.id !== p.id));
    pushToast({ title: 'Pipeline deleted', description: `"${p.name}" removed from this demo session. The Opportunities board is unaffected.`, variant: 'info' });
  };

  const newPipeline = () => {
    const id = `pl_new_${++newSeq}_${Date.now()}`;
    setEditing({
      id,
      name: 'New Pipeline',
      status: 'active',
      updatedAt: new Date().toISOString(),
      stages: [
        { id: `${id}_s0`, name: 'New Lead', order: 0 },
        { id: `${id}_s1`, name: 'In Progress', order: 1 },
        { id: `${id}_s2`, name: 'Won', order: 2 },
      ],
    });
  };

  const menuFor = (p: LocalPipeline): MenuItem[] => [
    { label: 'Edit stages', icon: <Pencil size={14} />, onClick: () => setEditing(p) },
    { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicate(p) },
    p.status === 'active'
      ? { label: 'Archive', icon: <Archive size={14} />, onClick: () => toggleArchive(p) }
      : { label: 'Restore', icon: <ArchiveRestore size={14} />, onClick: () => toggleArchive(p) },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => remove(p) },
  ];

  return (
    <div data-tour="settings.configSection" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">Pipelines</p>
          <p className="mt-0.5 text-xs text-ink-muted">{pipelines.length} pipelines - edits here stay in Settings.</p>
        </div>
        <Button size="sm" data-tour="settings.addConfig" onClick={newPipeline}>
          <Plus size={13} /> New pipeline
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pipelines..."
          className={cx(fieldCls, 'pl-9')}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2.5 font-semibold">Pipeline</th>
                <th className="px-4 py-2.5 text-center font-semibold">Stages</th>
                <th className="px-4 py-2.5 text-center font-semibold">Opportunities</th>
                <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                <th className="px-4 py-2.5 font-semibold">Updated</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const s = stats[p.id] ?? { count: 0, value: 0 };
                return (
                  <tr key={p.id} className={cx('transition-colors hover:bg-surface-sunken/50', p.status === 'archived' && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditing(p)}
                        className="font-semibold text-ink hover:text-brand hover:underline"
                      >
                        {p.name}
                      </button>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.stages.slice(0, 4).map((st) => (
                          <span key={st.id} className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            {st.name}
                          </span>
                        ))}
                        {p.stages.length > 4 && (
                          <span className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle">
                            +{p.stages.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-muted">{p.stages.length}</td>
                    <td className="px-4 py-3 text-center text-ink-muted">{s.count}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">{money(s.value)}</td>
                    <td className="px-4 py-3 text-ink-muted">{fmtDate(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === 'active' ? 'good' : 'neutral'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <KebabMenu items={menuFor(p)} ariaLabel={`Actions for ${p.name}`} />
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
            title={query ? 'No pipelines match' : 'No pipelines yet'}
            body={query ? 'Try a different search.' : 'Create a pipeline to organize your opportunities into stages.'}
            action={
              query
                ? <Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>
                : <Button size="sm" onClick={newPipeline}><Plus size={13} /> New pipeline</Button>
            }
          />
        )}
      </div>

      {editing && (
        <PipelineStageEditor
          pipeline={editing}
          onClose={() => setEditing(null)}
          onSave={applyEditorSave}
        />
      )}
    </div>
  );
}
