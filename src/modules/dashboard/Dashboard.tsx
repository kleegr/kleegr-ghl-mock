import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Check, ChevronDown, Copy, LayoutDashboard, MoreHorizontal,
  Pencil, Plus, RefreshCw, ShieldCheck, Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import {
  DATE_RANGES, WIDGET_META, initialDashboards,
  type DashboardConfig, type DashWidget, type WidgetKind,
  type WidgetSpan, type DateRangeId,
} from './dashboardData';
import { useDashboardData, computeMetrics } from './metrics';
import { WidgetGrid } from './WidgetGrid';
import { AddWidgetModal } from './AddWidgetModal';
import { Popover } from './Popover';

const clone = (dashboards: DashboardConfig[]): DashboardConfig[] =>
  JSON.parse(JSON.stringify(dashboards));

let addSeq = 0;

export function Dashboard() {
  const data = useDashboardData();
  const navigate = useNavigate();
  const pushToast = useStore((state) => state.pushToast);
  const [dashboards, setDashboards] = useState<DashboardConfig[]>(() => initialDashboards());
  const [activeId, setActiveId] = useState('dash_default');
  const [dateRangeId, setDateRangeId] = useState<DateRangeId>('last30');
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const snapshotRef = useRef<DashboardConfig[] | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);

  const active = dashboards.find((dashboard) => dashboard.id === activeId) ?? dashboards[0];
  const ctx = useMemo(() => computeMetrics(data, dateRangeId), [data, dateRangeId]);
  const updateActive = (update: (dashboard: DashboardConfig) => DashboardConfig) =>
    setDashboards((current) => current.map((dashboard) => dashboard.id === active.id ? update(dashboard) : dashboard));

  const onReorder = (widgets: DashWidget[]) => updateActive((dashboard) => ({ ...dashboard, widgets }));
  const onSetPipeline = (id: string, pipelineId: string) => updateActive((dashboard) => ({
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => widget.id === id ? { ...widget, pipelineId } : widget),
  }));
  const onToggleCollapse = (id: string) => updateActive((dashboard) => ({
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => widget.id === id ? { ...widget, collapsed: !widget.collapsed } : widget),
  }));
  const onSetSpan = (id: string, span: WidgetSpan) => updateActive((dashboard) => ({
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => widget.id === id ? { ...widget, span } : widget),
  }));
  const onRemove = (id: string) => updateActive((dashboard) => ({
    ...dashboard,
    widgets: dashboard.widgets.filter((widget) => widget.id !== id),
  }));
  const onAdd = (kind: WidgetKind) => {
    const meta = WIDGET_META[kind];
    const widget: DashWidget = {
      id: `w_add_${Date.now().toString(36)}_${(addSeq++).toString(36)}`,
      kind,
      span: meta.defaultSpan,
      ...(meta.scoped ? { pipelineId: meta.allowAllPipelines ? 'all' : ctx.primaryPipelineId } : {}),
    };
    updateActive((dashboard) => ({ ...dashboard, widgets: [...dashboard.widgets, widget] }));
    pushToast({ title: 'Widget added', description: `${meta.title} added to ${active.name}.`, variant: 'info' });
  };

  const enterEdit = () => {
    snapshotRef.current = clone(dashboards);
    setEditing(true);
  };
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
    timers.current.push(window.setTimeout(() => setShowSaved(false), 2200));
    pushToast({ title: 'Dashboard saved', description: `“${active.name}” was updated for this demo session.`, variant: 'success' });
  };
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    timers.current.push(window.setTimeout(() => {
      setRefreshing(false);
      pushToast({ title: 'Dashboard refreshed', description: 'Metrics are up to date.', variant: 'info' });
    }, 650));
  };

  return (
    <div data-tour="dashboard.page" className="flex h-full flex-col">
      <div data-tour="dashboard.onboardingChecklist" className="flex min-h-[58px] shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 lg:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <DashboardSwitcher
            dashboards={dashboards}
            activeId={active.id}
            onSelect={(id) => { if (!editing) setActiveId(id); }}
          />
          <button
            type="button"
            disabled={editing}
            onClick={() => pushToast({ title: 'New dashboard', description: 'Dashboard creation is simulated in this public demo.', variant: 'info' })}
            className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#4bb8df] px-3 text-[12px] font-semibold text-white hover:bg-[#37abd4] disabled:opacity-45"
          >
            <Plus size={14} /> New
          </button>
          {showSaved && (
            <span className="hidden items-center gap-1 text-[11px] font-semibold text-good sm:inline-flex">
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRangeId} onChange={setDateRangeId} />
          <button
            type="button"
            onClick={() => pushToast({ title: 'Dashboard insights', description: 'AI insights are represented with fictional demo data.', variant: 'info' })}
            className="grid h-8 w-8 place-items-center rounded-[4px] border border-[#d9dee7] bg-white text-[#7358d8] hover:bg-[#f7f5ff]"
            aria-label="Dashboard insights"
            title="Dashboard insights"
          >
            <Sparkles size={15} />
          </button>
          {editing ? (
            <>
              <button type="button" onClick={cancelEdit} className="h-8 rounded-[4px] px-3 text-[12px] font-semibold text-ink-muted hover:bg-surface-sunken">Cancel</button>
              <button type="button" onClick={saveEdit} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#4bb8df] px-3 text-[12px] font-semibold text-white hover:bg-[#37abd4]"><Check size={14} /> Save</button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d9dee7] bg-white px-3 text-[12px] font-semibold text-[#344054] hover:bg-[#f7f8fa]"
            >
              <Pencil size={13} /> Edit Dashboard
            </button>
          )}
          <DashboardMenu
            refreshing={refreshing}
            onRefresh={refresh}
            onOpenGuides={() => navigate('/guides')}
            onDuplicate={() => pushToast({ title: 'Dashboard duplicated', description: 'A demo copy would be created here.', variant: 'info' })}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f3f5f8] p-4 lg:p-[18px]">
        {editing && (
          <div className="mb-3 flex min-h-9 items-center gap-2 rounded-[5px] border border-[#b8dff0] bg-[#eef9fd] px-3 text-[11px] text-[#476072]">
            <Pencil size={12} className="shrink-0 text-[#1599c6]" />
            <span><strong className="font-semibold text-[#263b4b]">Editing {active.name}.</strong> Drag cards to reorder them or use each card menu to resize and remove.</span>
            <button type="button" onClick={() => setAddOpen(true)} className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-[#158fbb] hover:underline"><Plus size={12} /> Add widget</button>
          </div>
        )}

        {active.widgets.length === 0 ? (
          <EmptyDashboard editing={editing} onAct={() => editing ? setAddOpen(true) : enterEdit()} />
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
      </div>

      <AddWidgetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        present={active.widgets.map((widget) => widget.kind)}
        onAdd={onAdd}
      />
    </div>
  );
}

function EmptyDashboard({ editing, onAct }: { editing: boolean; onAct: () => void }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-[6px] border border-dashed border-[#cfd6df] bg-white text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef8fc] text-[#34a9d3]"><LayoutDashboard size={22} /></span>
        <p className="mt-3 text-sm font-semibold text-ink">This dashboard is empty</p>
        <p className="mt-1 text-xs text-ink-muted">{editing ? 'Add a widget to start building your view.' : 'Edit the dashboard to add your first widget.'}</p>
        <Button size="sm" className="mt-4 rounded-[4px]" onClick={onAct}><Plus size={14} /> {editing ? 'Add widget' : 'Edit dashboard'}</Button>
      </div>
    </div>
  );
}

function DashboardSwitcher({
  dashboards, activeId, onSelect,
}: {
  dashboards: DashboardConfig[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = dashboards.find((dashboard) => dashboard.id === activeId);
  return (
    <Popover
      open={open}
      setOpen={setOpen}
      width="w-72"
      trigger={
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-8 min-w-[190px] items-center gap-2 rounded-[4px] border border-[#d9dee7] bg-white px-2.5 text-[12px] font-semibold text-[#344054] hover:bg-[#f7f8fa]">
          <LayoutDashboard size={14} className="text-[#6e7b8c]" />
          <span className="min-w-0 flex-1 truncate text-left">{active?.name ?? 'Dashboard'}</span>
          <ChevronDown size={13} className="text-[#8b96a7]" />
        </button>
      }
    >
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Switch dashboard</p>
      <ul className="pb-1">
        {dashboards.map((dashboard) => (
          <li key={dashboard.id}>
            <button type="button" onClick={() => { onSelect(dashboard.id); setOpen(false); }} className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-surface-sunken">
              <Check size={14} className={cx('mt-0.5 shrink-0', dashboard.id === activeId ? 'text-brand' : 'text-transparent')} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5"><span className="truncate text-sm font-semibold text-ink">{dashboard.name}</span>{dashboard.isDefault && <Badge tone="neutral">Default</Badge>}</span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{dashboard.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

function DateRangePicker({ value, onChange }: { value: DateRangeId; onChange: (id: DateRangeId) => void }) {
  const [open, setOpen] = useState(false);
  const current = DATE_RANGES.find((range) => range.id === value);
  return (
    <Popover
      open={open}
      setOpen={setOpen}
      width="w-48"
      trigger={
        <button type="button" onClick={() => setOpen((currentOpen) => !currentOpen)} className="flex h-8 items-center gap-2 rounded-[4px] border border-[#d9dee7] bg-white px-2.5 text-[12px] font-medium text-[#475467] hover:bg-[#f7f8fa]">
          <CalendarDays size={14} className="text-[#6e7b8c]" />
          <span className="whitespace-nowrap">{current?.label ?? 'Date range'}</span>
          <ChevronDown size={13} className="text-[#8b96a7]" />
        </button>
      }
    >
      <ul className="py-1">
        {DATE_RANGES.map((range) => (
          <li key={range.id}>
            <button type="button" onClick={() => { onChange(range.id); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-sunken">
              <Check size={13} className={cx('shrink-0', range.id === value ? 'text-brand' : 'text-transparent')} /> {range.label}
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

function DashboardMenu({
  refreshing, onRefresh, onOpenGuides, onDuplicate,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onOpenGuides: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const act = (action: () => void) => { setOpen(false); action(); };
  return (
    <Popover
      open={open}
      setOpen={setOpen}
      width="w-52"
      trigger={
        <button type="button" onClick={() => setOpen((current) => !current)} className="grid h-8 w-8 place-items-center rounded-[4px] border border-[#d9dee7] bg-white text-[#667085] hover:bg-[#f7f8fa]" aria-label="Dashboard options"><MoreHorizontal size={16} /></button>
      }
    >
      <div className="py-1 text-xs">
        <button type="button" onClick={() => act(onRefresh)} disabled={refreshing} className="flex w-full items-center gap-2 px-3 py-2 text-left text-ink hover:bg-surface-sunken disabled:opacity-50"><RefreshCw size={13} className={cx(refreshing && 'animate-spin')} /> {refreshing ? 'Refreshing…' : 'Refresh dashboard'}</button>
        <button type="button" onClick={() => act(onDuplicate)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-ink hover:bg-surface-sunken"><Copy size={13} /> Duplicate dashboard</button>
        <button type="button" onClick={() => act(onOpenGuides)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-ink hover:bg-surface-sunken"><ShieldCheck size={13} /> Guided setup</button>
      </div>
    </Popover>
  );
}
