import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Workflow } from '@/types';
import { cx } from '@/utils';
import { WorkflowsList } from './WorkflowsList';
import { AutomationOverview } from './AutomationOverview';
import { WorkflowBuilder } from './WorkflowBuilder';

/* ── module sub-nav ──────────────────────────────────────────── */

type ModuleView = 'workflows' | 'overview';
type ListTab = 'all' | 'review' | 'deleted';

function SubNav({
  view,
  onView,
  onSettings,
}: {
  view: ModuleView;
  onView: (v: ModuleView) => void;
  onSettings: () => void;
}) {
  return (
    <div className="flex items-center gap-8 border-b border-line bg-surface px-6">
      <span className="py-4 font-display text-lg font-bold text-ink">Automation</span>

      <nav className="flex items-end gap-7 self-stretch">
        <button
          onClick={() => onView('workflows')}
          className={cx(
            'relative flex items-center py-4 text-sm font-semibold transition-colors',
            view === 'workflows' ? 'text-brand' : 'text-ink-muted hover:text-ink',
          )}
        >
          Workflows
          {view === 'workflows' && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>

        <button
          onClick={() => onView('overview')}
          className={cx(
            'relative flex items-start gap-1 py-4 text-sm font-semibold transition-colors',
            view === 'overview' ? 'text-brand' : 'text-ink-muted hover:text-ink',
          )}
        >
          Overview
          <span className="rounded bg-banner px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white">Beta</span>
          {view === 'overview' && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      </nav>

      <button
        onClick={onSettings}
        className="ml-2 flex items-center gap-2 py-4 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <Settings size={16} />
        Global Workflow Settings
      </button>
    </div>
  );
}

/* ── main entry ────────────────────────────────────────────── */

export function Automations() {
  const pushToast = useStore((s) => s.pushToast);

  const [view, setView] = useState<ModuleView>('workflows');
  const [listTab, setListTab] = useState<ListTab>('all');
  const [openWf, setOpenWf] = useState<Workflow | null>(null);
  const [blank, setBlank] = useState(false);

  const openWorkflow = (wf: Workflow) => {
    setBlank(false);
    setOpenWf(wf);
  };

  const createBlank = () => {
    setBlank(true);
    setOpenWf({
      id: `new-${Date.now()}`,
      name: 'Untitled Workflow',
      status: 'draft',
      enrolled: 0,
      trigger: '',
    });
  };

  const closeBuilder = () => {
    setOpenWf(null);
    setBlank(false);
  };

  /* full-screen builder takes over the whole module surface */
  if (openWf) {
    return (
      <div className="h-full" data-tour="automations.page">
        <WorkflowBuilder wf={openWf} blank={blank} onBack={closeBuilder} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-tour="automations.page">
      <SubNav
        view={view}
        onView={setView}
        onSettings={() =>
          pushToast({
            title: 'Global Workflow Settings',
            description: 'Settings panel is cosmetic in this demo build.',
            variant: 'info',
          })
        }
      />

      <div className="flex-1 overflow-y-auto">
        {view === 'workflows' ? (
          <WorkflowsList
            tab={listTab}
            onTabChange={setListTab}
            onOpenWorkflow={openWorkflow}
            onCreateBlank={createBlank}
          />
        ) : (
          <AutomationOverview
            onNeedsReview={() => {
              setView('workflows');
              setListTab('review');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Automations;
