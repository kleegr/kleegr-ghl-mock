import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/primitives';
import { Toggle } from './Toggle';

/** Settings -> Notifications. */
export function NotificationsSection() {
  const pushToast = useStore((s) => s.pushToast);
  const [toggles, setToggles] = useState({
    new_lead_email: true,
    new_lead_sms: true,
    missed_call_sms: true,
    appointment_reminder: true,
    review_received: false,
    payment_received: true,
    weekly_report: false,
    marketing_updates: false,
  });
  function flip(k: keyof typeof toggles) {
    setToggles((p) => ({ ...p, [k]: !p[k] }));
    pushToast({ title: 'Setting saved (session only)', variant: 'success' });
  }
  const rows: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: 'new_lead_email', label: 'New lead - email', desc: 'Email me when a new lead comes in.' },
    { key: 'new_lead_sms', label: 'New lead - SMS', desc: 'Text me when a new lead comes in.' },
    { key: 'missed_call_sms', label: 'Missed call - SMS', desc: 'Text me on every missed call.' },
    { key: 'appointment_reminder', label: 'Appointment reminders', desc: 'Daily digest of upcoming appointments.' },
    { key: 'review_received', label: 'New review', desc: 'Notify me when a new review comes in.' },
    { key: 'payment_received', label: 'Payment received', desc: 'Notify me when an invoice is paid.' },
    { key: 'weekly_report', label: 'Weekly performance report', desc: 'Receive a summary every Monday.' },
    { key: 'marketing_updates', label: 'Product tips', desc: 'Occasional product tips and best practices.' },
  ];
  return (
    <div data-tour="settings.toggles">
      <p className="mb-4 text-sm font-bold text-ink">Notifications</p>
      <Card>
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{row.label}</p>
              <p className="text-xs text-ink-muted">{row.desc}</p>
            </div>
            <Toggle checked={toggles[row.key]} onChange={() => flip(row.key)} />
          </div>
        ))}
      </Card>
    </div>
  );
}
