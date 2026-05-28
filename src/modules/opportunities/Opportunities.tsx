/**
 * TODO(Wave1): Full Opportunities / Pipelines build — Kanban board with
 * drag-and-drop stage moves, 3–4 pipelines, list view toggle, add/edit
 * opportunity modal, won/lost confirm, stage totals.
 * See plan §7.4 and Phase 1 in §22.
 */
import { Filter } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Opportunities() {
  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Pipeline board — track and move deals through stages"
      />
      <EmptyState
        icon={<Filter size={32} />}
        title="Opportunities — coming in Wave 1"
        body="Full build: draggable Kanban board, 3–4 pipelines, stage column totals, list view, won/lost flows."
      />
    </div>
  );
}
