import { Clock, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui/primitives';
import type { TutorialDef } from '../tutorialDefs';

interface TutorialCardProps {
  tutorial: TutorialDef;
  /** Launch the interactive walkthrough. */
  onStart: (id: string) => void;
  /** Open the read-only step preview. */
  onPreview: (id: string) => void;
  /** Whether this tutorial has been completed in the current session. */
  completed?: boolean;
}

/**
 * Tutorial card — shows area, title, description, estimated time, a primary
 * "Start" CTA that launches the interactive Tutorial engine, and a secondary
 * "Preview" CTA that opens the read-only step outline.
 *
 * data-tour attributes:
 *   guides.tutorialCard  — the whole card
 *   guides.preview       — the preview CTA button
 *   guides.start         — the start CTA button
 */
export function TutorialCard({ tutorial, onStart, onPreview, completed }: TutorialCardProps) {
  return (
    <Card
      className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
      data-tour="guides.tutorialCard"
    >
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {tutorial.area}
          </p>
          <h3 className="text-sm font-bold leading-snug text-ink">{tutorial.title}</h3>
        </div>
        {completed ? (
          <Badge tone="good" className="ml-3 shrink-0 gap-1">
            <CheckCircle2 size={11} /> Done
          </Badge>
        ) : (
          <Badge tone="brand" className="ml-3 shrink-0">
            Interactive
          </Badge>
        )}
      </div>

      <p className="flex-1 px-4 pb-3 text-xs leading-relaxed text-ink-muted">
        {tutorial.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <Clock size={11} />
          ~{tutorial.estMinutes} min
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            className="gap-1"
            onClick={() => onPreview(tutorial.id)}
            data-tour="guides.preview"
          >
            Preview
          </Button>
          <Button
            variant="primary"
            size="xs"
            className="gap-1"
            onClick={() => onStart(tutorial.id)}
            data-tour="guides.start"
          >
            {completed ? 'Replay' : 'Start'}
            {completed ? <ArrowRight size={11} /> : <PlayCircle size={12} />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
