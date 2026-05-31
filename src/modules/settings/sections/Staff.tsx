import { useStore } from '@/store/useStore';
import { Button, Badge, Card, Avatar } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

/** Settings -> Staff. Reads team members from the demo store. */
export function StaffSection() {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.staff">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">My Staff</p>
        <Button
          size="sm"
          data-tour="settings.addConfig"
          onClick={() => pushToast({ title: 'Add User - demo only', description: 'Staff additions are not persisted in demo mode.', variant: 'info' })}
        >
          <Plus size={13} /> Add User
        </Button>
      </div>
      <Card>
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{u.name}</p>
                  {u.isCurrentUser && <Badge tone="brand">You</Badge>}
                  <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role}</Badge>
                  {u.status === 'invited' && <Badge tone="warn">invited</Badge>}
                </div>
                <p className="text-xs text-ink-muted">{u.title ? u.title + ' \u00b7 ' : ''}{u.email}</p>
                {u.phone && <p className="text-xs text-ink-subtle">{u.phone}</p>}
              </div>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
