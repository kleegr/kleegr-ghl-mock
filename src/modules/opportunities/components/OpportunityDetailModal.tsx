import { useState, type ReactNode } from 'react';
import {
  X, UserRound, Search, ListFilter, SlidersHorizontal, Plus, ClipboardList,
  Trash2, Settings, Minus, ChevronDown,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Opportunity, Contact, User } from '@/types';
import { dateLabel, fullName, cx } from '@/utils';
import { Button } from '@/components/ui/primitives';
import { Overlay } from './Overlay';

interface Props {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
  onClose: () => void;
}

type Section =
  | 'details'
  | 'appointment'
  | 'tasks'
  | 'notes'
  | 'payments'
  | 'associated';

const NAV: { id: Section; label: string }[] = [
  { id: 'details', label: 'Opportunity Details' },
  { id: 'appointment', label: 'Book/Update Appointment' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'payments', label: 'Payments' },
  { id: 'associated', label: 'Associated Objects' },
];

/* ---- tiny field primitives (local to this drawer) ---- */
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
const inputCls =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20';

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, 'appearance-none pr-9')}
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
    </div>
  );
}

function EmptyPanel({ icon, title, body, cta }: { icon: ReactNode; title: string; body: string; cta: string }) {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">{icon}</span>
      <p className="mt-4 text-base font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
      <Button
        size="md"
        className="mt-5"
        onClick={() => pushToast({ title: `Demo: ${cta}`, description: 'This action is simulated in the demo.', variant: 'info' })}
      >
        <Plus size={15} /> {cta}
      </Button>
    </div>
  );
}

