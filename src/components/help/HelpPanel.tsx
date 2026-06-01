/**
 * HelpPanel — the screen-level "module help" drawer.
 *
 * Opened from the Help Mode bar (or the popover's "Screen help" button), this is
 * the right-hand drawer the architecture plan calls the module help panel. It
 * reads the current route, resolves it to one or more help areas
 * (`resolveHelpAreas`), and renders everything the Developer 1 model knows about
 * this screen:
 *
 *   - a one-line summary of what the screen is for (the `screen`-tier entry)
 *   - the key sections on the screen (`section`-tier entries)
 *   - the important controls on the screen (`control`-tier entries)
 *   - the tutorials related to anything on this screen (deduped via `getFlow`)
 *
 * Each row that maps to a real tutorial flow gets a "Show me" button that hands
 * off to the existing tutorial engine (through `onStartTutorial`, wired in
 * HelpProvider). Rows do NOT open the popover — that would stack a card on top
 * of the drawer; the drawer already shows the help copy inline.
 *
 * If the route has no help area (or no entries), we show a polished empty state
 * with a link to the full Guides library rather than an empty shell.
 *
 * All help copy comes from `@/help`; this component contributes only layout,
 * generic section labels, and empty-state wording.
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  GraduationCap,
  BookOpen,
  Layers,
  MousePointerClick,
  Sparkles,
  Info,
  Clock3,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { helpByArea, type HelpEntry } from '@/help';
import { getFlow, type TutorialFlow } from '@/tutorials/flows';
import { Button, EmptyState } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { resolveHelpAreas, AREA_LABEL } from './helpRoutes';

interface HelpPanelProps {
  onClose: () => void;
  /** Launch a tutorial by flow id (handled centrally in HelpProvider). */
  onStartTutorial: (id: string) => void;
}

/** Collapse the entries of one-or-more areas into a single, key-unique list. */
function entriesForAreas(areas: ReturnType<typeof resolveHelpAreas>): HelpEntry[] {
  const seen = new Set<string>();
  const out: HelpEntry[] = [];
  for (const area of areas) {
    for (const entry of helpByArea[area] ?? []) {
      if (seen.has(entry.key)) continue;
      seen.add(entry.key);
      out.push(entry);
    }
  }
  return out;
}

