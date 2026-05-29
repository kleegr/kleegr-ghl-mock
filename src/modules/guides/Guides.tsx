import { useState } from 'react';
import { GraduationCap, PlayCircle, Repeat2, CheckCircle2, Circle, BookOpen, Layers } from 'lucide-react';
import { PageHeader, Card, CardHeader } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { TutorialCard } from './components/TutorialCard';
import { TutorialPreviewModal } from './components/TutorialPreviewModal';
import { TUTORIALS } from './tutorialDefs';
import { totalEstMinutes } from './utils';

/**
 * Guides — Tutorial Mode launcher.
 *
 * Shows all 10 required V1 tutorials as cards that launch the interactive
 * Tutorial engine (spotlight + coachmark + progress + completion). Tracks
 * completion in-memory (resets with Reset Demo), shows an onboarding
 * checklist, and explains the two modes.
 *
 * data-tour attributes applied:
 *   guides.page             — root container
 *   guides.tutorialList     — the cards grid heading
 *   guides.onboardingChecklist — progress checklist
 *   guides.tutorialCard     — each tutorial card (in TutorialCard.tsx)
 *   guides.start / guides.preview — card CTAs (in TutorialCard.tsx)
 *   guides.modeExplanation  — the side panel
 */

const TOTAL_MIN = totalEstMinutes(TUTORIALS);

export function Guides() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const startTutorial = useStore((s) => s.startTutorial);
  const completed = useStore((s) => s.completedTutorials);

  const previewTutorial = TUTORIALS.find((t) => t.id === previewId);
  const doneCount = TUTORIALS.filter((t) => completed.includes(t.id)).length;
  const pctDone = Math.round((doneCount / TUTORIALS.length) * 100);

  return (
    <div data-tour="guides.page">
      <PageHeader
        title="Guides"
        subtitle="Tutorial Mode — interactive, step-by-step walkthroughs for every core task in the platform"
      />

      <div className="space-y-6 p-5">
        {/* ── Overview stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-ink-muted">Total tutorials</p>
            <p className="text-2xl font-bold text-ink">{TUTORIALS.length}</p>
          </Card>
          <Card className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-ink-muted">Required for onboarding</p>
            <p className="text-2xl font-bold text-ink">{TUTORIALS.length}</p>
          </Card>
          <Card className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-ink-muted">Est. total time</p>
            <p className="text-2xl font-bold text-ink">{TOTAL_MIN} min</p>
          </Card>
          <Card className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-xs text-ink-muted">Completed</p>
            <p className={`text-2xl font-bold ${doneCount > 0 ? 'text-good' : 'text-ink-muted'}`}>
              {doneCount} / {TUTORIALS.length}
            </p>
          </Card>
        </div>

        {/* ── Main content: cards + side panel ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_296px]">
          {/* Tutorial cards */}
          <div>
            <p
              className="mb-3 text-sm font-bold text-ink"
              data-tour="guides.tutorialList"
            >
              All Tutorials
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TUTORIALS.map((t) => (
                <TutorialCard
                  key={t.id}
                  tutorial={t}
                  onStart={startTutorial}
                  onPreview={setPreviewId}
                  completed={completed.includes(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-3" data-tour="guides.modeExplanation">
            {/* Onboarding checklist */}
            <Card data-tour="guides.onboardingChecklist">
              <CardHeader
                title="Your progress"
                subtitle={`${doneCount} of ${TUTORIALS.length} tutorials completed`}
              />
              <div className="px-4 pt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-500"
                    style={{ width: `${pctDone}%` }}
                  />
                </div>
              </div>
              <ul className="px-2 py-2">
                {TUTORIALS.map((t) => {
                  const done = completed.includes(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => startTutorial(t.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-sunken"
                      >
                        {done ? (
                          <CheckCircle2 size={15} className="shrink-0 text-good" />
                        ) : (
                          <Circle size={15} className="shrink-0 text-ink-subtle" />
                        )}
                        <span className={`flex-1 truncate text-[13px] ${done ? 'text-ink-subtle line-through' : 'font-medium text-ink'}`}>
                          {t.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Demo Mode" subtitle="Free exploration" />
              <div className="space-y-3 px-4 py-3">
                <div className="flex gap-2.5">
                  <PlayCircle size={15} className="mt-0.5 shrink-0 text-brand" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    The app opens in{' '}
                    <strong className="text-ink">Demo Mode</strong> by default. All data is
                    pre-seeded and realistic. Click anywhere, open records, move pipeline cards,
                    and reply to conversations — everything is simulated locally.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <Repeat2 size={15} className="mt-0.5 shrink-0 text-good" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    Hit{' '}
                    <strong className="text-ink">Reset Demo</strong> in the top bar any time to
                    restore the seeded state — perfect between sales calls.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Tutorial Mode" subtitle="Guided walkthroughs" />
              <div className="space-y-3 px-4 py-3">
                <div className="flex gap-2.5">
                  <GraduationCap size={15} className="mt-0.5 shrink-0 text-brand" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    <strong className="text-ink">Tutorial Mode</strong> dims the screen and
                    spotlights each control with coachmarks — modeled on Arcade — to teach the
                    exact tasks clients perform every day. Press{' '}
                    <strong className="text-ink">Start</strong> on any tutorial to begin.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    Each walkthrough tracks your progress and ends with a completion screen. Your
                    progress resets whenever you Reset Demo.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Prompt System" subtitle="Content generation" />
              <div className="space-y-3 px-4 py-3">
                <div className="flex gap-2.5">
                  <BookOpen size={15} className="mt-0.5 shrink-0 text-ink-muted" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    Tutorial scripts and seed data are generated from structured prompt templates
                    in{' '}
                    <code className="text-[11px] text-brand">/prompts</code>. Maintainers can
                    regenerate content without touching app code.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <Layers size={15} className="mt-0.5 shrink-0 text-ink-muted" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    All tutorials are config-driven from a typed{' '}
                    <code className="text-[11px] text-brand">TutorialFlow</code> array — no new
                    components required to add a new guide.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <TutorialPreviewModal
        tutorial={previewTutorial}
        onClose={() => setPreviewId(null)}
        onStart={startTutorial}
      />
    </div>
  );
}
