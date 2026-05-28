/**
 * TODO(Wave3): Full Guides / Tutorial Mode build — tutorial launcher listing
 * all 10 required tutorials grouped by area (each with title, description, est.
 * time, completion state), onboarding checklist, and entry point for the
 * Tutorial Engine (TutorialProvider + overlay/spotlight/coachmark).
 * See plan §9, §18, and Phase 3 in §22.
 */
import { GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Guides() {
  return (
    <div>
      <PageHeader
        title="Guides"
        subtitle="Tutorial Mode — step-by-step walkthroughs for every core task"
      />
      <EmptyState
        icon={<GraduationCap size={32} />}
        title="Tutorial Mode — coming in Wave 3"
        body="Full build: 10 guided tutorials with spotlight overlays, coachmarks, step progress, and completion screens (Arcade-style)."
      />
    </div>
  );
}
