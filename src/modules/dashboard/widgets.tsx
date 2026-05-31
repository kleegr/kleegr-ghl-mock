/**
 * widgets.tsx — the inner content for every dashboard widget kind.
 *
 * `WidgetBody` is a pure switch over `WidgetKind`; each branch reads from the
 * precomputed `MetricsCtx` (see metrics.ts) and renders a real-looking card
 * body — KPI tiles, opportunity charts, a pipeline funnel, recharts graphs, and
 * activity/task/appointment lists. Pipeline-scoped widgets resolve their
 * pipeline from `widget.pipelineId` (falling back to the primary pipeline).
 */
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, CheckSquare, CalendarClock, Inbox,
} from 'lucide-react';
import { Badge, Avatar, EmptyState } from '@/components/ui/primitives';
import { money, relativeTime, dateLabel, clockTime, fullName } from '@/utils';
import type { DashWidget, WidgetKind } from './dashboardData';
import type { ActivityItem, ActivityType, MetricsCtx } from './metrics';

const PIE_COLORS = ['#1f6feb', '#12986a', '#d99111', '#7c3aed', '#d9363e', '#0891b2', '#db2777', '#65a30d'];

const STATUS_COLOR: Record<'open' | 'won' | 'lost' | 'abandoned', string> = {
  open: '#1f6feb',
  won: '#12986a',
  lost: '#d9363e',
  abandoned: '#98a2b3',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  contact: 'bg-brand-soft text-brand',
  conversation: 'bg-good/10 text-good',
  opportunity: 'bg-warn/10 text-warn',
  appointment: 'bg-[#ede9fe] text-[#5b21b6]',
  invoice: 'bg-[#dcfce7] text-[#166534]',
  review: 'bg-warn/10 text-warn',
  call: 'bg-bad/10 text-bad',
};
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  contact: 'New lead', conversation: 'Reply', opportunity: 'Deal',
  appointment: 'Appt', invoice: 'Paid', review: 'Review', call: 'Missed call',
};

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-ink-muted">
          <span className="font-semibold text-ink">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          {p.name ? ` ${p.name}` : ''}
        </p>
      ))}
    </div>
  );
}

