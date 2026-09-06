/**
 * WidgetCard.tsx — the chrome around a single dashboard widget.
 *
 * Renders the card shell, header (title + icon), and per-widget controls:
 *   • a pipeline dropdown for pipeline-scoped widgets (writes widget.pipelineId)
 *   • a date-range label for range-sensitive widgets
 *   • a "more" menu with collapse/expand, and — in edit mode — resize + remove
 *   • a drag handle (edit mode only; dnd-kit listeners are spread onto it)
 *
 * KPI tiles are self-contained (KpiBody draws its own icon + number), so they
 * get a slim title row instead of the full header. Everything here mutates
 * local dashboard state through the callbacks passed by WidgetGrid — there is
 * no global/store mutation from a widget.
 */
import { useState } from 'react';
import {
  MoreHorizontal, ChevronDown, GripVertical, Trash2, ChevronsLeftRight,
  Check, Calendar, Maximize2, Minimize2,
} from 'lucide-react';
import type { Pipeline } from '@/types';
import { cx } from '@/utils';
import {
  WIDGET_META, type DashWidget, type WidgetSpan,
} from './dashboardData';
import type { MetricsCtx } from './metrics';
import { WidgetBody, isKpi } from './widgets';
import { Popover } from './Popover';

/* Widget kinds whose body reacts to the dashboard date range. Used to decide
   whether to surface the range label as a per-widget hint. */
const RANGE_SENSITIVE = new Set<DashWidget['kind']>([
  'kpiNewContacts', 'kpiRevenue', 'recentActivity', 'leadTrend', 'revenueByMonth',
]);

const SPAN_LABEL: Record<WidgetSpan, string> = { 1: 'Small', 2: 'Medium', 3: 'Wide' };

export interface WidgetCardProps {
  widget: DashWidget;
  ctx: MetricsCtx;
  pipelines: Pipeline[];
  editing: boolean;
  onSetPipeline: (pipelineId: string) => void;
  onToggleCollapse: () => void;
  onSetSpan: (span: WidgetSpan) => void;
  onRemove: () => void;
  /** dnd-kit drag-handle listeners/attributes — spread onto the handle. */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  /** True while this card is the one being dragged. */
  dragging?: boolean;
}

export function WidgetCard({
  widget, ctx, pipelines, editing,
  onSetPipeline, onToggleCollapse, onSetSpan, onRemove,
  dragHandleProps, dragging,
}: WidgetCardProps) {
  const meta = WIDGET_META[widget.kind];
  const Icon = meta.icon;
  const kpi = isKpi(widget.kind);
  const collapsed = !!widget.collapsed;

  const controls = (
    <div className="flex items-center gap-1">
      {meta.scoped && (
        <PipelineSelect
          value={widget.pipelineId ?? ctx.primaryPipelineId}
          pipelines={pipelines}
          allowAll={!!meta.allowAllPipelines}
          onChange={onSetPipeline}
        />
      )}
      {RANGE_SENSITIVE.has(widget.kind) && (
        <span className="hidden items-center gap-1 rounded-md bg-surface-sunken px-1.5 py-1 text-[10px] font-medium text-ink-muted sm:inline-flex">
          <Calendar size={11} />
          {ctx.range.label}
        </span>
      )}
      <WidgetMenu
        collapsed={collapsed}
        editing={editing}
        span={widget.span}
        resizable={!kpi}
        onToggleCollapse={onToggleCollapse}
        onSetSpan={onSetSpan}
        onRemove={onRemove}
      />
      {editing && (
        <button
          {...dragHandleProps}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          className="grid h-7 w-7 cursor-grab touch-none place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
      )}
    </div>
  );

  return (
    <div
      className={cx(
        'flex h-full min-h-[168px] flex-col overflow-hidden rounded-[6px] border border-[#d9dee7] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.025)] transition-shadow',
        dragging && 'opacity-60',
        editing && 'ring-1 ring-[#9ccfe2]',
      )}
    >
      {kpi ? (
        <div className="flex min-h-[42px] items-center justify-between border-b border-[#edf0f3] px-3.5">
          <span className="text-[12px] font-semibold text-[#344054]">{meta.title}</span>
          {controls}
        </div>
      ) : (
        <div className="flex min-h-[42px] items-center justify-between gap-2 border-b border-[#edf0f3] px-3.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold text-[#344054]">{meta.title}</span>
          </div>
          {controls}
        </div>
      )}

      {collapsed ? (
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-ink-subtle hover:text-ink"
        >
          <ChevronDown size={13} />
          Collapsed — click to expand
        </button>
      ) : (
        <div className={cx('min-w-0', kpi ? '' : 'flex-1')}>
          <WidgetBody widget={widget} ctx={ctx} icon={<Icon size={16} />} />
        </div>
      )}
    </div>
  );
}

/* ──── Pipeline dropdown ──── */

function PipelineSelect({
  value, pipelines, allowAll, onChange,
}: {
  value: string;
  pipelines: Pipeline[];
  allowAll: boolean;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = allowAll
    ? [{ id: 'all', name: 'All Pipelines' }, ...pipelines]
    : pipelines;
  const current = options.find((p) => p.id === value) ?? options[0];

  return (
    <Popover open={open} setOpen={setOpen}
      trigger={
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-6 max-w-[7.5rem] items-center gap-1 rounded-[3px] border border-[#e1e5ea] bg-white px-2 text-[10px] font-medium text-[#667085] hover:bg-[#f7f8fa]"
        >
          <span className="truncate">{current?.name ?? 'Pipeline'}</span>
          <ChevronDown size={12} className="shrink-0" />
        </button>
      }
    >
      <div className="w-52 py-1">
        <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Pipeline
        </p>
        {options.map((p) => (
          <button
            key={p.id}
            onClick={() => { onChange(p.id); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-sunken"
          >
            <Check size={13} className={cx('shrink-0', p.id === value ? 'text-brand' : 'text-transparent')} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </Popover>
  );
}

/* ──── Per-widget "more" menu ──── */

function WidgetMenu({
  collapsed, editing, span, resizable,
  onToggleCollapse, onSetSpan, onRemove,
}: {
  collapsed: boolean;
  editing: boolean;
  span: WidgetSpan;
  resizable: boolean;
  onToggleCollapse: () => void;
  onSetSpan: (span: WidgetSpan) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} setOpen={setOpen}
      trigger={
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Widget options"
          className="grid h-6 w-6 place-items-center rounded-[3px] text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]"
        >
          <MoreHorizontal size={16} />
        </button>
      }
    >
      <div className="w-48 py-1 text-xs">
        <MenuItem
          icon={collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          label={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => { onToggleCollapse(); setOpen(false); }}
        />
        {editing && resizable && (
          <>
            <div className="my-1 border-t border-line" />
            <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Width
            </p>
            {([1, 2, 3] as WidgetSpan[]).map((s) => (
              <button
                key={s}
                onClick={() => { onSetSpan(s); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ink hover:bg-surface-sunken"
              >
                <Check size={13} className={cx('shrink-0', s === span ? 'text-brand' : 'text-transparent')} />
                <ChevronsLeftRight size={13} className="shrink-0 text-ink-subtle" />
                {SPAN_LABEL[s]}
              </button>
            ))}
          </>
        )}
        {editing && (
          <>
            <div className="my-1 border-t border-line" />
            <MenuItem
              icon={<Trash2 size={13} />}
              label="Remove widget"
              danger
              onClick={() => { onRemove(); setOpen(false); }}
            />
          </>
        )}
      </div>
    </Popover>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-sunken',
        danger ? 'text-bad' : 'text-ink',
      )}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}
