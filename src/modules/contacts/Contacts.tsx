/**
 * TODO(Wave1): Full Contacts / CRM build — Smart Lists table (150–300 contacts),
 * contact detail drawer with tabs (Activity, Conversations, Tasks, Appointments,
 * Notes, Opportunities, Documents, Custom Fields), add/edit/tag/import modals.
 * See plan §7.3 and Phase 1 in §22.
 */
import { Users } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Contacts() {
  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="CRM — Smart Lists, contact profiles, tags, and activity"
      />
      <EmptyState
        icon={<Users size={32} />}
        title="Contacts — coming in Wave 1"
        body="Full build: sortable/filterable contact table, Smart List tabs, contact drawer with full activity timeline, add/edit modals."
      />
    </div>
  );
}
