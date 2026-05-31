import { useStore } from '@/store/useStore';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { Plug } from 'lucide-react';

/** Settings -> Integrations (summary; the full surface lives at /integrations). */
export function IntegrationsSection() {
  const pushToast = useStore((s) => s.pushToast);
  const integs = [
    { name: 'Outlook / Email', connected: false },
    { name: 'Google Calendar', connected: false },
    { name: 'Stripe', connected: false },
    { name: 'Facebook', connected: false },
  ];
  return (
    <div>
      <p className="mb-4 text-sm font-bold text-ink">Integrations</p>
      <Card>
        {integs.map((i) => (
          <div key={i.name} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div className="flex items-center gap-3">
              <Plug size={15} className="text-ink-muted" />
              <p className="text-sm font-semibold text-ink">{i.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={i.connected ? 'good' : 'neutral'}>{i.connected ? 'Connected' : 'Not connected'}</Badge>
              <Button variant="secondary" size="xs" onClick={() => pushToast({ title: i.name + ' - demo only', variant: 'info' })}>
                {i.connected ? 'Manage' : 'Connect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="px-5 py-3">
          <p className="text-xs text-ink-muted">Manage integrations in detail from the <a href="/integrations" className="text-brand underline">Integrations</a> page.</p>
        </div>
      </Card>
    </div>
  );
}
