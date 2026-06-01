import { useMemo, useState, type ReactNode } from 'react';
import {
  Plus, Phone, ShieldCheck, ChevronDown, Settings2, Star, Trash2, Hash, BadgeCheck,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, EmptyState, Tabs } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { KebabMenu, type MenuItem } from './_ui';
import {
  ConfigureNumberModal,
  blankPhoneRecord,
  forwardingLabel,
  type PhoneRecord,
} from './ConfigureNumberModal';
import { MessagingCompliance, VoiceSettings, TrustCenter, AdditionalSettings } from './PhoneTabs';

/**
 * Settings -> Phone System hub.
 *
 * Top-level tabs (Phone Numbers / Messaging / Voice / Trust Center / Additional)
 * mirror GHL's phone settings. The Phone Numbers tab is a full "Manage Numbers"
 * table wired to the ConfigureNumberModal (add + edit), seeded from the demo
 * store's phoneNumbers. The remaining tabs render the compliance / voice /
 * trust / additional panels from PhoneTabs. All state is session-local.
 */

type TabId = 'numbers' | 'messaging' | 'voice' | 'trust' | 'additional';

const TABS = [
  { id: 'numbers', label: 'Phone Numbers' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'voice', label: 'Voice' },
  { id: 'trust', label: 'Trust Center' },
  { id: 'additional', label: 'Additional Settings' },
];

const STATUS_TONE: Record<PhoneRecord['status'], 'good' | 'warn' | 'neutral'> = {
  active: 'good',
  porting: 'warn',
  inactive: 'neutral',
};

