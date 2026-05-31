import { useStore } from '@/store/useStore';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

/** Settings -> Phone Numbers. Reads provisioned numbers from the shared store. */
export function PhoneSection() {
  const phoneNumbers = useStore((s) => s.phoneNumbers);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Phone Numbers</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Buy Number - demo only', variant: 'info' })}>
          <Plus size={13} /> Buy Number
        </Button>
      </div>
      <Card>
        {phoneNumbers.map((ph) => (
          <div key={ph.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{ph.number}</p>
              <p className="text-xs text-ink-muted">{ph.label} {'\u00b7'} {ph.type.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={ph.status === 'active' ? 'good' : 'neutral'}>{ph.status}</Badge>
              <Button variant="ghost" size="xs">Edit</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
