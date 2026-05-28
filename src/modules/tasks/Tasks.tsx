/**
 * Tasks — Follow-up Task Manager (plan §7.12)
 * Summary stat cards · filter tabs · grouped task list (overdue/today/upcoming/completed).
 * toggleTask() wired to store.
 * Add Task modal: demo-safe — pushes a toast (no addTask store action in V1).
 * Task detail modal: shows full task info, wires toggleTask() inline.
 */
import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  Avatar,
  EmptyState,
  Tabs,
} from '@/components/ui/primitives';
import type { Task } from '@/types';
import { cx, fullName, dateLabel, userById } from '@/utils';
import {
  TaskFilter,
  TaskGroup,
  getTaskGroup,
  GROUP_ORDER,
  GROUP_LABEL,
  GROUP_TONE,
} from './utils';

// ─── Priority badge tone ───────────────────────────────────────────────────

const PRI_TONE: Record<Task['priority'], 'bad' | 'warn' | 'neutral'> = {
  high: 'bad',
  medium: 'warn',
  low: 'neutral',
};

// ─── Summary stat card ─────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: 'bad' | 'warn' | 'good' | 'brand' | 'neutral';
}

function SummaryCard({ label, value, tone = 'neutral' }: SummaryCardProps) {
  const valueClass: Record<string, string> = {
    bad: 'text-bad',
    warn: 'text-warn',
    good: 'text-good',
    brand: 'text-brand',
    neutral: 'text-ink',
  };
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={cx('text-2xl font-bold', valueClass[tone])}>{value}</p>
    </div>
  );
}

// ─── Task row ──────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  contactName?: string;
  onClick: () => void;
}

function TaskRow({ task, contactName, onClick }: TaskRowProps) {
  const toggleTask = useStore((s) => s.toggleTask);
  const group = getTaskGroup(task);
  const isCompleted = task.status === 'completed';
  const isOverdue = group === 'overdue';

  return (
    <div
      data-tour="tasks.row"
      className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0 hover:bg-surface-sunken"
    >
      {/* Completion toggle */}
      <button
        data-tour="tasks.toggle"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTask(task.id);
        }}
        className={cx(
          'shrink-0 rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          isCompleted
            ? 'text-good hover:text-good/70'
            : 'text-ink-subtle hover:text-brand',
        )}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted ? (
          <CheckCircle2 size={18} aria-hidden />
        ) : (
          <Circle size={18} aria-hidden />
        )}
      </button>

      {/* Row content — click to open detail */}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
        onClick={onClick}
        aria-label={`Open task: ${task.title}`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cx(
              'text-sm font-medium',
              isCompleted
                ? 'text-ink-subtle line-through'
                : isOverdue
                ? 'text-bad'
                : 'text-ink',
            )}
          >
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-subtle">
            <span
              className={cx(
                isOverdue && !isCompleted ? 'font-semibold text-bad' : '',
              )}
            >
              {dateLabel(task.dueDate)}
            </span>
            {contactName && <span>· {contactName}</span>}
          </div>
        </div>
        <Badge tone={PRI_TONE[task.priority]} size="sm">
          {task.priority}
        </Badge>
      </button>
    </div>
  );
}

