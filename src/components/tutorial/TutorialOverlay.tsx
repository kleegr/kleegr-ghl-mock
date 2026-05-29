/**
 * TutorialOverlay — the Tutorial Mode engine (plan §9 / §18).
 *
 * An Arcade-style, config-driven walkthrough renderer. It reads the active
 * tutorial + step index from the store and the step configs from
 * `src/tutorials/flows.ts`, then:
 *   1. navigates to the step's route,
 *   2. resolves the target via its stable `data-tour` selector (polling so it
 *      survives navigation/modal-mount), scrolls it into view,
 *   3. dims the rest of the screen with a spotlight cutout around the target,
 *   4. renders a coachmark (title, body, "Step X of N", Back/Next/Skip/Exit),
 *   5. supports click-to-advance gating, and
 *   6. shows a celebratory completion card at the end.
 *
 * All state is in-memory (store); nothing persists. The component is mounted
 * once in AppShell and portals to <body> so it can overlay any module — and
 * even spotlight elements inside open modals.
 *
 * Generic + data-driven: adding a tutorial requires no changes here.
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, X, ArrowRight, ArrowLeft, CheckCircle2, PartyPopper } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getFlow, TUTORIAL_FLOWS, type FlowStep } from '@/tutorials/flows';
import { cx } from '@/utils';

interface Rect { top: number; left: number; width: number; height: number; }

const PAD = 8;
const COACH_W = 332;

function sameRect(a: Rect | null, b: Rect): boolean {
  if (!a) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

export function TutorialOverlay() {
  const activeId = useStore((s) => s.activeTutorialId);
  const stepIndex = useStore((s) => s.tutorialStep);
  const completionId = useStore((s) => s.completionCardId);
  const next = useStore((s) => s.tutorialNext);
  const back = useStore((s) => s.tutorialBack);
  const exit = useStore((s) => s.exitTutorial);
  const complete = useStore((s) => s.completeTutorial);

  const flow = getFlow(activeId);
  const active = !!flow;
  const step: FlowStep | undefined = flow?.steps[stepIndex];
  const total = flow?.steps.length ?? 0;
  const isLast = stepIndex >= total - 1;

  const navigate = useNavigate();
  const location = useLocation();
  const elRef = useRef<Element | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const coachRef = useRef<HTMLDivElement>(null);
  const [coachH, setCoachH] = useState(190);

  const onNext = useCallback(() => {
    if (!flow) return;
    if (stepIndex >= flow.steps.length - 1) complete(flow.id);
    else next();
  }, [flow, stepIndex, complete, next]);

  // Navigate to the step's route when needed.
  useEffect(() => {
    if (!active || !step?.route) return;
    if (location.pathname !== step.route) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeId, stepIndex]);

  // Scroll the target into view once it appears for this step.
  useEffect(() => {
    if (!active || !step?.target) { elRef.current = null; setRect(null); return; }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        return;
      }
      if (tries++ < 30) timer = setTimeout(find, 100);
    };
    find();
    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeId, stepIndex, step?.target]);

  // Track the target rect on a rAF loop (survives scroll/resize/layout shifts).
  useEffect(() => {
    if (!active) return;
    if (!step?.target) { elRef.current = null; setRect(null); return; }
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        // Treat not-yet-laid-out / hidden elements (e.g. a modal mid-mount) as
        // "not found" so we show a centered coachmark instead of a 1px spotlight.
        if (r.width < 2 || r.height < 2) {
          elRef.current = null;
          setRect((prev) => (prev === null ? prev : null));
        } else {
          elRef.current = el;
          const nr: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
          setRect((prev) => (sameRect(prev, nr) ? prev : nr));
        }
      } else {
        elRef.current = null;
        setRect((prev) => (prev === null ? prev : null));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelled = true; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeId, stepIndex, step?.target]);

  // Click-to-advance gating.
  useEffect(() => {
    if (!active || step?.advanceOn !== 'click') return;
    const onClick = (e: MouseEvent) => {
      const el = elRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) {
        // let the target's own handler run (and any modal mount) before advancing
        window.setTimeout(() => onNext(), 90);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeId, stepIndex, step, onNext]);

  // Esc exits the tutorial.
  useEffect(() => {
    if (!active && !completionId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); if (active) exit(); else useStore.getState().dismissCompletion(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active, completionId, exit]);

  // Measure coachmark height for accurate placement.
  useLayoutEffect(() => {
    if (coachRef.current) setCoachH(coachRef.current.offsetHeight);
  }, [stepIndex, activeId, rect]);

  if (completionId) return <CompletionCard id={completionId} />;
  if (!active || !flow || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const coach = coachStyle(rect, step.placement ?? 'auto', vw, vh, coachH);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={`Tutorial: ${flow.title}`}>
      {/* Dim panels — a 4-panel cutout leaves the target clickable through the hole. */}
      {rect ? (
        <>
          <DimPanel style={{ top: 0, left: 0, width: '100%', height: Math.max(0, rect.top - PAD) }} />
          <DimPanel style={{ top: Math.max(0, rect.top - PAD), left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          <DimPanel style={{ top: Math.max(0, rect.top - PAD), left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2 }} />
          <DimPanel style={{ top: rect.top + rect.height + PAD, left: 0, width: '100%', bottom: 0 }} />
          {/* Highlight ring */}
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-xl ring-2 ring-brand ring-offset-2 ring-offset-transparent transition-all duration-150"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: '0 0 0 9999px rgba(8,15,31,0.0), 0 0 22px 4px rgb(var(--brand) / 0.45)',
            }}
          />
        </>
      ) : (
        <div className="pointer-events-auto absolute inset-0 bg-ink/55 backdrop-blur-[1px]" />
      )}

      {/* Coachmark */}
      <div
        ref={coachRef}
        className="pointer-events-auto absolute w-[320px] max-w-[calc(100vw-24px)] animate-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        style={coach}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-soft/50 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">
            <GraduationCap size={13} /> {flow.area}
          </span>
          <button onClick={exit} className="rounded p-0.5 text-ink-subtle hover:bg-line/50 hover:text-ink" aria-label="Exit tutorial">
            <X size={15} />
          </button>
        </div>

        <div className="px-4 py-3">
          <h3 className="text-sm font-bold text-ink">{step.title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
          {step.advanceOn === 'click' && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand">
              Click the highlighted control to continue
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="px-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-[11px] font-medium text-ink-subtle">Step {stepIndex + 1} of {total}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={exit} className="rounded-lg px-2 py-1 text-xs font-medium text-ink-subtle hover:bg-surface-sunken hover:text-ink">
              Skip
            </button>
            {stepIndex > 0 && (
              <button onClick={back} className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken">
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button onClick={onNext} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand/90">
              {isLast ? 'Finish' : 'Next'} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DimPanel({ style }: { style: React.CSSProperties }) {
  return <div aria-hidden className="pointer-events-auto absolute bg-ink/55 backdrop-blur-[1px] transition-all duration-150" style={style} />;
}

function coachStyle(
  rect: Rect | null,
  placement: NonNullable<FlowStep['placement']>,
  vw: number,
  vh: number,
  coachH: number,
): React.CSSProperties {
  if (!rect) {
    return { top: Math.max(12, vh / 2 - coachH / 2), left: Math.max(12, vw / 2 - COACH_W / 2) };
  }
  const gap = 14;
  const cx0 = rect.left + rect.width / 2 - COACH_W / 2;
  const cy0 = rect.top + rect.height / 2 - coachH / 2;
  let top = 0;
  let left = 0;

  const roomBelow = vh - (rect.top + rect.height);
  const roomAbove = rect.top;
  const roomRight = vw - (rect.left + rect.width);
  const roomLeft = rect.left;

  let chosen = placement;
  if (chosen === 'auto') {
    if (roomBelow >= coachH + gap + 12) chosen = 'bottom';
    else if (roomAbove >= coachH + gap + 12) chosen = 'top';
    else if (roomRight >= COACH_W + gap + 12) chosen = 'right';
    else chosen = 'left';
  } else if (chosen === 'bottom' && roomBelow < coachH + gap + 12 && roomAbove >= coachH + gap + 12) {
    chosen = 'top';
  } else if (chosen === 'top' && roomAbove < coachH + gap + 12 && roomBelow >= coachH + gap + 12) {
    chosen = 'bottom';
  } else if (chosen === 'right' && roomRight < COACH_W + gap + 12 && roomLeft >= COACH_W + gap + 12) {
    chosen = 'left';
  } else if (chosen === 'left' && roomLeft < COACH_W + gap + 12 && roomRight >= COACH_W + gap + 12) {
    chosen = 'right';
  }

  switch (chosen) {
    case 'top':    top = rect.top - coachH - gap; left = cx0; break;
    case 'right':  left = rect.left + rect.width + gap; top = cy0; break;
    case 'left':   left = rect.left - COACH_W - gap; top = cy0; break;
    case 'bottom':
    default:       top = rect.top + rect.height + gap; left = cx0; break;
  }

  // Clamp into the viewport.
  top = Math.min(Math.max(12, top), Math.max(12, vh - coachH - 12));
  left = Math.min(Math.max(12, left), Math.max(12, vw - COACH_W - 12));
  return { top, left };
}

/* ── Completion card ────────────────────────────────────────── */

function CompletionCard({ id }: { id: string }) {
  const dismiss = useStore((s) => s.dismissCompletion);
  const start = useStore((s) => s.startTutorial);
  const navigate = useNavigate();

  const flow = getFlow(id);
  const idx = TUTORIAL_FLOWS.findIndex((f) => f.id === id);
  const nextFlow = idx >= 0 && idx < TUTORIAL_FLOWS.length - 1 ? TUTORIAL_FLOWS[idx + 1] : undefined;
  if (!flow) return null;

  return createPortal(
    <div className="fixed inset-0 z-[58] flex items-center justify-center bg-ink/50 px-4" onMouseDown={dismiss}>
      <div
        className="w-full max-w-sm animate-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial complete"
      >
        <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-brand-soft/70 to-surface px-6 pt-7 pb-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-sm">
            <PartyPopper size={26} />
          </span>
          <h2 className="mt-1 text-lg font-bold text-ink">{flow.completionTitle}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{flow.completionBody}</p>
        </div>

        <div className="space-y-2 px-6 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">What you learned</p>
          <ul className="space-y-1.5">
            {flow.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-[13px] text-ink">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-good" />
                <span>{s.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-6 py-4">
          {nextFlow ? (
            <button
              onClick={() => start(nextFlow.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Start next: {nextFlow.title} <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => { dismiss(); navigate('/guides'); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              See all guides <ArrowRight size={14} />
            </button>
          )}
          <button
            onClick={() => { dismiss(); navigate('/guides'); }}
            className="w-full rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken"
          >
            Back to guides
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
