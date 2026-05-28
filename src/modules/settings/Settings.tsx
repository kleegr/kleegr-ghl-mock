/**
 * TODO(Wave2): Full Settings build — hub with sections for Business Profile,
 * My Staff, Calendars config, Phone numbers, Custom Fields, Tags, Pipelines
 * config, Integrations, Domains, Conversation AI/Bots (mock), Custom Values,
 * Notifications. Accepts optional :section param from router.
 * See plan §7.17 and Phase 2 in §22.
 */
import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Settings() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Account configuration — profile, staff, fields, pipelines, and more"
      />
      <EmptyState
        icon={<SettingsIcon size={32} />}
        title="Settings — coming in Wave 2"
        body="Full build: settings hub with Business Profile, My Staff, Custom Fields, Tags, Pipelines config, and Notifications sections."
      />
    </div>
  );
}
