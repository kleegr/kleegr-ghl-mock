import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ChevronDown, Settings2, Star, Trash2, Hash, PhoneOutgoing, ArrowRightLeft, Phone as PhoneIcon, AlertTriangle } from 'lucide-react';
import { Button, Badge, EmptyState } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { Kebab } from '../ui';
import { cx, dateLabel } from '@/utils';
import { ConfigureNumberModal } from './ConfigureNumberModal';
import { INITIAL_NUMBERS, type PhoneRow, a2pLabel, a2pTone } from './phoneData';

/**
 * Manage Numbers — the table inside the Phone System hub's "Phone Numbers" tab.
 * Owns the (local, demo-safe) list of numbers, the Add Number dropdown, and the
 * Configure Number modal. Status/default/A2P badges + a per-row action menu.
 */

const ADD_OPTIONS = [
  { id: 'local', label: 'Buy a local number', icon: <Hash size={14} /> },
  { id: 'toll_free', label: 'Buy a toll-free number', icon: <PhoneOutgoing size={14} /> },
  { id: 'port', label: 'Port an existing number', icon: <ArrowRightLeft size={14} /> },
];

export function ManageNumbers() {
  const pushToast = useStore((s) => s.pushToast);
  const [numbers, setNumbers] = useState<PhoneRow[]>(() => INITIAL_NUMBERS.map((n) => ({ ...n })));

  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'configure' | 'add'>('configure');
  const [activeRow, setActiveRow] = useState<PhoneRow | null>(null);

  useEffect(() => {
    if (!addOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAddOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [addOpen]);

  const pendingCount = useMemo(() => numbers.filter((n) => n.a2p !== 'registered').length, [numbers]);

  const startAdd = (kind: string) => {
    setAddOpen(false);
    if (kind === 'port') {
      pushToast({ title: 'Port a number (demo)', description: 'Number porting is illustrative in this demo.', variant: 'info' });
      return;
    }
    setActiveRow({
      id: '',
      number: 'Auto-assigned on purchase',
      friendlyName: kind === 'toll_free' ? 'New Toll-Free Number' : 'New Local Number',
      type: kind === 'toll_free' ? 'toll_free' : 'local',
      status: 'active',
      forwardTo: 'Demo User',
      timeout: 25,
      recordCalls: true,
      isDefault: false,
      a2p: 'pending',
      createdAt: new Date().toISOString(),
      owner: 'Demo User',
    });
    setModalMode('add');
    setModalOpen(true);
  };

  const configure = (row: PhoneRow) => {
    setActiveRow(row);
    setModalMode('configure');
    setModalOpen(true);
  };

  const makeDefault = (row: PhoneRow) => {
    setNumbers((list) => list.map((n) => ({ ...n, isDefault: n.id === row.id })));
    pushToast({ title: 'Default number updated', description: `${row.friendlyName} is now your default.`, variant: 'success' });
  };

  const release = (row: PhoneRow) => {
    setNumbers((list) => list.filter((n) => n.id !== row.id));
    pushToast({ title: 'Number released (demo)', description: `${row.number} was removed from the account.`, variant: 'success' });
  };

  const handleSave = (id: string | null, patch: Partial<PhoneRow>) => {
    if (id) {
      setNumbers((list) =>
        list.map((n) => {
          if (n.id !== id) return patch.isDefault ? { ...n, isDefault: false } : n;
          return { ...n, ...patch };
        }),
      );
      pushToast({ title: 'Number saved', description: `${patch.friendlyName ?? 'Number'} was updated.`, variant: 'success' });
    } else {
      const newRow: PhoneRow = {
        id: `ph_new_${Date.now()}`,
        number: `+1 (555) 400-1${(100 + numbers.length + 3).toString().slice(-2)}`,
        friendlyName: patch.friendlyName ?? 'New Number',
        type: activeRow?.type ?? 'local',
        status: 'active',
        forwardTo: patch.forwardTo ?? 'Demo User',
        timeout: patch.timeout ?? 25,
        recordCalls: patch.recordCalls ?? true,
        isDefault: !!patch.isDefault,
        a2p: 'pending',
        createdAt: new Date().toISOString(),
        owner: 'Demo User',
      };
      setNumbers((list) => [...list.map((n) => (newRow.isDefault ? { ...n, isDefault: false } : n)), newRow]);
      pushToast({ title: 'Number added (demo)', description: `${newRow.friendlyName} is ready to use.`, variant: 'success' });
    }
    setModalOpen(false);
  };

  return (
    <div data-tour="settings.configSection" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Manage Numbers</h3>
          <p className="mt-0.5 text-xs text-ink-muted">{numbers.length} active {numbers.length === 1 ? 'number' : 'numbers'} on this account.</p>
        </div>

        {/* Add Number dropdown */}
        <div ref={addRef} className="relative">
          <Button size="sm" data-tour="settings.addConfig" onClick={() => setAddOpen((o) => !o)}>
            <Plus size={13} /> Add Number <ChevronDown size={13} />
          </Button>
          {addOpen && (
            <div className="absolute right-0 z-30 mt-1 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
              {ADD_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => startAdd(o.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-sunken"
                >
                  <span className="text-ink-subtle">{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-xs text-ink">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>
            {pendingCount} {pendingCount === 1 ? 'number is' : 'numbers are'} still completing A2P registration. Messaging
            throughput may be limited until registration is approved.
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                <th className="px-5 py-2.5">Number</th>
                <th className="px-4 py-2.5">Forwarding</th>
                <th className="px-4 py-2.5">Timeout</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {numbers.map((n) => (
                <tr key={n.id} className="transition-colors hover:bg-surface-sunken/50">
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono font-semibold text-ink">{n.number}</span>
                      {n.isDefault && <Badge tone="brand">Default</Badge>}
                      <Badge tone={a2pTone(n.a2p)}>{a2pLabel(n.a2p)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {n.friendlyName} · {n.type === 'toll_free' ? 'Toll-free' : 'Local'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{n.forwardTo}</td>
                  <td className="px-4 py-3 text-ink-muted tabular-nums">{n.timeout}s</td>
                  <td className="px-4 py-3">
                    <Badge tone={n.status === 'active' ? 'good' : 'neutral'}>{n.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    <div>{dateLabel(n.createdAt)}</div>
                    <div className="text-[11px] text-ink-subtle">{n.owner}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => configure(n)}>
                        <Settings2 size={12} /> Configure
                      </Button>
                      <Kebab
                        items={[
                          { label: 'Configure', icon: <Settings2 size={14} />, onClick: () => configure(n) },
                          ...(n.isDefault
                            ? []
                            : [{ label: 'Set as default', icon: <Star size={14} />, onClick: () => makeDefault(n) }]),
                          { label: 'Release number', icon: <Trash2 size={14} />, onClick: () => release(n), danger: true },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {numbers.length === 0 && (
          <EmptyState
            icon={<PhoneIcon size={26} />}
            title="No phone numbers yet"
            body="Add a local or toll-free number to start making and receiving calls."
            action={
              <Button size="sm" onClick={() => startAdd('local')}>
                <Plus size={13} /> Add Number
              </Button>
            }
          />
        )}
      </div>

      <ConfigureNumberModal
        row={activeRow}
        mode={modalMode}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
