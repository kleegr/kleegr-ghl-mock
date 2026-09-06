/**
 * MonthView — hand-rolled 6-row × 7-col month grid.
 * No external calendar library; all logic is from ../utils.
 */
import type { Appointment, Calendar } from '@/types';
import { clockTime, cx } from '@/utils';
import { buildMonthGrid, isSameDay, isToday } from '../utils';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHIP_MAX = 3;

interface Props {
  year: number;
  month: number;
  appointments: Appointment[];
  calendars: Calendar[];
  onSelectAppt: (a: Appointment) => void;
  onClickDay?: (date: Date) => void;
}

export function MonthView({
  year,
  month,
  appointments,
  calendars,
  onSelectAppt,
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
    <div className="flex min-h-full flex-col bg-surface" data-tour="calendars.monthGrid">
      {/* Day-of-week header */}
      <div className="grid h-9 shrink-0 grid-cols-7 border-b border-line bg-surface">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="border-r border-line px-2 py-2 text-left text-[11px] font-semibold text-ink-muted last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
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
                'min-h-[92px] cursor-pointer border-b border-r border-line p-1.5 transition-colors hover:bg-brand-soft/20 sm:min-h-[104px]',
                !cell.inMonth && 'bg-surface-sunken/70',
              )}
              onClick={() => onClickDay?.(cell.date)}
            >
              {/* Day number */}
              <div className="mb-1 flex justify-end">
                <span
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
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
              <div className="space-y-1">
                {visible.map((a) => (
                  <button
                    key={a.id}
                    className={cx(
                      'flex w-full items-center gap-1.5 overflow-hidden rounded-[4px] border-l-[3px] px-1.5 py-1 text-left text-[10px] font-medium shadow-[0_1px_1px_rgba(16,24,40,.04)] hover:brightness-95 focus:outline-none',
                      a.status === 'cancelled' && 'opacity-50',
                    )}
                    style={{
                      background: `${calColor(a.calendarId)}18`,
                      borderLeftColor: calColor(a.calendarId),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppt(a);
                    }}
                    data-tour="calendars.appointmentChip"
                    aria-label={a.title}
                  >
                    <span className="shrink-0 text-[9px] text-ink-muted">{clockTime(a.startTime)}</span>
                    <span
                      className={cx(
                        'min-w-0 flex-1 truncate font-semibold',
                        a.status === 'cancelled' && 'line-through',
                      )}
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
