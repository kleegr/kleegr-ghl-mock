/**
 * metrics.ts — derives every number the dashboard widgets render from the
 * shared Zustand store (fake seed data). Pure + memoizable: `useDashboardData`
 * pulls the raw slices, `computeMetrics(data, rangeId)` turns them into the
 * widget-ready `MetricsCtx`. No API calls, no mutation.
 *
 * Date range affects "flow" metrics (new contacts, collected revenue, the
 * activity feed, missed calls). "State" metrics (open pipeline value, unread
 * threads, upcoming appointments) are point-in-time snapshots and intentionally
 * ignore the range — matching how GoHighLevel surfaces them.
 */
import { useStore } from '@/store/useStore';
import type {
  Appointment, Calendar, Call, Contact, Conversation, Invoice,
  LeadSourceDatum, Opportunity, Pipeline, Review, Task, User,
} from '@/types';
import { fullName, money } from '@/utils';
import { rangeSince, type DateRangeId, DATE_RANGES } from './dashboardData';

export interface DashboardData {
  contacts: Contact[];
  conversations: Conversation[];
  opportunities: Opportunity[];
  appointments: Appointment[];
  tasks: Task[];
  reviews: Review[];
  invoices: Invoice[];
  calls: Call[];
  leadSources: LeadSourceDatum[];
  pipelines: Pipeline[];
  calendars: Calendar[];
  users: User[];
}

/** Subscribe to exactly the store slices the dashboard needs. */
export function useDashboardData(): DashboardData {
  return {
    contacts: useStore((s) => s.contacts),
    conversations: useStore((s) => s.conversations),
    opportunities: useStore((s) => s.opportunities),
    appointments: useStore((s) => s.appointments),
    tasks: useStore((s) => s.tasks),
    reviews: useStore((s) => s.reviews),
    invoices: useStore((s) => s.invoices),
    calls: useStore((s) => s.calls),
    leadSources: useStore((s) => s.leadSources),
    pipelines: useStore((s) => s.pipelines),
    calendars: useStore((s) => s.calendars),
    users: useStore((s) => s.users),
  };
}

export type ActivityType =
  | 'contact' | 'conversation' | 'opportunity' | 'appointment' | 'invoice' | 'review' | 'call';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  label: string;
  sub: string;
  time: string;
}

export interface PipelineMetric {
  pipelineId: string;
  pipelineName: string;
  total: number;
  statusCounts: { open: number; won: number; lost: number; abandoned: number };
  openValue: number;
  wonValue: number;
  /** Won / (Won + Lost), 0..1. */
  conversionRate: number;
  stages: { id: string; name: string; count: number; openValue: number }[];
}

export interface MetricsCtx {
  data: DashboardData;
  range: { id: DateRangeId; label: string; since: number | null };
  primaryPipelineId: string;
  kpis: {
    pipelineValue: number;
    openOpps: number;
    newContacts: number;
    revenue: number;
    paidCount: number;
    openTasks: number;
    overdueTasks: number;
    unread: number;
    upcomingAppts: number;
    avgRating: string;
    reviewCount: number;
    missedCalls: number;
  };
  activity: ActivityItem[];
  dueTasks: Task[];
  nextAppts: Appointment[];
  leadTrend: { day: string; leads: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  pipelineMetric: (pipelineId: string) => PipelineMetric;
  spark: (base: number, variance: number, points?: number) => { i: number; v: number }[];
}

const DAY = 86_400_000;
const within = (iso: string, since: number | null) =>
  since == null ? true : new Date(iso).getTime() >= since;

export function computeMetrics(data: DashboardData, rangeId: DateRangeId): MetricsCtx {
  const {
    contacts, conversations, opportunities, appointments, tasks, reviews,
    invoices, calls, pipelines, calendars, users,
  } = data;

  const since = rangeSince(rangeId);
  const rangeLabel = DATE_RANGES.find((r) => r.id === rangeId)?.label ?? 'All time';
  const now = Date.now();
  const primaryPipelineId = pipelines.find((p) => p.id === 'pipe_sales')?.id ?? pipelines[0]?.id ?? '';

  // ──── KPIs ────
  const openOppList = opportunities.filter((o) => o.status === 'open');
  const pipelineValue = openOppList.reduce((s, o) => s + o.monetaryValue, 0);
  const unread = conversations.filter((c) => c.unread).length;
  const upcomingAppts = appointments.filter(
    (a) => new Date(a.startTime).getTime() >= now && a.status === 'confirmed',
  ).length;
  const openTasks = tasks.filter((t) => t.status === 'open');
  const overdueTasks = openTasks.filter((t) => new Date(t.dueDate).getTime() < now);

  const paidInRange = invoices.filter((i) => i.status === 'paid' && within(i.issuedAt, since));
  const revenue = paidInRange.reduce((s, i) => s + i.total, 0);
  const newContacts = contacts.filter((c) => within(c.createdAt, since)).length;
  const missedCalls = calls.filter((c) => c.direction === 'missed' && within(c.createdAt, since)).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // ──── Activity feed (range-aware, newest first) ────
  const feed: ActivityItem[] = [
    ...contacts.map((c) => ({ id: `a_c_${c.id}`, type: 'contact' as const, label: `${fullName(c)} joined as a new lead`, sub: c.source, time: c.createdAt })),
    ...conversations.filter((c) => !c.unread).map((c) => {
      const ct = contacts.find((x) => x.id === c.contactId);
      return { id: `a_cv_${c.id}`, type: 'conversation' as const, label: `Reply sent to ${ct ? fullName(ct) : 'a contact'}`, sub: c.channel.toUpperCase(), time: c.lastMessageAt };
    }),
    ...appointments.filter((a) => a.status === 'showed').map((a) => {
      const ct = contacts.find((x) => x.id === a.contactId);
      const cal = calendars.find((x) => x.id === a.calendarId);
      return { id: `a_ap_${a.id}`, type: 'appointment' as const, label: `${ct ? fullName(ct) : 'Contact'} attended ${cal?.name ?? 'an appointment'}`, sub: cal?.name ?? 'Calendar', time: a.startTime };
    }),
    ...invoices.filter((i) => i.status === 'paid').map((i) => {
      const ct = contacts.find((x) => x.id === i.contactId);
      return { id: `a_in_${i.id}`, type: 'invoice' as const, label: `${i.number} paid by ${ct ? fullName(ct) : 'a client'}`, sub: money(i.total), time: i.issuedAt };
    }),
    ...calls.filter((c) => c.direction === 'missed').map((c) => {
      const ct = contacts.find((x) => x.id === c.contactId);
      return { id: `a_ca_${c.id}`, type: 'call' as const, label: `Missed call from ${ct ? fullName(ct) : 'an unknown number'}`, sub: 'Phone', time: c.createdAt };
    }),
    ...reviews.map((r) => ({ id: `a_rv_${r.id}`, type: 'review' as const, label: `${r.author} left a ${r.rating}★ ${r.source} review`, sub: r.source, time: r.createdAt })),
  ]
    .filter((item) => within(item.time, since))
    .sort((a, b) => +new Date(b.time) - +new Date(a.time))
    .slice(0, 14);

  // ──── Lists ────
  const dueTasks = [...openTasks]
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 6);

