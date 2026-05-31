/**
 * dashboardData.ts — DEMO-ONLY catalogs & layout config for the Dashboard
 * workspace.
 *
 * This module owns the local, in-memory shape of the GoHighLevel-style
 * dashboard editor: the widget catalog (what can be placed on a board), a small
 * set of saved dashboards a user can switch between, and the date-range options
 * shown in the header. Nothing here is persisted — switching dashboards, adding
 * widgets, reordering, and resizing all live in component state and reset with
 * the page (mirroring the rest of the demo).
 *
 * The shapes are intentionally compatible with the shared `SavedDashboard` /
 * `DashboardWidget` foundation types (src/types) — this module simply uses a
 * richer, domain-specific `WidgetKind` union than the generic foundation enum,
 * which the foundation explicitly allows callers to extend.
 */
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp, Banknote, Users, CreditCard, CheckSquare, Star, MessageSquare,
  CalendarDays, Target, Percent, Filter, BarChart3, PieChart, Activity,
  ListTodo, GitBranch, LineChart as LineChartIcon,
} from 'lucide-react';

/* ──── Widget kinds ──── */

export type WidgetKind =
  // KPI tiles
  | 'kpiPipelineValue'
  | 'kpiOpenOpps'
  | 'kpiNewContacts'
  | 'kpiRevenue'
  | 'kpiTasks'
  | 'kpiReviews'
  | 'kpiUnread'
  | 'kpiAppointments'
  // Opportunity-focused
  | 'opportunityStatus'
  | 'opportunityValue'
  | 'conversionRate'
  | 'funnel'
  | 'stageDistribution'
  // Charts
  | 'leadSources'
  | 'revenueByMonth'
  | 'leadTrend'
  // Lists
  | 'recentActivity'
  | 'tasksDue'
  | 'appointments';

export type WidgetSpan = 1 | 2 | 3;

/** A single placed widget instance on a dashboard (in-memory only). */
export interface DashWidget {
  /** Unique within its dashboard. */
  id: string;
  kind: WidgetKind;
  /** Column span on large screens (1–3). */
  span: WidgetSpan;
  collapsed?: boolean;
  /** Pipeline filter for pipeline-scoped widgets: 'all' or a pipeline id.
   *  Undefined means "use the primary pipeline" (resolved at render time). */
  pipelineId?: string;
}

/** A saved, switchable dashboard (in-memory only). */
export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  widgets: DashWidget[];
}

export type WidgetCategory = 'KPI' | 'Opportunities' | 'Charts' | 'Lists';

export interface WidgetMeta {
  title: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory;
  defaultSpan: WidgetSpan;
  /** Whether this widget exposes a per-widget pipeline dropdown. */
  scoped?: boolean;
  /** Whether the pipeline dropdown may include an "All pipelines" option. */
  allowAllPipelines?: boolean;
}

/* ──── Widget catalog ──── */

export const WIDGET_META: Record<WidgetKind, WidgetMeta> = {
  kpiPipelineValue: { title: 'Pipeline Value', description: 'Total open deal value across the pipeline.', icon: TrendingUp, category: 'KPI', defaultSpan: 1 },
  kpiOpenOpps: { title: 'Open Opportunities', description: 'Count of deals still in play.', icon: GitBranch, category: 'KPI', defaultSpan: 1 },
  kpiNewContacts: { title: 'New Contacts', description: 'Contacts added in the selected range.', icon: Users, category: 'KPI', defaultSpan: 1 },
  kpiRevenue: { title: 'Revenue Collected', description: 'Paid invoice revenue in the selected range.', icon: Banknote, category: 'KPI', defaultSpan: 1 },
  kpiTasks: { title: 'Open Tasks', description: 'Open and overdue task count.', icon: CheckSquare, category: 'KPI', defaultSpan: 1 },
  kpiReviews: { title: 'Avg. Review Rating', description: 'Average rating across all reviews.', icon: Star, category: 'KPI', defaultSpan: 1 },
  kpiUnread: { title: 'Unread Conversations', description: 'Threads waiting for a reply.', icon: MessageSquare, category: 'KPI', defaultSpan: 1 },
  kpiAppointments: { title: 'Upcoming Appointments', description: 'Confirmed appointments still ahead.', icon: CalendarDays, category: 'KPI', defaultSpan: 1 },

  opportunityStatus: { title: 'Opportunity Status', description: 'Won / open / lost / abandoned breakdown.', icon: Target, category: 'Opportunities', defaultSpan: 1, scoped: true, allowAllPipelines: true },
  opportunityValue: { title: 'Opportunity Value', description: 'Open vs. won value with a trend.', icon: Banknote, category: 'Opportunities', defaultSpan: 1, scoped: true, allowAllPipelines: true },
  conversionRate: { title: 'Conversion Rate', description: 'Won deals as a share of closed deals.', icon: Percent, category: 'Opportunities', defaultSpan: 1, scoped: true, allowAllPipelines: true },
  funnel: { title: 'Pipeline Conversion', description: 'Stage-by-stage funnel for a pipeline.', icon: Filter, category: 'Opportunities', defaultSpan: 2, scoped: true },
  stageDistribution: { title: 'Stage Distribution', description: 'Open value by pipeline stage.', icon: BarChart3, category: 'Opportunities', defaultSpan: 1, scoped: true },

  leadSources: { title: 'Lead Sources', description: 'Contacts by acquisition channel.', icon: PieChart, category: 'Charts', defaultSpan: 1 },
  revenueByMonth: { title: 'Revenue by Month', description: 'Paid invoice revenue per month.', icon: BarChart3, category: 'Charts', defaultSpan: 2 },
  leadTrend: { title: 'Lead Volume', description: 'New contact volume over recent days.', icon: LineChartIcon, category: 'Charts', defaultSpan: 3 },

  recentActivity: { title: 'Recent Activity', description: 'Latest events across every module.', icon: Activity, category: 'Lists', defaultSpan: 1 },
  tasksDue: { title: 'Tasks Due', description: 'Open tasks sorted by due date.', icon: ListTodo, category: 'Lists', defaultSpan: 1 },
  appointments: { title: 'Upcoming Appointments', description: 'Your next confirmed appointments.', icon: CalendarDays, category: 'Lists', defaultSpan: 1 },
};

