import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { Field, SelectInput, inputCls } from './shared';
import { useProductivity } from '../state';
import type { Priority, TicketChannel, TicketStage } from '../types';
import { CHANNEL_LABEL, DEMO_COMPANIES, PRIORITIES, TEAM, TICKET_STAGES } from '../data';

export function CreateTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createTicket } = useProductivity();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [requester, setRequester] = useState('');
  const [company, setCompany] = useState(DEMO_COMPANIES[0]);
  const [channel, setChannel] = useState<TicketChannel>('email');
  const [priority, setPriority] = useState<Priority>('medium');
  const [stage, setStage] = useState<TicketStage>('open');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [tags, setTags] = useState('');

  const reset = () => {
    setSubject(''); setBody(''); setRequester(''); setCompany(DEMO_COMPANIES[0]);
    setChannel('email'); setPriority('medium'); setStage('open'); setAssigneeId(''); setDueAt(''); setTags('');
  };

  const handleClose = () => { reset(); onClose(); };

  const submit = () => {
    if (!subject.trim() || !requester.trim()) return;
    createTicket({
      subject,
      body,
      requester,
      company,
      channel,
      priority,
      stage,
      assigneeId: assigneeId || undefined,
      dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Ticket"
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button data-tour="productivity.create-ticket-submit" size="sm" disabled={!subject.trim() || !requester.trim()} onClick={submit}>
            Create Ticket
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Subject" required>
          <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" autoFocus />
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputCls} h-24 resize-none py-2`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What does the customer need? Add any relevant detail."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Requester" required>
            <input className={inputCls} value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="e.g. Jordan from Acme" />
          </Field>
          <Field label="Company">
            <SelectInput value={company} onChange={setCompany}>
              {DEMO_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Channel">
            <SelectInput value={channel} onChange={(v) => setChannel(v as TicketChannel)}>
              {(Object.keys(CHANNEL_LABEL) as TicketChannel[]).map((c) => (
                <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput value={priority} onChange={(v) => setPriority(v as Priority)}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Stage">
            <SelectInput value={stage} onChange={(v) => setStage(v as TicketStage)}>
              {TICKET_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <SelectInput value={assigneeId} onChange={setAssigneeId}>
              <option value="">— Unassigned —</option>
              {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Tags">
            <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" />
          </Field>
        </div>

        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">
          Demo mode: tickets are stored in memory for this session only — no email, no backend, no real customer data.
        </p>
      </div>
    </Modal>
  );
}
