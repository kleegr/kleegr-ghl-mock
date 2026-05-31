import { useState } from 'react';
import { ShieldCheck, BadgeCheck } from 'lucide-react';
import { Button, Badge } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { GroupCard, Field, TextInput, Select, KeyValue, SaveBar } from '../ui';
import { Toggle } from '../Toggle';

/* Lighter Phone System hub tabs: Voice, Trust Center, Additional Settings.
 * Grouped here to keep the phone/ folder tidy. All local + demo-safe. */

/* ── Voice ───────────────────────────────────────────────────────────────────── */
export function VoiceSettings() {
  const pushToast = useStore((s) => s.pushToast);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);
  const [recordAll, setRecordAll] = useState(true);
  const [transcribe, setTranscribe] = useState(true);
  const [vmEmail, setVmEmail] = useState(true);
  const [hold, setHold] = useState('soft_piano');
  const [timeout, setTimeoutVal] = useState('25');

  const save = () => { setDirty(false); pushToast({ title: 'Voice settings saved', variant: 'success' }); };

  return (
    <div data-tour="settings.configSection" className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-ink">Voice</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Account-wide defaults for calls, recording, and voicemail.</p>
      </div>

      <GroupCard title="Call recording & voicemail" bodyClassName="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Record all calls by default</p>
            <p className="text-xs text-ink-muted">New numbers inherit this setting.</p>
          </div>
          <Toggle checked={recordAll} onChange={(v) => { setRecordAll(v); touch(); }} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Transcribe voicemails</p>
            <p className="text-xs text-ink-muted">Add a text transcript to the contact timeline.</p>
          </div>
          <Toggle checked={transcribe} onChange={(v) => { setTranscribe(v); touch(); }} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Email voicemails to the assigned user</p>
            <p className="text-xs text-ink-muted">Send an email notification with the recording.</p>
          </div>
          <Toggle checked={vmEmail} onChange={(v) => { setVmEmail(v); touch(); }} />
        </div>
      </GroupCard>

      <GroupCard title="Defaults" bodyClassName="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default ring timeout (seconds)">
            <Select value={timeout} onChange={(e) => { setTimeoutVal(e.target.value); touch(); }}>
              {['15', '20', '25', '30', '45'].map((s) => (
                <option key={s} value={s}>{s} seconds</option>
              ))}
            </Select>
          </Field>
          <Field label="Hold music">
            <Select value={hold} onChange={(e) => { setHold(e.target.value); touch(); }}>
              <option value="soft_piano">Soft piano</option>
              <option value="upbeat">Upbeat</option>
              <option value="ringtone">Ringback tone</option>
              <option value="none">Silence</option>
            </Select>
          </Field>
        </div>
      </GroupCard>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SaveBar onCancel={() => setDirty(false)} onSave={save} dirty={dirty} />
      </div>
    </div>
  );
}

/* ── Trust Center ─────────────────────────────────────────────────────────── */
export function TrustCenter() {
  const pushToast = useStore((s) => s.pushToast);
  const [cnam, setCnam] = useState('Demo Business');

  return (
    <div data-tour="settings.configSection" className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-ink">Trust Center</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Caller identity and verification status for your numbers.</p>
      </div>

      <GroupCard title="Verification status" action={<Badge tone="good">Verified</Badge>}>
        <div className="divide-y divide-line">
          <KeyValue label="Business identity">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-good" /> Approved</span>
          </KeyValue>
          <KeyValue label="Caller ID (CNAM)">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} className="text-good" /> Registered</span>
          </KeyValue>
          <KeyValue label="Shaken/STIR attestation">Level A (full attestation) — demo</KeyValue>
        </div>
      </GroupCard>

      <GroupCard title="Caller ID display name" desc="Name shown on outbound calls where CNAM is supported.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="CNAM display name" className="min-w-0 flex-1">
            <TextInput value={cnam} onChange={(e) => setCnam(e.target.value)} />
          </Field>
          <Button
            size="sm"
            onClick={() => pushToast({ title: 'Submitted for review (demo)', description: 'CNAM updates are illustrative in this demo.', variant: 'info' })}
          >
            Submit for review
          </Button>
        </div>
      </GroupCard>
    </div>
  );
}

/* ── Additional Settings ────────────────────────────────────────────────── */
export function AdditionalSettings() {
  const pushToast = useStore((s) => s.pushToast);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);
  const [missedText, setMissedText] = useState(true);
  const [afterHours, setAfterHours] = useState('voicemail');
  const [hours, setHours] = useState('9to5');

  const save = () => { setDirty(false); pushToast({ title: 'Settings saved', variant: 'success' }); };

  return (
    <div data-tour="settings.configSection" className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-ink">Additional Settings</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Business hours and automated call handling.</p>
      </div>

      <GroupCard title="Business hours & routing" bodyClassName="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business hours">
            <Select value={hours} onChange={(e) => { setHours(e.target.value); touch(); }}>
              <option value="9to5">Mon–Fri, 9:00 AM – 5:00 PM</option>
              <option value="extended">Mon–Sat, 8:00 AM – 8:00 PM</option>
              <option value="247">Open 24/7</option>
            </Select>
          </Field>
          <Field label="After-hours calls go to">
            <Select value={afterHours} onChange={(e) => { setAfterHours(e.target.value); touch(); }}>
              <option value="voicemail">Voicemail</option>
              <option value="ivr">IVR / call menu</option>
              <option value="forward">Forward to on-call user</option>
              <option value="ai">Voice AI agent</option>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
          <div>
            <p className="text-sm text-ink">Missed-call text-back</p>
            <p className="text-xs text-ink-muted">Automatically text contacts when a call is missed.</p>
          </div>
          <Toggle checked={missedText} onChange={(v) => { setMissedText(v); touch(); }} />
        </div>
      </GroupCard>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SaveBar onCancel={() => setDirty(false)} onSave={save} dirty={dirty} />
      </div>
    </div>
  );
}
