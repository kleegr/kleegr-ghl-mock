import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

/** Settings -> Pipelines. */
export function PipelinesSection() {
  const pipelines = useStore((s) => s.pipelines);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Pipelines</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Pipeline - demo only', variant: 'info' })}>
          <Plus size={13} /> Add Pipeline
        </Button>
      </div>
      <div className="space-y-3">
        {pipelines.map((pipe) => (
          <Card key={pipe.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{pipe.name}</p>
              <Button variant="ghost" size="xs">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pipe.stages.map((st) => (
                <span key={st.id} className="rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink">
                  {st.order + 1}. {st.name}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
