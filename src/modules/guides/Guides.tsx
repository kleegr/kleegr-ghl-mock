import { useState } from 'react';
import { GraduationCap, PlayCircle, Repeat2, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { PageHeader, Card, CardHeader } from '@/components/ui/primitives';
import { TutorialCard } from './components/TutorialCard';
import { TutorialPreviewModal } from './components/TutorialPreviewModal';
import { TUTORIALS } from './tutorialDefs';
import { totalEstMinutes } from './utils';

/**
 * Guides — Tutorial Mode launcher.
 *
 * Shows all 10 required V1 tutorials as clickable cards with step previews.
 * Stats overview, mode explanation panel, and prompt system notes.
 *
 * The Tutorial engine (spotlight/coachmark/step gating/completion tracking)
 * is NOT implemented here — that is Wave 3. This page is the planning and
 * preview surface that ships with the Wave 1 content pass.
 *
 * data-tour attributes applied:
 *   guides.page            — root container
 *   guides.tutorialList    — the cards grid heading
 *   guides.tutorialCard    — each tutorial card (in TutorialCard.tsx)
 *   guides.preview         — the preview CTA (in TutorialCard.tsx)
 *   guides.modeExplanation — the side panel
 */

const TOTAL_MIN = totalEstMinutes(TUTORIALS);

export function Guides() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTutorial = TUTORIALS.find((t) => t.id === previewId);

  return (
    <div data-tour="guides.page">
      <PageHeader
        title="Guides"
        subtitle="Tutorial Mode — step-by-step walkthroughs for every core task in the platform"
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
            <p className="text-2xl font-bold text-ink-muted">0 / {TUTORIALS.length}</p>
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
                <TutorialCard key={t.id} tutorial={t} onPreview={setPreviewId} />
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-3" data-tour="guides.modeExplanation">
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
              <CardHeader title="Tutorial Mode" subtitle="Guided walkthroughs — Wave 3" />
              <div className="space-y-3 px-4 py-3">
                <div className="flex gap-2.5">
                  <GraduationCap size={15} className="mt-0.5 shrink-0 text-brand" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    <strong className="text-ink">Tutorial Mode</strong> launches in Wave 3. Each
                    tutorial uses spotlight overlays, coachmarks, and step gating — modeled on
                    Arcade — to teach the exact tasks clients perform every day.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    All 10 required onboarding tutorials are planned. Preview the step outline for
                    any tutorial by clicking{' '}
                    <strong className="text-ink">Preview steps</strong>.
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
                    <code className="text-[11px] text-brand">TutorialDef</code> array — no new
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
      />
    </div>
  );
}
