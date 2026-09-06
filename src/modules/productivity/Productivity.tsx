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
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, Grid3X3, LayoutDashboard, Menu, MoreHorizontal, Plus, Settings2, Sparkles, TicketCheck, Zap } from 'lucide-react';
import { Button, Tabs } from '@/components/ui/primitives';
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
  const location = useLocation();
  const initialTab: TabId = location.pathname === '/tickets' ? 'tickets' : 'overview';
  const [active, setActive] = useState<TabId>(initialTab);

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

  if (location.pathname === '/tickets') {
    return (
      <div className="flex h-full min-h-0 bg-[#f4f5f7]" data-tour="productivity">
        <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-3">
          <button aria-label="New ticket" className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white"><Plus size={17}/></button>
          <button aria-label="Tickets" className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><TicketCheck size={17}/></button>
          <button aria-label="Ticket dashboard" className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken"><LayoutDashboard size={17}/></button>
          <button aria-label="Ticket settings" className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken"><Settings2 size={17}/></button>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line bg-surface px-4">
            <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#163c79] text-white"><TicketCheck size={16}/></span><span className="text-sm font-semibold text-ink">Kleegr Tickets</span></div>
            <div className="flex items-center gap-2"><div className="inline-flex rounded-lg border border-line bg-surface p-0.5"><span className="rounded-md bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-ink">Board</span><span className="px-3 py-1.5 text-xs text-ink-muted">List</span><span className="px-3 py-1.5 text-xs text-ink-muted">Workspace</span></div><button aria-label="More ticket actions" className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted"><MoreHorizontal size={17}/></button></div>
          </div>
          <div className="min-h-0 flex-1 p-4"><TicketsView compact onOpenTask={goToTasks}/></div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-tour="productivity">
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#163c79] text-white shadow-sm"><Zap size={18} fill="currentColor"/></span>
          <span className="text-base font-semibold text-[#163c79]">Productivity</span>
          <button aria-label="Open apps" className="ml-3 grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken"><Grid3X3 size={17}/></button>
          <span className="h-6 w-px bg-line"/>
          <span className="text-sm font-medium text-ink">Kleegr Project Management</span>
        </div>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">DEMO WORKSPACE</span>
      </div>

      <div className="flex min-h-[50px] shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button aria-label="Workspace menu" className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-ink-muted"><Menu size={16}/></button>
          <div className="min-w-0 overflow-x-auto"><Tabs tabs={tabs} active={active} onChange={(id) => setActive(id as TabId)} /></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button aria-label="Notifications" className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken"><Bell size={16}/></button>
          <div className="inline-flex">
            <Button size="sm" className="rounded-r-none"><Plus size={14}/> Create</Button>
            <Button size="sm" className="rounded-none border-x border-white/25 px-2" aria-label="Create with AI"><Sparkles size={14}/></Button>
            <Button size="sm" className="rounded-l-none px-2" aria-label="More create options"><ChevronDown size={14}/></Button>
          </div>
          <button aria-label="More options" className="grid h-8 w-8 place-items-center rounded-md text-ink-muted"><MoreHorizontal size={17}/></button>
        </div>
      </div>

      {/* Active tab. Views are height-filling and manage their own scrolling, so
          this region is a padded, height-constrained flex child. */}
      <div className="min-h-0 flex-1 bg-[#f4f5f7] p-5">{renderActive()}</div>
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
