import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';
import { ALL_TAGS } from './data';

/** Settings -> Tags. */
export function TagsSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Tags</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Tag - demo only', variant: 'info' })}>
          <Plus size={13} /> Add Tag
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">
            {tag}
            <button className="text-ink-subtle hover:text-bad" aria-label={'Remove ' + tag}>{'\u00d7'}</button>
          </span>
        ))}
      </div>
    </div>
  );
}
