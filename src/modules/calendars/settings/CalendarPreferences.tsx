/**
 * Calendar Settings → Preferences.
 *
 * General booking preferences — week start, language, time format, default
 * calendar, and booking/confirmation behavior. All controls are local state.
 */
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';
import { Field, Select, Switch, SettingRow } from '../components/controls';
import { CALENDAR_CATALOG } from '../data';

const WEEK_STARTS = [
  { v: 'sun', l: 'Sunday' },
  { v: 'mon', l: 'Monday' },
  { v: 'sat', l: 'Saturday' },
];
const LANGUAGES = ['English (US)', 'English (UK)', 'Español', 'Français', 'Deutsch'];
const TIME_FORMATS = [
  { v: '12h', l: '12-hour (1:30 PM)' },
  { v: '24h', l: '24-hour (13:30)' },
];

export function CalendarPreferences() {
  const pushToast = useStore((s) => s.pushToast);

  const [weekStart, setWeekStart] = useState('sun');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [timeFormat, setTimeFormat] = useState('12h');
  const [defaultCal, setDefaultCal] = useState(CALENDAR_CATALOG[0]?.id ?? '');

  const [serviceMenu, setServiceMenu] = useState(true);
  const [allowReschedule, setAllowReschedule] = useState(true);
  const [allowCancel, setAllowCancel] = useState(true);
  const [requireConfirm, setRequireConfirm] = useState(false);
  const [sendReminders, setSendReminders] = useState(true);
  const [addToContactTimeline, setAddToContactTimeline] = useState(true);
  const [lookBusy, setLookBusy] = useState(false);

  return (
    <div className="space-y-5" data-tour="calendars.preferences">
      {/* General */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">General</h3>
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Week starts on">
              <Select value={weekStart} onChange={(e) => setWeekStart(e.target.value)}>
                {WEEK_STARTS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Time format">
              <Select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}>
                {TIME_FORMATS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Language">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Default calendar">
              <Select value={defaultCal} onChange={(e) => setDefaultCal(e.target.value)}>
                {CALENDAR_CATALOG.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      {/* Booking widget */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Booking widget</h3>
        <Card className="px-4 py-1">
          <SettingRow
            title="Show service menu"
            description="Let invitees choose from your published calendars on one page."
          >
            <Switch checked={serviceMenu} onChange={setServiceMenu} label="Show service menu" />
          </SettingRow>
          <SettingRow
            title="Look busy"
            description="Hide a percentage of open slots so your calendar looks in demand."
          >
            <Switch checked={lookBusy} onChange={setLookBusy} label="Look busy" />
          </SettingRow>
          <SettingRow
            title="Add bookings to contact timeline"
            description="Log every booking as an activity on the contact record."
          >
            <Switch checked={addToContactTimeline} onChange={setAddToContactTimeline} label="Timeline" />
          </SettingRow>
        </Card>
      </div>

      {/* Confirmation & changes */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Confirmation &amp; changes</h3>
        <Card className="px-4 py-1">
          <SettingRow
            title="Require confirmation"
            description="New bookings stay pending until you confirm them."
          >
            <Switch checked={requireConfirm} onChange={setRequireConfirm} label="Require confirmation" />
          </SettingRow>
          <SettingRow
            title="Send reminders"
            description="Email and SMS reminders before the appointment."
          >
            <Switch checked={sendReminders} onChange={setSendReminders} label="Send reminders" />
          </SettingRow>
          <SettingRow
            title="Allow rescheduling"
            description="Invitees can reschedule from the confirmation page."
          >
            <Switch checked={allowReschedule} onChange={setAllowReschedule} label="Allow rescheduling" />
          </SettingRow>
          <SettingRow
            title="Allow cancellation"
            description="Invitees can cancel from the confirmation page."
          >
            <Switch checked={allowCancel} onChange={setAllowCancel} label="Allow cancellation" />
          </SettingRow>
        </Card>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button
          onClick={() =>
            pushToast({
              title: 'Preferences saved',
              description: 'Calendar preferences updated for this session (demo).',
              variant: 'success',
            })
          }
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}
