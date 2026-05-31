/**
 * Dashboard — GoHighLevel-style sub-account home, rebuilt as an editable
 * widget workspace (Wave 3).
 *
 * The screen is a configurable board: a header with a dashboard switcher,
 * date-range selector, refresh, and an Edit mode; a responsive, drag-reorderable
 * grid of widgets (KPIs, opportunity charts, a pipeline funnel, recharts graphs,
 * and activity/task/appointment lists); and the Wave 1 onboarding checklist that
 * launches Tutorial Mode.
 *
 * Everything is local, in-memory state derived from the Zustand demo store —
 * switching dashboards, adding/removing/reordering/resizing widgets, and the
 * date range all live here and reset with the page. No API calls, no real PII.
 *
 * State model
 *   • dashboards      — working copy of the saved-dashboard set (mutable)
 *   • activeId        — which dashboard is shown
 *   • editing         — edit mode on/off; a snapshot is taken on enter so Cancel
 *                       can fully restore the layout
 *   • dateRangeId     — global range feeding range-aware widgets via computeMetrics
 *
 * data-tour anchors `dashboard.page` and `dashboard.onboardingChecklist` are
 * preserved from Wave 1. No tutorial flow targets the dashboard, so the rest of
 * the layout is free to change.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ChevronDown, RefreshCw, Pencil, Plus, Check,
  CalendarDays, GraduationCap, CheckCircle2, Circle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Card, CardHeader, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import {
  initialDashboards, DATE_RANGES, WIDGET_META,
  type DashboardConfig, type DashWidget, type WidgetKind,
  type WidgetSpan, type DateRangeId,
} from './dashboardData';
import { useDashboardData, computeMetrics } from './metrics';
import { WidgetGrid } from './WidgetGrid';
import { AddWidgetModal } from './AddWidgetModal';
import { Popover } from './Popover';

/** Deep clone the layout for the edit-mode snapshot (plain JSON data). */
const clone = (d: DashboardConfig[]): DashboardConfig[] => JSON.parse(JSON.stringify(d));

/** Monotonic suffix so widgets added during a session always get unique ids. */
let addSeq = 0;

export function Dashboard() {
  const data = useDashboardData();
  const startTutorial = useStore((s) => s.startTutorial);
  const completedTutorials = useStore((s) => s.completedTutorials);
  const pushToast = useStore((s) => s.pushToast);

  const [dashboards, setDashboards] = useState<DashboardConfig[]>(() => initialDashboards());
  const [activeId, setActiveId] = useState<string>('dash_default');
  const [dateRangeId, setDateRangeId] = useState<DateRangeId>('last30');
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const snapshotRef = useRef<DashboardConfig[] | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); }, []);

  const active = dashboards.find((d) => d.id === activeId) ?? dashboards[0];
  const ctx = useMemo(() => computeMetrics(data, dateRangeId), [data, dateRangeId]);

  /* ──── Layout mutations (operate on the active dashboard) ──── */
  const updateActive = (fn: (d: DashboardConfig) => DashboardConfig) =>
    setDashboards((ds) => ds.map((d) => (d.id === active.id ? fn(d) : d)));

  const onReorder = (next: DashWidget[]) => updateActive((d) => ({ ...d, widgets: next }));
  const onSetPipeline = (id: string, pipelineId: string) =>
    updateActive((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, pipelineId } : w)) }));
  const onToggleCollapse = (id: string) =>
    updateActive((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, collapsed: !w.collapsed } : w)) }));
  const onSetSpan = (id: string, span: WidgetSpan) =>
    updateActive((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, span } : w)) }));
  const onRemove = (id: string) =>
    updateActive((d) => ({ ...d, widgets: d.widgets.filter((w) => w.id !== id) }));

  const onAdd = (kind: WidgetKind) => {
    const meta = WIDGET_META[kind];
    const widget: DashWidget = {
      id: `w_add_${Date.now().toString(36)}_${(addSeq++).toString(36)}`,
      kind,
      span: meta.defaultSpan,
      ...(meta.scoped ? { pipelineId: meta.allowAllPipelines ? 'all' : ctx.primaryPipelineId } : {}),
    };
    updateActive((d) => ({ ...d, widgets: [...d.widgets, widget] }));
    pushToast({ title: 'Widget added', description: `${meta.title} added to ${active.name}.`, variant: 'info' });
  };

  /* ──── Edit / refresh / switch ──── */
  const enterEdit = () => { snapshotRef.current = clone(dashboards); setEditing(true); };
  const cancelEdit = () => {
    if (snapshotRef.current) setDashboards(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
    setAddOpen(false);
  };
  const saveEdit = () => {
    snapshotRef.current = null;
    setEditing(false);
    setAddOpen(false);
    setShowSaved(true);
    const t = window.setTimeout(() => setShowSaved(false), 2600);
    timers.current.push(t);
    pushToast({ title: 'Dashboard saved', description: `“${active.name}” layout updated for this demo session.`, variant: 'success' });
  };
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    const t = window.setTimeout(() => {
      setRefreshing(false);
      pushToast({ title: 'Dashboard refreshed', description: 'Metrics recalculated from the latest demo data.', variant: 'info' });
    }, 700);
    timers.current.push(t);
  };
  const selectDashboard = (id: string) => { if (!editing) setActiveId(id); };

  /* ──── Onboarding checklist (Wave 1 — launches Tutorial Mode) ──── */
  const onboardingItems = [
    { id: 'add-contact', label: 'Add a new contact' },
    { id: 'reply-conversation', label: 'Reply to a conversation' },
    { id: 'move-pipeline', label: 'Move a lead through a pipeline' },
    { id: 'book-appointment', label: 'Book an appointment' },
    { id: 'create-invoice', label: 'Create an invoice' },
  ];
  const doneCount = onboardingItems.filter((i) => completedTutorials.includes(i.id)).length;

  return (
    <div data-tour="dashboard.page" className="flex h-full flex-col">
      {/* ──── Header ──── */}
      <div className="border-b border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <LayoutDashboard size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl font-bold leading-tight text-ink">{active.name}</h1>
                {active.isDefault && <Badge tone="neutral">Default</Badge>}
                {showSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good">
                    <Check size={12} /> Saved
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-ink-muted">{active.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!editing && (
              <DashboardSwitcher dashboards={dashboards} activeId={active.id} onSelect={selectDashboard} />
            )}
            <DateRangePicker value={dateRangeId} onChange={setDateRangeId} />
            {!editing ? (
              <>
                <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing}>
                  <RefreshCw size={15} className={cx(refreshing && 'animate-spin')} />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
                <Button size="sm" onClick={enterEdit}>
                  <Pencil size={15} /> Edit dashboard
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus size={15} /> Add widget
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                <Button size="sm" onClick={saveEdit}>
                  <Check size={15} /> Save
                </Button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-xs text-ink-muted">
            <Pencil size={13} className="shrink-0 text-brand" />
            <span>
              <span className="font-semibold text-ink">Editing “{active.name}”.</span>{' '}
              Drag the grip to reorder, use a widget’s ⋯ menu to resize or remove, or add a new widget. Changes are local to this demo.
            </span>
            <span className="ml-auto hidden shrink-0 font-medium text-ink-subtle sm:inline">
              {active.widgets.length} widget{active.widgets.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* ──── Body ──── */}
      <div className="flex-1 overflow-y-auto bg-surface-sunken/40 px-5 py-5">
        {active.widgets.length === 0 ? (
          <EmptyDashboard editing={editing} onAct={() => (editing ? setAddOpen(true) : enterEdit())} />
        ) : (
          <WidgetGrid
            widgets={active.widgets}
            ctx={ctx}
            pipelines={data.pipelines}
            editing={editing}
            onReorder={onReorder}
            onSetPipeline={onSetPipeline}
            onToggleCollapse={onToggleCollapse}
            onSetSpan={onSetSpan}
            onRemove={onRemove}
            onAdd={() => setAddOpen(true)}
          />
        )}

        {/* ──── Onboarding checklist (hidden while editing the layout) ──── */}
        {!editing && (
          <Card data-tour="dashboard.onboardingChecklist" className="mt-5">
            <CardHeader
              title="Getting started"
              subtitle={`${doneCount} of ${onboardingItems.length} completed — launch a guided walkthrough for any task`}
              actions={
                <Link to="/guides" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  <GraduationCap size={13} />
                  Open guides
                </Link>
              }
            />
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
                      <span className={cx('text-sm', done ? 'text-ink-subtle line-through' : 'font-medium text-ink')}>
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
        )}
      </div>

      <AddWidgetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        present={active.widgets.map((w) => w.kind)}
        onAdd={onAdd}
      />
    </div>
  );
}

