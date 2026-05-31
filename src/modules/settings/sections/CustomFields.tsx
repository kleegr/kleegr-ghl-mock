import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';
import { CUSTOM_FIELDS } from './data';

/** Settings -> Custom Fields. */
export function CustomFieldsSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Custom Fields</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Field - demo only', variant: 'info' })}>
          <Plus size={13} /> Add Field
        </Button>
      </div>
      <Card>
        {CUSTOM_FIELDS.map((cf) => (
          <div key={cf.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{cf.name}</p>
              <p className="text-xs text-ink-muted">{cf.type} {'\u00b7'} {cf.scope}{cf.folder ? ' \u00b7 ' + cf.folder : ''}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
