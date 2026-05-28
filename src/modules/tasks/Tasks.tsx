/**
 * Tasks — Wave 1 implementation.
 *
 * GoHighLevel-style task manager. Reads entirely from the Zustand store (fake
 * seed data). No real backend, no real API calls, no real PII.
 *
 * Sections:
 *  1. Summary stat cards (Due Today / Overdue / Open / Completed / High Priority)
 *  2. Filter tabs         (All | My Tasks | Due Today | Overdue | Completed)
 *  3. Priority filter pills
 *  4. Grouped task list   (Overdue / Due Today / Upcoming / Completed)
 *  5. Flat list           (for non-grouped tabs)
 *  6. Task detail modal   (full fields + toggle complete/incomplete)
 *  7. Add Task modal      (mocked — no addTask store action yet)
 *
 * data-tour keys (plan §18):
 *  tasks.page · tasks.addButton · tasks.summary · tasks.filters
 *  tasks.list · tasks.groupedList · tasks.row · tasks.toggle
 *  tasks.detail · tasks.addModal · tasks.addSubmit
 */

import { useState, useMemo, type ReactNode } from 'react';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  CalendarDays,
  Flag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  Avatar,
  EmptyState,
  Tabs,
} from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import type { Contact, Task, User } from '@/types';
import {
  fullName,
  isOverdue,
  isDueToday,
  formatDueDate,
  dueDateLabel,
} from './utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'u_me';

type TabId          = 'all' | 'mine' | 'today' | 'overdue' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityTone(priority: Task['priority']): 'bad' | 'warn' | 'neutral' {
  if (priority === 'high')   return 'bad';
  if (priority === 'medium') return 'warn';
  return 'neutral';
}

// ─── Summary stat card ────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: 'bad' | 'warn' | 'good' | 'neutral' | 'brand';
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function SummaryCard({ label, value, tone = 'neutral', icon, active, onClick }: SummaryCardProps) {
  const iconCls =
    tone === 'bad'   ? 'bg-bad/10 text-bad'      :
    tone === 'warn'  ? 'bg-warn/10 text-warn'     :
    tone === 'good'  ? 'bg-good/10 text-good'     :
    tone === 'brand' ? 'bg-brand-soft text-brand' :
                       'bg-surface-sunken text-ink-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex min-w-[96px] flex-1 flex-col gap-1.5 rounded-xl border p-3 text-left',
        'transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        active ? 'border-brand bg-brand/5' : 'border-line bg-surface',
      ].join(' ')}
    >
      <span className={['grid h-8 w-8 shrink-0 place-items-center rounded-lg', iconCls].join(' ')}>
        {icon}
      </span>
      <p className="font-display text-xl font-extrabold leading-none text-ink">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
    </button>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  contactName?: string;
  assigneeName?: string;
  onToggle: () => void;
  onClick: () => void;
}

