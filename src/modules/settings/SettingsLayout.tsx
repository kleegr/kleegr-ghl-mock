import { useParams } from 'react-router-dom';
import {
  BusinessProfile, StaffSection, CalendarsSection, PhoneSection,
  CustomFieldsSection, TagsSection, PipelinesSection, CustomValuesSection,
  NotificationsSection, IntegrationsSection,
} from './sections';

/**
 * The Settings content host.
 *
 * Navigation now lives in the dedicated settings rail (see SettingsSidebar,
 * rendered by AppShell for /settings routes) so Settings reads as its own area
 * with a left menu + "Back to Dashboard", matching the real GoHighLevel portal.
 * This component just renders the active section's content.
 *
 * Sections live in ./sections/* — one file each — so future developers can own
 * an area (Phone System, Custom Fields, Pipelines, etc.) without colliding in a
 * single giant file. Adding a section = add a file, an entry to SETTINGS_GROUPS
 * (in SettingsSidebar), and a case below.
 */
function SectionContent({ section }: { section: string }) {
  switch (section) {
    case 'business':      return <BusinessProfile />;
    case 'staff':         return <StaffSection />;
    case 'calendars':     return <CalendarsSection />;
    case 'phones':        return <PhoneSection />;
    case 'custom-fields': return <CustomFieldsSection />;
    case 'tags':          return <TagsSection />;
    case 'pipelines':     return <PipelinesSection />;
    case 'custom-values': return <CustomValuesSection />;
    case 'notifications': return <NotificationsSection />;
    case 'integrations':  return <IntegrationsSection />;
    default:              return <BusinessProfile />;
  }
}

export function SettingsLayout() {
  const params = useParams<{ section?: string }>();
  const activeSection = params.section ?? 'business';

  return (
    <div data-tour="settings.page" className="min-h-[calc(100vh-50px)] min-w-0 bg-[#f4f5f7] px-5 py-5 pb-10">
      <SectionContent section={activeSection} />
    </div>
  );
}
