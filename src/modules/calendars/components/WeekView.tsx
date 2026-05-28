/**
 * WeekView — 7-day column layout for the current week.
 * No external calendar library.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Calendar } from '@/types';
import { cx, clockTime } from '@/utils';
import { buildWeekDays, isSameDay, isToday, formatWeekRange } from '../utils';

interface Props {
  anchor: Date;
  appointments: Appointment[];
  calendars: Calendar[];
  onSelectAppt: (a: Appointment) => void;
  onNavigate: (dir: -1 | 1) => void;
}

export function WeekView({ anchor, appointments, calendars, onSelectAppt, onNavigate }: Props) {
  const days = buildWeekDays(anchor);
  const today = new Date();

  const calColor = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#1f6feb';

  const apptsByDay = (date: Date) =>
    appointments
      .filter((a) => isSameDay(new Date(a.startTime), date))
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  return (
    <div className="flex flex-col" data-tour="calendars.weekView">
      {/* Week navigation */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <button
          onClick={() => onNavigate(-1)}
          className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-ink">
          {formatWeekRange(days)}
        </span>
        <button
          onClick={() => onNavigate(1)}
          className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 divide-x divide-line overflow-x-auto">
        {days.map((day) => {
          const dayAppts = apptsByDay(day);
          const todayDay = isToday(day);
          const isCurrentDay = isSameDay(day, today);

          return (
            <div key={day.toISOString()} className="min-w-[90px]">
              {/* Day header */}
              <div
                className={cx(
                  'border-b border-line py-2 text-center',
                  (todayDay || isCurrentDay) && 'bg-brand-soft',
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <span
                  className={cx(
                    'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                    (todayDay || isCurrentDay)
                      ? 'bg-brand text-brand-fg'
                      : 'text-ink',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Appointments */}
              <div className="space-y-1.5 p-1.5">
                {dayAppts.length === 0 && (
                  <p className="py-4 text-center text-[10px] text-ink-subtle">—</p>
                )}
                {dayAppts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectAppt(a)}
                    className="w-full rounded-lg px-1.5 py-1.5 text-left text-[10px] font-medium hover:opacity-80 focus:outline-none"
                    style={{ background: `${calColor(a.calendarId)}22` }}
                    aria-label={a.title}
                  >
                    <p
                      className="truncate font-semibold leading-snug"
                      style={{ color: calColor(a.calendarId) }}
                    >
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-ink-subtle">{clockTime(a.startTime)}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
