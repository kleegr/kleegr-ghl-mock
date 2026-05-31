import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

/** Settings -> Calendars. */
export function CalendarsSection() {
  const calendars = useStore((s) => s.calendars);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Calendars</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Calendar - demo only', variant: 'info' })}>
          <Plus size={13} /> Add Calendar
        </Button>
      </div>
      <Card>
        {calendars.map((cal) => (
          <div key={cal.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
              <p className="text-sm font-medium text-ink">{cal.name}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
