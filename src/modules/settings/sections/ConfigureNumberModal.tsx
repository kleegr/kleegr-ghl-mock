import { useState } from 'react';
import { Phone, PhoneForwarded, Settings2 } from 'lucide-react';
import { Button, Tabs } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { ModalShell, Field, TextInput, Select, TextArea, ToggleRow } from './_ui';

/**
 * The provisioned-number record used across the Phone System hub. It is richer
 * than the store's PhoneNumber (which only knows number/label/type/status) so
 * the Configure modal can round-trip forwarding + advanced settings without
 * touching shared state. Everything here is session-local demo data.
 */
export interface PhoneRecord {
  id: string;
  number: string;
  label: string;
  type: 'local' | 'toll_free';
  status: 'active' | 'inactive' | 'porting';
  /* Basic */
  recordCalls: boolean;
  callsGoTo: string;
  isDefault: boolean;
  /* Call forwarding */
  forwardMode: 'user' | 'team' | 'external' | 'ivr';
  externalNumber: string;
  timeoutSec: number;
  backupDestination: string;
  /* Advanced */
  whisperMessage: string;
  callConnect: boolean;
  callerId: 'number' | 'name';
  forwardingBehavior: 'simultaneous' | 'sequential';
  /* Meta */
  a2p: boolean;
  createdAt: string;
}

export const RING_TIMEOUTS = [10, 15, 20, 25, 30, 45] as const;

/** Demo-safe routing destinations (no real users). */
export const ROUTING_TARGETS = [
  'Demo User',
  'Sales Team',
  'Support Team',
  'Front Desk',
  'Voicemail',
  'IVR / Voice AI',
] as const;

const BACKUP_TARGETS = ['Voicemail', 'Front Desk', 'Sales Team', 'Hang up'] as const;

let phoneSeq = 0;
const demoNumber = () => `+1 (555) 4${String(20 + (phoneSeq % 79)).padStart(2, '0')}-${String(1100 + (++phoneSeq % 800)).slice(0, 4)}`;

/** A fresh record for the Add Number flow. */
export function blankPhoneRecord(seed: Partial<PhoneRecord> = {}): PhoneRecord {
  return {
    id: `ph_new_${++phoneSeq}`,
    number: demoNumber(),
    label: 'New Number',
    type: 'local',
    status: 'active',
    recordCalls: true,
    callsGoTo: 'Demo User',
    isDefault: false,
    forwardMode: 'user',
    externalNumber: '',
    timeoutSec: 20,
    backupDestination: 'Voicemail',
    whisperMessage: 'Incoming call from your Kleegr demo line',
    callConnect: false,
    callerId: 'number',
    forwardingBehavior: 'simultaneous',
    a2p: false,
    createdAt: new Date().toISOString(),
    ...seed,
  };
}

/** Friendly summary of where a number routes - used in the Manage Numbers table. */
export function forwardingLabel(r: PhoneRecord): string {
  switch (r.forwardMode) {
    case 'external':
      return r.externalNumber ? `External - ${r.externalNumber}` : 'External number';
    case 'team':
      return `${r.callsGoTo} (team)`;
    case 'ivr':
      return 'IVR / Voice AI';
    default:
      return r.callsGoTo;
  }
}

interface Props {
  mode: 'add' | 'edit';
  record: PhoneRecord;
  onClose: () => void;
  onSave: (rec: PhoneRecord) => void;
}

type TabId = 'basic' | 'forwarding' | 'advanced';

