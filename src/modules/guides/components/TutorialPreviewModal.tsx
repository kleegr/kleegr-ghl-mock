import { Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import type { TutorialDef } from '../tutorialDefs';

interface TutorialPreviewModalProps {
  tutorial: TutorialDef | undefined;
  onClose: () => void;
}

/**
 * Read-only preview modal showing the planned step outline for a tutorial.
 * Does NOT implement any Tutorial engine behaviour — that is Wave 3.
 */
export function TutorialPreviewModal({ tutorial, onClose }: TutorialPreviewModalProps) {
  return (
    <Modal
      open={!!tutorial}
      onClose={onClose}
      title={tutorial?.title ?? ''}
      size="md"
    >
      {tutorial && (
        <div className="space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{tutorial.area}</Badge>
            <Badge tone="neutral">Wave 3</Badge>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} />
              ~{tutorial.estMinutes} min
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-ink-muted">{tutorial.description}</p>

          {/* Step list */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink">
              Planned Steps
            </p>
            <ol className="space-y-2.5">
              {tutorial.plannedSteps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Completion note */}
          <div className="flex gap-2.5 rounded-lg border border-good/25 bg-good/5 p-3">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" />
            <div>
              <p className="text-xs font-bold text-ink">On completion</p>
              <p className="mt-0.5 text-xs text-ink-muted">{tutorial.completionNote}</p>
            </div>
          </div>

          {/* Wave 3 notice */}
          <div className="flex gap-2.5 rounded-lg border border-line bg-surface-sunken p-3">
            <BookOpen size={15} className="mt-0.5 shrink-0 text-ink-muted" />
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Tutorial Mode</strong> — interactive spotlight overlays,
              coachmarks, step gating, and completion tracking — launches in Wave 3.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
