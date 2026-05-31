/**
 * Calendar Settings → Connections.
 *
 * Per-staff view of connected calendar accounts and video conferencing, with
 * connect/disconnect demo actions and an empty state. No real Google/Microsoft
 * APIs — connecting just shows polished demo feedback.
 */
import { useState } from 'react';
import {
  Calendar, Video, Mail, Link2, RefreshCw, AlertTriangle,
  CheckCircle2, Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Badge, Button, Card, EmptyState } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { CONNECTIONS_BY_USER } from '../data';
import type { ConnectionAccount, ConnectionProvider } from '../types';

const PROVIDER_ICON: Record<ConnectionProvider, typeof Calendar> = {
  google: Calendar,
  outlook: Mail,
  ical: Link2,
  zoom: Video,
  google_meet: Video,
};

const CALENDAR_PROVIDERS: { id: ConnectionProvider; label: string; desc: string }[] = [
  { id: 'google', label: 'Google Calendar', desc: 'Two-way sync with Google Calendar' },
  { id: 'outlook', label: 'Outlook Calendar', desc: 'Two-way sync with Microsoft 365' },
  { id: 'ical', label: 'iCal feed', desc: 'One-way read-only iCal subscription' },
];
const VIDEO_PROVIDERS: { id: ConnectionProvider; label: string; desc: string }[] = [
  { id: 'zoom', label: 'Zoom', desc: 'Auto-create Zoom links on booking' },
  { id: 'google_meet', label: 'Google Meet', desc: 'Auto-create Meet links on booking' },
];

type ConnTab = 'calendar' | 'video';

export function Connections() {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);

  const [userId, setUserId] = useState(users[0]?.id ?? '');
  const [tab, setTab] = useState<ConnTab>('calendar');

  const accounts = CONNECTIONS_BY_USER[userId] ?? [];
  const visible = accounts.filter((a) => a.kind === tab);
  const providers = tab === 'calendar' ? CALENDAR_PROVIDERS : VIDEO_PROVIDERS;
  const connectedProviders = new Set(visible.map((a) => a.provider));

  const connect = (label: string) =>
    pushToast({
      title: `Connect ${label}`,
      description: 'Account connection is a demo — no external account is linked.',
      variant: 'info',
    });

  return (
    <div className="space-y-5" data-tour="calendars.connections">
      {/* Staff selector */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Staff member
        </p>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const count = (CONNECTIONS_BY_USER[u.id] ?? []).length;
            const active = u.id === userId;
            return (
              <button
                key={u.id}
                onClick={() => setUserId(u.id)}
                className={cx(
                  'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-brand bg-brand-soft font-semibold text-brand'
                    : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
                )}
              >
                <Avatar name={u.name} size="xs" />
                <span>{u.name}</span>
                <span className={cx('rounded-full px-1.5 text-[10px] font-bold', active ? 'bg-brand text-brand-fg' : 'bg-line text-ink-subtle')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'calendar', label: 'Calendar Sync', count: accounts.filter((a) => a.kind === 'calendar').length },
          { id: 'video', label: 'Video Conferencing', count: accounts.filter((a) => a.kind === 'video').length },
        ]}
        active={tab}
        onChange={(id) => setTab(id as ConnTab)}
      />

      {/* Connected accounts */}
      {visible.length === 0 ? (
        <EmptyState
          icon={tab === 'calendar' ? <Calendar size={32} /> : <Video size={32} />}
          title={tab === 'calendar' ? 'No calendars connected' : 'No conferencing connected'}
          body={
            tab === 'calendar'
              ? 'Connect a calendar to keep availability in sync and avoid double-bookings.'
              : 'Connect a video tool to auto-generate meeting links on every booking.'
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2">
          {visible.map((a) => (
            <ConnectionCard key={a.id} account={a} pushToast={pushToast} />
          ))}
        </div>
      )}

      {/* Available to connect */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Available
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {providers.map((p) => {
            const Icon = PROVIDER_ICON[p.id];
            const already = connectedProviders.has(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{p.label}</p>
                    <p className="truncate text-xs text-ink-muted">{p.desc}</p>
                  </div>
                </div>
                <Button
                  variant={already ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => connect(p.label)}
                  disabled={already}
                >
                  {already ? 'Connected' : <><Plus size={13} /> Connect</>}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({
  account,
  pushToast,
}: {
  account: ConnectionAccount;
  pushToast: (t: { title: string; description?: string; variant: 'default' | 'success' | 'info' }) => void;
}) {
  const Icon = PROVIDER_ICON[account.provider];
  const status = account.status;
  return (
    <Card className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{account.label}</p>
            {account.primary && <Badge tone="brand">Primary</Badge>}
          </div>
          {account.email && <p className="truncate text-xs text-ink-muted">{account.email}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === 'connected' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
            <CheckCircle2 size={14} /> Synced
          </span>
        )}
        {status === 'syncing' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn">
            <RefreshCw size={14} className="animate-spin" /> Syncing
          </span>
        )}
        {status === 'error' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad">
            <AlertTriangle size={14} /> Needs attention
          </span>
        )}
        {status === 'error' ? (
          <Button
            variant="secondary"
            size="xs"
            onClick={() => pushToast({ title: 'Reconnecting account', description: 'Demo only — no external account is linked.', variant: 'info' })}
          >
            Reconnect
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => pushToast({ title: `${account.label} disconnected`, description: 'Demo only — nothing was changed externally.', variant: 'info' })}
          >
            Disconnect
          </Button>
        )}
      </div>
    </Card>
  );
}
