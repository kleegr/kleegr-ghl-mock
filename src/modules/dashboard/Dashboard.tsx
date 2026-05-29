/**
 * Dashboard — Wave 1 implementation.
 *
 * A polished GoHighLevel-style sub-account home screen. Reads entirely from
 * the Zustand store (fake seed data). No real API calls, no real PII.
 *
 * Sections:
 *  1. KPI stat cards (8 tiles)
 *  2. Pipeline-value trend chart + Lead-source breakdown chart
 *  3. Revenue / appointments bar chart
 *  4. Recent activity feed
 *  5. Tasks due card
 *  6. Upcoming appointments card
 *  7. Onboarding checklist (launches Tutorial Mode)
 */

import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Calendar,
  CreditCard, CheckSquare, Star, Phone, Filter,
  GraduationCap, CheckCircle2, Circle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, PageHeader, Badge, Avatar } from '@/components/ui/primitives';
import { money, relativeTime, dateLabel, clockTime, fullName } from '@/utils';

// ─── helpers ──────────────────────────────────────────────────

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

/** Sparkline data: last 8 days rolling (all fake, derived from seed counts). */
function makeSparkline(base: number, variance: number, points = 8) {
  // Deterministic enough for a demo — shifts by index
  return Array.from({ length: points }, (_, i) => ({
    i,
    v: Math.max(0, Math.round(base + Math.sin(i * 1.3 + base) * variance)),
  }));
}

// ─── KPI card ─────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: React.ReactNode;
  delta?: { pct: number; positive: boolean };
  sub?: string;
  to?: string;
  sparkData?: { i: number; v: number }[];
  accent?: string; // tailwind bg class for the icon bubble
  icon: React.ReactNode;
  tourKey: string;
}

