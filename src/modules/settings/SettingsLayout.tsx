import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Calendar, Phone, Sliders, Tag,
  GitBranch, Code2, Bell, Plug,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/primitives';
import { cx } from '@/utils';
import {
  BusinessProfile, StaffSection, CalendarsSection, PhoneSection,
  CustomFieldsSection, TagsSection, PipelinesSection, CustomValuesSection,
  NotificationsSection, IntegrationsSection,
} from './sections';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * The Settings shell: a docked section nav + the active section's content.
 *
 * Sections live in ./sections/* - one file each - so future developers can own
 * an area (Phone System, Custom Fields, Pipelines, etc.) without colliding in a
 * single giant file. Adding a section = add a file, an entry to NAV_ITEMS, and a
 * case to SectionContent.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'business', label: 'Business Profile', icon: <Building2 size={15} /> },
  { id: 'staff', label: 'Staff', icon: <Users size={15} /> },
  { id: 'calendars', label: 'Calendars', icon: <Calendar size={15} /> },
  { id: 'phones', label: 'Phone Numbers', icon: <Phone size={15} /> },
  { id: 'custom-fields', label: 'Custom Fields', icon: <Sliders size={15} /> },
  { id: 'tags', label: 'Tags', icon: <Tag size={15} /> },
  { id: 'pipelines', label: 'Pipelines', icon: <GitBranch size={15} /> },
  { id: 'custom-values', label: 'Custom Values', icon: <Code2 size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={15} /> },
];

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
  const navigate = useNavigate();
  const activeSection = params.section ?? 'business';

  return (
    <div data-tour="settings.page">
      <PageHeader
        title="Settings"
        subtitle="Account configuration - profile, staff, fields, pipelines, and more"
      />

      <div className="flex min-h-0 flex-col gap-0 lg:flex-row">
        {/* Settings nav */}
        <nav
          className="shrink-0 border-b border-line bg-surface-sunken lg:w-52 lg:border-b-0 lg:border-r"
          data-tour="settings.nav"
        >
          <div className="flex flex-wrap gap-0 lg:flex-col lg:py-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/settings/${item.id}`)}
                className={cx(
                  'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                  activeSection === item.id
                    ? 'bg-brand-soft font-semibold text-brand'
                    : 'text-ink-muted hover:bg-surface hover:text-ink',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content area */}
        <div className="min-w-0 flex-1 px-5 py-5 pb-10">
          <SectionContent section={activeSection} />
        </div>
      </div>
    </div>
  );
}
