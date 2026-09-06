import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity, Bot, BriefcaseBusiness, CalendarDays, Check, CheckSquare, ChevronLeft,
  DollarSign, FileText, ListTodo, Pencil, Plus, Receipt,
  RefreshCw, Search, Send, Share2, Sparkles, StickyNote, Tag, TicketCheck, Trash2, User, X,
} from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx, fullName, money } from '@/utils';
import type { Appointment, Contact, Opportunity, Task } from '@/types';
import {
  useConversationRecords,
  type ConversationDocument,
  type ConversationNote,
  type ConversationPayment,
  type ConversationProjectTask,
  type ConversationTicket,
  type ConversationTicketMessage,
  type NoteColor,
} from '../ConversationRecords';

type PanelKey =
  | 'contact' | 'activity' | 'associations' | 'opportunities' | 'tasks' | 'notes'
  | 'appointments' | 'documents' | 'payments' | 'agent-logs' | 'tickets' | 'project-tasks';

type Editor =
  | { kind: 'note'; item?: ConversationNote }
  | { kind: 'ticket'; item?: ConversationTicket }
  | { kind: 'ticket-message'; ticketId: string; item?: ConversationTicketMessage }
  | { kind: 'document'; item?: ConversationDocument }
  | { kind: 'payment'; item?: ConversationPayment }
  | { kind: 'project-task'; item?: ConversationProjectTask }
  | { kind: 'task'; item?: Task }
  | { kind: 'appointment'; item?: Appointment }
  | { kind: 'opportunity'; item?: Opportunity }
  | { kind: 'company' }
  | null;

const RAIL: Array<{ key: PanelKey; label: string; Icon: React.ElementType }> = [
  { key: 'contact', label: 'Contact details', Icon: User },
  { key: 'activity', label: 'Activity', Icon: Activity },
  { key: 'associations', label: 'Associations', Icon: Share2 },
  { key: 'opportunities', label: 'Opportunities', Icon: BriefcaseBusiness },
  { key: 'tasks', label: 'Tasks', Icon: CheckSquare },
  { key: 'notes', label: 'Notes', Icon: StickyNote },
  { key: 'appointments', label: 'Appointments', Icon: CalendarDays },
  { key: 'documents', label: 'Documents', Icon: FileText },
  { key: 'payments', label: 'Payments', Icon: DollarSign },
  { key: 'agent-logs', label: 'Agent logs', Icon: Bot },
];

const ALL_PANELS = new Set<PanelKey>([...RAIL.map((item) => item.key), 'tickets', 'project-tasks']);
const inputClass = 'h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20';
const textAreaClass = `${inputClass} h-auto min-h-24 resize-y py-2`;

function PanelHeader({ title, count, onClose, onAdd }: { title: string; count?: number; onClose: () => void; onAdd?: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
      <h2 className="text-[15px] font-bold text-ink">{title}{count === undefined ? '' : ` (${count})`}</h2>
      <div className="flex items-center gap-1">
        {onAdd && <button type="button" onClick={onAdd} className="flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-brand hover:bg-brand-soft"><Plus size={13} /> Add</button>}
        <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close panel"><X size={16} /></button>
      </div>
    </div>
  );
}

function Empty({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-ink-muted">{icon}<p className="text-[13px]">{title}</p>{action}</div>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-ink-subtle">
      <Search size={14} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-subtle" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={12} /></button>}
    </label>
  );
}

function CardActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {onEdit && <button type="button" onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Edit"><Pencil size={13} /></button>}
      <button type="button" onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-bad/10 hover:text-bad" aria-label="Delete"><Trash2 size={13} /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-ink-muted">{label}</span>{children}</label>;
}

