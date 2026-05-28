import { useState, useMemo } from 'react';
import {
  Plus, CheckSquare, AlertTriangle, Clock, CheckCircle2,
  Flag, User, Calendar, Briefcase, ChevronDown, ChevronRight,
  X, FileText,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, Badge, Avatar, Button } from '@/components/ui/primitives';
import { fullName, relativeTime, dateLabel } from '@/utils';
import type { Task } from '@/types';

type Filter = 'all' | 'mine' | 'today' | 'overdue' | 'completed';

const PRIORITY_TONE = {
  high: 'bad',
  medium: 'warn',
  low: 'neutral',
} as const;

const PRIORITY_COLOR = {
  high: 'text-bad',
  medium: 'text-warn',
  low: 'text-ink-subtle',
} as const;

export function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const users = useStore((s) => s.users);
  const toggleTask = useStore((s) => s.toggleTask);
  const pushToast = useStore((s) => s.pushToast);

  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);
  const todayEnd = useMemo(() => todayStart + 86400000, [todayStart]);

  const me = users.find((u) => u.isCurrentUser) ?? users[0];

  // ── Summary counts ──────────────────────────────────────────────────
  const summary = useMemo(() => ({
    open: tasks.filter((t) => t.status === 'open').length,
    today: tasks.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() >= todayStart && new Date(t.dueDate).getTime() < todayEnd).length,
    overdue: tasks.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() < todayStart).length,
    high: tasks.filter((t) => t.status === 'open' && t.priority === 'high').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }), [tasks, todayStart, todayEnd]);

  // ── Filtered + grouped ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tasks;
    if (activeFilter === 'mine') list = list.filter((t) => t.assigneeId === me?.id);
    else if (activeFilter === 'today') list = list.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() >= todayStart && new Date(t.dueDate).getTime() < todayEnd);
    else if (activeFilter === 'overdue') list = list.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() < todayStart);
    else if (activeFilter === 'completed') list = list.filter((t) => t.status === 'completed');
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
    return list;
  }, [tasks, activeFilter, priorityFilter, me, todayStart, todayEnd]);

  const groups = useMemo(() => {
    if (activeFilter === 'completed') return [{ id: 'completed', label: 'Completed', tasks: filtered }];
    const overdue = filtered.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() < todayStart);
    const today = filtered.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() >= todayStart && new Date(t.dueDate).getTime() < todayEnd);
    const upcoming = filtered.filter((t) => t.status === 'open' && new Date(t.dueDate).getTime() >= todayEnd);
    const completed = filtered.filter((t) => t.status === 'completed');
    const result = [];
    if (overdue.length) result.push({ id: 'overdue', label: `Overdue (${overdue.length})`, tasks: overdue, accent: 'text-bad' });
    if (today.length) result.push({ id: 'today', label: `Due Today (${today.length})`, tasks: today, accent: 'text-warn' });
    if (upcoming.length) result.push({ id: 'upcoming', label: `Upcoming (${upcoming.length})`, tasks: upcoming, accent: 'text-ink' });
    if (completed.length) result.push({ id: 'completed', label: `Completed (${completed.length})`, tasks: completed, accent: 'text-good' });
    return result;
  }, [filtered, todayStart, todayEnd, activeFilter]);

  const contactById = (id?: string) => id ? contacts.find((c) => c.id === id) : undefined;
  const userById = (id?: string) => id ? users.find((u) => u.id === id) : undefined;

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    pushToast({ title: 'Task created (demo)', description: `"${newTitle.trim()}" added. Reset demo to restore seed state.`, variant: 'success' });
    setAddOpen(false);
    setNewTitle('');
    setNewPriority('medium');
  };

  // Sync selected task from store
  const syncedSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
    : null;

  return (
    <div data-tour="tasks.page" className="flex flex-col">
      <PageHeader
        title="Tasks"
        subtitle="Follow-up command center — grouped by due date"
        actions={
          <Button size="sm" data-tour="tasks.addButton" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Task
          </Button>
        }
      />

      <div className="px-5 pt-4">
        {/* ── Summary Cards ── */}
        <div data-tour="tasks.summary" className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            { label: 'Open', value: summary.open, icon: CheckSquare, color: '#71849b', filter: 'all' as Filter },
            { label: 'Due Today', value: summary.today, icon: Clock, color: '#d99111', filter: 'today' as Filter },
            { label: 'Overdue', value: summary.overdue, icon: AlertTriangle, color: '#d9363e', filter: 'overdue' as Filter },
            { label: 'High Priority', value: summary.high, icon: Flag, color: '#d9363e', filter: 'all' as Filter },
            { label: 'Completed', value: summary.completed, icon: CheckCircle2, color: '#12986a', filter: 'completed' as Filter },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() => setActiveFilter(card.filter)}
              className={`flex flex-col gap-2 rounded-xl border p-3 text-left shadow-card transition-colors ${
                (card.filter === activeFilter && !(card.label === 'High Priority'))
                  ? 'border-brand/40 bg-brand-soft'
                  : 'border-line bg-surface hover:bg-surface-sunken'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{card.label}</p>
                <card.icon size={13} style={{ color: card.color }} />
              </div>
              <p className="font-display text-2xl font-extrabold text-ink">{card.value}</p>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div data-tour="tasks.filters" className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-sunken p-0.5">
            {([
              { id: 'all', label: 'All' },
              { id: 'mine', label: 'My Tasks' },
              { id: 'today', label: 'Due Today' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'completed', label: 'Completed' },
            ] as { id: Filter; label: string }[]).map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === f.id
                    ? 'bg-surface text-ink shadow-card'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink outline-none hover:border-brand/40"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* ── Grouped List ── */}
        <div data-tour="tasks.list" className="space-y-3 pb-8">
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <CheckCircle2 size={28} className="text-good" />
              <p className="text-sm font-semibold text-ink">Nothing here — nice work!</p>
              <p className="text-xs text-ink-muted">Change filters or add a new task.</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.id} data-tour="tasks.groupedList" className="rounded-xl border border-line bg-surface shadow-card overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center gap-2 border-b border-line px-4 py-2.5 hover:bg-surface-sunken transition-colors"
              >
                {collapsedGroups[group.id] ? (
                  <ChevronRight size={13} className="shrink-0 text-ink-subtle" />
                ) : (
                  <ChevronDown size={13} className="shrink-0 text-ink-subtle" />
                )}
                <span className={`text-xs font-bold ${'accent' in group ? (group as { accent?: string }).accent : 'text-ink'}`}>
                  {group.label}
                </span>
              </button>

              {/* Task rows */}
              {!collapsedGroups[group.id] && (
                <div className="divide-y divide-line">
                  {group.tasks.map((task) => {
                    const contact = contactById(task.contactId);
                    const assignee = userById(task.assigneeId);
                    const isOverdue = task.status === 'open' && new Date(task.dueDate).getTime() < todayStart;
                    return (
                      <div
                        key={task.id}
                        data-tour="tasks.row"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken transition-colors group"
                      >
                        {/* Toggle */}
                        <button
                          data-tour="tasks.toggle"
                          onClick={() => toggleTask(task.id)}
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            task.status === 'completed'
                              ? 'border-good bg-good'
                              : 'border-line bg-surface hover:border-brand'
                          }`}
                          aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.status === 'completed' && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Main content */}
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                          <p className={`text-sm font-semibold leading-snug ${
                            task.status === 'completed' ? 'text-ink-muted line-through' : 'text-ink'
                          }`}>
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {contact && (
                              <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                                <User size={10} />
                                {fullName(contact)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone={PRIORITY_TONE[task.priority]} size="sm">{task.priority}</Badge>
                          <span className={`text-[11px] font-semibold ${
                            isOverdue ? 'text-bad' : 'text-ink-muted'
                          }`}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {assignee && (
                            <div
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: assignee.avatarColor }}
                              title={assignee.name}
                            >
                              {assignee.name[0]}
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="rounded p-0.5 text-ink-subtle opacity-0 group-hover:opacity-100 hover:text-ink transition-opacity"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Task Detail Modal ── */}
      <Modal
        open={!!syncedSelectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Detail"
        data-tour="tasks.detail"
        footer={
          syncedSelectedTask ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>Close</Button>
              <Button
                size="sm"
                variant={syncedSelectedTask.status === 'completed' ? 'secondary' : 'primary'}
                onClick={() => {
                  toggleTask(syncedSelectedTask.id);
                }}
              >
                {syncedSelectedTask.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
            </>
          ) : undefined
        }
      >
        {syncedSelectedTask && (() => {
          const contact = contactById(syncedSelectedTask.contactId);
          const assignee = userById(syncedSelectedTask.assigneeId);
          return (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Title</p>
                <p className="mt-1 text-sm font-semibold text-ink">{syncedSelectedTask.title}</p>
              </div>
              {syncedSelectedTask.description && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Notes</p>
                  <p className="mt-1 text-sm text-ink-muted">{syncedSelectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Status</p>
                  <div className="mt-1">
                    <Badge tone={syncedSelectedTask.status === 'completed' ? 'good' : 'neutral'} size="sm">
                      {syncedSelectedTask.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Priority</p>
                  <div className="mt-1">
                    <Badge tone={PRIORITY_TONE[syncedSelectedTask.priority]} size="sm">
                      {syncedSelectedTask.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Due Date</p>
                  <p className="mt-1 text-sm text-ink">{dateLabel(syncedSelectedTask.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Assignee</p>
                  <p className="mt-1 text-sm text-ink">{assignee?.name ?? '—'}</p>
                </div>
              </div>
              {contact && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Related Contact</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar name={fullName(contact)} size="xs" />
                    <span className="text-sm text-ink">{fullName(contact)}</span>
                    <span className="text-xs text-ink-muted">{contact.phone}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ── Add Task Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setNewTitle(''); }}
        title="Add Task"
        data-tour="tasks.addModal"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              data-tour="tasks.addSubmit"
              disabled={!newTitle.trim()}
              onClick={handleAddTask}
            >
              Create Task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Task title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="e.g. Call back about quote — Maya"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition-colors ${
                    newPriority === p
                      ? p === 'high' ? 'border-bad bg-bad/10 text-bad'
                        : p === 'medium' ? 'border-warn bg-warn/10 text-warn'
                        : 'border-line bg-surface-sunken text-ink'
                      : 'border-line text-ink-muted hover:bg-surface-sunken'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-subtle">
            Demo mode: task is not persisted to the store. Reset demo to restore seed data.
          </p>
        </div>
      </Modal>
    </div>
  );
}