function Spark({ data, color = 'rgb(var(--brand))' }: { data: { i: number; v: number }[]; color?: string }) {
  return (
    <div className="mt-2 h-9">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ──── KPI tile ──── */

interface KpiSpec {
  value: React.ReactNode;
  sub?: string;
  delta?: { pct: number; positive: boolean };
  accent: string;
  spark?: { i: number; v: number }[];
}

function kpiSpec(kind: WidgetKind, ctx: MetricsCtx): KpiSpec {
  const k = ctx.kpis;
  switch (kind) {
    case 'kpiPipelineValue':
      return { value: money(k.pipelineValue), sub: `${k.openOpps} open deals`, delta: { pct: 12, positive: true }, accent: 'bg-brand-soft text-brand', spark: ctx.spark(k.pipelineValue / 1000, 18) };
    case 'kpiOpenOpps':
      return { value: k.openOpps, sub: 'in the pipeline', delta: { pct: 5, positive: true }, accent: 'bg-warn/10 text-warn' };
    case 'kpiNewContacts':
      return { value: k.newContacts, sub: ctx.range.label.toLowerCase(), delta: { pct: 8, positive: true }, accent: 'bg-good/10 text-good' };
    case 'kpiRevenue':
      return { value: money(k.revenue), sub: `${k.paidCount} invoices paid`, delta: { pct: 21, positive: true }, accent: 'bg-[#dcfce7] text-[#166534]', spark: ctx.spark(Math.max(1, k.revenue / 1000), 10) };
    case 'kpiTasks':
      return { value: k.openTasks, sub: k.overdueTasks > 0 ? `${k.overdueTasks} overdue` : 'all on time', accent: k.overdueTasks > 0 ? 'bg-bad/10 text-bad' : 'bg-good/10 text-good' };
    case 'kpiReviews':
      return { value: k.avgRating, sub: `${k.reviewCount} reviews`, accent: 'bg-warn/10 text-warn' };
    case 'kpiUnread':
      return { value: k.unread, sub: 'awaiting reply', delta: { pct: 3, positive: false }, accent: 'bg-[#ede9fe] text-[#5b21b6]' };
    case 'kpiAppointments':
      return { value: k.upcomingAppts, sub: 'confirmed ahead', accent: 'bg-[#e0f2fe] text-[#075985]' };
    default:
      return { value: '—', accent: 'bg-surface-sunken text-ink-muted' };
  }
}

function KpiBody({ kind, ctx, icon }: { kind: WidgetKind; ctx: MetricsCtx; icon: React.ReactNode }) {
  const spec = kpiSpec(kind, ctx);
  return (
    <div className="px-4 pb-4 pt-1">
      <div className="flex items-start justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm ${spec.accent}`}>{icon}</span>
        {spec.delta && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${spec.delta.positive ? 'text-good' : 'text-bad'}`}>
            {spec.delta.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(spec.delta.pct)}%
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold leading-none text-ink">{spec.value}</p>
      {spec.sub && <p className="mt-1 text-[11px] capitalize text-ink-muted">{spec.sub}</p>}
      {spec.spark && <Spark data={spec.spark} />}
    </div>
  );
}

/* ──── Opportunity Status ──── */

function OpportunityStatusBody({ ctx, pid }: { ctx: MetricsCtx; pid: string }) {
  const m = ctx.pipelineMetric(pid);
  const total = m.total || 1;
  const order: ('open' | 'won' | 'lost' | 'abandoned')[] = ['open', 'won', 'lost', 'abandoned'];
  if (m.total === 0) return <EmptyState icon={<Inbox size={26} />} title="No opportunities" body="No deals in this pipeline yet." className="py-10" />;
  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        {order.map((s) => {
          const pctW = (m.statusCounts[s] / total) * 100;
          return pctW > 0 ? <span key={s} style={{ width: `${pctW}%`, background: STATUS_COLOR[s] }} /> : null;
        })}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {order.map((s) => (
          <li key={s} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s] }} />
            <span className="flex-1 capitalize text-ink-muted">{s}</span>
            <span className="font-semibold text-ink">{m.statusCounts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──── Opportunity Value ──── */

function OpportunityValueBody({ ctx, pid }: { ctx: MetricsCtx; pid: string }) {
  const m = ctx.pipelineMetric(pid);
  return (
    <div className="px-4 pb-4 pt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Open value</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-ink">{money(m.openValue)}</p>
      <Spark data={ctx.spark(Math.max(1, m.openValue / 1000), 16)} />
      <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2 text-xs">
        <span className="text-ink-muted">Won value</span>
        <span className="font-semibold text-good">{money(m.wonValue)}</span>
      </div>
    </div>
  );
}

/* ──── Conversion Rate (progress ring) ──── */

function ConversionRateBody({ ctx, pid }: { ctx: MetricsCtx; pid: string }) {
  const m = ctx.pipelineMetric(pid);
  const pct = Math.round(m.conversionRate * 100);
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4 px-4 pb-4 pt-3">
      <div className="relative grid h-24 w-24 shrink-0 place-items-center">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={R} fill="none" stroke="rgb(var(--surface-sunken))" strokeWidth="9" />
          <circle cx="48" cy="48" r={R} fill="none" stroke="rgb(var(--good))" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} />
        </svg>
        <span className="absolute font-display text-xl font-extrabold text-ink">{pct}%</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-xs">
        <div className="flex items-center justify-between"><span className="text-ink-muted">Won</span><span className="font-semibold text-good">{m.statusCounts.won}</span></div>
        <div className="flex items-center justify-between"><span className="text-ink-muted">Lost</span><span className="font-semibold text-bad">{m.statusCounts.lost}</span></div>
        <div className="flex items-center justify-between border-t border-line pt-1.5"><span className="text-ink-muted">Open</span><span className="font-semibold text-ink">{m.statusCounts.open}</span></div>
      </div>
    </div>
  );
}

/* ──── Funnel (descending bars) ──── */

function FunnelBody({ ctx, pid }: { ctx: MetricsCtx; pid: string }) {
  const m = ctx.pipelineMetric(pid);
  const stages = m.stages.filter((s) => s.count > 0);
  if (stages.length === 0) return <EmptyState icon={<Inbox size={26} />} title="No deals to chart" body="This pipeline has no opportunities yet." className="py-10" />;
  const max = Math.max(...stages.map((s) => s.count), 1);
  const top = stages[0].count || 1;
  return (
    <div className="max-h-72 space-y-1.5 overflow-y-auto px-4 pb-4 pt-3">
      {stages.map((s, i) => {
        const widthPct = Math.max(8, (s.count / max) * 100);
        const conv = Math.round((s.count / top) * 100);
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-right text-[11px] text-ink-muted" title={s.name}>{s.name}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-sunken">
              <div className="flex h-full items-center rounded-md px-2 text-[11px] font-semibold text-white" style={{ width: `${widthPct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}>
                {s.count}
              </div>
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-ink-subtle">{conv}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ──── Stage Distribution (bar chart) ──── */

function StageDistributionBody({ ctx, pid }: { ctx: MetricsCtx; pid: string }) {
  const m = ctx.pipelineMetric(pid);
  const rows = m.stages.filter((s) => s.openValue > 0).map((s) => ({ name: s.name, value: s.openValue }));
  if (rows.length === 0) return <EmptyState icon={<Inbox size={26} />} title="No open value" body="No open deals to distribute." className="py-10" />;
  return (
    <div className="h-48 px-2 pb-3 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={48} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="value" name="open value" fill="rgb(var(--brand))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ──── Lead Sources (donut) ──── */

function LeadSourcesBody({ ctx }: { ctx: MetricsCtx }) {
  const sources = [...ctx.data.leadSources].sort((a, b) => b.value - a.value);
  if (sources.length === 0) return <EmptyState icon={<Inbox size={26} />} title="No lead sources" className="py-10" />;
  return (
    <div className="flex items-center gap-3 px-4 pb-4 pt-3">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={sources} dataKey="value" nameKey="source" cx="50%" cy="50%" innerRadius={34} outerRadius={54} strokeWidth={0}>
            {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-[11px]">
        {sources.slice(0, 5).map((ls, i) => (
          <li key={ls.source} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-ink-muted">{ls.source}</span>
            <span className="font-semibold text-ink">{ls.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──── Revenue by month / Lead trend ──── */

function RevenueByMonthBody({ ctx }: { ctx: MetricsCtx }) {
  const rows = ctx.revenueByMonth;
  if (rows.length === 0) return <EmptyState icon={<Inbox size={26} />} title="No revenue yet" body="No paid invoices to chart." className="py-10" />;
  return (
    <div className="h-48 px-2 pb-3 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="revenue" fill="rgb(var(--good))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeadTrendBody({ ctx }: { ctx: MetricsCtx }) {
  return (
    <div className="h-40 px-2 pb-3 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ctx.leadTrend} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Line type="monotone" dataKey="leads" stroke="rgb(var(--brand))" strokeWidth={2} dot={{ r: 3, fill: 'rgb(var(--brand))', strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ──── Lists ──── */

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ACTIVITY_COLORS[item.type]}`}>{ACTIVITY_LABELS[item.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-xs text-ink">{item.label}</p>
        <p className="mt-0.5 text-[11px] text-ink-subtle">{relativeTime(item.time)}</p>
      </div>
    </li>
  );
}

function RecentActivityBody({ ctx }: { ctx: MetricsCtx }) {
  if (ctx.activity.length === 0) return <EmptyState icon={<Inbox size={26} />} title="No recent activity" body="Nothing happened in this range." className="py-10" />;
  return <ul className="max-h-80 divide-y divide-line/60 overflow-y-auto">{ctx.activity.map((a) => <ActivityRow key={a.id} item={a} />)}</ul>;
}

function TasksDueBody({ ctx }: { ctx: MetricsCtx }) {
  if (ctx.dueTasks.length === 0) return <EmptyState icon={<CheckSquare size={26} />} title="No open tasks" body="You're all caught up." className="py-10" />;
  return (
    <ul className="divide-y divide-line/60">
      {ctx.dueTasks.map((task) => {
        const assignee = ctx.data.users.find((u) => u.id === task.assigneeId);
        const overdue = new Date(task.dueDate).getTime() < Date.now();
        return (
          <li key={task.id} className="flex items-start gap-3 px-4 py-2.5">
            <CheckSquare size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-medium text-ink">{task.title}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={`text-[11px] font-semibold ${overdue ? 'text-bad' : 'text-ink-subtle'}`}>{overdue ? 'Overdue · ' : ''}{dateLabel(task.dueDate)}</span>
                <Badge tone={task.priority === 'high' ? 'bad' : task.priority === 'medium' ? 'warn' : 'neutral'}>{task.priority}</Badge>
              </div>
            </div>
            {assignee && <Avatar name={assignee.name} size="xs" />}
          </li>
        );
      })}
    </ul>
  );
}

function AppointmentsBody({ ctx }: { ctx: MetricsCtx }) {
  if (ctx.nextAppts.length === 0) return <EmptyState icon={<CalendarClock size={26} />} title="No upcoming appointments" body="Nothing on the calendar yet." className="py-10" />;
  return (
    <ul className="divide-y divide-line/60">
      {ctx.nextAppts.map((appt) => {
        const contact = ctx.data.contacts.find((c) => c.id === appt.contactId);
        const cal = ctx.data.calendars.find((c) => c.id === appt.calendarId);
        return (
          <li key={appt.id} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: cal?.color ?? '#1f6feb' }} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-medium text-ink">{contact ? fullName(contact) : 'Contact'}</p>
              <p className="mt-0.5 text-[11px] text-ink-subtle">{cal?.name ?? 'Appointment'} · {dateLabel(appt.startTime)} {clockTime(appt.startTime)}</p>
            </div>
            <Badge tone="brand">{appt.status}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

/* ──── Dispatcher ──── */

export function WidgetBody({ widget, ctx, icon }: { widget: DashWidget; ctx: MetricsCtx; icon: React.ReactNode }) {
  const pid = widget.pipelineId ?? ctx.primaryPipelineId;
  switch (widget.kind) {
    case 'kpiPipelineValue':
    case 'kpiOpenOpps':
    case 'kpiNewContacts':
    case 'kpiRevenue':
    case 'kpiTasks':
    case 'kpiReviews':
    case 'kpiUnread':
    case 'kpiAppointments':
      return <KpiBody kind={widget.kind} ctx={ctx} icon={icon} />;
    case 'opportunityStatus': return <OpportunityStatusBody ctx={ctx} pid={pid} />;
    case 'opportunityValue': return <OpportunityValueBody ctx={ctx} pid={pid} />;
    case 'conversionRate': return <ConversionRateBody ctx={ctx} pid={pid} />;
    case 'funnel': return <FunnelBody ctx={ctx} pid={pid} />;
    case 'stageDistribution': return <StageDistributionBody ctx={ctx} pid={pid} />;
    case 'leadSources': return <LeadSourcesBody ctx={ctx} />;
    case 'revenueByMonth': return <RevenueByMonthBody ctx={ctx} />;
    case 'leadTrend': return <LeadTrendBody ctx={ctx} />;
    case 'recentActivity': return <RecentActivityBody ctx={ctx} />;
    case 'tasksDue': return <TasksDueBody ctx={ctx} />;
    case 'appointments': return <AppointmentsBody ctx={ctx} />;
    default: return null;
  }
}

/** KPI kinds render their own icon+number block (no separate card header). */
export function isKpi(kind: WidgetKind): boolean {
  return kind.startsWith('kpi');
}
