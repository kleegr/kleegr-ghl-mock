/**
 * Settings → Calendars.
 *
 * Surfaces the full Calendar Settings hub (calendar list, preferences,
 * availability and connections) inside the account Settings shell. The hub
 * manages its own session-only catalog here, mirroring the Calendars module's
 * own Settings tab. Rendered in `embedded` mode so it sits cleanly under the
 * SettingsLayout page header without doubling padding.
 */
import { CalendarSettings } from '@/modules/calendars/settings/CalendarSettings';

/** Settings -> Calendars. */
export function CalendarsSection() {
  return (
    <div data-tour="settings.configSection">
      <CalendarSettings embedded />
    </div>
  );
}
