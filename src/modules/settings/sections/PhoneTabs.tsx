import React, { useState } from 'react';
import { Mic, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { SettingsCard, Field, TextInput, TextArea, Select, ToggleRow, SaveBar } from './_ui';

/**
 * Secondary Phone System tabs (Messaging compliance, Voice, Trust Center,
 * Additional settings). Split out of PhoneSystem.tsx to keep each file focused.
 * All state is session-local demo data.
 */

/* --- Messaging Compliance --- */
const DEFAULT_OPT_OUT =
  'Reply STOP to unsubscribe at any time. Reply HELP for help. Message and data rates may apply. Message frequency varies.';

export function MessagingCompliance() {
  const pushToast = useStore((s) => s.pushToast);
  const [committed, setCommitted] = useState({
    optOut: DEFAULT_OPT_OUT,
    sender: 'Main Line - +1 (555) 400-1100',
    includeOptOut: true,
    linkShortener: true,
    quietHours: true,
  });
  const [form, setForm] = useState(committed);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const save = () => {
    setCommitted(form);
    pushToast({ title: 'Messaging settings saved', description: 'Compliance preferences updated. Demo only.', variant: 'success' });
  };

  return (
    <div className="space-y-4">
      <SettingsCard title="Compliance status" desc="A2P 10DLC registration for application-to-person messaging.">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusTile icon={<BadgeCheck size={16} className="text-good" />} label="Brand registration" value="Verified" tone="good" />
          <StatusTile icon={<BadgeCheck size={16} className="text-good" />} label="Campaign" value="Approved" tone="good" />
          <StatusTile icon={<AlertTriangle size={16} className="text-warn" />} label="Throughput" value="Standard (T-Mobile 2,000/day)" tone="warn" />
        </div>
      </SettingsCard>

      <SettingsCard title="Opt-out language" desc="Appended to outbound campaigns to stay compliant.">
        <ToggleRow
          label="Append opt-out language to campaigns"
          desc="Automatically include STOP/HELP instructions on the first message."
          checked={form.includeOptOut}
          onChange={(v) => set({ includeOptOut: v })}
        />
        <div className="mt-2">
          <Field label="Opt-out / disclosure text">
            <TextArea rows={3} value={form.optOut} onChange={(e) => set({ optOut: e.target.value })} />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title="Sender settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default sending number">
            <Select value={form.sender} onChange={(e) => set({ sender: e.target.value })}>
              <option>Main Line - +1 (555) 400-1100</option>
              <option>Sales - +1 (555) 400-1102</option>
              <option>Toll Free - +1 (555) 400-1101</option>
            </Select>
          </Field>
        </div>
        <div className="mt-1 rounded-xl border border-line px-4 py-1">
          <ToggleRow label="Auto-shorten links" desc="Wrap outbound links so clicks can be tracked." checked={form.linkShortener} onChange={(v) => set({ linkShortener: v })} />
          <div className="border-t border-line/70" />
          <ToggleRow label="Respect quiet hours" desc="Hold non-urgent messages outside 8am-9pm local time." checked={form.quietHours} onChange={(v) => set({ quietHours: v })} />
        </div>
        <SaveBar onSave={save} onCancel={() => setForm(committed)} />
      </SettingsCard>
    </div>
  );
}

/* --- Voice --- */
export function VoiceSettings() {
  const pushToast = useStore((s) => s.pushToast);
  const [committed, setCommitted] = useState({
    greeting: "Thanks for calling. Please leave a message and we'll get right back to you.",
    recordAll: true,
    disclosure: true,
    whisper: true,
    voicemailEmail: true,
  });
  const [form, setForm] = useState(committed);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const save = () => { setCommitted(form); pushToast({ title: 'Voice settings saved', variant: 'success' }); };

  return (
    <div className="space-y-4">
      <SettingsCard title="Call recording">
        <div className="rounded-xl border border-line px-4 py-1">
          <ToggleRow label="Record all calls by default" desc="New numbers inherit this setting." checked={form.recordAll} onChange={(v) => set({ recordAll: v })} />
          <div className="border-t border-line/70" />
          <ToggleRow label="Play recording disclosure" desc="Inform callers that the call may be recorded." checked={form.disclosure} onChange={(v) => set({ disclosure: v })} />
          <div className="border-t border-line/70" />
          <ToggleRow label="Enable whisper messages" desc="Announce the source before connecting the agent." checked={form.whisper} onChange={(v) => set({ whisper: v })} />
        </div>
      </SettingsCard>

      <SettingsCard title="Voicemail">
        <Field label="Default voicemail greeting">
          <TextArea rows={3} value={form.greeting} onChange={(e) => set({ greeting: e.target.value })} />
        </Field>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Recording... (demo only)', variant: 'info' })}>
            <Mic size={14} /> Record greeting
          </Button>
          <Button variant="ghost" size="sm" onClick={() => pushToast({ title: 'Upload audio - demo only', variant: 'info' })}>Upload audio</Button>
        </div>
        <div className="mt-2 rounded-xl border border-line px-4 py-1">
          <ToggleRow label="Email voicemails" desc="Send a transcript and audio link when a voicemail arrives." checked={form.voicemailEmail} onChange={(v) => set({ voicemailEmail: v })} />
        </div>
        <SaveBar onSave={save} onCancel={() => setForm(committed)} />
      </SettingsCard>
    </div>
  );
}

/* --- Trust Center --- */
export function TrustCenter() {
  return (
    <div className="space-y-4">
      <SettingsCard title="A2P Brand Registration" desc="Registered business identity used for messaging trust.">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Legal entity" value="Demo Business LLC" />
          <Row label="Brand status" value={<Badge tone="good">Verified</Badge>} />
          <Row label="EIN" value="00-0000000 (demo)" />
          <Row label="Vetting score" value="75 / 100" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Campaign Registration" desc="Use case approved with the messaging aggregator.">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Use case" value="Customer Care / Mixed" />
          <Row label="Campaign status" value={<Badge tone="good">Approved</Badge>} />
          <Row label="Sample messages" value="3 on file" />
          <Row label="Opt-in method" value="Web form + keyword" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Caller ID (CNAM)" desc="Outbound display name shown to recipients.">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Display name" value="DEMO BUSINESS" />
          <Row label="CNAM status" value={<Badge tone="warn">Pending</Badge>} />
        </dl>
      </SettingsCard>
    </div>
  );
}

/* --- Additional Settings --- */
export function AdditionalSettings() {
  const pushToast = useStore((s) => s.pushToast);
  const [committed, setCommitted] = useState({
    missedCallTextBack: true,
    callFromApp: true,
    businessHours: true,
    international: false,
    voicemailDrop: false,
  });
  const [form, setForm] = useState(committed);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const save = () => { setCommitted(form); pushToast({ title: 'Settings saved', variant: 'success' }); };

  return (
    <SettingsCard title="Additional phone settings">
      <div className="rounded-xl border border-line px-4 py-1">
        <ToggleRow label="Missed-call text-back" desc="Auto-text callers when a call is missed." checked={form.missedCallTextBack} onChange={(v) => set({ missedCallTextBack: v })} />
        <div className="border-t border-line/70" />
        <ToggleRow label="Call from mobile app" desc="Allow staff to place calls from the Kleegr app." checked={form.callFromApp} onChange={(v) => set({ callFromApp: v })} />
        <div className="border-t border-line/70" />
        <ToggleRow label="Business-hours routing" desc="Send after-hours calls straight to voicemail." checked={form.businessHours} onChange={(v) => set({ businessHours: v })} />
        <div className="border-t border-line/70" />
        <ToggleRow label="Allow international calling" desc="Enable outbound calls outside the US/Canada." checked={form.international} onChange={(v) => set({ international: v })} />
        <div className="border-t border-line/70" />
        <ToggleRow label="Voicemail drop" desc="Leave a pre-recorded voicemail with one tap." checked={form.voicemailDrop} onChange={(v) => set({ voicemailDrop: v })} />
      </div>
      <SaveBar onSave={save} onCancel={() => setForm(committed)} />
    </SettingsCard>
  );
}

/* --- small helpers --- */
function StatusTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'good' | 'warn' | 'bad' }) {
  const ring = tone === 'good' ? 'border-good/30' : tone === 'warn' ? 'border-warn/40' : 'border-bad/40';
  return (
    <div className={cx('rounded-xl border bg-surface px-4 py-3', ring)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{icon}{label}</div>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2 last:border-0 sm:last:border-b sm:[&:nth-last-child(2)]:border-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
