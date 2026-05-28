/**
 * TODO(Wave2): Full Automations / Workflows build — workflow list (8–15 workflows),
 * flow canvas with trigger + action nodes, node settings drawer, published/draft
 * toggle, enrollment counts, execution log table.
 * See plan §7.6 and Phase 2 in §22.
 */
import { Workflow } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Automations() {
  return (
    <div>
      <PageHeader
        title="Automations"
        subtitle="Workflows — triggers, actions, and automated follow-up sequences"
      />
      <EmptyState
        icon={<Workflow size={32} />}
        title="Automations — coming in Wave 2"
        body="Full build: workflow list, visual flow canvas with draggable nodes, node config drawer, enrollment and execution log tabs."
      />
    </div>
  );
}
