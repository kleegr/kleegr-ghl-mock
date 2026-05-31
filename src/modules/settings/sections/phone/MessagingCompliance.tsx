import { useState } from 'react';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { Button, Badge } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { GroupCard, Field, TextInput, TextArea, Select, KeyValue, SaveBar } from '../ui';
import { Toggle } from '../Toggle';

/**
 * Messaging / Compliance tab inside the Phone System hub.
 * A2P brand + campaign status, sender defaults, and opt-out handling. Local +
 * demo-safe — Save just confirms; nothing is registered with a real carrier.
 */
export function MessagingCompliance() {
  const pushToast = useStore((s) => s.pushToast);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  const [autoOptOut, setAutoOptOut] = useState(true);
  const [includeStop, setIncludeStop] = useState(true);
  const [throttle, setThrottle] = useState('balanced');
  const [optOutCopy, setOptOutCopy] = useState('Reply STOP to unsubscribe at any time.');
  const [senderName, setSenderName] = useState('Demo Business');

  const save = () => {
    setDirty(false);
    pushToast({ title: 'Messaging settings saved', description: 'Compliance preferences updated for this demo session.', variant: 'success' });
  };
  const cancel = () => setDirty(false);

  return (
    <div data-tour="settings.configSection" className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-ink">Messaging Compliance</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          A2P 10DLC registration and opt-out handling for SMS sent from this account.
        </p>
      </div>

      {/* Registration status */}
      <GroupCard
        title="A2P 10DLC registration"
        desc="Carrier registration required for application-to-person SMS in the US."
        action={<Badge tone="good">Registered</Badge>}
      >
        <div className="divide-y divide-line">
          <KeyValue label="Brand status">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-good" /> Verified
            </span>
          </KeyValue>
          <KeyValue label="Campaign use case">Customer care &amp; account notifications</KeyValue>
          <KeyValue label="Daily message limit">3,000 segments / day (demo)</KeyValue>
        </div>
      </GroupCard>

      {/* Sender settings */}
      <GroupCard title="Sender settings" bodyClassName="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default sender name" hint="Shown where supported by the carrier.">
            <TextInput value={senderName} onChange={(e) => { setSenderName(e.target.value); touch(); }} />
          </Field>
          <Field label="Sending throughput">
            <Select value={throttle} onChange={(e) => { setThrottle(e.target.value); touch(); }}>
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced (recommended)</option>
              <option value="aggressive">Maximum</option>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Append opt-out language to first message</p>
            <p className="text-xs text-ink-muted">Automatically include STOP instructions on the first SMS to a contact.</p>
          </div>
          <Toggle checked={includeStop} onChange={(v) => { setIncludeStop(v); touch(); }} />
        </div>
      </GroupCard>

      {/* Opt-out handling */}
      <GroupCard title="Opt-out handling" bodyClassName="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Honor STOP / UNSUBSCRIBE automatically</p>
            <p className="text-xs text-ink-muted">Contacts who reply STOP are flagged Do-Not-Disturb instantly.</p>
          </div>
          <Toggle checked={autoOptOut} onChange={(v) => { setAutoOptOut(v); touch(); }} />
        </div>
        <Field label="Opt-out footer text">
          <TextArea rows={2} value={optOutCopy} onChange={(e) => { setOptOutCopy(e.target.value); touch(); }} />
        </Field>
        <div className="flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2.5 text-xs text-ink-muted">
          <MessageSquare size={14} className="mt-0.5 shrink-0 text-ink-subtle" />
          <span>
            This is a demo environment — no live messages are sent and no real carrier registration is performed.
          </span>
        </div>
      </GroupCard>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SaveBar onCancel={cancel} onSave={save} dirty={dirty} />
      </div>
    </div>
  );
}
