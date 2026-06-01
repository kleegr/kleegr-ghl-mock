import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Send, UserCheck, UserX, Trash2, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { fieldCls, Select, CopyId, KebabMenu, type MenuItem } from './_ui';
import { StaffDrawer } from './StaffDrawer';
import {
  buildStaff,
  blankStaffMember,
  fullStaffName,
  type StaffMember,
  type StaffStatus,
} from './staffModel';

/**
 * Settings -> Staff.
 *
 * A GHL-style staff roster table (search + role/status filters + row count)
 * wired to the StaffDrawer editor. The list is seeded from the demo store's
 * users via buildStaff() and then held in local state, so add/edit/status
 * changes and removals update the table immediately. Everything is
 * session-local and demo-safe - no real people, no persistence.
 */

const STATUS_TONE: Record<StaffStatus, 'good' | 'warn' | 'neutral'> = {
  active: 'good',
  invited: 'warn',
  disabled: 'neutral',
};

type DrawerState = { mode: 'edit' | 'add'; member: StaffMember } | null;

export function StaffSection() {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);

  const [staff, setStaff] = useState<StaffMember[]>(() => buildStaff(users));
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'User'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StaffStatus>('all');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        fullStaffName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q)
      );
    });
  }, [staff, query, roleFilter, statusFilter]);

  const upsert = (m: StaffMember) => {
    setStaff((list) => {
      const exists = list.some((x) => x.id === m.id);
      return exists ? list.map((x) => (x.id === m.id ? m : x)) : [m, ...list];
    });
    pushToast({
      title: drawer?.mode === 'add' ? 'User added' : 'User updated',
      description: `${fullStaffName(m) || 'User'} saved for this demo session.`,
      variant: 'success',
    });
    setDrawer(null);
  };

  const setStatus = (id: string, status: StaffStatus, label: string) => {
    setStaff((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
    pushToast({ title: label, variant: 'success' });
  };

  const removeMember = (m: StaffMember) => {
    setStaff((list) => list.filter((x) => x.id !== m.id));
    pushToast({ title: 'User removed', description: `${fullStaffName(m)} was removed (demo only).`, variant: 'info' });
  };

  const menuFor = (m: StaffMember): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'Edit user', icon: <Pencil size={14} />, onClick: () => setDrawer({ mode: 'edit', member: m }) },
    ];
    if (m.status === 'invited') {
      items.push({ label: 'Resend invite', icon: <Send size={14} />, onClick: () => pushToast({ title: 'Invite resent', description: `Invitation re-sent to ${m.email} (demo only).`, variant: 'info' }) });
      items.push({ label: 'Mark active', icon: <UserCheck size={14} />, onClick: () => setStatus(m.id, 'active', 'User activated') });
    } else if (m.status === 'active') {
      items.push({ label: 'Deactivate', icon: <UserX size={14} />, onClick: () => setStatus(m.id, 'disabled', 'User deactivated') });
    } else {
      items.push({ label: 'Reactivate', icon: <UserCheck size={14} />, onClick: () => setStatus(m.id, 'active', 'User reactivated') });
    }
    if (!m.isCurrentUser) {
      items.push({ label: 'Remove user', icon: <Trash2 size={14} />, danger: true, onClick: () => removeMember(m) });
    }
    return items;
  };

  const activeCount = staff.filter((m) => m.status === 'active').length;

  return (
    <div data-tour="settings.staff" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">My Staff</p>
          <p className="mt-0.5 text-xs text-ink-muted">{staff.length} users - {activeCount} active</p>
        </div>
        <Button
          size="sm"
          data-tour="settings.addConfig"
          onClick={() => setDrawer({ mode: 'add', member: blankStaffMember() })}
        >
          <Plus size={13} /> Add user
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className={cx(fieldCls, 'pl-9')}
          />
        </div>
        <div className="w-36">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} aria-label="Filter by role">
            <option value="all">All roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </Select>
        </div>
        <div className="w-40">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Phone</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">User ID</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((m) => (
                <tr key={m.id} className="group transition-colors hover:bg-surface-sunken/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={fullStaffName(m)} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDrawer({ mode: 'edit', member: m })}
                            className="truncate text-sm font-semibold text-ink hover:text-brand hover:underline"
                          >
                            {fullStaffName(m) || 'Unnamed user'}
                          </button>
                          {m.isCurrentUser && <Badge tone="brand">You</Badge>}
                        </div>
                        <p className="truncate text-xs text-ink-muted">{m.title ? `${m.title} - ` : ''}{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{m.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.role === 'Admin' ? 'brand' : 'neutral'}>{m.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3"><CopyId id={m.id} label="User ID" /></td>
                  <td className="px-4 py-3 text-right">
                    <KebabMenu items={menuFor(m)} ariaLabel={`Actions for ${fullStaffName(m)}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Users size={26} />}
            title="No users match"
            body="Try a different search or clear the role and status filters."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setQuery(''); setRoleFilter('all'); setStatusFilter('all'); }}>
                Clear filters
              </Button>
            }
          />
        )}
      </div>

      <p className="text-xs text-ink-subtle">Showing {filtered.length} of {staff.length} users.</p>

      {drawer && (
        <StaffDrawer
          member={drawer.member}
          onClose={() => setDrawer(null)}
          onSave={upsert}
        />
      )}
    </div>
  );
}
