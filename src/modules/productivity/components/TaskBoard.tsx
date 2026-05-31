/**
 * Task board (status columns) — adapts Meridian's Board/Kanban view.
 * Cards drag between To Do / In Progress / Review / Done via the shared
 * KanbanBoard; dropping moves the task's status in the in-memory store.
 */

import { Clock, MessageSquare } from 'lucide-react';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Task } from '../types';
import { TASK_STATUSES } from '../data';
import { AssigneePill, PriorityBadge, TaskTypeIcon } from './shared';
import { KanbanBoard } from './Board';

function isOverdue(t: Task): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.status !== 'done';
}

export function TaskCard({ task }: { task: Task }) {
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-brand/40">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
          <TaskTypeIcon type={task.type} size={12} />
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{task.title}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <AssigneePill id={task.assigneeId} />
        <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
          {task.points != null && (
            <span className="grid h-4 min-w-4 place-items-center rounded bg-surface-sunken px-1 font-bold text-ink-muted">{task.points}</span>
          )}
          {task.subtasks.length > 0 && <span>{doneSubs}/{task.subtasks.length}</span>}
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-0.5"><MessageSquare size={11} /> {task.comments.length}</span>
          )}
          {task.dueAt && (
            <span className={cx('inline-flex items-center gap-0.5', isOverdue(task) ? 'font-semibold text-bad' : '')}>
              <Clock size={11} /> {dateLabel(task.dueAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { moveTask } = useProductivity();

  return (
    <KanbanBoard<Task>
      columns={TASK_STATUSES}
      items={tasks}
      columnOf={(t) => t.status}
      onMove={(id, status) => moveTask(id, status as Task['status'])}
      onCardClick={onOpen}
      renderCard={(t) => <TaskCard task={t} />}
      tour="productivity.task-board"
      emptyHint="No tasks"
    />
  );
}