export function ConversationContextPanel({ contact }: { contact: Contact }) {
  const [params, setParams] = useSearchParams();
  const rawPanel = params.get('panel') as PanelKey | null;
  const active: PanelKey | null = rawPanel === null ? 'contact' : rawPanel === ('closed' as PanelKey) ? null : ALL_PANELS.has(rawPanel) ? rawPanel : 'contact';
  const setActive = (panel: PanelKey | null) => {
    const next = new URLSearchParams(params);
    next.set('panel', panel ?? 'closed');
    setParams(next, { replace: true });
  };

  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState('');
  const [contactEditing, setContactEditing] = useState(false);
  const [contactDraft, setContactDraft] = useState(contact);
  const [tagDraft, setTagDraft] = useState('');
  const [companyChoice, setCompanyChoice] = useState(contact.companyId ?? '');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const users = useStore((state) => state.users);
  const companies = useStore((state) => state.companies);
  const pipelines = useStore((state) => state.pipelines);
  const calendars = useStore((state) => state.calendars);
  const messages = useStore((state) => state.messages);
  const conversations = useStore((state) => state.conversations);
  const calls = useStore((state) => state.calls);
  const opportunities = useStore((state) => state.opportunities.filter((item) => item.contactId === contact.id));
  const appointments = useStore((state) => state.appointments.filter((item) => item.contactId === contact.id));
  const tasks = useStore((state) => state.tasks.filter((item) => item.contactId === contact.id));
  const updateContact = useStore((state) => state.updateContact);
  const addTag = useStore((state) => state.addTagToContacts);
  const removeTag = useStore((state) => state.removeTagFromContacts);
  const assignOwner = useStore((state) => state.assignOwnerToContacts);
  const addCompany = useStore((state) => state.addCompany);
  const setContactCompany = useStore((state) => state.setContactCompany);
  const addOpportunity = useStore((state) => state.addOpportunity);
  const updateOpportunity = useStore((state) => state.updateOpportunity);
  const removeOpportunity = useStore((state) => state.removeOpportunity);
  const addAppointment = useStore((state) => state.addAppointment);
  const updateAppointment = useStore((state) => state.updateAppointment);
  const removeAppointment = useStore((state) => state.removeAppointment);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const removeTask = useStore((state) => state.removeTask);
  const toggleTask = useStore((state) => state.toggleTask);
  const pushToast = useStore((state) => state.pushToast);

  const records = useConversationRecords();
  const notes = records.notesFor(contact.id);
  const tickets = records.ticketsFor(contact.id);
  const documents = records.documentsFor(contact.id);
  const payments = records.paymentsFor(contact.id);
  const projectTasks = records.projectTasksFor(contact.id);
  const recordActivities = records.activitiesFor(contact.id);
  const currentUser = users.find((user) => user.isCurrentUser) ?? users[0];

  const close = () => setActive(null);
  const saved = (label: string) => pushToast({ title: `${label} saved`, description: 'Available for this demo session.', variant: 'success' });
  const deleteNotice = (label: string) => pushToast({ title: `${label} deleted`, description: 'Removed from this demo session.', variant: 'success' });

  const contactConversationIds = useMemo(() => new Set(conversations.filter((item) => item.contactId === contact.id).map((item) => item.id)), [conversations, contact.id]);
  const contactMessages = useMemo(() => messages.filter((item) => contactConversationIds.has(item.conversationId)), [messages, contactConversationIds]);
  const lowerQuery = query.trim().toLowerCase();
  const matches = (...values: Array<string | undefined>) => !lowerQuery || values.some((value) => value?.toLowerCase().includes(lowerQuery));

  const activityItems = useMemo(() => [
    ...recordActivities.map((item) => ({ id: item.id, at: item.createdAt, title: item.title, detail: item.detail ?? item.actor })),
    ...contactMessages.map((item) => ({ id: item.id, at: item.createdAt, title: `${item.direction === 'inbound' ? 'Received' : 'Sent'} ${item.channel} message`, detail: item.body })),
    ...calls.filter((item) => item.contactId === contact.id).map((item) => ({ id: item.id, at: item.createdAt, title: `${item.direction} call`, detail: item.durationSec ? `${Math.floor(item.durationSec / 60)}m ${item.durationSec % 60}s` : 'No answer' })),
    ...opportunities.map((item) => ({ id: item.id, at: item.updatedAt, title: 'Opportunity updated', detail: `${item.name} · ${item.status}` })),
    { id: `created-${contact.id}`, at: contact.createdAt, title: 'Contact created', detail: `Source: ${contact.source}` },
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)), [recordActivities, contactMessages, calls, opportunities, contact]);

  const contactBody = (
    <>
      <PanelHeader title="Contact Details" onClose={close} />
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={fullName(contact)} size="lg" />
          <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-bold text-ink">{fullName(contact)}</p><p className="truncate text-[12px] text-ink-muted">{contact.email}</p></div>
          <Button size="xs" variant={contactEditing ? 'secondary' : 'ghost'} onClick={() => { setContactDraft(contact); setContactEditing((value) => !value); }}>{contactEditing ? 'Cancel' : 'Edit'}</Button>
        </div>
        {contactEditing ? (
          <div className="space-y-3 rounded-xl border border-line p-3">
            <div className="grid grid-cols-2 gap-2"><Field label="First name"><input className={inputClass} value={contactDraft.firstName} onChange={(event) => setContactDraft({ ...contactDraft, firstName: event.target.value })} /></Field><Field label="Last name"><input className={inputClass} value={contactDraft.lastName} onChange={(event) => setContactDraft({ ...contactDraft, lastName: event.target.value })} /></Field></div>
            <Field label="Email"><input className={inputClass} value={contactDraft.email} onChange={(event) => setContactDraft({ ...contactDraft, email: event.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={contactDraft.phone} onChange={(event) => setContactDraft({ ...contactDraft, phone: event.target.value })} /></Field>
            <Field label="Source"><input className={inputClass} value={contactDraft.source} onChange={(event) => setContactDraft({ ...contactDraft, source: event.target.value })} /></Field>
            <Button size="sm" className="w-full" onClick={() => { updateContact(contact.id, { firstName: contactDraft.firstName, lastName: contactDraft.lastName, email: contactDraft.email, phone: contactDraft.phone, source: contactDraft.source }); setContactEditing(false); saved('Contact'); }}>Save changes</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl bg-surface-sunken p-3 text-[12px]">
            {[['Phone', contact.phone], ['Source', contact.source], ['Created', new Date(contact.createdAt).toLocaleDateString()], ['Last activity', new Date(contact.lastActivityAt).toLocaleDateString()]].map(([label, value]) => <div key={label}><p className="text-ink-subtle">{label}</p><p className="mt-0.5 truncate font-semibold text-ink">{value}</p></div>)}
          </div>
        )}
        <Field label="Owner"><select className={inputClass} value={contact.ownerId} onChange={(event) => { assignOwner([contact.id], event.target.value); saved('Owner'); }}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></Field>
        <div><p className="mb-1 text-[11px] font-semibold text-ink-muted">Tags ({contact.tags.length})</p><div className="mb-2 flex flex-wrap gap-1">{contact.tags.map((tagName) => <button key={tagName} type="button" onClick={() => removeTag([contact.id], tagName)} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">{tagName}<X size={10} /></button>)}</div><div className="flex gap-1.5"><input className={inputClass} value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Add a tag" onKeyDown={(event) => { if (event.key === 'Enter' && tagDraft.trim()) { addTag([contact.id], tagDraft); setTagDraft(''); } }} /><Button size="sm" onClick={() => { if (tagDraft.trim()) { addTag([contact.id], tagDraft); setTagDraft(''); } }}><Tag size={13} /> Add</Button></div></div>
        <label className="flex items-center justify-between rounded-xl border border-line p-3 text-[13px] font-semibold text-ink"><span><span className="block">Do Not Disturb</span><span className="text-[11px] font-normal text-ink-muted">Pause demo outreach on all channels</span></span><input type="checkbox" checked={contact.dnd} onChange={(event) => updateContact(contact.id, { dnd: event.target.checked })} className="h-4 w-4 accent-brand" /></label>
      </div>
    </>
  );

  let body: ReactNode = contactBody;
  if (active === 'activity') body = <><PanelHeader title="Activity (EDT)" count={activityItems.length} onClose={close} /><div className="space-y-4 p-4">{activityItems.map((item, index) => <div key={item.id} className="flex gap-3"><div className="flex flex-col items-center"><span className="mt-1 h-2 w-2 rounded-full bg-brand" />{index < activityItems.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}</div><div className="min-w-0 pb-1"><p className="text-[13px] font-semibold text-ink">{item.title}</p><p className="truncate text-[12px] text-ink-muted">{item.detail}</p><p className="text-[11px] text-ink-subtle">{new Date(item.at).toLocaleString()}</p></div></div>)}</div></>;

  if (active === 'notes') body = <><PanelHeader title="Notes" count={notes.length} onClose={close} onAdd={() => setEditor({ kind: 'note' })} /><div className="space-y-3 p-4"><SearchField value={query} onChange={setQuery} placeholder="Search notes" />{notes.filter((item) => matches(item.title, item.body)).map((item) => <div key={item.id} className={cx('rounded-xl border-l-4 p-3 shadow-sm ring-1 ring-line', item.color === 'yellow' ? 'border-warn bg-warn/5' : item.color === 'green' ? 'border-good bg-good/5' : 'border-brand bg-brand-soft/30')}><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-ink">{item.pinned && '📌 '}{item.title}</p><p className="mt-1 whitespace-pre-wrap text-[12px] text-ink-muted">{item.body}</p><p className="mt-2 text-[10px] text-ink-subtle">{item.author} · {new Date(item.updatedAt).toLocaleString()}</p></div><CardActions onEdit={() => setEditor({ kind: 'note', item })} onDelete={() => { records.deleteNote(contact.id, item.id); deleteNotice('Note'); }} /></div></div>)}{notes.length === 0 && <Empty icon={<StickyNote size={28} />} title="No notes yet" action={<Button size="sm" onClick={() => setEditor({ kind: 'note' })}>Add note</Button>} />}</div></>;

  if (active === 'tickets') {
    const selectedTicket = tickets.find((item) => item.id === selectedTicketId);
    body = selectedTicket ? (
      <TicketDetailPanel
        ticket={selectedTicket}
        contact={contact}
        currentUserName={currentUser?.name ?? 'Demo Agent'}
        records={records}
        onBack={() => setSelectedTicketId(null)}
        onClose={close}
        onEditTicket={() => setEditor({ kind: 'ticket', item: selectedTicket })}
        onEditMessage={(item) => setEditor({ kind: 'ticket-message', ticketId: selectedTicket.id, item })}
        onSaved={saved}
        onDeleted={deleteNotice}
      />
    ) : (
      <>
        <PanelHeader title="Tickets" count={tickets.length} onClose={close} onAdd={() => setEditor({ kind: 'ticket' })} />
        <div className="space-y-3 p-4">
          <SearchField value={query} onChange={setQuery} placeholder="Search tickets" />
          {tickets.filter((item) => matches(item.number, item.subject, item.description)).map((item) => (
            <div key={item.id} className="rounded-xl border border-line p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setSelectedTicketId(item.id)} className="min-w-0 flex-1 text-left">
                  <div className="mb-1 flex items-center gap-1.5"><span className="text-[11px] font-bold text-brand">{item.number}</span><Badge tone={item.status === 'resolved' ? 'good' : item.priority === 'urgent' ? 'bad' : 'brand'}>{item.status}</Badge></div>
                  <p className="text-[13px] font-bold text-ink">{item.subject}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-ink-muted">{item.description}</p>
                  <p className="mt-2 text-[11px] text-ink-subtle">{item.stage.replace(/_/g, ' ')} · {item.priority} · {item.assignee} · {item.messages.length} updates</p>
                </button>
                <CardActions onEdit={() => setEditor({ kind: 'ticket', item })} onDelete={() => { records.deleteTicket(contact.id, item.id); deleteNotice('Ticket'); }} />
              </div>
            </div>
          ))}
          {tickets.length === 0 && <Empty icon={<TicketCheck size={28} />} title="No tickets yet" action={<Button size="sm" onClick={() => setEditor({ kind: 'ticket' })}>Create ticket</Button>} />}
        </div>
      </>
    );
  }

  if (active === 'documents') body = <><PanelHeader title="Documents" count={documents.length} onClose={close} onAdd={() => setEditor({ kind: 'document' })} /><div className="space-y-3 p-4">{documents.map((item) => <div key={item.id} className="flex items-start gap-2.5 rounded-xl border border-line p-3 shadow-sm"><span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-sunken text-ink-muted"><FileText size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-ink">{item.name}</p><p className="text-[11px] text-ink-muted">{item.kind} · {item.sizeLabel}</p><Badge tone={item.status === 'signed' ? 'good' : item.status === 'sent' || item.status === 'viewed' ? 'brand' : 'neutral'}>{item.status}</Badge></div><CardActions onEdit={() => setEditor({ kind: 'document', item })} onDelete={() => { records.deleteDocument(contact.id, item.id); deleteNotice('Document'); }} /></div>)}</div></>;

  if (active === 'payments') body = <><PanelHeader title="Payments" count={payments.length} onClose={close} onAdd={() => setEditor({ kind: 'payment' })} /><div className="space-y-3 p-4"><div className="rounded-xl bg-surface-sunken p-3"><p className="text-[11px] text-ink-muted">Net payments</p><p className="text-xl font-bold text-ink">{money(payments.reduce((sum, item) => sum + item.amount, 0))}</p></div>{payments.map((item) => <div key={item.id} className="flex items-start gap-2.5 rounded-xl border border-line p-3 shadow-sm"><Receipt size={17} className="mt-0.5 text-ink-subtle" /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-ink">{item.description}</p><p className={cx('text-[13px] font-bold', item.amount < 0 ? 'text-bad' : 'text-good')}>{money(item.amount)}</p><p className="text-[11px] text-ink-muted">{item.method} · {item.status.replace(/_/g, ' ')}</p></div><div className="flex"><button type="button" title="Refund" disabled={item.kind === 'refund' || item.status === 'refunded'} onClick={() => { records.refundPayment(contact.id, item.id); saved('Refund'); }} className="grid h-7 w-7 place-items-center rounded text-ink-subtle hover:text-brand disabled:opacity-30"><RefreshCw size={13} /></button><CardActions onEdit={item.kind === 'charge' ? () => setEditor({ kind: 'payment', item }) : undefined} onDelete={() => { records.deletePayment(contact.id, item.id); deleteNotice('Payment'); }} /></div></div>)}</div></>;

  if (active === 'tasks') body = <><PanelHeader title="Tasks" count={tasks.length} onClose={close} onAdd={() => setEditor({ kind: 'task' })} /><div className="space-y-3 p-4"><SearchField value={query} onChange={setQuery} placeholder="Search tasks" />{tasks.filter((item) => matches(item.title, item.description)).map((item) => <div key={item.id} className="flex items-start gap-2 rounded-xl border border-line p-3 shadow-sm"><button type="button" onClick={() => toggleTask(item.id)} className={cx('mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2', item.status === 'completed' ? 'border-good bg-good text-white' : 'border-ink-subtle')} aria-label="Toggle task">{item.status === 'completed' && <Check size={11} />}</button><div className="min-w-0 flex-1"><p className={cx('text-[13px] font-semibold text-ink', item.status === 'completed' && 'line-through opacity-60')}>{item.title}</p><p className="text-[11px] text-ink-muted">Due {new Date(item.dueDate).toLocaleDateString()} · {item.priority}</p></div><CardActions onEdit={() => setEditor({ kind: 'task', item })} onDelete={() => { removeTask(item.id); deleteNotice('Task'); }} /></div>)}{tasks.length === 0 && <Empty icon={<CheckSquare size={28} />} title="No tasks yet" />}</div></>;

  if (active === 'project-tasks') body = <><PanelHeader title="Project Tasks" count={projectTasks.length} onClose={close} onAdd={() => setEditor({ kind: 'project-task' })} /><div className="space-y-3 p-4"><SearchField value={query} onChange={setQuery} placeholder="Search project tasks" />{projectTasks.filter((item) => matches(item.title, item.description, item.project, item.owner)).map((item) => <div key={item.id} className="rounded-xl border border-line p-3 shadow-sm"><div className="flex items-start gap-2"><button type="button" onClick={() => { records.updateProjectTask(contact.id, item.id, { status: item.status === 'done' ? 'to_do' : 'done' }); saved('Project task'); }} className={cx('mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2', item.status === 'done' ? 'border-good bg-good text-white' : 'border-ink-subtle')} aria-label={item.status === 'done' ? 'Reopen project task' : 'Complete project task'}>{item.status === 'done' && <Check size={11} />}</button><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-1"><Badge tone={item.priority === 'urgent' ? 'bad' : item.priority === 'high' ? 'warn' : 'neutral'}>{item.priority}</Badge><Badge tone={item.status === 'done' ? 'good' : item.status === 'in_progress' || item.status === 'in_review' ? 'brand' : 'neutral'}>{item.status.replace(/_/g, ' ')}</Badge></div><p className={cx('text-[13px] font-bold text-ink', item.status === 'done' && 'line-through opacity-60')}>{item.title}</p><p className="mt-1 line-clamp-2 text-[12px] text-ink-muted">{item.description}</p><p className="mt-2 text-[11px] text-ink-subtle">{item.project} · {item.type} · {item.owner}</p><p className="text-[11px] text-ink-subtle">Due {new Date(item.dueDate).toLocaleDateString()}</p></div><CardActions onEdit={() => setEditor({ kind: 'project-task', item })} onDelete={() => { records.deleteProjectTask(contact.id, item.id); deleteNotice('Project task'); }} /></div></div>)}{projectTasks.length === 0 && <Empty icon={<ListTodo size={28} />} title="No project tasks yet" action={<Button size="sm" onClick={() => setEditor({ kind: 'project-task' })}>Add project task</Button>} />}</div></>;

  if (active === 'appointments') body = <><PanelHeader title="Appointments" count={appointments.length} onClose={close} onAdd={() => setEditor({ kind: 'appointment' })} /><div className="space-y-3 p-4"><SearchField value={query} onChange={setQuery} placeholder="Search appointments" />{appointments.filter((item) => matches(item.title, item.location, item.notes)).map((item) => <div key={item.id} className="rounded-xl border border-line p-3 shadow-sm"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{item.title}</p><p className="mt-0.5 text-[12px] text-ink-muted">{new Date(item.startTime).toLocaleString()}</p><p className="text-[11px] text-ink-subtle">{item.location || 'Online'} · {item.status.replace(/_/g, ' ')}</p></div><CardActions onEdit={() => setEditor({ kind: 'appointment', item })} onDelete={() => { removeAppointment(item.id); deleteNotice('Appointment'); }} /></div></div>)}{appointments.length === 0 && <Empty icon={<CalendarDays size={28} />} title="No appointments yet" />}</div></>;

  if (active === 'opportunities') body = <><PanelHeader title="Opportunities" count={opportunities.length} onClose={close} onAdd={() => setEditor({ kind: 'opportunity' })} /><div className="space-y-3 p-4">{opportunities.map((item) => { const pipeline = pipelines.find((value) => value.id === item.pipelineId); const stage = pipeline?.stages.find((value) => value.id === item.stageId); return <div key={item.id} className="rounded-xl border border-line p-3 shadow-sm"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-brand">{pipeline?.name} › {stage?.name}</p><p className="text-[13px] font-bold text-ink">{item.name}</p><div className="mt-1 flex items-center gap-2"><span className="text-[13px] font-bold text-ink">{money(item.monetaryValue)}</span><Badge tone={item.status === 'won' ? 'good' : item.status === 'lost' ? 'bad' : 'brand'}>{item.status}</Badge></div></div><CardActions onEdit={() => setEditor({ kind: 'opportunity', item })} onDelete={() => { removeOpportunity(item.id); deleteNotice('Opportunity'); }} /></div></div>; })}{opportunities.length === 0 && <Empty icon={<BriefcaseBusiness size={28} />} title="No opportunities yet" />}</div></>;

  if (active === 'associations') body = <><PanelHeader title="Associations" onClose={close} onAdd={() => setEditor({ kind: 'company' })} /><div className="space-y-4 p-4"><div><p className="mb-2 text-[13px] font-bold text-ink">Companies ({contact.companyId ? 1 : 0})</p>{contact.companyId ? (() => { const company = companies.find((item) => item.id === contact.companyId); return company ? <div className="rounded-xl border border-line p-3"><div className="flex items-start justify-between"><div><p className="text-[13px] font-bold text-ink">{company.name}</p><p className="text-[12px] text-ink-muted">{company.industry || 'Company'}</p><p className="text-[11px] text-ink-subtle">{company.website || company.phone}</p></div><button type="button" onClick={() => { setContactCompany(contact.id, undefined); setCompanyChoice(''); saved('Association'); }} className="text-[11px] font-semibold text-bad">Unlink</button></div></div> : null; })() : <p className="rounded-xl bg-surface-sunken px-3 py-5 text-center text-[12px] text-ink-muted">No company associated</p>}</div><div className="space-y-2"><Field label="Link existing company"><select className={inputClass} value={companyChoice} onChange={(event) => setCompanyChoice(event.target.value)}><option value="">Choose a company…</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Button size="sm" className="w-full" disabled={!companyChoice || companyChoice === contact.companyId} onClick={() => { setContactCompany(contact.id, companyChoice); saved('Association'); }}>Link company</Button><Button size="sm" variant="secondary" className="w-full" onClick={() => setEditor({ kind: 'company' })}><Plus size={13} /> Create new company</Button></div></div></>;

  if (active === 'agent-logs') { const logs = activityItems.filter((item) => matches(item.title, item.detail)); body = <><PanelHeader title="Agent Logs" count={logs.length} onClose={close} /><div className="space-y-3 p-4"><div className="flex gap-2"><div className="flex-1"><SearchField value={query} onChange={setQuery} placeholder="Search logs" /></div><button type="button" onClick={() => pushToast({ title: 'Logs refreshed', description: 'Showing the latest demo activity.', variant: 'success' })} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken"><RefreshCw size={14} /></button></div>{logs.map((item) => <div key={`log-${item.id}`} className="rounded-lg border border-line p-2.5"><p className="text-[12px] font-semibold text-ink">{item.title}</p><p className="truncate text-[11px] text-ink-muted">{item.detail}</p><p className="text-[10px] text-ink-subtle">{new Date(item.at).toLocaleString()}</p></div>)}</div></>; }

  return (
    <div data-tour="conversations.contactContext" className="flex h-full min-h-0 border-l border-line bg-surface">
      {active && <div className="min-h-0 w-[332px] flex-none overflow-y-auto">{body}</div>}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-l border-line py-3">
        {RAIL.map(({ key, label, Icon }) => <button key={key} type="button" title={label} aria-label={label} aria-pressed={active === key} onClick={() => { setQuery(''); setActive(active === key ? null : key); }} className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors', active === key ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink')}><Icon size={18} /></button>)}
        <div className="my-1 h-px w-7 shrink-0 bg-line" />
        <button type="button" title="Tickets" aria-label="Tickets" aria-pressed={active === 'tickets'} onClick={() => { setQuery(''); setActive(active === 'tickets' ? null : 'tickets'); }} className={cx('relative grid h-9 w-9 shrink-0 place-items-center rounded-lg', active === 'tickets' ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink')}><TicketCheck size={18} />{tickets.filter((ticket) => ticket.status === 'open').length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">{tickets.filter((ticket) => ticket.status === 'open').length}</span>}</button>
        <button type="button" title="Project tasks" aria-label="Project tasks" aria-pressed={active === 'project-tasks'} onClick={() => { setQuery(''); setActive(active === 'project-tasks' ? null : 'project-tasks'); }} className={cx('relative grid h-9 w-9 shrink-0 place-items-center rounded-lg', active === 'project-tasks' ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink')}><ListTodo size={18} />{projectTasks.filter((task) => task.status !== 'done').length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{projectTasks.filter((task) => task.status !== 'done').length}</span>}</button>
        <button type="button" title="AI summary" aria-label="AI summary" onClick={() => pushToast({ title: 'AI conversation summary', description: `${fullName(contact)} is engaged and evaluating next steps. Follow up on the open ${tickets.length ? 'support ticket' : 'request'} and confirm timing.`, variant: 'info' })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ai hover:bg-ai-soft"><Sparkles size={18} /></button>
      </div>

      <RecordEditor
        editor={editor}
        onClose={() => setEditor(null)}
        contact={contact}
        users={users}
        pipelines={pipelines}
        calendars={calendars}
        onSave={(label) => { setEditor(null); saved(label); }}
        records={records}
        addCompany={addCompany}
        setContactCompany={setContactCompany}
        addOpportunity={addOpportunity}
        updateOpportunity={updateOpportunity}
        addAppointment={addAppointment}
        updateAppointment={updateAppointment}
        addTask={addTask}
        updateTask={updateTask}
        currentUserId={currentUser?.id ?? 'u_me'}
      />
    </div>
  );
}

type StoreApi = ReturnType<typeof useConversationRecords>;

function TicketDetailPanel({ ticket, contact, currentUserName, records, onBack, onClose, onEditTicket, onEditMessage, onSaved, onDeleted }: {
  ticket: ConversationTicket;
  contact: Contact;
  currentUserName: string;
  records: StoreApi;
  onBack: () => void;
  onClose: () => void;
  onEditTicket: () => void;
  onEditMessage: (message: ConversationTicketMessage) => void;
  onSaved: (label: string) => void;
  onDeleted: (label: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [replyKind, setReplyKind] = useState<ConversationTicketMessage['kind']>('agent');
  const nextAction = ticket.status === 'closed'
    ? { label: 'Reopen', status: 'open' as const, stage: 'working' as const }
    : ticket.status === 'resolved'
      ? { label: 'Close', status: 'closed' as const, stage: 'closed' as const }
      : { label: 'Resolve', status: 'resolved' as const, stage: 'resolved' as const };
  const postReply = () => {
    if (!reply.trim()) return;
    records.createTicketMessage(contact.id, ticket.id, {
      body: reply.trim(),
      kind: replyKind,
      author: replyKind === 'customer' ? fullName(contact) : currentUserName,
    });
    setReply('');
    onSaved(replyKind === 'internal' ? 'Internal ticket note' : 'Ticket reply');
  };
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-line bg-surface px-3 py-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onBack} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Back to tickets"><ChevronLeft size={17} /></button>
          <div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-brand">{ticket.number}</p><h2 className="truncate text-[14px] font-bold text-ink">{ticket.subject}</h2></div>
          <button type="button" onClick={onEditTicket} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Edit ticket"><Pencil size={14} /></button>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close panel"><X size={16} /></button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5"><Badge tone={ticket.status === 'resolved' || ticket.status === 'closed' ? 'good' : 'brand'}>{ticket.status}</Badge><Badge tone={ticket.priority === 'urgent' ? 'bad' : ticket.priority === 'high' ? 'warn' : 'neutral'}>{ticket.priority}</Badge><span className="text-[10px] text-ink-subtle">{ticket.stage.replace(/_/g, ' ')} · {ticket.assignee}</span></div>
        <div className="mt-2 flex gap-2"><Button size="xs" onClick={() => { records.updateTicket(contact.id, ticket.id, { status: nextAction.status, stage: nextAction.stage }); onSaved('Ticket status'); }}>{nextAction.label}</Button><Button size="xs" variant="secondary" onClick={onEditTicket}>Edit fields</Button></div>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl bg-surface-sunken p-3"><p className="text-[11px] font-semibold text-ink-subtle">Issue summary</p><p className="mt-1 whitespace-pre-wrap text-[12px] text-ink-muted">{ticket.description}</p></div>
        <div className="space-y-2.5">
          {[...ticket.messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)).map((message) => (
            <div key={message.id} className={cx('rounded-xl border p-3', message.kind === 'internal' ? 'border-warn/40 bg-warn/10' : message.kind === 'customer' ? 'border-line bg-surface' : 'border-brand/20 bg-brand-soft/30')}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-[11px] font-bold text-ink">{message.author}</p><Badge tone={message.kind === 'internal' ? 'warn' : message.kind === 'customer' ? 'neutral' : 'brand'}>{message.kind}</Badge></div><p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">{message.body}</p><p className="mt-1.5 text-[10px] text-ink-subtle">{new Date(message.createdAt).toLocaleString()}{message.updatedAt !== message.createdAt ? ' · edited' : ''}</p></div>
                <CardActions onEdit={() => onEditMessage(message)} onDelete={() => { records.deleteTicketMessage(contact.id, ticket.id, message.id); onDeleted('Ticket reply'); }} />
              </div>
            </div>
          ))}
        </div>
        <div className={cx('rounded-xl border p-3', replyKind === 'internal' ? 'border-warn/40 bg-warn/5' : 'border-line bg-surface')}>
          <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-ink-muted">Add update</span><select aria-label="Ticket update type" className="h-7 rounded-md border border-line bg-surface px-2 text-[11px] text-ink" value={replyKind} onChange={(event) => setReplyKind(event.target.value as ConversationTicketMessage['kind'])}><option value="agent">Reply to contact</option><option value="internal">Internal note</option><option value="customer">Simulate customer reply</option></select></div>
          <textarea aria-label="Ticket update message" value={reply} onChange={(event) => setReply(event.target.value)} rows={4} placeholder={replyKind === 'internal' ? 'Add a note for your team…' : 'Write a ticket reply…'} className="w-full resize-y bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-subtle" />
          <div className="mt-2 flex justify-end"><Button size="sm" disabled={!reply.trim()} onClick={postReply}><Send size={13} /> Post</Button></div>
        </div>
      </div>
    </>
  );
}

function RecordEditor({ editor, onClose, contact, users, pipelines, calendars, onSave, records, addCompany, setContactCompany, addOpportunity, updateOpportunity, addAppointment, updateAppointment, addTask, updateTask, currentUserId }: {
  editor: Editor;
  onClose: () => void;
  contact: Contact;
  users: ReturnType<typeof useStore.getState>['users'];
  pipelines: ReturnType<typeof useStore.getState>['pipelines'];
  calendars: ReturnType<typeof useStore.getState>['calendars'];
  onSave: (label: string) => void;
  records: StoreApi;
  addCompany: ReturnType<typeof useStore.getState>['addCompany'];
  setContactCompany: ReturnType<typeof useStore.getState>['setContactCompany'];
  addOpportunity: ReturnType<typeof useStore.getState>['addOpportunity'];
  updateOpportunity: ReturnType<typeof useStore.getState>['updateOpportunity'];
  addAppointment: ReturnType<typeof useStore.getState>['addAppointment'];
  updateAppointment: ReturnType<typeof useStore.getState>['updateAppointment'];
  addTask: ReturnType<typeof useStore.getState>['addTask'];
  updateTask: ReturnType<typeof useStore.getState>['updateTask'];
  currentUserId: string;
}) {
  if (!editor) return null;
  const title = `${'item' in editor && editor.item ? 'Edit' : 'Add'} ${editor.kind === 'company' ? 'company' : editor.kind === 'ticket-message' ? 'ticket reply' : editor.kind}`;
  return (
    <Modal open title={title.replace(/^./, (value) => value.toUpperCase())} onClose={onClose} size={editor.kind === 'ticket' || editor.kind === 'project-task' ? 'lg' : 'md'}>
      {editor.kind === 'note' && <NoteForm item={editor.item} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updateNote(contact.id, editor.item.id, value); else records.createNote(contact.id, value); onSave('Note'); }} />}
      {editor.kind === 'ticket' && <TicketForm item={editor.item} users={users.map((user) => user.name)} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updateTicket(contact.id, editor.item.id, value); else records.createTicket(contact.id, value); onSave('Ticket'); }} />}
      {editor.kind === 'ticket-message' && <TicketMessageForm item={editor.item} users={users.map((user) => user.name)} contactName={fullName(contact)} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updateTicketMessage(contact.id, editor.ticketId, editor.item.id, value); else records.createTicketMessage(contact.id, editor.ticketId, value); onSave('Ticket reply'); }} />}
      {editor.kind === 'document' && <DocumentForm item={editor.item} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updateDocument(contact.id, editor.item.id, value); else records.createDocument(contact.id, value); onSave('Document'); }} />}
      {editor.kind === 'payment' && <PaymentForm item={editor.item} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updatePayment(contact.id, editor.item.id, value); else records.createPayment(contact.id, value); onSave('Payment'); }} />}
      {editor.kind === 'project-task' && <ProjectTaskForm item={editor.item} users={users.map((user) => user.name)} onCancel={onClose} onSubmit={(value) => { if (editor.item) records.updateProjectTask(contact.id, editor.item.id, value); else records.createProjectTask(contact.id, value); onSave('Project task'); }} />}
      {editor.kind === 'task' && <TaskForm item={editor.item} users={users} contactId={contact.id} currentUserId={currentUserId} onCancel={onClose} onSubmit={(value) => { if (editor.item) updateTask(editor.item.id, value); else addTask(value); onSave('Task'); }} />}
      {editor.kind === 'appointment' && <AppointmentForm item={editor.item} calendars={calendars} contactId={contact.id} onCancel={onClose} onSubmit={(value) => { if (editor.item) updateAppointment(editor.item.id, value); else addAppointment(value); onSave('Appointment'); }} />}
      {editor.kind === 'opportunity' && <OpportunityForm item={editor.item} pipelines={pipelines} contact={contact} currentUserId={currentUserId} onCancel={onClose} onSubmit={(value) => { if (editor.item) updateOpportunity(editor.item.id, value); else addOpportunity(value); onSave('Opportunity'); }} />}
      {editor.kind === 'company' && <CompanyForm onCancel={onClose} onSubmit={(value) => { const company = addCompany(value); setContactCompany(contact.id, company.id); onSave('Company'); }} />}
    </Modal>
  );
}

function FormActions({ onCancel, disabled = false }: { onCancel: () => void; disabled?: boolean }) { return <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={disabled}>Save</Button></div>; }

function NoteForm({ item, onCancel, onSubmit }: { item?: ConversationNote; onCancel: () => void; onSubmit: (value: { title: string; body: string; color: NoteColor; pinned: boolean }) => void }) {
  const [title, setTitle] = useState(item?.title ?? ''); const [body, setBody] = useState(item?.body ?? ''); const [color, setColor] = useState<NoteColor>(item?.color ?? 'yellow'); const [pinned, setPinned] = useState(item?.pinned ?? false);
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ title: title.trim(), body: body.trim(), color, pinned }); }} className="space-y-3"><Field label="Title"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field><Field label="Description"><textarea className={textAreaClass} value={body} onChange={(event) => setBody(event.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Color"><select className={inputClass} value={color} onChange={(event) => setColor(event.target.value as NoteColor)}>{['yellow', 'blue', 'green', 'pink', 'purple', 'gray'].map((value) => <option key={value}>{value}</option>)}</select></Field><label className="mt-5 flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} /> Pin note</label></div><FormActions onCancel={onCancel} disabled={!title.trim() || !body.trim()} /></form>;
}

function TicketForm({ item, users, onCancel, onSubmit }: { item?: ConversationTicket; users: string[]; onCancel: () => void; onSubmit: (value: Parameters<StoreApi['createTicket']>[1]) => void }) {
  const [subject, setSubject] = useState(item?.subject ?? ''); const [description, setDescription] = useState(item?.description ?? ''); const [stage, setStage] = useState(item?.stage ?? 'new'); const [status, setStatus] = useState(item?.status ?? 'open'); const [priority, setPriority] = useState(item?.priority ?? 'normal'); const [assignee, setAssignee] = useState(item?.assignee ?? users[0] ?? 'Support Team'); const [tags, setTags] = useState(item?.tags.join(', ') ?? '');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ subject: subject.trim(), description: description.trim(), stage, status, priority, assignee, tags: tags.split(',').map((value) => value.trim()).filter(Boolean), source: item?.source ?? 'internal' }); }} className="space-y-3"><Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} autoFocus /></Field><Field label="Description"><textarea className={textAreaClass} value={description} onChange={(event) => setDescription(event.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Stage"><select className={inputClass} value={stage} onChange={(event) => setStage(event.target.value as typeof stage)}>{['new', 'triage', 'working', 'waiting_on_customer', 'resolved', 'closed'].map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</select></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['open', 'pending', 'resolved', 'closed'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Priority"><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>{['low', 'normal', 'high', 'urgent'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Assignee"><select className={inputClass} value={assignee} onChange={(event) => setAssignee(event.target.value)}>{[...users, 'Support Team'].map((value) => <option key={value}>{value}</option>)}</select></Field></div><Field label="Tags (comma separated)"><input className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} /></Field><FormActions onCancel={onCancel} disabled={!subject.trim() || !description.trim()} /></form>;
}

function TicketMessageForm({ item, users, contactName, onCancel, onSubmit }: { item?: ConversationTicketMessage; users: string[]; contactName: string; onCancel: () => void; onSubmit: (value: Parameters<StoreApi['createTicketMessage']>[2]) => void }) {
  const [body, setBody] = useState(item?.body ?? '');
  const [kind, setKind] = useState<ConversationTicketMessage['kind']>(item?.kind ?? 'agent');
  const defaultAuthor = kind === 'customer' ? contactName : users[0] ?? 'Demo Agent';
  const [author, setAuthor] = useState(item?.author ?? defaultAuthor);
  const changeKind = (next: ConversationTicketMessage['kind']) => {
    setKind(next);
    setAuthor(next === 'customer' ? contactName : users[0] ?? 'Demo Agent');
  };
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ body: body.trim(), kind, author }); }} className="space-y-3"><Field label="Update type"><select className={inputClass} value={kind} onChange={(event) => changeKind(event.target.value as ConversationTicketMessage['kind'])}><option value="agent">Reply to contact</option><option value="internal">Internal note</option><option value="customer">Simulated customer reply</option></select></Field><Field label="Author"><input className={inputClass} value={author} onChange={(event) => setAuthor(event.target.value)} /></Field><Field label="Message"><textarea className={textAreaClass} value={body} onChange={(event) => setBody(event.target.value)} autoFocus /></Field><FormActions onCancel={onCancel} disabled={!body.trim() || !author.trim()} /></form>;
}