  const nextAppts = appointments
    .filter((a) => new Date(a.startTime).getTime() >= now && a.status === 'confirmed')
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
    .slice(0, 5);

  // ──── Lead volume trend — last 8 days (a stable trend, not range-bound) ────
  const leadTrend = Array.from({ length: 8 }, (_, i) => {
    const start = now - (7 - i) * DAY;
    const end = start + DAY;
    return {
      day: new Date(start).toLocaleDateString('en-US', { weekday: 'short' }),
      leads: contacts.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return t >= start && t < end;
      }).length,
    };
  });

  // ──── Revenue by month — last 6 months from paid invoices ────
  const monthOrder: string[] = [];
  const revByMonth: Record<string, number> = {};
  invoices
    .filter((i) => i.status === 'paid')
    .slice()
    .sort((a, b) => +new Date(a.issuedAt) - +new Date(b.issuedAt))
    .forEach((i) => {
      const key = new Date(i.issuedAt).toLocaleDateString('en-US', { month: 'short' });
      if (!(key in revByMonth)) { revByMonth[key] = 0; monthOrder.push(key); }
      revByMonth[key] += i.total;
    });
  const revenueByMonth = monthOrder.slice(-6).map((m) => ({ month: m, revenue: revByMonth[m] }));

  // ──── Per-pipeline metric closure ────
  function pipelineMetric(pipelineId: string): PipelineMetric {
    const isAll = pipelineId === 'all';
    const pipe = isAll ? undefined : pipelines.find((p) => p.id === pipelineId);
    const opps = isAll ? opportunities : opportunities.filter((o) => o.pipelineId === pipelineId);

    const statusCounts = { open: 0, won: 0, lost: 0, abandoned: 0 };
    let openValue = 0;
    let wonValue = 0;
    for (const o of opps) {
      statusCounts[o.status] += 1;
      if (o.status === 'open') openValue += o.monetaryValue;
      if (o.status === 'won') wonValue += o.monetaryValue;
    }
    const closed = statusCounts.won + statusCounts.lost;
    const conversionRate = closed > 0 ? statusCounts.won / closed : 0;

    const stages = (pipe?.stages ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((st) => {
        const stageOpps = opps.filter((o) => o.stageId === st.id);
        return {
          id: st.id,
          name: st.name,
          count: stageOpps.length,
          openValue: stageOpps.filter((o) => o.status === 'open').reduce((s, o) => s + o.monetaryValue, 0),
        };
      });

    return {
      pipelineId,
      pipelineName: isAll ? 'All pipelines' : (pipe?.name ?? 'Pipeline'),
      total: opps.length,
      statusCounts,
      openValue,
      wonValue,
      conversionRate,
      stages,
    };
  }

  const spark = (base: number, variance: number, points = 8) =>
    Array.from({ length: points }, (_, i) => ({
      i,
      v: Math.max(0, Math.round(base + Math.sin(i * 1.3 + base) * variance)),
    }));

  return {
    data,
    range: { id: rangeId, label: rangeLabel, since },
    primaryPipelineId,
    kpis: {
      pipelineValue,
      openOpps: openOppList.length,
      newContacts,
      revenue,
      paidCount: paidInRange.length,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      unread,
      upcomingAppts,
      avgRating,
      reviewCount: reviews.length,
      missedCalls,
    },
    activity: feed,
    dueTasks,
    nextAppts,
    leadTrend,
    revenueByMonth,
    pipelineMetric,
    spark,
  } satisfies MetricsCtx;
}
