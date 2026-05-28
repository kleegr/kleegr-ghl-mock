import { Clock, ArrowRight } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui/primitives';
import type { TutorialDef } from '../tutorialDefs';

interface TutorialCardProps {
  tutorial: TutorialDef;
  onPreview: (id: string) => void;
}

/**
 * Tutorial card — shows area, title, description, estimated time, and a
 * "Preview steps" CTA that opens the TutorialPreviewModal.
 *
 * data-tour attributes:
 *   guides.tutorialCard  — the whole card
 *   guides.preview       — the preview CTA button
 */
export function TutorialCard({ tutorial, onPreview }: TutorialCardProps) {
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
        <Badge tone="neutral" className="ml-3 shrink-0">
          Wave 3
        </Badge>
      </div>

      <p className="flex-1 px-4 pb-3 text-xs leading-relaxed text-ink-muted">
        {tutorial.description}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-3">
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <Clock size={11} />
          ~{tutorial.estMinutes} min
        </span>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1"
          onClick={() => onPreview(tutorial.id)}
          data-tour="guides.preview"
        >
          Preview steps
          <ArrowRight size={11} />
        </Button>
      </div>
    </Card>
  );
}
