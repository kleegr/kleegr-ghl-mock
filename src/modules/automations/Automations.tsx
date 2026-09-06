import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BellRing, Settings, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Workflow } from '@/types';
import { cx } from '@/utils';
import { WorkflowsList } from './WorkflowsList';
import { AutomationOverview } from './AutomationOverview';
import { WorkflowBuilder } from './WorkflowBuilder';

/* ── module sub-nav ─────────────────────────────────────────── */

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
    <div className="flex h-10 shrink-0 items-center gap-7 bg-banner px-5 text-white">
      <span className="shrink-0 font-display text-[18px] font-semibold tracking-[-0.01em]">Automation</span>
      <div className="flex h-10 flex-1 items-end gap-6">
        <nav className="flex h-10 items-end gap-7" aria-label="Automation sections">
          <button
            onClick={() => onView('workflows')}
            className={cx(
              'relative flex h-10 items-center text-[12px] font-medium transition-colors',
              view === 'workflows' ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            Workflows
            {view === 'workflows' && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-banner-accent" />}
          </button>

          <button
            onClick={() => onView('overview')}
            className={cx(
              'relative flex h-10 items-center gap-1.5 text-[12px] font-medium transition-colors',
              view === 'overview' ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            Overview
            <span className="-mt-4 rounded-[3px] bg-amber-300 px-1 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wide text-amber-950">Beta</span>
            {view === 'overview' && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-banner-accent" />}
          </button>
        </nav>

        <span aria-hidden className="mb-2.5 h-5 w-px bg-white/20" />
        <button
          onClick={onSettings}
          className="flex h-10 items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors hover:text-white"
        >
          <Settings size={14} />
          Global Workflow Settings
        </button>
        <button
          onClick={() => onView('overview')}
          className="ml-auto mb-1.5 hidden h-7 items-center gap-1.5 rounded-full border border-banner-accent/35 bg-banner-accent/10 px-3 text-[10px] font-semibold text-banner-accent hover:bg-banner-accent/20 lg:flex"
        >
          <BellRing size={12} /> What's new · Automation updates
        </button>
        <Sparkles size={14} className="mb-3 ml-auto text-banner-accent/60 lg:hidden" />
      </div>
    </div>
  );
}

/* ── main entry ─────────────────────────────────────────────── */

export function Automations() {
  const pushToast = useStore((s) => s.pushToast);
  const workflows = useStore((s) => s.workflows);
  const navigate = useNavigate();

  /* `/automations/workflow/:workflowId` deep-links straight into the builder.
     The open workflow is derived from the URL param (so reloads and shared
     links work and browser back/forward behave), while a blank/untitled
     workflow is ephemeral local state that lives at the plain `/automations`
     URL because it has no persistent id to link to. */
  const { workflowId } = useParams<{ workflowId?: string }>();
  const routed = workflowId ? workflows.find((w) => w.id === workflowId) ?? null : null;

  const [view, setView] = useState<ModuleView>('workflows');
  const [listTab, setListTab] = useState<ListTab>('all');
  const [blankWf, setBlankWf] = useState<Workflow | null>(null);

  /* URL param wins when present; otherwise fall back to an in-progress blank. */
  const openWf = workflowId ? routed : blankWf;
  const blank = !workflowId && blankWf !== null;

  /* Invalid / stale workflow id → bounce back to the list with a heads-up,
     rather than rendering a dead builder. */
  useEffect(() => {
    if (workflowId && !routed) {
      pushToast({
        title: 'Workflow not found',
        description: `We couldn't find that workflow, so here is the full list.`,
        variant: 'info',
      });
      navigate('/automations', { replace: true });
    }
  }, [workflowId, routed, navigate, pushToast]);

  const openWorkflow = (wf: Workflow) => {
    setBlankWf(null);
    navigate(`/automations/workflow/${wf.id}`);
  };

  const createBlank = () => {
    setBlankWf({
      id: `new-${Date.now()}`,
      name: 'Untitled Workflow',
      status: 'draft',
      enrolled: 0,
      trigger: '',
    });
    navigate('/automations');
  };

  const closeBuilder = () => {
    setBlankWf(null);
    navigate('/automations');
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