function DocumentForm({ item, onCancel, onSubmit }: { item?: ConversationDocument; onCancel: () => void; onSubmit: (value: Parameters<StoreApi['createDocument']>[1]) => void }) {
  const [name, setName] = useState(item?.name ?? ''); const [kind, setKind] = useState(item?.kind ?? 'proposal'); const [status, setStatus] = useState(item?.status ?? 'draft');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), kind, status, sizeLabel: item?.sizeLabel ?? '184 KB', owner: item?.owner }); }} className="space-y-3"><Field label="Document name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field><div className="grid grid-cols-2 gap-3"><Field label="Type"><select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>{['proposal', 'contract', 'estimate', 'form', 'other'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['draft', 'sent', 'viewed', 'signed', 'void'].map((value) => <option key={value}>{value}</option>)}</select></Field></div><FormActions onCancel={onCancel} disabled={!name.trim()} /></form>;
}

function PaymentForm({ item, onCancel, onSubmit }: { item?: ConversationPayment; onCancel: () => void; onSubmit: (value: Parameters<StoreApi['createPayment']>[1]) => void }) {
  const [description, setDescription] = useState(item?.description ?? ''); const [amount, setAmount] = useState(String(item?.amount ?? 0)); const [status, setStatus] = useState(item?.status ?? 'succeeded'); const [method, setMethod] = useState(item?.method ?? 'Demo card •••• 4242');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ description: description.trim(), amount: Number(amount), status, method }); }} className="space-y-3"><Field label="Description"><input className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field><div className="grid grid-cols-2 gap-3"><Field label="Amount"><input type="number" min="0" step="0.01" className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} /></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['pending', 'succeeded', 'failed', 'partially_refunded', 'refunded'].map((value) => <option key={value}>{value}</option>)}</select></Field></div><Field label="Payment method"><input className={inputClass} value={method} onChange={(event) => setMethod(event.target.value)} /></Field><FormActions onCancel={onCancel} disabled={!description.trim() || Number(amount) <= 0} /></form>;
}

