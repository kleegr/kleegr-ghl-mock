/**
 * Launchpad setup guide. The live Kleegr screen is intentionally spacious and
 * task-led; this demo keeps that structure while using fictional setup state.
 */
import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Globe2,
  MessageCircle,
  Play,
  Send,
  Settings2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

type SetupTask = {
  id: string;
  title: string;
  description: string;
  action: string;
  tutorial: string;
};

type SetupCategory = {
  id: string;
  label: string;
  Icon: LucideIcon;
  tasks: SetupTask[];
};

const CATEGORIES: SetupCategory[] = [
  {
    id: 'foundation',
    label: 'Foundational setup',
    Icon: Settings2,
    tasks: [
      { id: 'business-profile', title: 'Complete your business profile', description: 'Add the details customers see across messages, invoices, calendars, and pages.', action: 'Open Business Profile', tutorial: 'Complete Your Business Profile' },
      { id: 'team', title: 'Invite your team and assign roles', description: 'Give each teammate the right workspace access and notification preferences.', action: 'Manage Team', tutorial: 'Invite Your Team' },
      { id: 'calendar', title: 'Connect your primary calendar', description: 'Keep availability and appointments synchronized from the start.', action: 'Set Up Calendar', tutorial: 'Connect a Calendar' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & lead generation',
    Icon: Send,
    tasks: [
      { id: 'social', title: 'Manage all your social media posts in one place', description: 'Set up the social planner to schedule and manage all your social media posts. Maintain a consistent presence across platforms like Facebook, Instagram, and more.', action: 'Setup Social Planner', tutorial: 'Setup Social Planner' },
      { id: 'form', title: 'Build a lead capture form', description: 'Create a branded form and route every new lead into the right follow-up.', action: 'Create Form', tutorial: 'Create Your First Form' },
      { id: 'reviews', title: 'Start collecting customer reviews', description: 'Send a simple branded review request after a successful customer interaction.', action: 'Set Up Reviews', tutorial: 'Launch Review Requests' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & conversations',
    Icon: MessageCircle,
    tasks: [
      { id: 'pipeline', title: 'Customize your opportunity pipeline', description: 'Map the stages your team uses from new lead through closed customer.', action: 'Edit Pipeline', tutorial: 'Build a Sales Pipeline' },
      { id: 'inbox', title: 'Connect a customer communication channel', description: 'Bring calls, email, text, and social conversations into one shared view.', action: 'View Channels', tutorial: 'Connect Your Inbox' },
      { id: 'workflow', title: 'Publish a lead follow-up workflow', description: 'Use a ready-made automation to follow up quickly and consistently.', action: 'Open Workflows', tutorial: 'Automate Lead Follow-up' },
    ],
  },
  {
    id: 'website',
    label: 'Website & monetization',
    Icon: Globe2,
    tasks: [
      { id: 'domain', title: 'Connect your branded domain', description: 'Use your own web address for pages, forms, calendars, and the client portal.', action: 'Connect Domain', tutorial: 'Connect a Domain' },
      { id: 'funnel', title: 'Publish your first conversion funnel', description: 'Start with a fictional template and customize every step for your offer.', action: 'Create Funnel', tutorial: 'Launch a Funnel' },
      { id: 'payments', title: 'Prepare a payment experience', description: 'Style invoices, products, and checkout pages before sharing them with customers.', action: 'Open Payments', tutorial: 'Create a Checkout' },
    ],
  },
];

const INITIAL_COMPLETED = new Set(['business-profile', 'team', 'pipeline', 'domain']);

function TutorialPreview({ title }: { title: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink">Watch the Tutorial</p>
      <div className="relative h-20 w-40 overflow-hidden rounded-md bg-gradient-to-br from-[#142347] via-[#6f285f] to-[#f48d5d] p-3 text-white shadow-card">
        <Sparkles className="absolute right-2 top-2 text-white/30" size={24} />
        <p className="relative max-w-[115px] text-[10px] font-semibold leading-4">{title}</p>
        <span className="absolute bottom-2 left-3 grid h-6 w-6 place-items-center rounded-full bg-black/75"><Play size={10} fill="currentColor" /></span>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  completed,
  expanded,
  onToggle,
  onExpand,
  onAction,
}: {
  task: SetupTask;
  completed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onAction: () => void;
}) {
  return (
    <article className={cx('rounded-xl border bg-[#f8f9fc] shadow-card transition-colors', expanded ? 'border-[#dfe4ec]' : 'border-[#e6e9ef]')}>
      <div className="flex items-start gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
          className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors', completed ? 'border-brand bg-brand text-white' : 'border-[#dfe3e9] bg-surface text-transparent')}
        >
          <Check size={13} strokeWidth={3} />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onExpand} aria-expanded={expanded}>
          <span className={cx('block text-sm font-semibold', completed ? 'text-ink-muted line-through' : 'text-[#1767bd]')}>{task.title}</span>
          {expanded ? <span className="mt-1 block max-w-3xl text-xs leading-[18px] text-ink-muted">{task.description}</span> : null}
        </button>
        <span className="pt-1 text-xs text-ink-muted">{completed ? '100%' : '0%'}</span>
        <button type="button" onClick={onExpand} className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface" aria-label={expanded ? 'Collapse task' : 'Expand task'}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
      </div>
      {expanded ? (
        <div className="flex flex-wrap items-end justify-between gap-4 px-14 pb-5">
          <TutorialPreview title={task.tutorial} />
          <Button size="sm" onClick={onAction}>{task.action}</Button>
        </div>
      ) : null}
    </article>
  );
}

export function Launchpad() {
  const pushToast = useStore((state) => state.pushToast);
  const [activeCategoryId, setActiveCategoryId] = useState('marketing');
  const [expandedTaskId, setExpandedTaskId] = useState('social');
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(INITIAL_COMPLETED));
  const activeCategory = CATEGORIES.find((category) => category.id === activeCategoryId) ?? CATEGORIES[0];
  const completeCount = activeCategory.tasks.filter((task) => completedIds.has(task.id)).length;
  const progress = Math.round((completeCount / activeCategory.tasks.length) * 100);

  const toggleTask = (taskId: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  return (
    <main className="min-h-full bg-[#f8f9fc] px-8 py-8" data-tour="launchpad.page">
      <div className="grid gap-10 xl:grid-cols-[255px_minmax(0,1fr)]">
        <aside>
          <h1 className="text-[16px] font-semibold text-ink">Setup Guide</h1>
          <nav className="mt-7 space-y-2" aria-label="Setup categories">
            {CATEGORIES.map((category) => {
              const selected = category.id === activeCategory.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => { setActiveCategoryId(category.id); setExpandedTaskId(category.tasks[0].id); }}
                  className={cx('flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors', selected ? 'border border-[#e6e9ef] bg-surface text-[#1767bd] shadow-card' : 'text-ink-muted hover:bg-surface')}
                >
                  <category.Icon size={19} className={selected ? 'text-[#1b7bd7]' : 'text-ink-subtle'} />
                  {category.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 rounded-xl border border-[#dcebf9] bg-[#eef7ff] p-4">
            <CircleDollarSign size={20} className="text-brand" />
            <p className="mt-2 text-xs font-semibold text-ink">Built to help you launch</p>
            <p className="mt-1 text-[11px] leading-4 text-ink-muted">Everything here is fictional demo content and safe to explore.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <p className="text-sm font-medium text-ink">Hey Avery, here&apos;s your personalized setup list with everything you need to get started.</p>
          <div className="mt-8 flex items-center justify-between gap-5">
            <p className="text-xs text-ink-muted">Your {activeCategory.label} Progress.</p>
            <span className="text-xs font-medium text-ink-muted">{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e8ed]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-7 space-y-3" aria-label={`${activeCategory.label} setup tasks`}>
            {activeCategory.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                completed={completedIds.has(task.id)}
                expanded={expandedTaskId === task.id}
                onToggle={() => toggleTask(task.id)}
                onExpand={() => setExpandedTaskId((current) => current === task.id ? '' : task.id)}
                onAction={() => pushToast({ title: task.action, description: 'This setup action stays inside the public demo.', variant: 'info' })}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
