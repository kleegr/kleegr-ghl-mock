import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button, Card } from '@/components/ui/primitives';

/** Settings -> Business Profile. Generic demo identity only. */
export function BusinessProfile() {
  const pushToast = useStore((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const fields = [
    { label: 'Business Name', value: 'Demo Business' },
    { label: 'Website', value: 'https://demo-business.example.com' },
    { label: 'Phone', value: '+1 (555) 010-0100' },
    { label: 'Email', value: 'contact@example.com' },
    { label: 'Address', value: '100 Demo Street, Demo City' },
    { label: 'Timezone', value: 'America/Chicago (CDT, UTC-5)' },
    { label: 'Industry', value: 'Professional Services' },
  ];
  return (
    <div data-tour="settings.businessProfile">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Business Profile</p>
        {!editing
          ? <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          : <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={() => { pushToast({ title: 'Profile saved (demo only)', variant: 'success' }); setEditing(false); }}>Save Changes</Button>
            </div>
        }
      </div>
      <Card>
        <div className="divide-y divide-line">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <p className="w-40 shrink-0 text-xs font-semibold text-ink-subtle">{f.label}</p>
              {editing ? (
                <input
                  defaultValue={f.value}
                  className="flex-1 rounded-lg border border-line bg-surface-sunken px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              ) : (
                <p className="flex-1 text-sm text-ink">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