function TaskForm({ item, users, contactId, currentUserId, onCancel, onSubmit }: { item?: Task; users: ReturnType<typeof useStore.getState>['users']; contactId: string; currentUserId: string; onCancel: () => void; onSubmit: (value: Parameters<ReturnType<typeof useStore.getState>['addTask']>[0]) => void }) {
  const [title, setTitle] = useState(item?.title ?? ''); const [description, setDescription] = useState(item?.description ?? ''); const [dueDate, setDueDate] = useState((item?.dueDate ?? new Date(Date.now() + 86_400_000).toISOString()).slice(0, 10)); const [assigneeId, setAssigneeId] = useState(item?.assigneeId ?? currentUserId); const [priority, setPriority] = useState(item?.priority ?? 'medium'); const [status, setStatus] = useState(item?.status ?? 'open');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ title: title.trim(), description: description.trim(), dueDate: new Date(`${dueDate}T17:00:00`).toISOString(), assigneeId, contactId, priority, status }); }} className="space-y-3"><Field label="Task title"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field><Field label="Description"><textarea className={textAreaClass} value={description} onChange={(event) => setDescription(event.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Due date"><input type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field><Field label="Owner"><select className={inputClass} value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></Field><Field label="Priority"><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>{['low', 'medium', 'high'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['open', 'completed'].map((value) => <option key={value}>{value}</option>)}</select></Field></div><FormActions onCancel={onCancel} disabled={!title.trim() || !dueDate} /></form>;
}

function ProjectTaskForm({ item, users, onCancel, onSubmit }: { item?: ConversationProjectTask; users: string[]; onCancel: () => void; onSubmit: (value: Parameters<StoreApi['createProjectTask']>[1]) => void }) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [status, setStatus] = useState(item?.status ?? 'to_do');
  const [priority, setPriority] = useState(item?.priority ?? 'medium');
  const [owner, setOwner] = useState(item?.owner ?? users[0] ?? 'Demo Agent');
  const [project, setProject] = useState(item?.project ?? 'Customer Onboarding');
  const [dueDate, setDueDate] = useState((item?.dueDate ?? new Date(Date.now() + 3 * 86_400_000).toISOString()).slice(0, 10));
  const [type, setType] = useState(item?.type ?? 'task');
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit({ title: title.trim(), description: description.trim(), status, priority, owner, project: project.trim(), dueDate: new Date(`${dueDate}T17:00:00`).toISOString(), type }); }} className="space-y-3">
      <Field label="Task title"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field>
      <Field label="Description"><textarea className={textAreaClass} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project"><input className={inputClass} value={project} onChange={(event) => setProject(event.target.value)} /></Field>
        <Field label="Owner"><select className={inputClass} value={owner} onChange={(event) => setOwner(event.target.value)}>{users.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['backlog', 'to_do', 'in_progress', 'in_review', 'done'].map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</select></Field>
        <Field label="Priority"><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>{['urgent', 'high', 'medium', 'low', 'none'].map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Type"><select className={inputClass} value={type} onChange={(event) => setType(event.target.value as typeof type)}>{['task', 'bug', 'feature', 'story', 'epic', 'milestone', 'improvement', 'chore'].map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Due date"><input type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
      </div>
      <FormActions onCancel={onCancel} disabled={!title.trim() || !description.trim() || !project.trim() || !dueDate} />
    </form>
  );
}