function TaskRow({ task, contactName, assigneeName, onToggle, onClick }: TaskRowProps) {
  const done    = task.status === 'completed';
  const overdue = !done && isOverdue(task.dueDate);
  const today   = !done && !overdue && isDueToday(task.dueDate);

  const dueCls = overdue ? 'text-bad' : today ? 'text-warn' : 'text-ink-subtle';

  return (
    <div
      data-tour="tasks.row"
      className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`Task: ${task.title}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        data-tour="tasks.toggle"
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        className="mt-0.5 shrink-0 rounded text-ink-subtle hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      >
        {done
          ? <CheckCircle2 size={18} className="text-good" />
          : <Circle size={18} />
        }
      </button>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className={[
          'text-sm font-medium line-clamp-1',
          done ? 'text-ink-subtle line-through' : 'text-ink',
        ].join(' ')}>
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={['text-[11px] font-semibold', dueCls].join(' ')}>
            {overdue && '⚠ '}{dueDateLabel(task.dueDate, task.status)}
          </span>
          {contactName && (
            <span className="text-[11px] text-ink-subtle">· {contactName}</span>
          )}
        </div>
      </div>

      {/* Priority + assignee */}
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
        {assigneeName && <Avatar name={assigneeName} size="xs" />}
      </div>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

interface GroupSectionProps {
  title: string;
  icon: ReactNode;
  tasks: Task[];
  contacts: Contact[];
  users: User[];
  onToggle: (id: string) => void;
  onSelect: (task: Task) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
  accentCls?: string;
}

function GroupSection({
  title, icon, tasks, contacts, users,
  onToggle, onSelect,
  collapsible = false, defaultOpen = true,
  accentCls = 'text-ink',
}: GroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div data-tour="tasks.groupedList">
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className={[
          'flex w-full items-center gap-2 border-b border-line/60 px-4 py-2',
          'text-[11px] font-bold uppercase tracking-wide',
          collapsible
            ? 'cursor-pointer hover:bg-surface-sunken'
            : 'cursor-default bg-surface-sunken/50',
          accentCls,
        ].join(' ')}
      >
        {icon}
        {title}
        <span className="ml-1 rounded-full border border-line bg-surface px-1.5 py-px text-[10px] font-bold text-ink-muted">
          {tasks.length}
        </span>
        {collapsible && (
          <span className="ml-auto text-ink-subtle">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>

      {open && (
        <div className="divide-y divide-line/60">
          {tasks.map((task) => {
            const contact  = task.contactId
              ? contacts.find((c) => c.id === task.contactId)
              : undefined;
            const assignee = users.find((u) => u.id === task.assigneeId);
            return (
              <TaskRow
                key={task.id}
                task={task}
                contactName={contact ? fullName(contact) : undefined}
                assigneeName={assignee?.name}
                onToggle={() => onToggle(task.id)}
                onClick={() => onSelect(task)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Task detail modal ────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  task: Task;
  contacts: Contact[];
  users: User[];
  onClose: () => void;
  onToggle: () => void;
}

function TaskDetailModal({ task, contacts, users, onClose, onToggle }: TaskDetailModalProps) {
  const done     = task.status === 'completed';
  const overdue  = !done && isOverdue(task.dueDate);
  const contact  = task.contactId ? contacts.find((c) => c.id === task.contactId) : undefined;
  const assignee = users.find((u) => u.id === task.assigneeId);

  return (
    <Modal
      open
      onClose={onClose}
      title="Task detail"
      size="md"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={done ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { onToggle(); onClose(); }}
          >
            {done ? 'Mark incomplete' : 'Mark complete'}
          </Button>
        </div>
      }
    >
      <div data-tour="tasks.detail" className="space-y-4">

        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="mt-0.5 shrink-0 text-ink-subtle hover:text-brand"
            onClick={onToggle}
            aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          >
            {done
              ? <CheckCircle2 size={22} className="text-good" />
              : <Circle size={22} />
            }
          </button>
          <div>
            <p className={[
              'text-base font-bold',
              done ? 'text-ink-subtle line-through' : 'text-ink',
            ].join(' ')}>
              {task.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={priorityTone(task.priority)}>{task.priority} priority</Badge>
              <Badge tone={done ? 'good' : overdue ? 'bad' : 'neutral'}>
                {done ? 'Completed' : overdue ? 'Overdue' : 'Open'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line bg-surface-sunken/40 px-4 py-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Due date</dt>
            <dd className={['mt-0.5 text-sm font-medium', overdue ? 'text-bad' : 'text-ink'].join(' ')}>
              {formatDueDate(task.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Status</dt>
            <dd className="mt-0.5">
              <Badge tone={done ? 'good' : overdue ? 'bad' : 'neutral'}>{task.status}</Badge>
            </dd>
          </div>
          {assignee && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Assignee</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <Avatar name={assignee.name} size="xs" />
                <span className="text-sm text-ink">{assignee.name}</span>
              </dd>
            </div>
          )}
          {contact && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Related contact</dt>
              <dd className="mt-0.5 text-sm font-medium text-brand">{fullName(contact)}</dd>
            </div>
          )}
        </dl>

        {task.description && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Notes</p>
            <p className="rounded-xl border border-line bg-surface-sunken/40 px-4 py-3 text-sm text-ink">
              {task.description}
            </p>
          </div>
        )}

      </div>
    </Modal>
  );
}

// ─── Add task modal ───────────────────────────────────────────────────────────

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: () => void;
}

function AddTaskModal({ onClose, onSubmit }: AddTaskModalProps) {
  const [title, setTitle]       = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const todayStr = new Date().toISOString().split('T')[0] ?? '';

  return (
    <Modal
      open
      onClose={onClose}
      title="Add task"
      size="sm"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            data-tour="tasks.addSubmit"
            size="sm"
            disabled={!title.trim()}
            onClick={() => { if (title.trim()) onSubmit(); }}
          >
            Add task
          </Button>
        </div>
      }
    >
      <div data-tour="tasks.addModal" className="space-y-4">

        <div>
          <label htmlFor="new-task-title" className="mb-1 block text-xs font-semibold text-ink">
            Task title <span className="text-bad">*</span>
          </label>
          <input
            id="new-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call back about quote"
            autoFocus
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
        </div>

        <div>
          <label htmlFor="new-task-due" className="mb-1 block text-xs font-semibold text-ink">
            Due date
          </label>
          <input
            id="new-task-due"
            type="date"
            value={dueDate}
            min={todayStr}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink">Priority</p>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as const).map((p) => {
              const activeCls =
                p === 'high'   ? 'border-bad bg-bad/10 text-bad'    :
                p === 'medium' ? 'border-warn bg-warn/10 text-warn'  :
                                 'border-line bg-surface-sunken text-ink';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={[
                    'flex-1 rounded-lg border py-1.5 text-xs font-semibold capitalize transition-colors',
                    priority === p
                      ? activeCls
                      : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken',
                  ].join(' ')}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <p className="rounded-lg border border-line/60 bg-surface-sunken px-3 py-2 text-[11px] text-ink-muted">
          <strong className="text-ink">Demo mode:</strong>{' '}
          Task creation is mocked — no data will be saved to the store.
        </p>

      </div>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Tasks() {
  const tasks      = useStore((s) => s.tasks);
  const contacts   = useStore((s) => s.contacts);
  const users      = useStore((s) => s.users);
  const toggleTask = useStore((s) => s.toggleTask);
  const pushToast  = useStore((s) => s.pushToast);

  const [activeTab, setActiveTab]           = useState<TabId>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedTask, setSelectedTask]     = useState<Task | null>(null);
  const [showAddModal, setShowAddModal]     = useState(false);

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    dueToday:     tasks.filter((t) => t.status === 'open' && isDueToday(t.dueDate)).length,
    overdue:      tasks.filter((t) => t.status === 'open' && isOverdue(t.dueDate)).length,
    open:         tasks.filter((t) => t.status === 'open').length,
    completed:    tasks.filter((t) => t.status === 'completed').length,
    highPriority: tasks.filter((t) => t.status === 'open' && t.priority === 'high').length,
  }), [tasks]);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => ({
    all:       tasks.length,
    mine:      tasks.filter((t) => t.assigneeId === CURRENT_USER_ID).length,
    today:     tasks.filter((t) => t.status === 'open' && isDueToday(t.dueDate)).length,
    overdue:   tasks.filter((t) => t.status === 'open' && isOverdue(t.dueDate)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }), [tasks]);

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let base = tasks;
    switch (activeTab) {
      case 'mine':      base = base.filter((t) => t.assigneeId === CURRENT_USER_ID); break;
      case 'today':     base = base.filter((t) => t.status === 'open' && isDueToday(t.dueDate)); break;
      case 'overdue':   base = base.filter((t) => t.status === 'open' && isOverdue(t.dueDate)); break;
      case 'completed': base = base.filter((t) => t.status === 'completed'); break;
    }
    if (priorityFilter !== 'all') {
      base = base.filter((t) => t.priority === priorityFilter);
    }
    return base;
  }, [tasks, activeTab, priorityFilter]);

  const isGrouped = activeTab === 'all' || activeTab === 'mine';

  // ── Groups ────────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    if (!isGrouped) return null;
    const byDue = (a: Task, b: Task) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return {
      overdue:   filteredTasks.filter((t) => t.status === 'open' && isOverdue(t.dueDate)).sort(byDue),
      today:     filteredTasks.filter((t) => t.status === 'open' && isDueToday(t.dueDate)).sort(byDue),
      upcoming:  filteredTasks
        .filter((t) => t.status === 'open' && !isOverdue(t.dueDate) && !isDueToday(t.dueDate))
        .sort(byDue),
      completed: filteredTasks
        .filter((t) => t.status === 'completed')
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    };
  }, [filteredTasks, isGrouped]);

  // ── Toggle handler ────────────────────────────────────────────────────────
  function handleToggle(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    toggleTask(taskId);
    if (task) {
      pushToast({
        title: task.status === 'open' ? 'Task completed ✓' : 'Task reopened',
        description: task.title,
        variant: 'success',
      });
    }
  }

  const tabDefs = [
    { id: 'all',       label: 'All Tasks',  count: tabCounts.all },
    { id: 'mine',      label: 'My Tasks',   count: tabCounts.mine },
    { id: 'today',     label: 'Due Today',  count: tabCounts.today },
    { id: 'overdue',   label: 'Overdue',    count: tabCounts.overdue },
    { id: 'completed', label: 'Completed',  count: tabCounts.completed },
  ];

  const allGroupsEmpty =
    isGrouped && groups !== null &&
    groups.overdue.length   === 0 &&
    groups.today.length     === 0 &&
    groups.upcoming.length  === 0 &&
    groups.completed.length === 0;

  return (
    <div data-tour="tasks.page">
      <PageHeader
        title="Tasks"
        subtitle="Follow-up tasks, reminders, and team to-dos."
        actions={
          <Button data-tour="tasks.addButton" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Task
          </Button>
        }
      />

      {/* Summary cards */}
      <div data-tour="tasks.summary" className="flex gap-2 overflow-x-auto px-5 py-4 sm:gap-3">
        <SummaryCard
          label="Due today"
          value={summary.dueToday}
          tone={summary.dueToday > 0 ? 'warn' : 'neutral'}
          icon={<Clock size={15} />}
          active={activeTab === 'today'}
          onClick={() => setActiveTab('today')}
        />
        <SummaryCard
          label="Overdue"
          value={summary.overdue}
          tone={summary.overdue > 0 ? 'bad' : 'neutral'}
          icon={<AlertCircle size={15} />}
          active={activeTab === 'overdue'}
          onClick={() => setActiveTab('overdue')}
        />
        <SummaryCard
          label="Open"
          value={summary.open}
          tone="brand"
          icon={<CheckSquare size={15} />}
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        />
        <SummaryCard
          label="Completed"
          value={summary.completed}
          tone="good"
          icon={<CheckCircle2 size={15} />}
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
        />
        <SummaryCard
          label="High priority"
          value={summary.highPriority}
          tone={summary.highPriority > 0 ? 'bad' : 'neutral'}
          icon={<Flag size={15} />}
        />
      </div>

      {/* Filters */}
      <div data-tour="tasks.filters">
        <div className="flex items-center justify-between border-b border-line bg-surface px-5">
          <Tabs
            tabs={tabDefs}
            active={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />
          <div className="flex shrink-0 items-center gap-0.5 pb-1 pl-3">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={[
                  'rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors',
                  priorityFilter === p
                    ? 'bg-brand text-brand-fg'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                ].join(' ')}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="px-5 py-4 pb-10">
        <Card data-tour="tasks.list" className="overflow-hidden">

          {/* Grouped view */}
          {isGrouped && groups && (
            <>
              <GroupSection
                title="Overdue"
                icon={<AlertCircle size={12} />}
                tasks={groups.overdue}
                contacts={contacts}
                users={users}
                onToggle={handleToggle}
                onSelect={setSelectedTask}
                accentCls="text-bad"
              />
              <GroupSection
                title="Due Today"
                icon={<Clock size={12} />}
                tasks={groups.today}
                contacts={contacts}
                users={users}
                onToggle={handleToggle}
                onSelect={setSelectedTask}
                accentCls="text-warn"
              />
              <GroupSection
                title="Upcoming"
                icon={<CalendarDays size={12} />}
                tasks={groups.upcoming}
                contacts={contacts}
                users={users}
                onToggle={handleToggle}
                onSelect={setSelectedTask}
                accentCls="text-ink"
              />
              <GroupSection
                title="Completed"
                icon={<CheckCircle2 size={12} />}
                tasks={groups.completed}
                contacts={contacts}
                users={users}
                onToggle={handleToggle}
                onSelect={setSelectedTask}
                collapsible
                defaultOpen={false}
                accentCls="text-good"
              />
              {allGroupsEmpty && (
                <EmptyState
                  icon={<CheckSquare size={32} />}
                  title={priorityFilter !== 'all' ? `No ${priorityFilter}-priority tasks` : 'All caught up!'}
                  body={priorityFilter !== 'all' ? 'Try removing the priority filter.' : 'No tasks match the current view.'}
                />
              )}
            </>
          )}

          {/* Flat view */}
          {!isGrouped && (
            filteredTasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare size={32} />}
                title={
                  activeTab === 'today'   ? 'No tasks due today'           :
                  activeTab === 'overdue' ? 'No overdue tasks — nice work!' :
                                           'No completed tasks yet'
                }
                body={
                  priorityFilter !== 'all'
                    ? `Try removing the ${priorityFilter} priority filter.`
                    : undefined
                }
              />
            ) : (
              <div className="divide-y divide-line/60">
                {filteredTasks.map((task) => {
                  const contact  = task.contactId
                    ? contacts.find((c) => c.id === task.contactId)
                    : undefined;
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      contactName={contact ? fullName(contact) : undefined}
                      assigneeName={assignee?.name}
                      onToggle={() => handleToggle(task.id)}
                      onClick={() => setSelectedTask(task)}
                    />
                  );
                })}
              </div>
            )
          )}

          {filteredTasks.length > 0 && (
            <div className="border-t border-line/60 px-4 py-2.5">
              <p className="text-[11px] text-ink-subtle">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                {priorityFilter !== 'all' ? ` · ${priorityFilter} priority` : ''}
              </p>
            </div>
          )}

        </Card>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          contacts={contacts}
          users={users}
          onClose={() => setSelectedTask(null)}
          onToggle={() => handleToggle(selectedTask.id)}
        />
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSubmit={() => {
            setShowAddModal(false);
            pushToast({
              title: 'Demo: task not saved',
              description: 'The store does not yet have an addTask action — this is mocked.',
              variant: 'info',
            });
          }}
        />
      )}

    </div>
  );
}
