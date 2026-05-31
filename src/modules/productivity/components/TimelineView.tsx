/**
 * Timeline / Gantt view — adapts Meridian's GanttView. Each project renders as
 * a horizontal bar positioned across a shared month scale, with milestone
 * markers and a "today" line. Clicking a bar opens the project detail. Not a
 * full drag-resize Gantt — a polished planning overview.
 */

import { useMemo, useState } from 'react';
import { Flag } from 'lucide-react';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Project } from '../types';
import { PROJECT_STATUS_META } from '../data';
import { AssigneePill, ProjectStatusBadge } from './shared';
import { ProjectDetail } from './ProjectDetail';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

export function TimelineView() {
  const { projects, tasks } = useProductivity();
  const [openId, setOpenId] = useState<string | null>(null);

  const { rangeStart, months, totalMs } = useMemo(() => {
    const starts = projects.map((p) => new Date(p.startAt).getTime());
    const ends = projects.flatMap((p) => [new Date(p.dueAt).getTime(), ...p.milestones.map((m) => new Date(m.dueAt).getTime())]);
    const minD = startOfMonth(new Date(Math.min(...starts, Date.now())));
    const maxRaw = new Date(Math.max(...ends, Date.now()));
    const maxD = startOfMonth(addMonths(maxRaw, 1)); // pad one month past the last end
    const m: Date[] = [];
    let c = new Date(minD);
    while (c <= maxD) { m.push(new Date(c)); c = addMonths(c, 1); }
    const total = maxD.getTime() - minD.getTime() || 1;
    return { rangeStart: minD, months: m, totalMs: total };
  }, [projects]);

  const pctOf = (t: number) => ((t - rangeStart.getTime()) / totalMs) * 100;
  const todayPct = pctOf(Date.now());

  const linkedCount = (p: Project) => tasks.filter((t) => t.projectId === p.id).length;

  return (
    <div className="flex h-full flex-col" data-tour="productivity.timeline">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">Project Timeline</h3>
        <span className="text-[12px] text-ink-subtle">{projects.length} projects · {months.length} months</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line">
        <div className="min-w-[760px]">
          {/* Month scale */}
          <div className="sticky top-0 z-10 flex border-b border-line bg-surface-sunken">
            <div className="w-52 shrink-0 border-r border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Project</div>
            <div className="relative flex-1">
              <div className="flex">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 border-r border-line/60 px-2 py-2 text-[11px] font-medium text-ink-muted last:border-r-0">
                    {MONTHS_SHORT[m.getMonth()]} <span className="text-ink-subtle">'{String(m.getFullYear()).slice(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Today line spanning all rows (offset by the 208px label column) */}
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-[5] w-px bg-bad/60"
              style={{ left: `calc(208px + (100% - 208px) * ${todayPct / 100})` }}
              aria-hidden="true"
            >
              <span className="absolute -top-0 left-1 rounded bg-bad px-1 py-0.5 text-[9px] font-bold text-white">Today</span>
            </div>

            {projects.map((p) => {
              const left = pctOf(new Date(p.startAt).getTime());
              const right = pctOf(new Date(p.dueAt).getTime());
              const width = Math.max(right - left, 2);
              return (
                <div key={p.id} className="flex items-center border-b border-line last:border-b-0 hover:bg-surface-sunken/40">
                  <div className="w-52 shrink-0 border-r border-line px-3 py-2.5">
                    <button onClick={() => setOpenId(p.id)} className="block w-full text-left">
                      <span className="block truncate text-[13px] font-semibold text-ink">{p.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <ProjectStatusBadge status={p.status} />
                        <span className="text-[10px] text-ink-subtle">{linkedCount(p)} tasks</span>
                      </span>
                    </button>
                  </div>

                  <div className="relative h-14 flex-1">
                    {/* Bar */}
                    <button
                      onClick={() => setOpenId(p.id)}
                      className="group absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-left shadow-card transition-all hover:brightness-95"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${p.color}22`, border: `1.5px solid ${p.color}` }}
                      title={`${p.name} · ${dateLabel(p.startAt)} → ${dateLabel(p.dueAt)}`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="truncate text-[11px] font-semibold" style={{ color: p.color }}>
                        {PROJECT_STATUS_META[p.status].label}
                      </span>
                    </button>

                    {/* Milestone markers */}
                    {p.milestones.map((m) => {
                      const mp = pctOf(new Date(m.dueAt).getTime());
                      if (mp < 0 || mp > 100) return null;
                      return (
                        <span
                          key={m.id}
                          className="absolute top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${mp}%` }}
                          title={`${m.title} · ${dateLabel(m.dueAt)}${m.done ? ' (done)' : ''}`}
                        >
                          <Flag size={13} className={cx(m.done ? 'fill-good text-good' : 'text-ink-muted')} strokeWidth={2} />
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 px-1 text-[11px] text-ink-subtle">
        <AssigneePill id="u_jordan" /> <span>Owners are demo team members · dates are relative demo data</span>
      </div>

      <ProjectDetail projectId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