/* Seed the rich PhoneRecord rows from the store's lightweight PhoneNumbers. */
function seedNumbers(
  base: { id: string; number: string; label: string; type: 'local' | 'toll_free'; status: 'active' | 'inactive' | 'porting' }[],
): PhoneRecord[] {
  return base.map((n, i) =>
    blankPhoneRecord({
      id: n.id,
      number: n.number,
      label: n.label,
      type: n.type,
      status: n.status,
      isDefault: i === 0,
      a2p: i === 0,
      callsGoTo: i === 0 ? 'Front Desk' : i === 1 ? 'Support Team' : 'Sales Team',
      forwardMode: i === 1 ? 'team' : 'user',
      timeoutSec: i === 1 ? 30 : 20,
      recordCalls: i !== 1,
      createdAt: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24 * 21).toISOString(),
    }),
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export function PhoneSection() {
  const storeNumbers = useStore((s) => s.phoneNumbers);
  const pushToast = useStore((s) => s.pushToast);

  const [tab, setTab] = useState<TabId>('numbers');
  const [numbers, setNumbers] = useState<PhoneRecord[]>(() => seedNumbers(storeNumbers));
  const [config, setConfig] = useState<{ mode: 'add' | 'edit'; record: PhoneRecord } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const a2pVerified = useMemo(() => numbers.some((n) => n.a2p), [numbers]);

  /* Save from the Configure modal - keep a single default across the table. */
  const saveRecord = (rec: PhoneRecord) => {
    setNumbers((list) => {
      const exists = list.some((n) => n.id === rec.id);
      let next = exists ? list.map((n) => (n.id === rec.id ? rec : n)) : [...list, rec];
      if (rec.isDefault) next = next.map((n) => (n.id === rec.id ? n : { ...n, isDefault: false }));
      return next;
    });
  };

  const makeDefault = (id: string) => {
    setNumbers((list) => list.map((n) => ({ ...n, isDefault: n.id === id })));
    pushToast({ title: 'Default number updated', variant: 'success' });
  };

  const release = (rec: PhoneRecord) => {
    setNumbers((list) => list.filter((n) => n.id !== rec.id));
    pushToast({ title: 'Number released', description: `${rec.label} (${rec.number}) released (demo only).`, variant: 'info' });
  };

  const openAdd = (type: 'local' | 'toll_free') => {
    setAddOpen(false);
    setConfig({
      mode: 'add',
      record: blankPhoneRecord({ type, label: type === 'toll_free' ? 'New Toll-Free' : 'New Local Number' }),
    });
  };

  const menuFor = (n: PhoneRecord): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'Configure', icon: <Settings2 size={14} />, onClick: () => setConfig({ mode: 'edit', record: n }) },
    ];
    if (!n.isDefault) items.push({ label: 'Set as default', icon: <Star size={14} />, onClick: () => makeDefault(n.id) });
    items.push({ label: 'Release number', icon: <Trash2 size={14} />, danger: true, onClick: () => release(n) });
    return items;
  };

  return (
    <div data-tour="settings.configSection" className="space-y-4">
      <div>
        <p className="text-sm font-bold text-ink">Phone System</p>
        <p className="mt-0.5 text-xs text-ink-muted">Numbers, messaging compliance, voice, and trust settings.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as TabId)} />

      {tab === 'numbers' && (
        <div className="space-y-4">
          {/* A2P / compliance banner */}
          <div
            className={cx(
              'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3',
              a2pVerified ? 'border-good/30 bg-good/5' : 'border-warn/40 bg-warn/5',
            )}
          >
            <ShieldCheck size={18} className={a2pVerified ? 'text-good' : 'text-warn'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                A2P 10DLC messaging {a2pVerified ? 'registered' : 'registration needed'}
              </p>
              <p className="text-xs text-ink-muted">
                {a2pVerified
                  ? 'Brand and campaign are approved for application-to-person texting.'
                  : 'Register your brand to send compliant SMS from these numbers.'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTab('trust')}>View Trust Center</Button>
          </div>

          {/* Manage Numbers */}
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-ink">Manage Numbers</p>
              <div className="relative">
                <Button size="sm" data-tour="settings.addConfig" onClick={() => setAddOpen((o) => !o)}>
                  <Plus size={13} /> Add number <ChevronDown size={13} />
                </Button>
                {addOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAddOpen(false)} />
                    <div className="animate-pop absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop">
                      <DropItem icon={<Phone size={14} />} title="Buy a local number" onClick={() => openAdd('local')} />
                      <DropItem icon={<Hash size={14} />} title="Buy a toll-free number" onClick={() => openAdd('toll_free')} />
                      <DropItem icon={<BadgeCheck size={14} />} title="Import an existing number" onClick={() => openAdd('local')} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                    <th className="px-4 py-2.5 font-semibold">Number</th>
                    <th className="px-4 py-2.5 font-semibold">Forwarding</th>
                    <th className="px-4 py-2.5 font-semibold">Timeout</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Added</th>
                    <th className="w-10 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {numbers.map((n) => (
                    <tr key={n.id} className="transition-colors hover:bg-surface-sunken/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfig({ mode: 'edit', record: n })}
                            className="font-semibold text-ink hover:text-brand hover:underline"
                          >
                            {n.number}
                          </button>
                          {n.isDefault && <Badge tone="brand">Default</Badge>}
                          {n.a2p && <Badge tone="good">A2P</Badge>}
                        </div>
                        <p className="text-xs text-ink-muted">
                          {n.label} - {n.type === 'toll_free' ? 'Toll-free' : 'Local'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{forwardingLabel(n)}</td>
                      <td className="px-4 py-3 text-ink-muted">{n.timeoutSec}s</td>
                      <td className="px-4 py-3"><Badge tone={STATUS_TONE[n.status]}>{n.status}</Badge></td>
                      <td className="px-4 py-3 text-ink-muted">{fmtDate(n.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <KebabMenu items={menuFor(n)} ariaLabel={`Actions for ${n.label}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {numbers.length === 0 && (
              <EmptyState
                icon={<Phone size={26} />}
                title="No phone numbers"
                body="Add a local or toll-free number to start making and receiving calls."
                action={<Button size="sm" onClick={() => openAdd('local')}><Plus size={13} /> Add number</Button>}
              />
            )}
          </div>
          <p className="text-xs text-ink-subtle">{numbers.length} number{numbers.length === 1 ? '' : 's'} - demo-safe 555 range, not provisioned.</p>
        </div>
      )}

      {tab === 'messaging' && <MessagingCompliance />}
      {tab === 'voice' && <VoiceSettings />}
      {tab === 'trust' && <TrustCenter />}
      {tab === 'additional' && <AdditionalSettings />}

      {config && (
        <ConfigureNumberModal
          mode={config.mode}
          record={config.record}
          onClose={() => setConfig(null)}
          onSave={saveRecord}
        />
      )}
    </div>
  );
}

function DropItem({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-sunken"
    >
      <span className="text-ink-subtle">{icon}</span>
      {title}
    </button>
  );
}
