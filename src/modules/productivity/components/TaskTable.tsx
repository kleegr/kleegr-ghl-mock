/**
 * Task table — adapts Meridian's Table/List view. Compact, scannable rows with
 * status, priority, assignee, project, points, and due date. Rows open the
 * detail drawer. Header cells sort the in-memory list client-side.
 */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, Task } from '../types';
import { personName } from '../data';
import { AssigneePill, PriorityBadge, TaskStatusBadge, TaskTypeIcon } from './shared';

type SortKey = 'title' | 'status' | 'priority' | 'due';

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<Task['status'], number> = { todo: 0, in_progress: 1, review: 2, done: 3 };

export function TaskTable({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { projects } = useProductivity();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'priority', dir: 'asc' });

  const projectName = (id?: string) => projects.find((p) => p.id === id)?.name;

  const sorted = useMemo(() => {
    const arr = tasks.slice();
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'status': cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case 'priority': cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
        case 'due': cmp = (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity); break;
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const SortHead = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <button onClick={() => toggleSort(k)} className={cx('inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-ink', className)}>
      {label}
      {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-3 border-b border-line bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">
        <SortHead k="title" label="Task" className="flex-1" />
        <SortHead k="status" label="Status" className="hidden w-28 sm:flex" />
        <SortHead k="priority" label="Priority" className="hidden w-24 md:flex" />
        <span className="hidden w-28 lg:block font-semibold uppercase tracking-wide">Project</span>
        <span className="hidden w-20 md:block font-semibold uppercase tracking-wide">Assignee</span>
        <SortHead k="due" label="Due" className="w-20 justify-end" />
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-ink-subtle">No tasks match your filters.</div>
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map((t) => (
            <li key={t.id}>
              <button onClick={() => onOpen(t.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-sunken/60">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <TaskTypeIcon type={t.type} size={13} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{t.title}</span>
                    {t.assigneeId && <span className="block truncate text-[11px] text-ink-subtle md:hidden">{personName(t.assigneeId)}</span>}
                  </span>
                </span>
                <span className="hidden w-28 shrink-0 sm:block"><TaskStatusBadge status={t.status} /></span>
                <span className="hidden w-24 shrink-0 md:block"><PriorityBadge priority={t.priority} /></span>
                <span className="hidden w-28 shrink-0 truncate text-[12px] text-ink-muted lg:block">{projectName(t.projectId) ?? '—'}</span>
                <span className="hidden w-20 shrink-0 md:block"><AssigneePill id={t.assigneeId} /></span>
                <span className={cx('w-20 shrink-0 text-right text-[11px]', t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.status !== 'done' ? 'font-semibold text-bad' : 'text-ink-subtle')}>
                  {t.dueAt ? dateLabel(t.dueAt) : '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