/** Catalog grouped by category, for the Add Widget modal. */
export const WIDGET_CATALOG: { category: WidgetCategory; kinds: WidgetKind[] }[] = [
  { category: 'KPI', kinds: ['kpiPipelineValue', 'kpiOpenOpps', 'kpiNewContacts', 'kpiRevenue', 'kpiTasks', 'kpiReviews', 'kpiUnread', 'kpiAppointments'] },
  { category: 'Opportunities', kinds: ['opportunityStatus', 'opportunityValue', 'conversionRate', 'funnel', 'stageDistribution'] },
  { category: 'Charts', kinds: ['leadSources', 'revenueByMonth', 'leadTrend'] },
  { category: 'Lists', kinds: ['recentActivity', 'tasksDue', 'appointments'] },
];

/* ──── Date ranges ──── */

export type DateRangeId =
  | 'today' | 'last7' | 'last30' | 'thisMonth' | 'thisQuarter' | 'ytd' | 'all';

export const DATE_RANGES: { id: DateRangeId; label: string; short: string }[] = [
  { id: 'today', label: 'Today', short: 'Today' },
  { id: 'last7', label: 'Last 7 days', short: '7d' },
  { id: 'last30', label: 'Last 30 days', short: '30d' },
  { id: 'thisMonth', label: 'This month', short: 'MTD' },
  { id: 'thisQuarter', label: 'This quarter', short: 'QTD' },
  { id: 'ytd', label: 'Year to date', short: 'YTD' },
  { id: 'all', label: 'All time', short: 'All' },
];

/** Resolve a date range id to an inclusive lower bound (epoch ms) or null (all). */
export function rangeSince(id: DateRangeId): number | null {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const DAY = 86_400_000;
  switch (id) {
    case 'today': return startOfToday;
    case 'last7': return startOfToday - 6 * DAY;
    case 'last30': return startOfToday - 29 * DAY;
    case 'thisMonth': return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case 'thisQuarter': return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime();
    case 'ytd': return new Date(now.getFullYear(), 0, 1).getTime();
    case 'all': return null;
    default: return null;
  }
}

/* ──── Saved dashboards (the switcher) ──── */

let widgetSeq = 0;

/**
 * Create a fresh widget instance with a process-unique id. Exported so the
 * dashboard orchestrator can append widgets from the "Add widget" library.
 */
export function makeWidget(
  kind: WidgetKind,
  span?: WidgetSpan,
  extra?: Partial<DashWidget>,
): DashWidget {
  return {
    id: `w_${kind}_${++widgetSeq}`,
    kind,
    span: span ?? WIDGET_META[kind].defaultSpan,
    ...extra,
  };
}

const w = (kind: WidgetKind, span?: WidgetSpan, extra?: Partial<DashWidget>): DashWidget =>
  makeWidget(kind, span, extra);

/**
 * Build the initial saved-dashboard set. A factory (not a frozen constant) so
 * each store reset / fresh mount gets its own mutable copy with unique ids —
 * editing one dashboard never leaks into another session's state.
 */
export function initialDashboards(): DashboardConfig[] {
  return [
    {
      id: 'dash_default',
      name: 'Default Dashboard',
      description: 'A balanced overview of leads, pipeline, revenue, and activity.',
      isDefault: true,
      widgets: [
        w('kpiPipelineValue'),
        w('kpiOpenOpps'),
        w('kpiNewContacts'),
        w('kpiRevenue'),
        w('stageDistribution', 2),
        w('leadSources', 1),
        w('recentActivity', 1),
        w('tasksDue', 1),
        w('appointments', 1),
      ],
    },
    {
      id: 'dash_sales',
      name: 'Sales Overview',
      description: 'Pipeline health: value, conversion, and stage movement.',
      widgets: [
        w('opportunityValue', 1, { pipelineId: 'all' }),
        w('conversionRate', 1, { pipelineId: 'all' }),
        w('opportunityStatus', 1, { pipelineId: 'all' }),
        w('funnel', 2, { pipelineId: 'pipe_sales' }),
        w('stageDistribution', 1, { pipelineId: 'pipe_sales' }),
        w('revenueByMonth', 2),
      ],
    },
    {
      id: 'dash_activity',
      name: 'Activity Dashboard',
      description: 'Day-to-day workload: conversations, tasks, and appointments.',
      widgets: [
        w('kpiUnread'),
        w('kpiAppointments'),
        w('kpiTasks'),
        w('recentActivity', 2),
        w('tasksDue', 1),
        w('appointments', 1),
        w('leadTrend', 3),
      ],
    },
  ];
}

/** Tailwind-safe column-span classes (literal strings so they survive purge). */
export const SPAN_CLASS: Record<WidgetSpan, string> = {
  1: 'lg:col-span-1',
  2: 'sm:col-span-2 lg:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
};
