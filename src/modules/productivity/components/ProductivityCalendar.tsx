/**
 * Productivity Calendar — a month grid aggregating everything with a date:
 * task due dates, ticket due dates, and project milestones. Clicking an event
 * opens the relevant detail drawer (hosted locally; store is shared via
 * context). This is productivity-specific and does not touch the main
 * Calendars module. Adapts Meridian's Calendar view.
 */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { useProductivity } from '../state';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { TicketDetailDrawer } from './TicketDetailDrawer';
import { ProjectDetail } from './ProjectDetail';

type EventKind = 'ticket' | 'task' | 'milestone';
interface CalEvent {
  id: string;
  kind: EventKind;
  refId: string; // ticket/task id, or project id for milestones
  label: string;
  color: string;
  date: Date;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function ProductivityCalendar() {
  const { tickets, tasks, projects } = useProductivity();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [openTask, setOpenTask] = useState<string | null>(null);
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<string | null>(null);

  const events: CalEvent[] = useMemo(() => {
    const out: CalEvent[] = [];
    tickets.forEach((t) => {
      if (t.dueAt) out.push({ id: `tk-${t.id}`, kind: 'ticket', refId: t.id, label: t.subject, color: '#2563eb', date: new Date(t.dueAt) });
    });
    tasks.forEach((t) => {
      if (t.dueAt) out.push({ id: `t-${t.id}`, kind: 'task', refId: t.id, label: t.title, color: t.status === 'done' ? '#12895f' : '#7c3aed', date: new Date(t.dueAt) });
    });
    projects.forEach((p) => {
      p.milestones.forEach((m) => {
        out.push({ id: `ms-${m.id}`, kind: 'milestone', refId: p.id, label: m.title, color: p.color, date: new Date(m.dueAt) });
      });
    });
    return out;
  }, [tickets, tasks, projects]);

  // Build the 6-week grid starting on the Sunday on/before the 1st.
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const openEvent = (e: CalEvent) => {
    if (e.kind === 'ticket') setOpenTicket(e.refId);
    else if (e.kind === 'task') setOpenTask(e.refId);
    else setOpenProject(e.refId);
  };

  const shiftMonth = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-ink">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-[11px] text-ink-subtle">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Tickets</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7c3aed]" /> Tasks</span>
            <span className="inline-flex items-center gap-1"><Flag size={11} /> Milestones</span>
          </div>
          <Button size="xs" variant="ghost" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
          <div className="flex rounded-lg border border-line">
            <button onClick={() => shiftMonth(-1)} className="px-2 py-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Previous month"><ChevronLeft size={16} /></button>
            <button onClick={() => shiftMonth(1)} className="px-2 py-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {DOW.map((d) => (
            <div key={d} className="bg-surface-sunken px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">{d}</div>
          ))}
          {grid.map((day, i) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = sameDay(day, today);
            const dayEvents = events.filter((e) => sameDay(e.date, day));
            return (
              <div key={i} className={cx('min-h-[92px] bg-surface p-1.5', !inMonth && 'bg-surface-sunken/40')}>
                <div className="mb-1 flex justify-end">
                  <span className={cx('grid h-5 w-5 place-items-center rounded-full text-[11px]', isToday ? 'bg-brand font-bold text-brand-fg' : inMonth ? 'text-ink-muted' : 'text-ink-subtle')}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => openEvent(e)}
                      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] font-medium text-ink transition-colors hover:bg-surface-sunken"
                      title={e.label}
                    >
                      {e.kind === 'milestone'
                        ? <Flag size={9} className="shrink-0" style={{ color: e.color }} />
                        : <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />}
                      <span className="truncate">{e.label}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && <span className="px-1 text-[10px] text-ink-subtle">+{dayEvents.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailDrawer taskId={openTask} onClose={() => setOpenTask(null)} />
      <TicketDetailDrawer ticketId={openTicket} onClose={() => setOpenTicket(null)} onOpenTask={(id) => { setOpenTicket(null); setOpenTask(id); }} />
      <ProjectDetail projectId={openProject} onClose={() => setOpenProject(null)} onOpenTask={(id) => { setOpenProject(null); setOpenTask(id); }} />
    </div>
  );
}
