/**
 * BookModal — form to book a new appointment.
 * Calls the store's bookAppointment() action on submit.
 */
import { useState, useEffect } from 'react';
import type { Calendar, Contact, Appointment } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { fullName } from '@/utils';
import { toDateInputValue, combineDatetime, addThirtyMin } from '../utils';

type BookInput = Pick<
  Appointment,
  'calendarId' | 'contactId' | 'title' | 'startTime' | 'endTime' | 'location'
>;

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;  // "YYYY-MM-DD"
  calendars: Calendar[];
  contacts: Contact[];
  onBook: (input: BookInput) => void;
}

export function BookModal({ open, onClose, defaultDate, calendars, contacts, onBook }: Props) {
  const today = toDateInputValue(new Date());

  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? '');
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [location, setLocation] = useState('');
  const [autoTitle, setAutoTitle] = useState(true);

  // Auto-populate title from calendar + contact when both are selected
  useEffect(() => {
    if (!autoTitle) return;
    const cal = calendars.find((c) => c.id === calendarId);
    const contact = contacts.find((c) => c.id === contactId);
    if (cal && contact) {
      setTitle(`${cal.name} — ${fullName(contact)}`);
    }
  }, [calendarId, contactId, calendars, contacts, autoTitle]);

  // Reset when defaultDate changes
  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
  }, [defaultDate]);

  // Auto-derive end time when start time changes
  useEffect(() => {
    setEndTime(addThirtyMin(date, startTime));
  }, [startTime, date]);

  const handleSubmit = () => {
    if (!calendarId || !contactId || !title.trim() || !date || !startTime || !endTime) return;
    onBook({
      calendarId,
      contactId,
      title: title.trim(),
      startTime: combineDatetime(date, startTime),
      endTime: combineDatetime(date, endTime),
      location: location.trim() || undefined,
    });
    onClose();
  };

  const inputClass =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40';
  const labelClass = 'mb-1 block text-xs font-semibold text-ink-muted';

  return (
    <div data-tour="calendars.bookModal">
      <Modal
        open={open}
        onClose={onClose}
        title="Book Appointment"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!calendarId || !contactId || !title.trim() || !date}
              data-tour="calendars.bookSubmit"
            >
              Book Appointment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Calendar */}
          <div>
            <label className={labelClass}>Calendar</label>
            <select
              className={inputClass}
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact */}
          <div>
            <label className={labelClass}>Contact</label>
            <select
              className={inputClass}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setAutoTitle(false);
              }}
              placeholder="Appointment title"
            />
          </div>

          {/* Date + times row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className={labelClass}>Date</label>
              <input
                className={inputClass}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Start time</label>
              <input
                className={inputClass}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>End time</label>
              <input
                className={inputClass}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location (optional)</label>
            <input
              className={inputClass}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office / Zoom link"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
