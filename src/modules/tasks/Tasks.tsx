/**
 * TODO(Wave2): Full Tasks build — task list (My Tasks / All, 30–50 tasks),
 * due-date grouping, complete/uncomplete toggle, priority badges, add/edit modal,
 * contact linkage.
 * See plan §7.12 and Phase 2 in §22.
 */
import { CheckSquare } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Tasks() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="My tasks and team tasks — due dates, priorities, and contacts"
      />
      <EmptyState
        icon={<CheckSquare size={32} />}
        title="Tasks — coming in Wave 2"
        body="Full build: task list grouped by due date, complete/uncomplete actions, priority badges, add/edit modal linked to contacts."
      />
    </div>
  );
}
