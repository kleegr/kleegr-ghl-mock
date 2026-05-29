import { useMemo, useState, type ReactNode } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Contact, Pipeline, User, Opportunity } from '@/types';
import { fullName, cx } from '@/utils';
import { Button } from '@/components/ui/primitives';
import { Overlay } from './Overlay';

/**
 * AddOpportunityModal — GHL-style "Create Opportunity" drawer.
 *
 * Mirrors the look of the Edit Opportunity drawer (left intro rail + form) so
 * the primary "Add opportunity" button opens a believable creation surface.
 *
 * Wired to the store's `addOpportunity` action: submitting prepends a real
 * in-memory opportunity (session-only, cleared by Reset Demo) and switches the
 * board to the new deal's pipeline so the card is immediately visible. The form
 * is fully real: validation, pipeline→stage dependency, contact/owner pickers.
 */

interface Props {
  pipelines: Pipeline[];
  contacts: Contact[];
  users: User[];
  /** Pipeline pre-selected from the board toolbar. */
  initialPipelineId: string;
  /** Called after a successful create so the board can switch to the new deal's pipeline. */
  onCreated?: (pipelineId: string) => void;
  onClose: () => void;
}

const inputCls =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20';

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink">
        {label} {required && <span className="text-bad">*</span>}
      </span>
      {children}
    </label>
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'appearance-none pr-9')}>
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
    </div>
  );
}

export function AddOpportunityModal({ pipelines, contacts, users, initialPipelineId, onCreated, onClose }: Props) {
  const addOpportunity = useStore((s) => s.addOpportunity);

  const [form, setForm] = useState({
    name: '',
    contactId: contacts[0]?.id ?? '',
    pipelineId: initialPipelineId || pipelines[0]?.id || '',
    stageId: '',
    status: 'open' as Opportunity['status'],
    value: '',
    ownerId: users.find((u) => u.isCurrentUser)?.id ?? users[0]?.id ?? '',
    source: '',
    tags: '',
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pipeline = pipelines.find((p) => p.id === form.pipelineId) ?? pipelines[0];
  const stages = useMemo(
    () => (pipeline?.stages.slice().sort((a, b) => a.order - b.order) ?? []),
    [pipeline],
  );
  // Keep stage valid whenever the pipeline changes.
  const effectiveStageId = stages.some((s) => s.id === form.stageId) ? form.stageId : stages[0]?.id ?? '';

  const isValid = Boolean(form.name.trim() && form.contactId);

  const handleCreate = () => {
    if (!isValid) return;
    addOpportunity({
      name: form.name,
      contactId: form.contactId,
      pipelineId: form.pipelineId,
      stageId: effectiveStageId,
      status: form.status,
      monetaryValue: parseFloat(form.value) || 0,
      ownerId: form.ownerId,
      source: form.source,
    });
    onCreated?.(form.pipelineId);
    onClose();
  };

  return (
    <Overlay onClose={onClose} maxWidth="max-w-2xl" tour="opportunities.create">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Create Opportunity</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Add a new deal to a pipeline and assign an owner.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          <Field label="Opportunity Name" required>
            <input
              autoFocus
              className={inputCls}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Acme Co — Website Redesign"
            />
          </Field>

          <Field label="Primary Contact" required>
            <SelectInput value={form.contactId} onChange={(v) => set('contactId', v)}>
              {contacts.length === 0 && <option value="">No contacts available</option>}
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)}{c.email ? ` · ${c.email}` : ''}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <Field label="Pipeline">
              <SelectInput value={form.pipelineId} onChange={(v) => set('pipelineId', v)}>
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Stage">
              <SelectInput value={effectiveStageId} onChange={(v) => set('stageId', v)}>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(v) => set('status', v as Opportunity['status'])}>
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="abandoned">Abandoned</option>
              </SelectInput>
            </Field>
            <Field label="Value">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">$</span>
                <input
                  className={cx(inputCls, 'pl-7')}
                  value={form.value}
                  onChange={(e) => set('value', e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </Field>
            <Field label="Owner">
              <SelectInput value={form.ownerId} onChange={(v) => set('ownerId', v)}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Source">
              <input className={inputCls} value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="e.g. Website Form" />
            </Field>
          </div>

          <Field label="Tags">
            <input className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Comma-separated, e.g. hot, inbound" />
          </Field>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-3.5">
        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" disabled={!isValid} onClick={handleCreate}>
          <Plus size={15} /> Create
        </Button>
      </div>
    </Overlay>
  );
}
