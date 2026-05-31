/**
 * AppointmentDetail — modal showing all fields for a single appointment, with
 * working Cancel, Reschedule and status-change actions.
 *
 * The component is presentational: all mutations are lifted to the Calendars
 * container via callbacks, so a change here is reflected across the grid,
 * agenda and appointment list (session-only local state — no store writes).
 */
import React, { useEffect, useState } from 'react';
import {
  MapPin, Video, Calendar as CalIcon, User, Clock, CalendarClock,
  CheckCircle2, XCircle, Ban, RotateCcw, Undo2,
} from 'lucide-react';
import type { Appointment, Calendar, Contact } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge, Button } from '@/components/ui/primitives';
import { cx, dateLabel, clockTime, fullName } from '@/utils';
import { STATUS_TONE, STATUS_LABEL, STATUS_OPTIONS } from '../utils';
import { combineDatetime, toDateInputValue } from '../utils';

const STATUS_ICON: Record<Appointment['status'], React.ReactNode> = {
  confirmed: <CalendarClock size={13} />,
  showed: <CheckCircle2 size={13} />,
  no_show: <XCircle size={13} />,
  cancelled: <Ban size={13} />,
};

function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '09:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  appt: Appointment;
  calendars: Calendar[];
  contacts: Contact[];
  onStatusChange: (id: string, status: Appointment['status']) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string, startISO: string, endISO: string) => void;
}

export function AppointmentDetail({
  open,
  onClose,
  appt,
  calendars,
  contacts,
  onStatusChange,
  onCancel,
  onReschedule,
}: Props) {
  const cal = calendars.find((c) => c.id === appt.calendarId);
  const contact = contacts.find((c) => c.id === appt.contactId);
  const cancelled = appt.status === 'cancelled';

  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState(() => toDateInputValue(new Date(appt.startTime)));
  const [start, setStart] = useState(() => toTimeInputValue(appt.startTime));
  const [end, setEnd] = useState(() => toTimeInputValue(appt.endTime));

  // Re-sync the reschedule form whenever a different appointment is opened.
  useEffect(() => {
    setRescheduling(false);
    setDate(toDateInputValue(new Date(appt.startTime)));
    setStart(toTimeInputValue(appt.startTime));
    setEnd(toTimeInputValue(appt.endTime));
  }, [appt.id, appt.startTime, appt.endTime]);

  const applyReschedule = () => {
    const startISO = combineDatetime(date, start);
    let endISO = combineDatetime(date, end);
    if (+new Date(endISO) <= +new Date(startISO)) {
      // keep the original duration if the end is not after the start
      const dur = +new Date(appt.endTime) - +new Date(appt.startTime);
      endISO = new Date(+new Date(startISO) + Math.max(dur, 15 * 60_000)).toISOString();
    }
    onReschedule(appt.id, startISO, endISO);
    setRescheduling(false);
  };

  return (
    <div data-tour="calendars.appointmentDetail">
      <Modal
        open={open}
        onClose={onClose}
        title="Appointment Details"
        size="md"
        footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
      >
        {/* Calendar + status row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {cal && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: `${cal.color}22`, color: cal.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: cal.color }} />
              {cal.name}
            </span>
          )}
          <Badge tone={STATUS_TONE[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
        </div>

        {/* Title */}
        <h3 className={cx('mb-4 text-base font-bold text-ink', cancelled && 'line-through')}>
          {appt.title}
        </h3>

        {/* Detail rows */}
        <dl className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CalIcon size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Date</dt>
              <dd className="text-ink">{dateLabel(appt.startTime)}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Time</dt>
              <dd className="text-ink">{clockTime(appt.startTime)} – {clockTime(appt.endTime)}</dd>
            </div>
          </div>

          {contact && (
            <div className="flex items-start gap-3">
              <User size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Contact</dt>
                <dd className="text-ink">{fullName(contact)}</dd>
                <dd className="text-xs text-ink-muted">{contact.email}</dd>
              </div>
            </div>
          )}

          {appt.location && (
            <div className="flex items-start gap-3">
              {appt.location.toLowerCase().includes('zoom') || appt.location.toLowerCase().includes('meet') ? (
                <Video size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
              ) : (
                <MapPin size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Location</dt>
                <dd className="text-ink">{appt.location}</dd>
              </div>
            </div>
          )}

          {appt.notes ? (
            <div className="rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
              {appt.notes}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-ink-subtle">
              No notes for this appointment.
            </div>
          )}
        </dl>

        {/* Status control */}
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(appt.id, s)}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  appt.status === s
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
                )}
              >
                {STATUS_ICON[s]}
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Reschedule */}
        {rescheduling ? (
          <div className="mt-4 rounded-xl border border-line p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Reschedule</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-3 sm:col-span-1">
                <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Start</span>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-semibold text-ink-muted">End</span>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRescheduling(false)}>Cancel</Button>
              <Button size="sm" onClick={applyReschedule}>Apply new time</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRescheduling(true)}>
              <RotateCcw size={14} /> Reschedule
            </Button>
            {cancelled ? (
              <Button variant="secondary" size="sm" onClick={() => onStatusChange(appt.id, 'confirmed')}>
                <Undo2 size={14} /> Restore appointment
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={() => onCancel(appt.id)}>
                <Ban size={14} /> Cancel appointment
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