function AppointmentForm({ item, calendars, contactId, onCancel, onSubmit }: { item?: Appointment; calendars: ReturnType<typeof useStore.getState>['calendars']; contactId: string; onCancel: () => void; onSubmit: (value: Parameters<ReturnType<typeof useStore.getState>['addAppointment']>[0]) => void }) {
  const initialStart = item?.startTime ?? new Date(Date.now() + 86_400_000).toISOString(); const [title, setTitle] = useState(item?.title ?? 'Discovery call'); const [calendarId, setCalendarId] = useState(item?.calendarId ?? calendars[0]?.id ?? ''); const [start, setStart] = useState(initialStart.slice(0, 16)); const [status, setStatus] = useState(item?.status ?? 'confirmed'); const [location, setLocation] = useState(item?.location ?? 'Google Meet'); const [notes, setNotes] = useState(item?.notes ?? '');
  return <form onSubmit={(event) => { event.preventDefault(); const startTime = new Date(start).toISOString(); onSubmit({ title: title.trim(), calendarId, contactId, startTime, endTime: new Date(+new Date(startTime) + 30 * 60_000).toISOString(), status, location: location.trim(), notes: notes.trim() }); }} className="space-y-3"><Field label="Title"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field><div className="grid grid-cols-2 gap-3"><Field label="Calendar"><select className={inputClass} value={calendarId} onChange={(event) => setCalendarId(event.target.value)}>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></Field><Field label="Start"><input type="datetime-local" className={inputClass} value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['confirmed', 'showed', 'no_show', 'cancelled'].map((value) => <option key={value}>{value.replace(/_/g, ' ')}</option>)}</select></Field><Field label="Location"><input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} /></Field></div><Field label="Notes"><textarea className={textAreaClass} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field><FormActions onCancel={onCancel} disabled={!title.trim() || !calendarId || !start} /></form>;
}

