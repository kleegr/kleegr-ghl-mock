/**
 * Tasks tab — adapts Meridian's My Day + Board/Table views. A "My Day" strip
 * surfaces the current demo user's due/overdue work; below it a board/table
 * toggle with search + filters lists all tasks. Hosts the create modal and
 * detail drawer.
 */

import { useMemo, useState } from 'react';
import { KanbanSquare, Plus, Search, Sun, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, TaskStatus } from '../types';
import { CURRENT_USER_ID, PRIORITIES, TASK_STATUSES } from '../data';
import { PriorityBadge, SelectInput, TaskStatusBadge, TaskTypeIcon, inputCls } from './shared';
import { TaskBoard } from './TaskBoard';
import { TaskTable } from './TaskTable';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailDrawer } from './TaskDetailDrawer';

type View = 'board' | 'table';

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

export function TasksView() {
  const { tasks } = useProductivity();
  const [view, setView] = useState<View>('board');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (mineOnly && t.assigneeId !== CURRENT_USER_ID) return false;
      if (q) {
        const hay = `${t.title} ${t.description ?? ''} ${t.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, query, status, priority, mineOnly]);

  // My Day: my tasks due today or overdue, not done.
  const myDay = useMemo(() => {
    const todayEnd = startOfDay();
    todayEnd.setHours(23, 59, 59, 999);
    return tasks
      .filter((t) => t.assigneeId === CURRENT_USER_ID && t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() <= todayEnd.getTime())
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
  }, [tasks]);

  return (
    <div className="flex h-full flex-col">
      {/* My Day */}
      <div className="mb-3 rounded-xl border border-line bg-gradient-to-br from-brand-soft/60 to-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sun size={16} className="text-brand" />
          <h3 className="text-sm font-bold text-ink">My Day</h3>
          <span className="text-[12px] text-ink-subtle">· due today or overdue</span>
        </div>
        {myDay.length === 0 ? (
          <p className="px-1 py-2 text-[13px] text-ink-subtle">Nothing due today. You're all caught up. 🎉</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {myDay.map((t) => (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className="flex w-56 shrink-0 flex-col gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-left shadow-card transition-colors hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <TaskTypeIcon type={t.type} size={13} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <span className="line-clamp-2 text-[13px] font-semibold text-ink">{t.title}</span>
                <span className={cx('text-[11px]', new Date(t.dueAt!).getTime() < Date.now() ? 'font-semibold text-bad' : 'text-ink-subtle')}>
                  Due {dateLabel(t.dueAt!)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className={`${inputCls} pl-8`} />
        </div>

        <div className="w-32">
          <SelectInput value={status} onChange={(v) => setStatus(v as TaskStatus | 'all')}>
            <option value="all">All statuses</option>
            {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </SelectInput>
        </div>
        <div className="w-32">
          <SelectInput value={priority} onChange={(v) => setPriority(v as Priority | 'all')}>
            <option value="all">All priority</option>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </SelectInput>
        </div>

        <button
          onClick={() => setMineOnly((v) => !v)}
          className={cx('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors', mineOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken')}
        >
          My tasks
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-line p-0.5">
            <button onClick={() => setView('board')} className={cx('rounded-md px-2.5 py-1.5 transition-colors', view === 'board' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')} aria-label="Board view"><KanbanSquare size={15} /></button>
            <button onClick={() => setView('table')} className={cx('rounded-md px-2.5 py-1.5 transition-colors', view === 'table' ? 'bg-surface-sunken text-ink' : 'text-ink-subtle hover:text-ink')} aria-label="Table view"><Table2 size={15} /></button>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} data-tour="productivity.create-task">
            <Plus size={15} /> New Task
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'board' ? (
          <TaskBoard tasks={filtered} onOpen={setOpenId} />
        ) : (
          <div className="h-full overflow-y-auto pr-0.5">
            <TaskTable tasks={filtered} onOpen={setOpenId} />
          </div>
        )}
      </div>

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskDetailDrawer taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