// ─── Task detail modal ─────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const users = useStore((s) => s.users);
  const contacts = useStore((s) => s.contacts);
  const toggleTask = useStore((s) => s.toggleTask);

  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const assignee = userById(users, task.assigneeId);
  const contact = task.contactId
    ? contacts.find((c) => c.id === task.contactId)
    : null;

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title="Task Detail"
      size="md"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toggleTask(task.id);
              onClose();
            }}
          >
            {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div data-tour="tasks.detail" className="space-y-4">
        {/* Title + description */}
        <div>
          <p
            className={cx(
              'text-base font-bold',
              isCompleted ? 'text-ink-subtle line-through' : 'text-ink',
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 text-sm text-ink-muted">{task.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetaField
            label="Status"
            value={
              <Badge tone={isCompleted ? 'good' : 'brand'} size="sm">
                {task.status}
              </Badge>
            }
          />
          <MetaField
            label="Priority"
            value={
              <Badge tone={PRI_TONE[task.priority]} size="sm">
                {task.priority}
              </Badge>
            }
          />
          <MetaField
            label="Due Date"
            value={
              <div className="flex items-center gap-1.5 text-sm text-ink">
                <Calendar size={13} aria-hidden />
                {dateLabel(task.dueDate)}
              </div>
            }
          />
          {assignee && (
            <MetaField
              label="Assignee"
              value={
                <div className="flex items-center gap-1.5">
                  <Avatar name={assignee.name} size="xs" />
                  <span className="text-sm text-ink">{assignee.name}</span>
                </div>
              }
            />
          )}
          {contact && (
            <MetaField
              label="Contact"
              value={
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-ink-subtle" aria-hidden />
                  <span className="text-sm text-ink">{fullName(contact)}</span>
                </div>
              }
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function MetaField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold text-ink-subtle">{label}</p>
      {value}
    </div>
  );
}

// ─── Add task modal (demo-safe) ────────────────────────────────────────────
// NOTE: There is no addTask() action in the store (V1 scope).
// On submit, a demo toast is shown. Persistent creation requires a
// coordinator-approved store micro-task.

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

function AddTaskModal({ open, onClose }: AddTaskModalProps) {
  const pushToast = useStore((s) => s.pushToast);
  const contacts = useStore((s) => s.contacts);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [contactId, setContactId] = useState('');

  const handleClose = () => {
    setTitle('');
    setDueDate('');
    setPriority('medium');
    setContactId('');
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    pushToast({
      title: 'Task queued (demo)',
      description: `"${title.trim()}" noted — task persistence requires a store update.`,
      variant: 'info',
    });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Task"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button
            data-tour="tasks.addSubmit"
            size="sm"
            disabled={!title.trim()}
            onClick={handleSubmit}
          >
            Add Task
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div data-tour="tasks.addModal" className="space-y-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Title <span className="text-bad">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Follow up with Jane"
            className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
            autoFocus
          />
        </div>

        {/* Due date */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
            className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">
            Contact (optional)
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">— none —</option>
            {contacts.slice(0, 30).map((c) => (
              <option key={c.id} value={c.id}>
                {fullName(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Demo notice */}
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">
          Demo mode: submitted tasks show as a toast only. Persistent task
          creation requires a coordinator-approved store micro-task.
        </p>
      </div>
    </Modal>
  );
}

// ─── Main Tasks component ──────────────────────────────────────────────────

export function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const contacts = useStore((s) => s.contacts);

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Summary stats derived from the full task list (not the filtered view)
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      open: tasks.filter((t) => t.status === 'open').length,
      today: tasks.filter(
        (t) =>
          t.status === 'open' &&
          new Date(t.dueDate) >= today &&
          new Date(t.dueDate) < tomorrow,
      ).length,
      overdue: tasks.filter(
        (t) => t.status === 'open' && new Date(t.dueDate) < today,
      ).length,
      high: tasks.filter(
        (t) => t.status === 'open' && t.priority === 'high',
      ).length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    switch (activeFilter) {
      case 'mine':
        return tasks.filter((t) => t.assigneeId === 'u_me');
      case 'today':
        return tasks.filter(
          (t) =>
            t.status === 'open' &&
            new Date(t.dueDate) >= today &&
            new Date(t.dueDate) < tomorrow,
        );
      case 'overdue':
        return tasks.filter(
          (t) => t.status === 'open' && new Date(t.dueDate) < today,
        );
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, activeFilter]);

  // Group filtered tasks
  const grouped = useMemo(() => {
    const groups: Record<TaskGroup, Task[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: [],
    };
    filteredTasks.forEach((t) => groups[getTaskGroup(t)].push(t));
    return groups;
  }, [filteredTasks]);

  const filterTabs = [
    { id: 'all' as TaskFilter, label: 'All', count: tasks.length },
    {
      id: 'mine' as TaskFilter,
      label: 'My Tasks',
      count: tasks.filter((t) => t.assigneeId === 'u_me').length,
    },
    { id: 'today' as TaskFilter, label: 'Due Today', count: stats.today },
    { id: 'overdue' as TaskFilter, label: 'Overdue', count: stats.overdue },
    {
      id: 'completed' as TaskFilter,
      label: 'Completed',
      count: stats.completed,
    },
  ];

  return (
    <div data-tour="tasks.page">
      <PageHeader
        title="Tasks"
        subtitle="Follow-up tasks, reminders, and to-dos"
        actions={
          <Button
            data-tour="tasks.addButton"
            size="sm"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14} aria-hidden />
            Add Task
          </Button>
        }
      />

      <div className="flex flex-col gap-5 p-5">
        {/* Summary cards */}
        <div
          data-tour="tasks.summary"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          <SummaryCard label="Open Tasks" value={stats.open} tone="brand" />
          <SummaryCard
            label="Due Today"
            value={stats.today}
            tone={stats.today > 0 ? 'warn' : 'neutral'}
          />
          <SummaryCard
            label="Overdue"
            value={stats.overdue}
            tone={stats.overdue > 0 ? 'bad' : 'neutral'}
          />
          <SummaryCard
            label="High Priority"
            value={stats.high}
            tone={stats.high > 0 ? 'bad' : 'neutral'}
          />
          <SummaryCard
            label="Completed"
            value={stats.completed}
            tone="good"
          />
        </div>

        {/* Filter tabs */}
        <div data-tour="tasks.filters">
          <Tabs
            tabs={filterTabs}
            active={activeFilter}
            onChange={(id) => setActiveFilter(id as TaskFilter)}
            variant="underline"
          />
        </div>

        {/* Grouped task list */}
        <div data-tour="tasks.list" className="space-y-5">
          {GROUP_ORDER.map((group) => {
            const groupTasks = grouped[group];
            if (groupTasks.length === 0) return null;
            return (
              <div key={group} data-tour="tasks.groupedList">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={GROUP_TONE[group]}>
                    {GROUP_LABEL[group]}
                  </Badge>
                  <span className="text-xs text-ink-subtle">
                    {groupTasks.length}{' '}
                    task{groupTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Card className="overflow-hidden">
                  {groupTasks.map((task) => {
                    const contact = task.contactId
                      ? contacts.find((c) => c.id === task.contactId)
                      : null;
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        contactName={
                          contact ? fullName(contact) : undefined
                        }
                        onClick={() => setSelectedTask(task)}
                      />
                    );
                  })}
                </Card>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <EmptyState
              icon={<CheckSquare size={32} />}
              title="No tasks"
              body="All clear! No tasks match this filter."
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
      <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