export function OpportunityDetailModal({ opportunity: opp, contacts, users, onClose }: Props) {
  const pipelines = useStore((s) => s.pipelines);
  const moveOpportunity = useStore((s) => s.moveOpportunity);
  const pushToast = useStore((s) => s.pushToast);

  const contact = contacts.find((c) => c.id === opp.contactId);
  const [section, setSection] = useState<Section>('details');
  const [hideEmpty, setHideEmpty] = useState(false);

  // Local editable copy (demo-only except Stage, which is wired to the store).
  const [draft, setDraft] = useState({
    name: opp.name,
    pipelineId: opp.pipelineId,
    stageId: opp.stageId,
    status: opp.status as Opportunity['status'],
    value: String(opp.monetaryValue),
    ownerId: opp.ownerId,
    source: opp.source ?? '',
  });
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const pipeline = pipelines.find((p) => p.id === draft.pipelineId) ?? pipelines[0];
  const stages = pipeline?.stages.slice().sort((a, b) => a.order - b.order) ?? [];

  const handleStageChange = (stageId: string) => {
    set('stageId', stageId);
    if (stageId !== opp.stageId) moveOpportunity(opp.id, stageId); // real, persisted move
  };

  const demo = (label: string) => {
    pushToast({ title: `Demo: ${label}`, description: 'This action is simulated in the demo.', variant: 'info' });
    onClose();
  };

  return (
    <Overlay onClose={onClose} maxWidth="max-w-6xl" tour="opportunities.detail">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Edit &ldquo;{opp.name}&rdquo;</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Add and edit opportunity details, tasks, notes and appointments.
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="hidden w-60 shrink-0 flex-col gap-0.5 border-r border-line py-3 sm:flex" aria-label="Opportunity sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={cx(
                'mx-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                section === n.id ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
              aria-current={section === n.id}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {section === 'details' && (
            <div className="space-y-6">
              {/* Contact details */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-base font-bold text-ink">
                    Contact details
                    <span className="grid h-5 w-5 place-items-center rounded text-brand"><UserRound size={16} /></span>
                  </h3>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={hideEmpty}
                      onChange={(e) => setHideEmpty(e.target.checked)}
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand/30"
                    />
                    Hide Empty Fields
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <Field label="Primary Contact Name" required>
                    <input className={inputCls} defaultValue={contact ? fullName(contact) : ''} />
                  </Field>
                  <Field label="Primary Email">
                    <input className={inputCls} defaultValue={contact?.email ?? ''} />
                  </Field>
                  <Field label="Primary Phone">
                    <input className={inputCls} defaultValue={contact?.phone ?? ''} />
                  </Field>
                  <Field label="Additional Contacts (Max: 10)">
                    <input className={inputCls} placeholder="Add additional contacts" />
                  </Field>
                </div>
              </div>

              {/* Opportunity details */}
              <div>
                <h3 className="text-base font-bold text-ink">Opportunity Details</h3>
                <div className="mt-3 space-y-4">
                  <Field label="Opportunity Name" required>
                    <input className={inputCls} value={draft.name} onChange={(e) => set('name', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                    <Field label="Pipeline">
                      <SelectInput value={draft.pipelineId} onChange={(v) => set('pipelineId', v)}>
                        {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="Stage">
                      <SelectInput value={draft.stageId} onChange={handleStageChange}>
                        {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="Status">
                      <SelectInput value={draft.status} onChange={(v) => set('status', v as Opportunity['status'])}>
                        <option value="open">Open</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="abandoned">Abandoned</option>
                      </SelectInput>
                    </Field>
                    <Field label="Value">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">$</span>
                        <input className={cx(inputCls, 'pl-7')} value={draft.value} onChange={(e) => set('value', e.target.value.replace(/[^0-9.]/g, ''))} />
                      </div>
                    </Field>
                    <Field label="Owner">
                      <SelectInput value={draft.ownerId} onChange={(v) => set('ownerId', v)}>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="Followers">
                      <input className={inputCls} placeholder="Add Followers" />
                    </Field>
                    <Field label="Source">
                      <input className={inputCls} value={draft.source} onChange={(e) => set('source', e.target.value)} />
                    </Field>
                    <Field label="Tags">
                      <input className={inputCls} placeholder="Add tags" />
                    </Field>
                  </div>
                  <Field label="Client number">
                    <div className="flex items-center gap-2">
                      <input className={inputCls} placeholder="Client number" />
                      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="decrease"><Minus size={15} /></button>
                      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="increase"><Plus size={15} /></button>
                    </div>
                  </Field>
                </div>
              </div>

              <button
                onClick={() => pushToast({ title: 'Demo: Manage Fields', description: 'Custom field management is simulated in the demo.', variant: 'info' })}
                className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                <Settings size={15} /> Add/Manage Fields
              </button>
            </div>
          )}

          {section === 'appointment' && (
            <EmptyPanel icon={<Plus size={26} />} title="No appointments yet" body="Book or update an appointment for this opportunity." cta="Book Appointment" />
          )}

          {section === 'tasks' && (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-ink">Tasks</h3>
                <div className="flex items-center gap-3 text-ink-muted">
                  <button className="hover:text-ink" aria-label="Filter tasks"><ListFilter size={18} /></button>
                  <button className="hover:text-ink" aria-label="Sort tasks"><SlidersHorizontal size={18} /></button>
                </div>
              </div>
              <button
                onClick={() => demo('Add Task')}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-soft py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft/70"
              >
                <Plus size={16} /> Add Task
              </button>
              <div className="relative mt-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
                <input className={cx(inputCls, 'pl-9')} placeholder="Search by task title" />
              </div>
              <EmptyPanel icon={<ClipboardList size={26} />} title="No tasks yet" body="Stay organized by creating your first task." cta="Add Task" />
            </div>
          )}

          {section === 'notes' && (
            <EmptyPanel icon={<Plus size={26} />} title="No notes yet" body="Capture context and updates about this opportunity." cta="Add Note" />
          )}
          {section === 'payments' && (
            <EmptyPanel icon={<Plus size={26} />} title="No payments yet" body="Record invoices and payments tied to this deal." cta="Add Payment" />
          )}
          {section === 'associated' && (
            <EmptyPanel icon={<Plus size={26} />} title="No associated objects" body="Link related records to this opportunity." cta="Add Association" />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-3.5">
        <p className="hidden text-xs text-ink-subtle sm:block">
          Created By: <span className="font-medium text-brand">Workflow</span>
          <span className="mx-2 text-ink-subtle/60">·</span>
          Created On {dateLabel(opp.createdAt)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => demo('Delete Opportunity')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-bad hover:bg-bad/5"
            aria-label="Delete opportunity"
          >
            <Trash2 size={16} />
          </button>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => demo('Update Opportunity')}>Update</Button>
        </div>
      </div>
    </Overlay>
  );
}
