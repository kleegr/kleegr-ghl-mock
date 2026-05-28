/**
 * TODO(Wave1): Full Dashboard build — KPI stat cards, pipeline value chart,
 * lead-source breakdown, activity feed, tasks-due card, onboarding checklist.
 * See plan §7.1 and Phase 1 in §22.
 */
import { LayoutDashboard } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Business overview — KPIs, pipeline value, recent activity"
      />
      <EmptyState
        icon={<LayoutDashboard size={32} />}
        title="Dashboard — coming in Wave 1"
        body="Full build: stat cards, charts, activity feed, pipeline value widget, and onboarding checklist."
      />
    </div>
  );
}