/** A single section/control row: label + business-value copy + optional "Show me". */
function HelpRow({
  entry,
  onStartTutorial,
}: {
  entry: HelpEntry;
  onStartTutorial: (id: string) => void;
}) {
  const flow = entry.tutorialId ? getFlow(entry.tutorialId) : undefined;
  const planned = !!entry.tutorialId && !flow;
  return (
    <li className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">{entry.label}</p>
        {flow && (
          <button
            onClick={() => onStartTutorial(flow.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-fg"
            title={`Show me: ${flow.title}`}
          >
            <GraduationCap size={12} /> Show me
          </button>
        )}
        {planned && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-subtle"
            title="A guided walkthrough for this is planned but not available yet."
          >
            <Clock3 size={12} /> Soon
          </span>
        )}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{entry.help}</p>
    </li>
  );
}

function SectionGroup({
  icon,
  title,
  count,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="px-4 py-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
        {icon}
        {title}
        <span className="text-ink-subtle/70">({count})</span>
      </h4>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

export function HelpPanel({ onClose, onStartTutorial }: HelpPanelProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const helpMode = useStore((s) => s.helpMode);
  const toggleHelpMode = useStore((s) => s.toggleHelpMode);

  const areas = useMemo(() => resolveHelpAreas(pathname), [pathname]);
  const entries = useMemo(() => entriesForAreas(areas), [areas]);

  const screenEntry = entries.find((e) => e.tier === 'screen');
  const sections = entries.filter((e) => e.tier === 'section');
  const controls = entries.filter((e) => e.tier === 'control');

  // Related tutorials = every distinct, *available* flow referenced on this screen.
  const tutorials = useMemo(() => {
    const seen = new Set<string>();
    const flows: TutorialFlow[] = [];
    for (const e of entries) {
      if (!e.tutorialId || seen.has(e.tutorialId)) continue;
      const flow = getFlow(e.tutorialId);
      if (!flow) continue;
      seen.add(e.tutorialId);
      flows.push(flow);
    }
    return flows;
  }, [entries]);

  const title =
    screenEntry?.label ?? (areas[0] ? AREA_LABEL[areas[0]] : undefined) ?? 'This screen';

  // A compact "Covers: A, B" line when the route maps to more than one area.
  const coversLabel =
    areas.length > 1
      ? areas.map((a) => AREA_LABEL[a] ?? a).join(', ')
      : null;

  // Esc closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const hasContent = entries.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[48]">
      {/* Backdrop — click to close. */}
      <div
        className="absolute inset-0 bg-ink/30 animate-in"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Help for ${title}`}
        className="absolute right-0 top-0 flex h-full w-[384px] max-w-[92vw] flex-col border-l border-line bg-surface shadow-pop"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-line bg-brand-soft/40 px-4 py-3.5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand">
              <BookOpen size={13} /> Screen help
            </p>
            <h3 className="mt-1 truncate text-base font-bold text-ink">{title}</h3>
            {coversLabel && (
              <p className="mt-0.5 truncate text-[11px] text-ink-subtle">
                Covers: {coversLabel}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-ink-subtle hover:bg-line/40 hover:text-ink"
            aria-label="Close help panel"
          >
            <X size={18} />
          </button>
        </header>

        {/* Highlight-on-page toggle (mirrors the topbar Help Mode toggle). */}
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Sparkles size={13} className="text-brand" />
            Highlight explainable items on the page
          </span>
          <button
            role="switch"
            aria-checked={helpMode}
            onClick={toggleHelpMode}
            className={cx(
              'relative h-5 w-9 shrink-0 rounded-full transition-colors',
              helpMode ? 'bg-brand' : 'bg-line',
            )}
            aria-label="Toggle help highlights on the page"
          >
            <span
              className={cx(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                helpMode ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!hasContent ? (
            <EmptyState
              className="py-20"
              icon={<Info size={30} className="text-ink-subtle" />}
              title="No contextual help here yet"
              body="This screen doesn't have help entries in the catalog yet. You can still browse the full guided tutorial library."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('/guides');
                  }}
                >
                  <BookOpen size={14} /> Browse all guides
                </Button>
              }
            />
          ) : (
            <>
              {screenEntry?.help && (
                <p className="border-b border-line px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                  {screenEntry.help}
                </p>
              )}

              <SectionGroup
                icon={<Layers size={13} />}
                title="Sections on this screen"
                count={sections.length}
              >
                {sections.map((e) => (
                  <HelpRow key={e.key} entry={e} onStartTutorial={onStartTutorial} />
                ))}
              </SectionGroup>

              <SectionGroup
                icon={<MousePointerClick size={13} />}
                title="Controls"
                count={controls.length}
              >
                {controls.map((e) => (
                  <HelpRow key={e.key} entry={e} onStartTutorial={onStartTutorial} />
                ))}
              </SectionGroup>

              {tutorials.length > 0 && (
                <section className="px-4 py-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    <GraduationCap size={13} />
                    Related tutorials
                    <span className="text-ink-subtle/70">({tutorials.length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {tutorials.map((flow) => (
                      <li
                        key={flow.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {flow.title}
                          </p>
                          <p className="text-[11px] text-ink-subtle">
                            ~{flow.estMinutes} min · {flow.steps.length} steps
                          </p>
                        </div>
                        <Button
                          size="xs"
                          variant="primary"
                          className="shrink-0"
                          onClick={() => onStartTutorial(flow.id)}
                        >
                          <GraduationCap size={12} /> Start
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
