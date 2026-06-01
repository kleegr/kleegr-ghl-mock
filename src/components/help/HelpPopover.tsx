/**
 * HelpPopover — the single-element "what is this?" card.
 *
 * Driven entirely by the store's `activeHelpKey` (set by a badge click or by the
 * panel). It looks the key up in the Developer 1 help model, anchors itself next
 * to the live element (falling back to a centered card when the element is not
 * on screen — e.g. a control that only appears inside a closed modal), and shows
 * the business-value copy plus, when one exists, a "Show me" button that hands
 * off to the existing tutorial engine.
 *
 * It never starts its own tutorial logic — it calls the `onStartTutorial`
 * callback wired up in HelpProvider, which reuses the store's `startTutorial`.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, GraduationCap, PanelRight, Clock3 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getHelp } from '@/help';
import { getFlow } from '@/tutorials/flows';
import { cx } from '@/utils';
import { AREA_LABEL } from './helpRoutes';

const POP_W = 312;
const GAP = 12;

interface Pos {
  top: number;
  left: number;
  /** True when we could not anchor to an element and centered instead. */
  centered: boolean;
}

const TIER_LABEL: Record<string, string> = {
  screen: 'Screen',
  section: 'Section',
  control: 'Control',
};

function anchorRectFor(key: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return r;
}

function computePos(rect: DOMRect | null, popH: number): Pos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const center = (): Pos => ({
    top: Math.max(GAP, vh / 2 - popH / 2),
    left: Math.max(GAP, vw / 2 - POP_W / 2),
    centered: true,
  });
  if (!rect) return center();
  // A target that fills most of the viewport (e.g. a whole-screen container) has
  // no sensible "edge" to attach to — center instead.
  if (rect.width > vw * 0.7 && rect.height > vh * 0.7) return center();

  const roomBelow = vh - (rect.top + rect.height);
  const roomAbove = rect.top;
  const roomRight = vw - (rect.left + rect.width);

  let top: number;
  let left: number;
  if (roomBelow >= popH + GAP + 8) {
    top = rect.top + rect.height + GAP;
    left = rect.left;
  } else if (roomAbove >= popH + GAP + 8) {
    top = rect.top - popH - GAP;
    left = rect.left;
  } else if (roomRight >= POP_W + GAP + 8) {
    left = rect.left + rect.width + GAP;
    top = rect.top;
  } else {
    left = rect.left - POP_W - GAP;
    top = rect.top;
  }

  top = Math.min(Math.max(GAP, top), Math.max(GAP, vh - popH - GAP));
  left = Math.min(Math.max(GAP, left), Math.max(GAP, vw - POP_W - GAP));
  return { top, left, centered: false };
}

interface HelpPopoverProps {
  /** Launch a tutorial by flow id (handled centrally in HelpProvider). */
  onStartTutorial: (id: string) => void;
  /** Open the full screen-level help panel. */
  onOpenPanel: () => void;
}

export function HelpPopover({ onStartTutorial, onOpenPanel }: HelpPopoverProps) {
  const activeKey = useStore((s) => s.activeHelpKey);
  const closeHelp = useStore((s) => s.closeHelp);

  const cardRef = useRef<HTMLDivElement>(null);
  const [popH, setPopH] = useState(200);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, centered: true });

  const entry = getHelp(activeKey);

  // Track the anchor while open (handles scroll inside <main>, resize, layout).
  useEffect(() => {
    if (!activeKey) return;
    let raf = 0;
    const update = () => {
      setPos(computePos(anchorRectFor(activeKey), popH));
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [activeKey, popH]);

  // Re-measure card height for accurate placement once content is laid out.
  useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      setPopH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    }
  }, [activeKey, entry?.help]);

  // Esc closes; click-away closes (but ignore clicks on the badges so switching
  // from one badge to another does not flicker the card closed first).
  useEffect(() => {
    if (!activeKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeHelp();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (cardRef.current?.contains(t)) return;
      if (t.closest('[data-help-badge]')) return;
      closeHelp();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [activeKey, closeHelp]);

  if (!activeKey || !entry) return null;

  const flow = entry.tutorialId ? getFlow(entry.tutorialId) : undefined;
  const tutorialPlanned = !!entry.tutorialId && !flow; // referenced but not built yet
  const areaName = AREA_LABEL[entry.area] ?? entry.area;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[47]">
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Help: ${entry.label}`}
        className="pointer-events-auto absolute w-[312px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-pop"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-soft/50 px-3.5 py-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              {TIER_LABEL[entry.tier] ?? entry.tier}
            </span>
            <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {areaName}
            </span>
          </span>
          <button
            onClick={closeHelp}
            className="shrink-0 rounded p-0.5 text-ink-subtle hover:bg-line/50 hover:text-ink"
            aria-label="Close help"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-3.5 py-3">
          <h3 className="text-sm font-bold text-ink">{entry.label}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{entry.help}</p>
        </div>

        {(flow || tutorialPlanned || entry.tier === 'screen') && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3.5 py-2.5">
            {flow && (
              <button
                onClick={() => onStartTutorial(flow.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg transition-colors hover:bg-brand/90"
              >
                <GraduationCap size={13} /> Show me
              </button>
            )}
            {tutorialPlanned && (
              <span
                title="A guided walkthrough for this is planned but not available yet."
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-subtle"
              >
                <Clock3 size={13} /> Walkthrough coming soon
              </span>
            )}
            {entry.tier === 'screen' && (
              <button
                onClick={onOpenPanel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken"
              >
                <PanelRight size={13} /> Screen help
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
