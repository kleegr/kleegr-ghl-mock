import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';
import { CUSTOM_VALUES } from './data';

/** Settings -> Custom Values (merge fields). */
export function CustomValuesSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Custom Values</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Value - demo only', variant: 'info' })}>
          <Plus size={13} /> Add Value
        </Button>
      </div>
      <Card>
        {CUSTOM_VALUES.map((cv) => (
          <div key={cv.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="font-mono text-xs text-brand">{`{{${cv.key}}}`}</p>
              <p className="text-sm text-ink">{cv.value}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