function OpportunityForm({ item, pipelines, contact, currentUserId, onCancel, onSubmit }: { item?: Opportunity; pipelines: ReturnType<typeof useStore.getState>['pipelines']; contact: Contact; currentUserId: string; onCancel: () => void; onSubmit: (value: Parameters<ReturnType<typeof useStore.getState>['addOpportunity']>[0]) => void }) {
  const [name, setName] = useState(item?.name ?? `${fullName(contact)} — New opportunity`); const [pipelineId, setPipelineId] = useState(item?.pipelineId ?? pipelines[0]?.id ?? ''); const pipeline = pipelines.find((value) => value.id === pipelineId); const [stageId, setStageId] = useState(item?.stageId ?? pipeline?.stages[0]?.id ?? ''); const [value, setValue] = useState(String(item?.monetaryValue ?? 2500)); const [status, setStatus] = useState(item?.status ?? 'open');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), contactId: contact.id, pipelineId, stageId, monetaryValue: Number(value), status, ownerId: item?.ownerId ?? currentUserId, source: item?.source ?? 'Conversations' }); }} className="space-y-3"><Field label="Opportunity name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field><div className="grid grid-cols-2 gap-3"><Field label="Pipeline"><select className={inputClass} value={pipelineId} onChange={(event) => { const id = event.target.value; setPipelineId(id); setStageId(pipelines.find((value) => value.id === id)?.stages[0]?.id ?? ''); }}>{pipelines.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></Field><Field label="Stage"><select className={inputClass} value={stageId} onChange={(event) => setStageId(event.target.value)}>{pipeline?.stages.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></Field><Field label="Value"><input type="number" min="0" className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} /></Field><Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{['open', 'won', 'lost', 'abandoned'].map((value) => <option key={value}>{value}</option>)}</select></Field></div><FormActions onCancel={onCancel} disabled={!name.trim() || !pipelineId || !stageId} /></form>;
}

function CompanyForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (value: { name: string; industry?: string; website?: string; phone?: string }) => void }) {
  const [name, setName] = useState(''); const [industry, setIndustry] = useState(''); const [website, setWebsite] = useState(''); const [phone, setPhone] = useState('');
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), industry: industry.trim(), website: website.trim(), phone: phone.trim() }); }} className="space-y-3"><Field label="Company name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field><Field label="Industry"><input className={inputClass} value={industry} onChange={(event) => setIndustry(event.target.value)} /></Field><Field label="Website"><input className={inputClass} value={website} onChange={(event) => setWebsite(event.target.value)} /></Field><Field label="Phone"><input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field><FormActions onCancel={onCancel} disabled={!name.trim()} /></form>;
}