function KpiCard({ label, value, delta, sub, to, sparkData, icon, accent = 'bg-brand-soft text-brand', tourKey }: KpiProps) {
  const inner = (
    <Card
      data-tour={tourKey}
      className="flex flex-col gap-1 p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm ${accent}`}>
          {icon}
        </span>
        {delta && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold ${
              delta.positive ? 'text-good' : 'text-bad'
            }`}
          >
            {delta.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta.pct)}%
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-ink">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
      {sub && <p className="text-[11px] text-ink-muted">{sub}</p>}
      {sparkData && (
        <div className="mt-1 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="rgb(var(--brand))"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block" aria-label={label}>
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Activity item ───────────────────────────────────────────────

interface ActivityItem {
  id: string;
  label: string;
  sub: string;
  time: string;
  type: 'contact' | 'conversation' | 'opportunity' | 'appointment' | 'invoice' | 'review' | 'call';
}

const ACTIVITY_COLORS: Record<ActivityItem['type'], string> = {
  contact: 'bg-brand-soft text-brand',
  conversation: 'bg-good/10 text-good',
  opportunity: 'bg-warn/10 text-warn',
  appointment: 'bg-[#ede9fe] text-[#5b21b6]',
  invoice: 'bg-[#dcfce7] text-[#166534]',
  review: 'bg-warn/10 text-warn',
  call: 'bg-bad/10 text-bad',
};

const ACTIVITY_LABELS: Record<ActivityItem['type'], string> = {
  contact: 'New lead',
  conversation: 'Reply',
  opportunity: 'Deal',
  appointment: 'Appt',
  invoice: 'Paid',
  review: 'Review',
  call: 'Missed call',
};

// ─── Tooltip styles ─────────────────────────────────────────────

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; fill?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop text-xs">
      {label && <p className="font-semibold text-ink mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-ink-muted">
          <span className="font-semibold text-ink">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          {p.name ? ` ${p.name}` : ''}
        </p>
      ))}
    </div>
  );
}

// ─── Lead source donut colors ───────────────────────────────────────

const PIE_COLORS = ['#1f6feb', '#12986a', '#d99111', '#7c3aed', '#d9363e', '#0891b2', '#db2777', '#65a30d'];

// ─── Main component ────────────────────────────────────────────

export function Dashboard() {
  const contacts       = useStore((s) => s.contacts);
  const conversations  = useStore((s) => s.conversations);
  const opportunities  = useStore((s) => s.opportunities);
  const appointments   = useStore((s) => s.appointments);
  const tasks          = useStore((s) => s.tasks);
  const reviews        = useStore((s) => s.reviews);
  const invoices       = useStore((s) => s.invoices);
  const calls          = useStore((s) => s.calls);
  const leadSources    = useStore((s) => s.leadSources);
  const pipelines      = useStore((s) => s.pipelines);
  const calendars      = useStore((s) => s.calendars);
  const users          = useStore((s) => s.users);
  const startTutorial  = useStore((s) => s.startTutorial);
  const completedTutorials = useStore((s) => s.completedTutorials);

  // ── Derived KPIs ───────────────────────────────────────────────
  const openOpps = opportunities.filter((o) => o.status === 'open');
  const pipelineValue = openOpps.reduce((s, o) => s + o.monetaryValue, 0);
  const unreadConvs = conversations.filter((c) => c.unread).length;

  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const upcomingAppts = appointments.filter(
    (a) => new Date(a.startTime) >= todayStart && a.status === 'confirmed',
  );

  const openTasks  = tasks.filter((t) => t.status === 'open');
  const overdueTasks = openTasks.filter((t) => new Date(t.dueDate) < new Date());

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const collectedRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);

  const newContacts30 = contacts.filter(
    (c) => now - new Date(c.createdAt).getTime() < 30 * 86400000,
  ).length;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const missedCalls = calls.filter((c) => c.direction === 'missed').length;

  // ── Charts: pipeline trend (sparkline across 7 days) ─────────────────────
  const salesPipe = pipelines.find((p) => p.id === 'pipe_sales');
  const pipelineByStage = (salesPipe?.stages ?? []).map((st) => ({
    name: st.name,
    value: opportunities
      .filter((o) => o.stageId === st.id && o.status === 'open')
      .reduce((s, o) => s + o.monetaryValue, 0),
  }));

  // Fake lead-volume trend: last 8 days using contact createdAt
  const DAY_MS = 86400000;
  const leadTrend = Array.from({ length: 8 }, (_, i) => {
    const dayStart = now - (7 - i) * DAY_MS;
    const dayEnd   = dayStart + DAY_MS;
    return {
      day: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }),
      leads: contacts.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length,
    };
  });

  // Revenue by month (last 6 months from paid invoices)
  const revByMonth: Record<string, number> = {};
  paidInvoices.forEach((inv) => {
    const key = new Date(inv.issuedAt).toLocaleDateString('en-US', { month: 'short' });
    revByMonth[key] = (revByMonth[key] ?? 0) + inv.total;
  });
  const revenueChart = Object.entries(revByMonth)
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));

  // ── Activity feed (derived from multiple entities) ──────────────────────
  const activityItems: ActivityItem[] = [
    ...contacts.slice(0, 4).map((c) => ({
      id: `act_c_${c.id}`,
      type: 'contact' as const,
      label: `${c.firstName} ${c.lastName} joined as a new lead`,
      sub: c.source,
      time: c.createdAt,
    })),
    ...conversations.filter((c) => !c.unread).slice(0, 3).map((c) => {
      const contact = contacts.find((ct) => ct.id === c.contactId);
      return {
        id: `act_conv_${c.id}`,
        type: 'conversation' as const,
        label: `Reply sent to ${contact ? fullName(contact) : 'a contact'}`,
        sub: c.channel.toUpperCase(),
        time: c.lastMessageAt,
      };
    }),
    ...appointments.filter((a) => a.status === 'showed').slice(0, 3).map((a) => {
      const contact = contacts.find((c) => c.id === a.contactId);
      const cal = calendars.find((c) => c.id === a.calendarId);
      return {
        id: `act_appt_${a.id}`,
        type: 'appointment' as const,
        label: `${contact ? fullName(contact) : 'Contact'} attended ${cal?.name ?? 'appointment'}`,
        sub: cal?.name ?? 'Calendar',
        time: a.startTime,
      };
    }),
    ...paidInvoices.slice(0, 3).map((inv) => {
      const contact = contacts.find((c) => c.id === inv.contactId);
      return {
        id: `act_inv_${inv.id}`,
        type: 'invoice' as const,
        label: `${inv.number} paid by ${contact ? fullName(contact) : 'client'}`,
        sub: money(inv.total),
        time: inv.issuedAt,
      };
    }),
    ...calls.filter((c) => c.direction === 'missed').slice(0, 3).map((c) => {
      const contact = contacts.find((ct) => ct.id === c.contactId);
      return {
        id: `act_call_${c.id}`,
        type: 'call' as const,
        label: `Missed call from ${contact ? fullName(contact) : 'unknown'}`,
        sub: 'Phone',
        time: c.createdAt,
      };
    }),
    ...reviews.slice(0, 2).map((r) => ({
      id: `act_rev_${r.id}`,
      type: 'review' as const,
      label: `${r.author} left a ${r.rating}★ ${r.source} review`,
      sub: r.source,
      time: r.createdAt,
    })),
  ]
    .sort((a, b) => +new Date(b.time) - +new Date(a.time))
    .slice(0, 12);

  // ── Upcoming appointments (next 5 confirmed) ────────────────────────
  const nextAppts = appointments
    .filter((a) => new Date(a.startTime) >= new Date() && a.status === 'confirmed')
    .slice(0, 5);

  // ── Tasks due (open, sorted by dueDate) ──────────────────────────────
  const dueTasks = [...openTasks]
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 6);

  // ── Onboarding items — launch the matching Tutorial Mode walkthrough and
  //    reflect real completion (resets with Reset Demo) ─────────────────────
  const onboardingItems = [
    { id: 'add-contact',          label: 'Add a new contact' },
    { id: 'reply-conversation',   label: 'Reply to a conversation' },
    { id: 'move-pipeline',        label: 'Move a lead through a pipeline' },
    { id: 'book-appointment',     label: 'Book an appointment' },
    { id: 'create-invoice',       label: 'Create an invoice' },
  ];
  const doneCount = onboardingItems.filter((i) => completedTutorials.includes(i.id)).length;

  return (
    <div data-tour="dashboard.page">
      <PageHeader
        title="Dashboard"
        subtitle="Track leads, conversations, revenue, tasks, and appointments from one place."
      />

      <div className="space-y-5 px-5 py-5 pb-10">

        {/* ── KPI cards ── */}
        <section aria-label="Key metrics" data-tour="dashboard.kpis">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            <KpiCard
              tourKey="dashboard.kpi.pipelineValue"
              label="Pipeline value"
              value={money(pipelineValue)}
              delta={{ pct: 12, positive: true }}
              sub={`${openOpps.length} open deals`}
              to="/opportunities"
              icon={<Filter size={16} />}
              sparkData={makeSparkline(pipelineValue / 1000, 18)}
            />
            <KpiCard
              tourKey="dashboard.kpi.openOpps"
              label="Open opportunities"
              value={openOpps.length}
              delta={{ pct: 5, positive: true }}
              to="/opportunities"
              icon={<TrendingUp size={16} />}
              accent="bg-warn/10 text-warn"
            />
            <KpiCard
              tourKey="dashboard.kpi.newContacts"
              label="New contacts (30d)"
              value={newContacts30}
              delta={{ pct: 8, positive: true }}
              to="/contacts"
              icon={<Users size={16} />}
              accent="bg-good/10 text-good"
            />
            <KpiCard
              tourKey="dashboard.kpi.unreadConvs"
              label="Unread conversations"
              value={unreadConvs}
              delta={{ pct: 3, positive: false }}
              to="/conversations"
              icon={<MessageSquare size={16} />}
              accent="bg-[#ede9fe] text-[#5b21b6]"
            />
            <KpiCard
              tourKey="dashboard.kpi.upcomingAppts"
              label="Upcoming appts"
              value={upcomingAppts.length}
              to="/calendars"
              icon={<Calendar size={16} />}
              accent="bg-[#e0f2fe] text-[#075985]"
            />
            <KpiCard
              tourKey="dashboard.kpi.revenue"
              label="Revenue collected"
              value={money(collectedRevenue)}
              delta={{ pct: 21, positive: true }}
              sub={`${paidInvoices.length} invoices paid`}
              to="/payments"
              icon={<CreditCard size={16} />}
              accent="bg-[#dcfce7] text-[#166534]"
            />
            <KpiCard
              tourKey="dashboard.kpi.tasksDue"
              label="Open tasks"
              value={openTasks.length}
              sub={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : 'All on time'}
              to="/tasks"
              icon={<CheckSquare size={16} />}
              accent={overdueTasks.length > 0 ? 'bg-bad/10 text-bad' : 'bg-good/10 text-good'}
            />
            <KpiCard
              tourKey="dashboard.kpi.reviews"
              label="Avg review rating"
              value={avgRating}
              sub={`${missedCalls} missed calls`}
              to="/reputation"
              icon={<Star size={16} />}
              accent="bg-warn/10 text-warn"
            />
          </div>
        </section>

        {/* ── Charts row ── */}
        <section aria-label="Charts" className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Pipeline by stage (bar) */}
          <Card data-tour="dashboard.pipelineChart" className="lg:col-span-1">
            <CardHeader title="Pipeline by stage" subtitle="Open deal value (Sales Pipeline)" />
            <div className="px-2 py-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={pipelineByStage} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" fill="rgb(var(--brand))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Lead source donut */}
          <Card data-tour="dashboard.leadSources" className="lg:col-span-1">
            <CardHeader title="Lead sources" subtitle="Contacts by acquisition channel" />
            <div className="flex items-center gap-3 px-4 py-3">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    strokeWidth={0}
                  >
                    {leadSources.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-1.5 text-[11px]">
                {leadSources
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((ls, i) => (
                    <li key={ls.source} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink-muted">{ls.source}</span>
                      <span className="font-semibold text-ink">{ls.value}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </Card>

          {/* Revenue by month */}
          <Card data-tour="dashboard.revenueChart" className="lg:col-span-1">
            <CardHeader title="Revenue" subtitle="Paid invoices by month" />
            <div className="px-2 py-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueChart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="revenue" fill="rgb(var(--good))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* Lead volume trend (full-width) */}
        <Card data-tour="dashboard.leadTrend">
          <CardHeader title="Lead volume" subtitle="New contacts — last 8 days" />
          <div className="px-4 py-3">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={leadTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgb(var(--ink-subtle))' }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="rgb(var(--brand))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'rgb(var(--brand))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── Lower grid: activity + tasks + appointments + onboarding ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Activity feed */}
          <Card data-tour="dashboard.activity" className="lg:col-span-1">
            <CardHeader
              title="Recent activity"
              subtitle="Latest events across all modules"
              actions={
                <Badge tone="neutral">{activityItems.length}</Badge>
              }
            />
            <ul className="divide-y divide-line/60">
              {activityItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      ACTIVITY_COLORS[item.type]
                    }`}
                  >
                    {ACTIVITY_LABELS[item.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink line-clamp-1">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">{relativeTime(item.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Tasks due */}
          <Card data-tour="dashboard.tasksDue">
            <CardHeader
              title="Tasks due"
              subtitle={`${openTasks.length} open · ${overdueTasks.length} overdue`}
              actions={
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  View all
                </Link>
              }
            />
            <ul className="divide-y divide-line/60">
              {dueTasks.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-ink-subtle">No open tasks.</li>
              )}
              {dueTasks.map((task) => {
                const assignee = users.find((u) => u.id === task.assigneeId);
                const overdue = new Date(task.dueDate) < new Date();
                return (
                  <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                    <CheckSquare size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink line-clamp-1">{task.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold ${
                            overdue ? 'text-bad' : 'text-ink-subtle'
                          }`}
                        >
                          {overdue ? 'Overdue · ' : ''}{dateLabel(task.dueDate)}
                        </span>
                        <Badge
                          tone={
                            task.priority === 'high' ? 'bad' : task.priority === 'medium' ? 'warn' : 'neutral'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    {assignee && (
                      <Avatar name={assignee.name} size="xs" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Upcoming appointments */}
          <Card data-tour="dashboard.appointments">
            <CardHeader
              title="Upcoming appointments"
              subtitle={`${upcomingAppts.length} confirmed today`}
              actions={
                <Link
                  to="/calendars"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  View calendar
                </Link>
              }
            />
            <ul className="divide-y divide-line/60">
              {nextAppts.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-ink-subtle">No upcoming appointments.</li>
              )}
              {nextAppts.map((appt) => {
                const contact = contacts.find((c) => c.id === appt.contactId);
                const cal = calendars.find((c) => c.id === appt.calendarId);
                return (
                  <li key={appt.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: cal?.color ?? '#1f6feb' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink line-clamp-1">
                        {contact ? fullName(contact) : 'Contact'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-subtle">
                        {cal?.name ?? 'Appointment'} · {dateLabel(appt.startTime)} {clockTime(appt.startTime)}
                      </p>
                    </div>
                    <Badge tone="brand">{appt.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* ── Onboarding checklist ── */}
        <Card data-tour="dashboard.onboardingChecklist">
          <CardHeader
            title="Getting started"
            subtitle={`${doneCount} of ${onboardingItems.length} completed — launch a guided walkthrough for any task`}
            actions={
              <Link
                to="/guides"
                className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <GraduationCap size={13} />
                Open guides
              </Link>
            }
          />
          {/* Progress bar */}
          <div className="px-4 pt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${(doneCount / onboardingItems.length) * 100}%` }}
              />
            </div>
          </div>
          <ul className="divide-y divide-line/60 px-2 py-2">
            {onboardingItems.map((item) => {
              const done = completedTutorials.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => startTutorial(item.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-good" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-ink-subtle" />
                    )}
                    <span
                      className={`text-sm ${
                        done ? 'text-ink-subtle line-through' : 'font-medium text-ink'
                      }`}
                    >
                      {item.label}
                    </span>
                    <Badge tone={done ? 'good' : 'brand'} className="ml-auto">
                      {done ? 'Replay' : 'Start'}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line px-4 py-3">
            <p className="text-[11px] text-ink-subtle">
              <span className="font-semibold text-ink">Tutorial Mode</span> overlays step-by-step guides on each task —
              click any item above (or switch to Tutorial in the top bar) to begin a guided walkthrough.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
