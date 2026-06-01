/**
 * HelpProvider — the single mount point that wires the contextual help surfaces
 * together and keeps them out of the way of guided tutorials.
 *
 * Mounted once in AppShell (right after <TutorialOverlay />). It owns only one
 * piece of local state — whether the screen-level Help Panel is open — and reads
 * everything else (help mode, the active help key) from the store. The store
 * actions stay the source of truth; this component just coordinates which
 * surface is visible.
 *
 * Coordination rules:
 *   - While a tutorial (or its completion card) is active, NO help surface
 *     renders. The guided experience owns the screen; badges/popover/panel would
 *     only fight the spotlight overlay.
 *   - Starting a tutorial from any help surface goes through `startGuided`, which
 *     launches the flow and clears the help UI (closes the popover + panel and
 *     turns help mode off) so the user drops straight into a clean walkthrough.
 *   - The popover and panel never show at the same time: opening one closes the
 *     other, so cards never stack.
 *
 * Surfaces:
 *   - HelpBadgeLayer — the floating "?" badges (only while help mode is on).
 *   - HelpPopover    — the single "what is this?" card (driven by activeHelpKey).
 *   - HelpPanel      — the screen-level help drawer.
 *   - HelpModeBar    — a small floating bar (defined inline below) that tells the
 *                      user they're in help mode and offers quick actions.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, PanelRight, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { HelpBadgeLayer } from './HelpBadgeLayer';
import { HelpPopover } from './HelpPopover';
import { HelpPanel } from './HelpPanel';

export function HelpProvider() {
  const [panelOpen, setPanelOpen] = useState(false);

  const helpMode = useStore((s) => s.helpMode);
  const activeTutorialId = useStore((s) => s.activeTutorialId);
  const completionCardId = useStore((s) => s.completionCardId);
  const openHelp = useStore((s) => s.openHelp);
  const closeHelp = useStore((s) => s.closeHelp);
  const toggleHelpMode = useStore((s) => s.toggleHelpMode);
  const startTutorial = useStore((s) => s.startTutorial);

  // A guided tutorial (or its completion card) owns the screen — suppress help.
  const tutorialActive = !!activeTutorialId || !!completionCardId;

  /**
   * Launch a guided tutorial from any help surface, then clear the help UI so
   * the walkthrough starts clean. We read helpMode from getState() rather than
   * the closed-over value to avoid acting on a stale render.
   */
  const startGuided = (id: string) => {
    startTutorial(id);
    closeHelp();
    setPanelOpen(false);
    if (useStore.getState().helpMode) toggleHelpMode();
  };

  const openPanel = () => {
    closeHelp(); // never show the popover and the panel at once
    setPanelOpen(true);
  };

  return (
    <>
      {helpMode && !tutorialActive && <HelpBadgeLayer onSelect={openHelp} />}

      {!tutorialActive && (
        <HelpPopover onStartTutorial={startGuided} onOpenPanel={openPanel} />
      )}

      {panelOpen && !tutorialActive && (
        <HelpPanel onClose={() => setPanelOpen(false)} onStartTutorial={startGuided} />
      )}

      {helpMode && !panelOpen && !tutorialActive && (
        <HelpModeBar onExplainScreen={openPanel} onDone={toggleHelpMode} />
      )}
    </>
  );
}

/**
 * HelpModeBar — a small, unobtrusive floating bar shown while help mode is on.
 * It makes the mode discoverable ("you're in help mode") and offers two quick
 * actions: open the screen help panel, or exit help mode. Kept inline because it
 * is purely a control surface for HelpProvider's state and has no independent
 * logic.
 */
function HelpModeBar({
  onExplainScreen,
  onDone,
}: {
  onExplainScreen: () => void;
  onDone: () => void;
}) {
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[46] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-surface px-3 py-2 shadow-pop animate-in">
        <span className="flex items-center gap-1.5 pl-1 text-[13px] text-ink">
          <Sparkles size={15} className="text-brand" />
          <span className="font-semibold">Help mode</span>
          <span className="hidden text-ink-muted sm:inline">— click any “?” for an explanation</span>
        </span>
        <button
          onClick={onExplainScreen}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-fg"
        >
          <PanelRight size={13} /> Explain this screen
        </button>
        <button
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <Check size={13} /> Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