/* ──── Empty state ──── */

function EmptyDashboard({ editing, onAct }: { editing: boolean; onAct: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border-2 border-dashed border-line py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-ink-subtle shadow-card">
        <LayoutDashboard size={26} />
      </span>
      <p className="mt-4 text-sm font-bold text-ink">This dashboard is empty</p>
      <p className="mt-1 max-w-xs text-xs text-ink-muted">
        {editing ? 'Add a widget to start building your view.' : 'Switch to edit mode to add widgets to this dashboard.'}
      </p>
      <Button size="sm" className="mt-4" onClick={onAct}>
        <Plus size={15} /> {editing ? 'Add widget' : 'Edit dashboard'}
      </Button>
    </div>
  );
}

/* ──── Dashboard switcher ──── */

function DashboardSwitcher({
  dashboards, activeId, onSelect,
}: {
  dashboards: DashboardConfig[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = dashboards.find((d) => d.id === activeId);
  return (
    <Popover
      open={open}
      setOpen={setOpen}
      width="w-72"
      trigger={
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken"
        >
          <LayoutDashboard size={15} className="text-ink-muted" />
          <span className="max-w-[9rem] truncate">{active?.name ?? 'Dashboard'}</span>
          <ChevronDown size={14} className="text-ink-subtle" />
        </button>
      }
    >
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        Switch dashboard
      </p>
      <ul className="pb-1">
        {dashboards.map((d) => (
          <li key={d.id}>
            <button
              onClick={() => { onSelect(d.id); setOpen(false); }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-surface-sunken"
            >
              <Check size={14} className={cx('mt-0.5 shrink-0', d.id === activeId ? 'text-brand' : 'text-transparent')} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-ink">{d.name}</span>
                  {d.isDefault && <Badge tone="neutral">Default</Badge>}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{d.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

/* ──── Date-range picker ──── */

function DateRangePicker({
  value, onChange,
}: {
  value: DateRangeId;
  onChange: (id: DateRangeId) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = DATE_RANGES.find((r) => r.id === value);
  return (
    <Popover
      open={open}
      setOpen={setOpen}
      width="w-48"
      trigger={
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          <CalendarDays size={15} className="text-ink-muted" />
          <span className="whitespace-nowrap">{current?.label ?? 'Date range'}</span>
          <ChevronDown size={14} className="text-ink-subtle" />
        </button>
      }
    >
      <ul className="py-1">
        {DATE_RANGES.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => { onChange(r.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-sunken"
            >
              <Check size={13} className={cx('shrink-0', r.id === value ? 'text-brand' : 'text-transparent')} />
              {r.label}
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
