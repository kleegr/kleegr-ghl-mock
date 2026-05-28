/**
 * AppointmentDetail — modal showing all fields for a single appointment.
 * Read-only in V1; action buttons are cosmetic.
 */
import { MapPin, Video, Calendar as CalIcon, User, Clock } from 'lucide-react';
import type { Appointment, Calendar, Contact } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/primitives';
import type { BadgeProps } from '@/components/ui/primitives';
import { dateLabel, clockTime, fullName } from '@/utils';

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
  open: boolean;
  onClose: () => void;
  appt: Appointment;
  calendars: Calendar[];
  contacts: Contact[];
}

export function AppointmentDetail({ open, onClose, appt, calendars, contacts }: Props) {
  const cal = calendars.find((c) => c.id === appt.calendarId);
  const contact = contacts.find((c) => c.id === appt.contactId);

  return (
    <div data-tour="calendars.appointmentDetail">
      <Modal open={open} onClose={onClose} title="Appointment Details" size="md">
        {/* Calendar + status row */}
        <div className="mb-4 flex items-center gap-3">
          {cal && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: `${cal.color}22`, color: cal.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: cal.color }}
              />
              {cal.name}
            </span>
          )}
          <Badge tone={STATUS_TONE[appt.status]}>
            {STATUS_LABEL[appt.status]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="mb-4 text-base font-bold text-ink">{appt.title}</h3>

        {/* Detail rows */}
        <dl className="space-y-3 text-sm">
          {/* Date & time */}
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
              <dd className="text-ink">
                {clockTime(appt.startTime)} – {clockTime(appt.endTime)}
              </dd>
            </div>
          </div>

          {/* Contact */}
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

          {/* Location */}
          {appt.location && (
            <div className="flex items-start gap-3">
              {appt.location.toLowerCase().includes('zoom') ? (
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

          {/* Notes */}
          {appt.notes && (
            <div className="rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
              {appt.notes}
            </div>
          )}
        </dl>

        {/* Cosmetic actions */}
        <div className="mt-5 flex gap-2 border-t border-line pt-4">
          <button
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken"
            onClick={onClose}
          >
            Reschedule
          </button>
          <button
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken"
            onClick={onClose}
          >
            Cancel appointment
          </button>
        </div>
      </Modal>
    </div>
  );
}
