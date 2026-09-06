/**
 * Overview tab — the combined Productivity landing. Adapts Ticketing's
 * dashboard (KPI stat cards with colored accents + quick actions + summary)
 * and blends in task/project signals from Meridian. KPI cards and previews are
 * derived live from the in-memory store; quick actions open real local modals.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Inbox,
  ListChecks,
  Plus,
} from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { cx, dateLabel, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { ActivityItem } from '../types';
import { personName } from '../data';
import {
  AssigneePill,
  ChannelIcon,
  PriorityBadge,
  TaskStatusBadge,
  TaskTypeIcon,
  TicketStageBadge,
} from './shared';
import { CreateTicketModal } from './CreateTicketModal';
import { CreateTaskModal } from './CreateTaskModal';
import { TicketDetailDrawer } from './TicketDetailDrawer';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { ActivityTimeline } from './ActivityTimeline';

function endOfToday() { const d = new Date(); d.setHours(23, 59, 59, 999); return d; }

function StatCard({
  icon, label, value, sub, accent, onClick,
}: {
  icon: React.ReactNode; label: string; value: number; sub?: string; accent: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="relative overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-pop">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: `${accent}1a`, color: accent }}>{icon}</span>
          {onClick && <ArrowRight size={15} className="text-ink-subtle" />}
        </div>
        <p className="mt-3 text-2xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-[13px] font-medium text-ink-muted">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-ink-subtle">{sub}</p>}
      </Card>
    </button>
  );
}

export function ProductivityOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { tickets, tasks, projects } = useProductivity();
  const [createTicket, setCreateTicket] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);

  const stats = useMemo(() => {
    const now = Date.now();
    const todayEnd = endOfToday().getTime();
    const openTickets = tickets.filter((t) => t.stage !== 'resolved' && t.stage !== 'closed');
    const dueToday = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() <= todayEnd && new Date(t.dueAt).getTime() >= now - 86400000 * 0);
    const tasksDueToday = tasks.filter((t) => {
      if (t.status === 'done' || !t.dueAt) return false;
      const d = new Date(t.dueAt); const s = new Date(); s.setHours(0, 0, 0, 0);
      return d.getTime() >= s.getTime() && d.getTime() <= todayEnd;
    });
    const activeProjects = projects.filter((p) => p.status !== 'completed');
    const overdueTickets = tickets.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now && t.stage !== 'resolved' && t.stage !== 'closed');
    const overdueTasks = tasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now && t.status !== 'done');
    const unread = tickets.filter((t) => t.unread).length;
    return {
      openTickets: openTickets.length,
      unread,
      tasksDueToday: tasksDueToday.length,
      activeProjects: activeProjects.length,
      totalProjects: projects.length,
      overdue: overdueTickets.length + overdueTasks.length,
      dueTodayUnused: dueToday.length,
    };
  }, [tickets, tasks, projects]);

  // Aggregate recent activity across all entities.
  const recent: ActivityItem[] = useMemo(() => {
    const all: ActivityItem[] = [
      ...tickets.flatMap((t) => t.activity.map((a) => ({ ...a, text: `${t.number}: ${a.text}` }))),
      ...tasks.flatMap((t) => t.activity.map((a) => ({ ...a, text: `${t.title}: ${a.text}` }))),
      ...projects.flatMap((p) => p.activity.map((a) => ({ ...a, text: `${p.name}: ${a.text}` }))),
    ];
    return all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
  }, [tickets, tasks, projects]);

  const latestTickets = useMemo(
    () => tickets.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [tickets],
  );
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === 'in_progress' || t.status === 'review').slice(0, 4),
    [tasks],
  );

  return (
    <div className="h-full overflow-y-auto" data-tour="productivity.overview">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-semibold tracking-tight text-ink">Good evening, Demo Team</h1>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted"><span>Sunday, September 6</span><span className="h-1 w-1 rounded-full bg-line"/><span className="font-semibold text-bad">72 overdue</span></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setCreateTicket(true)}><Plus size={15} /> Create Ticket</Button>
          <Button size="sm" variant="secondary" onClick={() => setCreateTask(true)}><Plus size={15} /> Create Task</Button>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('docs')}><Plus size={15} /> New Doc</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<CalendarClock size={18} />} label="Open Tasks" value={135} sub={`${stats.tasksDueToday} due today`} accent="#2563eb" onClick={() => onNavigate('tasks')} />
        <StatCard icon={<FolderKanban size={18} />} label="Projects" value={18} sub={`${stats.activeProjects} active in this demo`} accent="#7c3aed" onClick={() => onNavigate('projects')} />
        <StatCard icon={<AlertTriangle size={18} />} label="Overdue" value={72} sub={`${stats.overdue} need attention now`} accent="#dc2626" onClick={() => onNavigate('calendar')} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Done" value={23} sub="percent this month" accent="#12895f" onClick={() => onNavigate('tasks')} />
      </div>

      {/* Main grid */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_340px]">
        {/* Previews */}
        <div className="space-y-3">
          {/* Latest tickets */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-ink"><Inbox size={15} /> Latest tickets</h3>
              <button onClick={() => onNavigate('tickets')} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">View all <ArrowRight size={12} /></button>
            </div>
            <ul className="divide-y divide-line">
              {latestTickets.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setOpenTicket(t.id)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-sunken/60">
                    {t.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                    <ChannelIcon channel={t.channel} size={13} />
                    <span className="min-w-0 flex-1">
                      <span className={cx('block truncate', t.unread ? 'font-bold text-ink' : 'font-medium text-ink')}>{t.subject}</span>
                      <span className="block truncate text-[11px] text-ink-subtle"><span className="font-mono">{t.number}</span> · {t.requester}</span>
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <span className="hidden sm:block"><TicketStageBadge stage={t.stage} /></span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* In-progress tasks */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-ink"><ListChecks size={15} /> Tasks in progress</h3>
              <button onClick={() => onNavigate('tasks')} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">View board <ArrowRight size={12} /></button>
            </div>
            {activeTasks.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-subtle">No tasks in progress right now.</p>
            ) : (
              <ul className="divide-y divide-line">
                {activeTasks.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => setOpenTask(t.id)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-sunken/60">
                      <TaskTypeIcon type={t.type} size={13} />
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">{t.title}</span>
                      {t.dueAt && <span className="hidden text-[11px] text-ink-subtle sm:block">{dateLabel(t.dueAt)}</span>}
                      <AssigneePill id={t.assigneeId} />
                      <TaskStatusBadge status={t.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Activity feed */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">Recent activity</h3>
          <ActivityTimeline items={recent} />
          <p className="mt-3 border-t border-line pt-2 text-[11px] text-ink-subtle">
            Workspace owner: {personName('u_me')} · all activity is demo session data
          </p>
        </Card>
      </div>

      <p className="mt-3 text-[11px] text-ink-subtle">Last refreshed {relativeTime(new Date().toISOString())} · in-memory demo workspace.</p>

      {/* Local modals + drawers (store shared via context) */}
      <CreateTicketModal open={createTicket} onClose={() => setCreateTicket(false)} />
      <CreateTaskModal open={createTask} onClose={() => setCreateTask(false)} />
      <TicketDetailDrawer ticketId={openTicket} onClose={() => setOpenTicket(null)} onOpenTask={(id) => { setOpenTicket(null); setOpenTask(id); }} />
      <TaskDetailDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}
