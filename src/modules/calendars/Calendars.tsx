/**
 * TODO(Wave1): Full Calendars & Appointments build — month/week/day/agenda views,
 * multiple calendars, book/reschedule/cancel appointment flows, color-coded events,
 * appointment detail modal.
 * See plan §7.5 and Phase 1 in §22.
 */
import { Calendar } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Calendars() {
  return (
    <div>
      <PageHeader
        title="Calendars"
        subtitle="Appointment scheduling — month, week, day, and agenda views"
      />
      <EmptyState
        icon={<Calendar size={32} />}
        title="Calendars — coming in Wave 1"
        body="Full build: calendar grid with 30–60 seeded appointments, booking modal, reschedule/cancel, per-calendar color coding."
      />
    </div>
  );
}
