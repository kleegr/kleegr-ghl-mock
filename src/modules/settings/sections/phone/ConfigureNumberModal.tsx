import { useEffect, useState } from 'react';
import { Phone as PhoneIcon } from 'lucide-react';
import { Button, Tabs } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { Field, TextInput, Select } from '../ui';
import { Toggle } from '../Toggle';
import {
  type PhoneRow,
  ROUTE_TARGETS,
  RING_TARGETS,
  TIMEOUT_OPTIONS,
} from './phoneData';

/**
 * Configure Number modal — opens from the Manage Numbers table (Configure) or
 * the Add Number dropdown. Three tabs mirror GHL's number config:
 * Basic Details · Call Forwarding · Advanced Settings. All local + demo-safe.
 */

interface Draft {
  friendlyName: string;
  number: string;
  recordCalls: boolean;
  routeKind: string;
  isDefault: boolean;
  // forwarding
  ringTarget: string;
  externalNumber: string;
  voiceAi: boolean;
  timeout: number;
  backup: string;
  // advanced
  whisper: string;
  callConnect: string;
  callerId: string;
  forwardingBehavior: string;
}

function draftFrom(row: PhoneRow | null): Draft {
  return {
    friendlyName: row?.friendlyName ?? '',
    number: row?.number ?? 'Auto-assigned on purchase',
    recordCalls: row?.recordCalls ?? true,
    routeKind: 'ring_user',
    isDefault: row?.isDefault ?? false,
    ringTarget: row?.owner ?? 'Demo User',
    externalNumber: '',
    voiceAi: false,
    timeout: row?.timeout ?? 25,
    backup: 'voicemail',
    whisper: 'Incoming call from your Demo Business line',
    callConnect: 'auto',
    callerId: 'called_number',
    forwardingBehavior: 'simultaneous',
  };
}

const TABS = [
  { id: 'basic', label: 'Basic Details' },
  { id: 'forwarding', label: 'Call Forwarding' },
  { id: 'advanced', label: 'Advanced Settings' },
];

export function ConfigureNumberModal({
  row,
  mode,
  open,
  onClose,
  onSave,
}: {
  row: PhoneRow | null;
  mode: 'configure' | 'add';
  open: boolean;
  onClose: () => void;
  onSave: (id: string | null, patch: Partial<PhoneRow>) => void;
}) {
  const [tab, setTab] = useState('basic');
  const [draft, setDraft] = useState<Draft>(() => draftFrom(row));

  useEffect(() => {
    if (open) {
      setDraft(draftFrom(row));
      setTab('basic');
    }
  }, [open, row]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    onSave(row?.id ?? null, {
      friendlyName: draft.friendlyName.trim() || 'Untitled number',
      recordCalls: draft.recordCalls,
      isDefault: draft.isDefault,
      timeout: draft.timeout,
      forwardTo:
        draft.routeKind === 'external'
          ? draft.externalNumber.trim() || 'External number'
          : draft.routeKind === 'ivr'
            ? 'IVR / call menu'
            : draft.routeKind === 'voice_ai'
              ? 'Voice AI agent'
              : draft.routeKind === 'voicemail'
                ? 'Voicemail'
                : draft.ringTarget,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={mode === 'add' ? 'Add a Phone Number' : `Configure ${row?.friendlyName ?? 'Number'}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            {mode === 'add' ? 'Add Number' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="-mt-1 mb-4">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'basic' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-2.5">
            <PhoneIcon size={16} className="text-brand" />
            <span className="font-mono text-sm text-ink">{draft.number}</span>
          </div>
          <Field label="Friendly name" hint="Helps your team recognize this number.">
            <TextInput
              value={draft.friendlyName}
              onChange={(e) => set('friendlyName', e.target.value)}
              placeholder="e.g. Main Line"
            />
          </Field>
          <Field label="Calls go to">
            <Select value={draft.routeKind} onChange={(e) => set('routeKind', e.target.value)}>
              {ROUTE_TARGETS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
            <div>
              <p className="text-sm text-ink">Record calls</p>
              <p className="text-xs text-ink-muted">Store recordings on the contact timeline (demo).</p>
            </div>
            <Toggle checked={draft.recordCalls} onChange={(v) => set('recordCalls', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
            <div>
              <p className="text-sm text-ink">Set as default number</p>
              <p className="text-xs text-ink-muted">Used as the outbound caller ID for new messages & calls.</p>
            </div>
            <Toggle checked={draft.isDefault} onChange={(v) => set('isDefault', v)} />
          </div>
        </div>
      )}

      {tab === 'forwarding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Route to user / team">
              <Select value={draft.ringTarget} onChange={(e) => set('ringTarget', e.target.value)}>
                {RING_TARGETS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="External number" hint="Optional — forward to an outside line.">
              <TextInput
                value={draft.externalNumber}
                onChange={(e) => set('externalNumber', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
            <Field label="Ring timeout (seconds)">
              <Select value={String(draft.timeout)} onChange={(e) => set('timeout', Number(e.target.value))}>
                {TIMEOUT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s} seconds</option>
                ))}
              </Select>
            </Field>
            <Field label="Backup destination" hint="Where the call goes if nobody answers.">
              <Select value={draft.backup} onChange={(e) => set('backup', e.target.value)}>
                <option value="voicemail">Voicemail</option>
                <option value="ivr">IVR / call menu</option>
                <option value="team">Ring the whole team</option>
                <option value="hangup">Play message & hang up</option>
              </Select>
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
            <div>
              <p className="text-sm text-ink">Use Voice AI agent</p>
              <p className="text-xs text-ink-muted">Answer with an AI receptionist before routing (demo).</p>
            </div>
            <Toggle checked={draft.voiceAi} onChange={(v) => set('voiceAi', v)} />
          </div>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-4">
          <Field label="Whisper message" hint="Played to the agent before connecting the caller.">
            <TextInput value={draft.whisper} onChange={(e) => set('whisper', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Call connect">
              <Select value={draft.callConnect} onChange={(e) => set('callConnect', e.target.value)}>
                <option value="auto">Connect automatically</option>
                <option value="press">Require key press to accept</option>
              </Select>
            </Field>
            <Field label="Caller ID shown to agent">
              <Select value={draft.callerId} onChange={(e) => set('callerId', e.target.value)}>
                <option value="called_number">This number</option>
                <option value="contact_number">Contact's number</option>
              </Select>
            </Field>
            <Field label="Forwarding behavior" className="sm:col-span-2">
              <Select value={draft.forwardingBehavior} onChange={(e) => set('forwardingBehavior', e.target.value)}>
                <option value="simultaneous">Ring all destinations at once</option>
                <option value="sequential">Ring destinations in order</option>
              </Select>
            </Field>
          </div>
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
            These advanced options are illustrative for the demo and aren't connected to a live carrier.
          </p>
        </div>
      )}
    </Modal>
  );
}
