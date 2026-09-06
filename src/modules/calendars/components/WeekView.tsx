/**
 * WeekView — 7-day column layout for the current week.
 * No external calendar library.
 */
import { Fragment } from 'react';
import type { Appointment, Calendar } from '@/types';
import { cx, clockTime } from '@/utils';
import { buildWeekDays, isSameDay, isToday } from '../utils';

const TIME_HOURS = Array.from({ length: 13 }, (_, index) => index + 7);

interface Props {
  anchor: Date;
  appointments: Appointment[];
  calendars: Calendar[];
  onSelectAppt: (a: Appointment) => void;
  dayOnly?: boolean;
}

export function WeekView({ anchor, appointments, calendars, onSelectAppt, dayOnly = false }: Props) {
  const days = dayOnly ? [anchor] : buildWeekDays(anchor);
  const today = new Date();

  const calColor = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#1f6feb';

  const apptsBySlot = (date: Date, hour: number) =>
    appointments
      .filter((a) => {
        const start = new Date(a.startTime);
        return isSameDay(start, date) && start.getHours() === hour;
      })
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  return (
    <div className="min-w-[820px] bg-surface" data-tour="calendars.weekView">
      <div
        className="grid border-b border-line"
        style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(${dayOnly ? '680px' : '108px'}, 1fr))` }}
      >
        <div className="flex items-end justify-center border-r border-line pb-2 text-[9px] font-medium text-ink-subtle">GMT-04</div>
        {days.map((day) => {
          const todayDay = isToday(day);
          return (
            <div key={day.toISOString()} className={cx('border-r border-line px-2 py-2.5 text-center last:border-r-0', todayDay && 'bg-brand-soft/35')}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <span className={cx('mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold', todayDay ? 'bg-brand text-white' : 'text-ink')}>
                {day.getDate()}
              </span>
            </div>
          );
        })}

        <div className="border-r border-t border-line px-1 py-2 text-right text-[9px] font-medium text-ink-subtle">all-day</div>
        {days.map((day) => (
          <div key={`all-${day.toISOString()}`} className={cx('min-h-8 border-r border-t border-line last:border-r-0', isToday(day) && 'bg-brand-soft/15')} />
        ))}

        {TIME_HOURS.map((hour) => (
          <Fragment key={hour}>
            <div className="relative min-h-[58px] border-r border-t border-line">
              <span className="absolute -top-2 right-1.5 bg-surface px-0.5 text-[9px] text-ink-subtle">
                {new Date(2020, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric' })}
              </span>
            </div>
            {days.map((day) => {
              const slotAppointments = apptsBySlot(day, hour);
              const currentSlot = isSameDay(day, today) && today.getHours() === hour;
              return (
                <div key={`${day.toISOString()}-${hour}`} className={cx('relative min-h-[58px] border-r border-t border-line p-1 last:border-r-0', isToday(day) && 'bg-brand-soft/[0.08]')}>
                  {currentSlot && (
                    <span className="pointer-events-none absolute inset-x-0 z-10 h-px bg-bad" style={{ top: `${(today.getMinutes() / 60) * 100}%` }}>
                      <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-bad" />
                    </span>
                  )}
                  <div className="relative z-[1] space-y-1">
                    {slotAppointments.map((appointment) => (
                      <button
                        key={appointment.id}
                        onClick={() => onSelectAppt(appointment)}
                        className={cx(
                          'w-full overflow-hidden rounded-[4px] border-l-[3px] px-1.5 py-1 text-left shadow-[0_1px_1px_rgba(16,24,40,.05)] hover:brightness-95 focus:outline-none',
                          appointment.status === 'cancelled' && 'opacity-50',
                        )}
                        style={{
                          background: `${calColor(appointment.calendarId)}1c`,
                          borderLeftColor: calColor(appointment.calendarId),
                        }}
                        aria-label={appointment.title}
                      >
                        <p className={cx('truncate text-[10px] font-semibold leading-4', appointment.status === 'cancelled' && 'line-through')} style={{ color: calColor(appointment.calendarId) }}>
                          {appointment.title}
                        </p>
                        <p className="truncate text-[9px] text-ink-muted">{clockTime(appointment.startTime)} – {clockTime(appointment.endTime)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
