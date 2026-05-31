/**
 * Productivity — combined ticketing + project/task workspace for the Kleegr
 * demo portal. Adapts the *feel* of two Kleegr repos (Ticketing for support
 * workflow, Meridian for project/task management) into a single module that
 * lives entirely on local demo state — no backend, no network, no auth.
 *
 * One `/productivity` route hosts eight internal tabs. Tab selection is local
 * `useState` (not sub-routes) so switching tabs is instant and the shared
 * in-memory data (held in `ProductivityProvider`) survives tab changes.
 * Navigating away from the route unmounts the provider, which resets the demo
 * back to its seed — intentional, reset-friendly behaviour.
 */
import { useMemo, useState } from 'react';
import { PageHeader, Tabs } from '@/components/ui/primitives';
import type { TabItem } from '@/components/ui/primitives';
import { ProductivityProvider, useProductivity } from './state';
import { ProductivityOverview } from './components/ProductivityOverview';
import { TicketsView } from './components/TicketsView';
import { TasksView } from './components/TasksView';
import { ProjectList } from './components/ProjectList';
import { ProductivityCalendar } from './components/ProductivityCalendar';
import { TimelineView } from './components/TimelineView';
import { DocsView } from './components/DocsView';
import { ProductivitySettings } from './components/ProductivitySettings';

type TabId =
  | 'overview'
  | 'tickets'
  | 'tasks'
  | 'projects'
  | 'calendar'
  | 'timeline'
  | 'docs'
  | 'settings';

/**
 * Inner workspace — rendered inside the provider so the tab bar can show live
 * counts (active tickets, open tasks, projects) pulled from demo state.
 */
function ProductivityWorkspace() {
  const { tickets, tasks, projects } = useProductivity();
  const [active, setActive] = useState<TabId>('overview');

  // Live badge counts: "things that still need attention" rather than raw totals.
  const activeTickets = useMemo(
    () => tickets.filter((t) => t.stage !== 'resolved' && t.stage !== 'closed').length,
    [tickets],
  );
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks]);

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tickets', label: 'Tickets', count: activeTickets },
    { id: 'tasks', label: 'Tasks', count: openTasks },
    { id: 'projects', label: 'Projects', count: projects.length },
    { id: 'calendar', label: 'Calendar' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'docs', label: 'Docs' },
    { id: 'settings', label: 'Settings' },
  ];

  // Clicking a task referenced from a ticket or project jumps to the Tasks tab
  // (the ticket/project drawer unmounts with its tab — a clean demo handoff).
  const goToTasks = () => setActive('tasks');

  function renderActive() {
    switch (active) {
      case 'overview':
        return <ProductivityOverview onNavigate={(t) => setActive(t as TabId)} />;
      case 'tickets':
        return <TicketsView onOpenTask={goToTasks} />;
      case 'tasks':
        return <TasksView />;
      case 'projects':
        return <ProjectList onOpenTask={goToTasks} />;
      case 'calendar':
        return <ProductivityCalendar />;
      case 'timeline':
        return <TimelineView />;
      case 'docs':
        return <DocsView />;
      case 'settings':
        return <ProductivitySettings />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-full flex-col" data-tour="productivity">
      <PageHeader
        title="Productivity"
        subtitle="Tickets, tasks, projects, timeline, and docs — one combined workspace"
      />

      {/* Tab bar — the underline variant supplies its own hairline divider. */}
      <div className="shrink-0 bg-surface px-5 pt-1">
        <Tabs tabs={tabs} active={active} onChange={(id) => setActive(id as TabId)} />
      </div>

      {/* Active tab. Views are height-filling and manage their own scrolling, so
          this region is a padded, height-constrained flex child. */}
      <div className="min-h-0 flex-1 p-5">{renderActive()}</div>
    </div>
  );
}

export function Productivity() {
  return (
    <ProductivityProvider>
      <ProductivityWorkspace />
    </ProductivityProvider>
  );
}