export function ConfigureNumberModal({ mode, record, onClose, onSave }: Props) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<TabId>('basic');
  const [draft, setDraft] = useState<PhoneRecord>(record);

  const set = (patch: Partial<PhoneRecord>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    onSave(draft);
    pushToast({
      title: mode === 'add' ? 'Number added' : 'Number updated',
      description: `${draft.label} (${draft.number}) saved. Demo only - not persisted.`,
      variant: 'success',
    });
    onClose();
  };

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="sm" onClick={save}>
        {mode === 'add' ? 'Add Number' : 'Save Number'}
      </Button>
    </>
  );

  const icon =
    tab === 'forwarding' ? <PhoneForwarded size={18} /> : tab === 'advanced' ? <Settings2 size={18} /> : <Phone size={18} />;

  return (
    <ModalShell
      onClose={onClose}
      title={mode === 'add' ? 'Add Phone Number' : 'Configure Number'}
      subtitle={`${draft.number} - ${draft.label}`}
      footer={footer}
    >
      <div className="px-6 pt-4">
        <Tabs
          variant="underline"
          active={tab}
          onChange={(id) => setTab(id as TabId)}
          tabs={[
            { id: 'basic', label: 'Basic Details' },
            { id: 'forwarding', label: 'Call Forwarding' },
            { id: 'advanced', label: 'Advanced Settings' },
          ]}
        />
      </div>

      <div className="px-6 py-5">
        {tab === 'basic' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-subtle">{icon}<span className="text-xs">Identify this number and where calls land first.</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Friendly name" required>
                <TextInput value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder="Main Line" />
              </Field>
              <Field label="Phone number" hint="Demo numbers use the reserved 555 range.">
                <TextInput value={draft.number} onChange={(e) => set({ number: e.target.value })} />
              </Field>
              <Field label="Number type">
                <Select value={draft.type} onChange={(e) => set({ type: e.target.value as PhoneRecord['type'] })}>
                  <option value="local">Local</option>
                  <option value="toll_free">Toll-free</option>
                </Select>
              </Field>
              <Field label="Calls go to">
                <Select value={draft.callsGoTo} onChange={(e) => set({ callsGoTo: e.target.value })}>
                  {ROUTING_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <div className="rounded-xl border border-line px-4 py-1">
              <ToggleRow
                label="Record calls"
                desc="Store recordings for inbound and outbound calls on this number."
                checked={draft.recordCalls}
                onChange={(v) => set({ recordCalls: v })}
              />
              <div className="border-t border-line/70" />
              <ToggleRow
                label="Set as default number"
                desc="Use this number as the default caller ID for outbound calls and texts."
                checked={draft.isDefault}
                onChange={(v) => set({ isDefault: v })}
              />
            </div>
          </div>
        )}

        {tab === 'forwarding' && (
          <div className="space-y-4">
            <Field label="Route incoming calls to">
              <Select value={draft.forwardMode} onChange={(e) => set({ forwardMode: e.target.value as PhoneRecord['forwardMode'] })}>
                <option value="user">A specific user</option>
                <option value="team">A team / ring group</option>
                <option value="external">An external number</option>
                <option value="ivr">IVR / Voice AI menu</option>
              </Select>
            </Field>

            {(draft.forwardMode === 'user' || draft.forwardMode === 'team') && (
              <Field label={draft.forwardMode === 'team' ? 'Team' : 'User'}>
                <Select value={draft.callsGoTo} onChange={(e) => set({ callsGoTo: e.target.value })}>
                  {ROUTING_TARGETS.filter((t) => t !== 'Voicemail' && t !== 'IVR / Voice AI').map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            )}

            {draft.forwardMode === 'external' && (
              <Field label="External number" hint="Demo only - calls are not actually forwarded.">
                <TextInput
                  value={draft.externalNumber}
                  onChange={(e) => set({ externalNumber: e.target.value })}
                  placeholder="+1 (555) 010-0199"
                />
              </Field>
            )}

            {draft.forwardMode === 'ivr' && (
              <div className="rounded-lg border border-line bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
                Calls will play your IVR / Voice AI menu. Build menu options in the Voice tab.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ring timeout">
                <Select value={String(draft.timeoutSec)} onChange={(e) => set({ timeoutSec: Number(e.target.value) })}>
                  {RING_TIMEOUTS.map((s) => <option key={s} value={s}>{s} seconds</option>)}
                </Select>
              </Field>
              <Field label="Backup destination" hint="Where unanswered calls land.">
                <Select value={draft.backupDestination} onChange={(e) => set({ backupDestination: e.target.value })}>
                  {BACKUP_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        )}

        {tab === 'advanced' && (
          <div className="space-y-4">
            <Field label="Whisper message" hint="Played to the agent before connecting the caller.">
              <TextArea
                rows={2}
                value={draft.whisperMessage}
                onChange={(e) => set({ whisperMessage: e.target.value })}
                placeholder="Call from your business line..."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Outbound caller ID">
                <Select value={draft.callerId} onChange={(e) => set({ callerId: e.target.value as PhoneRecord['callerId'] })}>
                  <option value="number">Show number</option>
                  <option value="name">Show business name</option>
                </Select>
              </Field>
              <Field label="Forwarding behavior">
                <Select
                  value={draft.forwardingBehavior}
                  onChange={(e) => set({ forwardingBehavior: e.target.value as PhoneRecord['forwardingBehavior'] })}
                >
                  <option value="simultaneous">Ring all at once</option>
                  <option value="sequential">Ring in order</option>
                </Select>
              </Field>
            </div>
            <div className="rounded-xl border border-line px-4 py-1">
              <ToggleRow
                label="Require key press to connect"
                desc="Caller presses 1 before the call connects (reduces spam / robocalls)."
                checked={draft.callConnect}
                onChange={(v) => set({ callConnect: v })}
              />
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
