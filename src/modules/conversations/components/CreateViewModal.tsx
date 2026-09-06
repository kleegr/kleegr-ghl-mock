/**
 * CreateViewModal — a real "Create View" drawer for the inbox Views section.
 *
 * GHL lets you save a filtered inbox view (scope + status + channel). This is a
 * working, in-memory version: the saved view is returned to the inbox, appears
 * in the Views list, and applies its filter when selected. Nothing is persisted
 * across a refresh (demo-safe), but it is never a silent no-op.
 */
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import type { Channel } from '@/types';
import { CHANNEL_LABEL } from '../utils';

export interface SavedView {
  id: string;
  name: string;
  scope: 'mine' | 'team' | 'all';
  status: 'all' | 'unread' | 'starred';
  channel: Channel | 'any';
}

const SCOPES: { id: SavedView['scope']; label: string }[] = [
  { id: 'mine', label: 'My Inbox' },
  { id: 'team', label: 'Team Inbox' },
  { id: 'all', label: 'All channels' },
];

const STATUSES: { id: SavedView['status']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'starred', label: 'Starred' },
];

const CHANNELS: (Channel | 'any')[] = ['any', 'sms', 'email', 'whatsapp', 'telegram', 'instagram', 'facebook', 'webchat', 'call'];

const pillCls = (on: boolean) =>
  cx(
    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
    on ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
  );

export function CreateViewModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (view: SavedView) => void;
}) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<SavedView['scope']>('mine');
  const [status, setStatus] = useState<SavedView['status']>('unread');
  const [channel, setChannel] = useState<Channel | 'any'>('any');

  const reset = () => {
    setName('');
    setScope('mine');
    setStatus('unread');
    setChannel('any');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ id: `view_${Date.now()}`, name: trimmed, scope, status, channel });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create View"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            <Eye size={15} /> Create View
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink">View name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Unread SMS — My Inbox"
            autoFocus
            className="h-10 w-full rounded-lg border border-line bg-surface-sunken px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand/30"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink">Scope</span>
          <div className="flex flex-wrap gap-1.5">
            {SCOPES.map((s) => (
              <button key={s.id} type="button" onClick={() => setScope(s.id)} className={pillCls(scope === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={pillCls(status === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink">Channel</span>
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map((c) => (
              <button key={c} type="button" onClick={() => setChannel(c)} className={pillCls(channel === c)}>
                {c === 'any' ? 'Any' : CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <p className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
          Saved views are kept for this session only (demo). Selecting a view filters the inbox below.
        </p>
      </div>
    </Modal>
  );
}
