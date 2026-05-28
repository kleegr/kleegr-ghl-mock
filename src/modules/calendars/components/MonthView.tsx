/**
 * MonthView — hand-rolled 6-row × 7-col month grid.
 * No external calendar library; all logic is from ../utils.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Calendar } from '@/types';
import { cx } from '@/utils';
import { buildMonthGrid, isSameDay, isToday, formatMonthYear } from '../utils';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHIP_MAX = 2;

interface Props {
  year: number;
  month: number;
  appointments: Appointment[];
  calendars: Calendar[];
  onSelectAppt: (a: Appointment) => void;
  onNavigate: (dir: -1 | 1) => void;
  onClickDay?: (date: Date) => void;
}

export function MonthView({
  year,
  month,
  appointments,
  calendars,
  onSelectAppt,
  onNavigate,
  onClickDay,
}: Props) {
  const grid = buildMonthGrid(year, month);
  const today = new Date();

  // Look-up calendar color by id
  const calColor = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#1f6feb';

  // Appointments on a given date
  const apptsByDay = (date: Date) =>
    appointments
      .filter((a) => isSameDay(new Date(a.startTime), date))
      .sort(
        (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
      );

  return (
    <div className="flex flex-col" data-tour="calendars.monthGrid">
      {/* Month navigation */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <button
          onClick={() => onNavigate(-1)}
          className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-ink">
          {formatMonthYear(year, month)}
        </span>
        <button
          onClick={() => onNavigate(1)}
          className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-line bg-surface-sunken">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-ink-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid flex-1 grid-cols-7">
        {grid.map((cell, idx) => {
          const dayAppts = apptsByDay(cell.date);
          const visible = dayAppts.slice(0, CHIP_MAX);
          const overflow = dayAppts.length - CHIP_MAX;
          const todayCell = isToday(cell.date);
          const isCurrentDay = isSameDay(cell.date, today);

          return (
            <div
              key={idx}
              className={cx(
                'min-h-[80px] border-b border-r border-line p-1 sm:min-h-[90px]',
                !cell.inMonth && 'bg-surface-sunken/60',
                idx % 7 === 0 && 'border-l',
              )}
              onClick={() => onClickDay?.(cell.date)}
            >
              {/* Day number */}
              <div className="mb-0.5 flex justify-end">
                <span
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    todayCell
                      ? 'bg-brand text-brand-fg'
                      : isCurrentDay
                      ? 'bg-brand text-brand-fg'
                      : cell.inMonth
                      ? 'text-ink'
                      : 'text-ink-subtle',
                  )}
                >
                  {cell.date.getDate()}
                </span>
              </div>

              {/* Appointment chips */}
              <div className="space-y-0.5">
                {visible.map((a) => (
                  <button
                    key={a.id}
                    className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium hover:opacity-80 focus:outline-none"
                    style={{ background: `${calColor(a.calendarId)}22` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppt(a);
                    }}
                    data-tour="calendars.appointmentChip"
                    aria-label={a.title}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: calColor(a.calendarId) }}
                    />
                    <span
                      className="min-w-0 flex-1 truncate"
                      style={{ color: calColor(a.calendarId) }}
                    >
                      {a.title}
                    </span>
                  </button>
                ))}
                {overflow > 0 && (
                  <p className="px-1 text-[10px] font-semibold text-ink-subtle">
                    +{overflow} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
