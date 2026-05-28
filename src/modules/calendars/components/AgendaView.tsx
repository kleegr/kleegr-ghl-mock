/**
 * AgendaView — date-grouped chronological appointment list.
 */
import type { Appointment, Calendar, Contact } from '@/types';
import { Badge, Avatar, EmptyState } from '@/components/ui/primitives';
import type { BadgeProps } from '@/components/ui/primitives';
import { fullName, clockTime } from '@/utils';
import { CalendarDays } from 'lucide-react';

const STATUS_TONE: Record<Appointment['status'], BadgeProps['tone']> = {
  confirmed: 'brand',
  showed:    'good',
  no_show:   'bad',
  cancelled: 'neutral',
};

const STATUS_LABEL: Record<Appointment['status'], string> = {
  confirmed: 'Confirmed',
  showed:    'Showed',
  no_show:   'No-show',
  cancelled: 'Cancelled',
};

interface Props {
  appointments: Appointment[];
  calendars: Calendar[];
  contacts: Contact[];
  onSelectAppt: (a: Appointment) => void;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function AgendaView({ appointments, calendars, contacts, onSelectAppt }: Props) {
  // Sort by startTime ascending
  const sorted = [...appointments].sort(
    (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
  );

  // Group by day key "YYYY-MM-DD"
  const groups: { key: string; label: string; appts: Appointment[] }[] = [];
  const seenKeys = new Set<string>();

  sorted.forEach((a) => {
    const d = new Date(a.startTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      groups.push({ key, label: dayLabel(a.startTime), appts: [] });
    }
    groups[groups.length - 1].appts.push(a);
  });

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={32} />}
        title="No appointments"
        body="No appointments match the current filter."
        className="py-20"
      />
    );
  }

  return (
    <div className="divide-y divide-line" data-tour="calendars.agenda">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Day header */}
          <div className="sticky top-0 z-10 bg-surface-sunken px-4 py-2">
            <p className="text-xs font-bold text-ink">{group.label}</p>
          </div>

          {/* Appointments */}
          {group.appts.map((a) => {
            const cal = calendars.find((c) => c.id === a.calendarId);
            const contact = contacts.find((c) => c.id === a.contactId);

            return (
              <button
                key={a.id}
                onClick={() => onSelectAppt(a)}
                className="flex w-full items-start gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-sunken focus:outline-none"
                aria-label={a.title}
              >
                {/* Time column */}
                <div className="w-20 shrink-0 text-right">
                  <p className="text-xs font-semibold text-ink">
                    {clockTime(a.startTime)}
                  </p>
                  <p className="text-[10px] text-ink-subtle">
                    {clockTime(a.endTime)}
                  </p>
                </div>

                {/* Color bar */}
                <div
                  className="mt-0.5 h-full w-0.5 self-stretch rounded-full"
                  style={{ background: cal?.color ?? '#1f6feb' }}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {a.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {cal && (
                      <span
                        className="text-xs"
                        style={{ color: cal.color }}
                      >
                        {cal.name}
                      </span>
                    )}
                    {a.location && (
                      <span className="text-xs text-ink-subtle">{a.location}</span>
                    )}
                  </div>
                </div>

                {/* Contact avatar + status */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {contact && (
                    <Avatar name={fullName(contact)} size="xs" />
                  )}
                  <Badge tone={STATUS_TONE[a.status]}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
