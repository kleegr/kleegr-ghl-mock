import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Send, UserX, UserCheck, Trash2, Users } from 'lucide-react';
import type { User } from '@/types';
import { useStore } from '@/store/useStore';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui/primitives';
import { Kebab, CopyChip, Select } from './ui';
import { INPUT_CX } from './ui';
import { StaffDrawer, type StaffPatch } from './StaffDrawer';
import { cx } from '@/utils';

/**
 * Settings → Staff.
 *
 * A real, GHL-style team table (not cards) with search + role filter, an Add
 * User flow, per-row action menu, and a full edit drawer. The roster is seeded
 * from the shared store but kept in local state so edits/additions are visible
 * for the demo session without mutating global data.
 */

type RoleFilter = 'all' | 'admin' | 'user';

const AVATAR_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#db2777', '#ea580c', '#0891b2'];

function statusTone(status: User['status']): 'good' | 'warn' | 'neutral' {
  if (status === 'active') return 'good';
  if (status === 'invited') return 'warn';
  return 'neutral';
}

export function StaffSection() {
  const seedUsers = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);

  const [roster, setRoster] = useState<User[]>(() => seedUsers.map((u) => ({ ...u })));
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'new'>('edit');
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title ?? '').toLowerCase().includes(q)
      );
    });
  }, [roster, query, roleFilter]);

  const openEdit = (user: User) => {
    setActiveUser(user);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openNew = () => {
    setActiveUser(null);
    setDrawerMode('new');
    setDrawerOpen(true);
  };

  const handleSave = (id: string | null, patch: StaffPatch) => {
    if (id) {
      setRoster((list) =>
        list.map((u) =>
          u.id === id
            ? { ...u, name: patch.name, email: patch.email, phone: patch.phone, role: patch.role, title: patch.title, status: patch.status }
            : u,
        ),
      );
      pushToast({ title: 'Staff member updated', description: `${patch.name}'s profile was saved.`, variant: 'success' });
    } else {
      const newUser: User = {
        id: `u_new_${Date.now()}`,
        name: patch.name,
        email: patch.email,
        phone: patch.phone || undefined,
        avatarColor: AVATAR_COLORS[roster.length % AVATAR_COLORS.length],
        role: patch.role,
        title: patch.title || undefined,
        status: patch.status === 'active' ? 'invited' : patch.status,
      };
      setRoster((list) => [...list, newUser]);
      pushToast({ title: 'Invite sent (demo)', description: `${patch.name} was added to the team.`, variant: 'success' });
    }
    setDrawerOpen(false);
  };

  const resendInvite = (u: User) =>
    pushToast({ title: 'Invite resent (demo)', description: `A new invite email would be sent to ${u.email}.`, variant: 'info' });

  const toggleStatus = (u: User) => {
    const next: User['status'] = u.status === 'disabled' ? 'active' : 'disabled';
    setRoster((list) => list.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    pushToast({
      title: next === 'disabled' ? 'User deactivated' : 'User reactivated',
      description: `${u.name} is now ${next}.`,
      variant: 'success',
    });
  };

  const removeUser = (u: User) => {
    setRoster((list) => list.filter((x) => x.id !== u.id));
    pushToast({ title: 'User removed (demo)', description: `${u.name} was removed from the team.`, variant: 'success' });
  };

  return (
    <div data-tour="settings.staff" className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">My Staff</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{roster.length} team members in this demo account.</p>
        </div>
        <Button size="sm" data-tour="settings.addConfig" onClick={openNew}>
          <Plus size={13} /> Add User
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or title"
            className={cx(INPUT_CX, 'pl-9')}
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="w-auto"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-2.5 font-bold">Name</th>
                <th className="px-4 py-2.5 font-bold">Phone</th>
                <th className="px-4 py-2.5 font-bold">Role</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">User ID</th>
                <th className="px-4 py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-surface-sunken/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-ink">{u.name}</span>
                          {u.isCurrentUser && <Badge tone="brand">You</Badge>}
                        </div>
                        <p className="truncate text-xs text-ink-muted">
                          {u.title ? `${u.title} · ` : ''}
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(u.status)}>{u.status ?? 'active'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <CopyChip value={u.id} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(u)}>
                        <Pencil size={12} /> Edit
                      </Button>
                      <Kebab
                        items={[
                          { label: 'Edit user', icon: <Pencil size={14} />, onClick: () => openEdit(u) },
                          ...(u.status === 'invited'
                            ? [{ label: 'Resend invite', icon: <Send size={14} />, onClick: () => resendInvite(u) }]
                            : []),
                          u.status === 'disabled'
                            ? { label: 'Reactivate', icon: <UserCheck size={14} />, onClick: () => toggleStatus(u) }
                            : { label: 'Deactivate', icon: <UserX size={14} />, onClick: () => toggleStatus(u) },
                          { label: 'Remove user', icon: <Trash2 size={14} />, onClick: () => removeUser(u), danger: true },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Users size={26} />}
            title="No matching staff"
            body="Try a different search term or role filter, or add a new user."
            action={
              <Button size="sm" onClick={openNew}>
                <Plus size={13} /> Add User
              </Button>
            }
          />
        )}
      </div>

      <StaffDrawer
        user={activeUser}
        mode={drawerMode}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
