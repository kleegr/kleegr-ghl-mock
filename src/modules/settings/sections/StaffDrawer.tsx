import { useMemo, useState } from 'react';
import { Upload, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button, Badge, Tabs, Avatar } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { Field, TextInput, TextArea, Select, Drawer } from './_ui';
import { Toggle } from './Toggle';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSION_IDS,
  STAFF_TIMEZONES,
  WEEKDAYS,
  defaultPermissions,
  fullStaffName,
  type StaffMember,
  type StaffRole,
  type Weekday,
} from './staffModel';

interface Props {
  member: StaffMember;
  onClose: () => void;
  onSave: (m: StaffMember) => void;
}

type TabId = 'info' | 'permissions' | 'call' | 'availability';

const TABS = [
  { id: 'info', label: 'User Info' },
  { id: 'permissions', label: 'Roles & Permissions' },
  { id: 'call', label: 'Call & Voicemail' },
  { id: 'availability', label: 'Availability' },
];

export function StaffDrawer({ member, onClose, onSave }: Props) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<TabId>('info');
  const [draft, setDraft] = useState<StaffMember>(member);

  const set = <K extends keyof StaffMember>(k: K, v: StaffMember[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setCall = (patch: Partial<StaffMember['call']>) => setDraft((d) => ({ ...d, call: { ...d.call, ...patch } }));
  const togglePerm = (id: string) => setDraft((d) => ({ ...d, permissions: { ...d.permissions, [id]: !d.permissions[id] } }));
  const setDay = (day: Weekday, patch: Partial<StaffMember['availability'][Weekday]>) =>
    setDraft((d) => ({ ...d, availability: { ...d.availability, [day]: { ...d.availability[day], ...patch } } }));

  const grantedCount = useMemo(
    () => ALL_PERMISSION_IDS.filter((id) => draft.permissions[id]).length,
    [draft.permissions],
  );

  const changeRole = (role: StaffRole) => setDraft((d) => ({ ...d, role, permissions: defaultPermissions(role) }));

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
      <Button size="sm" onClick={() => onSave(draft)}>Save User</Button>
    </>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title={fullStaffName(draft) || 'Edit User'}
      subtitle={draft.email}
      icon={<Avatar name={fullStaffName(draft)} size="md" />}
      footer={footer}
      width="xl"
    >
      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as TabId)} className="mb-5" />

      {tab === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required>
              <TextInput value={draft.first} onChange={(e) => set('first', e.target.value)} />
            </Field>
            <Field label="Last Name">
              <TextInput value={draft.last} onChange={(e) => set('last', e.target.value)} />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Role">
              <Select value={draft.role} onChange={(e) => changeRole(e.target.value as StaffRole)}>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </Select>
            </Field>
            <Field label="Timezone">
              <Select value={draft.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {STAFF_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <TextInput value={draft.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
          </div>
          <Field label="Email Signature" hint="Appended to outbound emails sent by this user.">
            <TextArea rows={4} value={draft.signature} onChange={(e) => set('signature', e.target.value)} />
          </Field>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-sunken p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">User Role</p>
                <p className="text-xs text-ink-muted">{grantedCount} of {ALL_PERMISSION_IDS.length} permissions enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-line bg-surface p-0.5">
                {(['Admin', 'User'] as StaffRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRole(r)}
                    className={cx(
                      'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                      draft.role === r ? 'bg-brand text-brand-fg' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, permissions: defaultPermissions(d.role) }))}
              >
                <RotateCcw size={13} /> Reset
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.id} className="overflow-hidden rounded-xl border border-line">
                <p className="border-b border-line bg-surface-sunken px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
                  {group.label}
                </p>
                <div className="divide-y divide-line">
                  {group.permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <span className="text-sm text-ink">{perm.label}</span>
                      <Toggle checked={!!draft.permissions[perm.id]} onChange={() => togglePerm(perm.id)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'call' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line">
            <p className="border-b border-line px-4 py-2.5 text-sm font-bold text-ink">Inbound Calls</p>
            <div className="divide-y divide-line">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm text-ink">Forward calls to my phone</p>
                  <p className="text-xs text-ink-muted">Ring this user's mobile alongside the web app.</p>
                </div>
                <Toggle checked={draft.call.forwardToPhone} onChange={(v) => setCall({ forwardToPhone: v })} />
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm text-ink">Record incoming calls</p>
                  <p className="text-xs text-ink-muted">Store recordings on the contact timeline.</p>
                </div>
                <Toggle checked={draft.call.recordCalls} onChange={(v) => setCall({ recordCalls: v })} />
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm text-ink">Enable WhatsApp calls</p>
                  <p className="text-xs text-ink-muted">Allow inbound calls over WhatsApp.</p>
                </div>
                <Toggle checked={draft.call.whatsapp} onChange={(v) => setCall({ whatsapp: v })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ring devices">
              <Select value={draft.call.routing} onChange={(e) => setCall({ routing: e.target.value as StaffMember['call']['routing'] })}>
                <option value="web">Web app only</option>
                <option value="phone">Forwarding number only</option>
                <option value="both">Web app + forwarding number</option>
              </Select>
            </Field>
            <Field label="Ring timeout (seconds)" hint="Send to voicemail after this many seconds.">
              <TextInput
                type="number"
                min={5}
                max={120}
                value={draft.call.timeoutSec}
                onChange={(e) => setCall({ timeoutSec: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>

          <Field label="Voicemail greeting">
            <TextArea rows={3} value={draft.call.voicemailGreeting} onChange={(e) => setCall({ voicemailGreeting: e.target.value })} />
          </Field>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Record greeting', description: 'Recording is simulated in the demo.', variant: 'info' })}>
              Record greeting
            </Button>
            <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Upload greeting', description: 'Audio upload is simulated in the demo.', variant: 'info' })}>
              <Upload size={13} /> Upload audio
            </Button>
          </div>
        </div>
      )}

      {tab === 'availability' && (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">Weekly hours this user is available for calls and booked appointments ({draft.timezone}).</p>
          <div className="overflow-hidden rounded-xl border border-line">
            {WEEKDAYS.map((day) => {
              const a = draft.availability[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                  <div className="flex w-28 items-center gap-2.5">
                    <Toggle checked={a.enabled} onChange={(v) => setDay(day, { enabled: v })} />
                    <span className={cx('text-sm font-semibold', a.enabled ? 'text-ink' : 'text-ink-subtle')}>{day}</span>
                  </div>
                  {a.enabled ? (
                    <div className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="time"
                        value={a.from}
                        onChange={(e) => setDay(day, { from: e.target.value })}
                        className="h-8 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                      />
                      <span className="text-ink-subtle">to</span>
                      <input
                        type="time"
                        value={a.to}
                        onChange={(e) => setDay(day, { to: e.target.value })}
                        className="h-8 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  ) : (
                    <Badge tone="neutral">Unavailable</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Drawer>
  );
}
