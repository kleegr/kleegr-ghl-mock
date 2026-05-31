import { useMemo, useState, type ReactNode } from 'react';
import {
  X, Building2, Mail, Phone, Tag, CalendarDays, Clock, User as UserIcon,
  BellOff, MessageSquare, CheckSquare, Banknote, PhoneCall, Sparkles, Send, Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx, fullName, dateLabel, relativeTime, clockTime, userById, money } from '@/utils';
import { Avatar, Badge, Button, Tabs } from '@/components/ui/primitives';
import { INPUT_CLS } from './Drawer';
import { useContactsModule } from '../context';
import type { Contact, Conversation, Message } from '@/types';

const CHANNEL_LABEL: Record<string, string> = {
  sms: 'SMS', email: 'Email', webchat: 'Web Chat', facebook: 'Facebook',
  instagram: 'Instagram', whatsapp: 'WhatsApp', call: 'Call',
};

interface TimelineEvent {
  id: string;
  kind: 'created' | 'message' | 'task' | 'appointment' | 'opportunity' | 'call' | 'invoice' | 'note';
  at: string;
  title: string;
  detail?: string;
}

/**
 * Full-screen contact record — the GHL "contact detail" workspace. Three panes:
 * identity/fields (left), activity timeline + composer (center), related records
 * (right). Reads everything live from the store by contactId.
 */
export function ContactWorkspace() {
  const { openContactId, closeContact } = useContactsModule();
  const contacts = useStore((s) => s.contacts);
  const contact = contacts.find((c) => c.id === openContactId);

  if (!contact) return null;
  return <WorkspaceInner key={contact.id} contact={contact} onClose={closeContact} />;
}

function WorkspaceInner({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const users = useStore((s) => s.users);
  const companies = useStore((s) => s.companies);
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const tasks = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);
  const opportunities = useStore((s) => s.opportunities);
  const calls = useStore((s) => s.calls);
  const invoices = useStore((s) => s.invoices);
  const pipelines = useStore((s) => s.pipelines);
  const updateContact = useStore((s) => s.updateContact);
  const pushToast = useStore((s) => s.pushToast);
  const openDialer = useStore((s) => s.openDialer);

  const [tab, setTab] = useState('activity');
  const [note, setNote] = useState('');
  const [localNotes, setLocalNotes] = useState<TimelineEvent[]>([]);
  const [newTag, setNewTag] = useState('');

  const owner = userById(users, contact.ownerId);
  const company = companies.find((co) => co.id === contact.companyId);

  const cConvos = useMemo(() => conversations.filter((c) => c.contactId === contact.id), [conversations, contact.id]);
  const cTasks = useMemo(() => tasks.filter((t) => t.contactId === contact.id), [tasks, contact.id]);
  const cAppts = useMemo(() => appointments.filter((a) => a.contactId === contact.id), [appointments, contact.id]);
  const cOpps = useMemo(() => opportunities.filter((o) => o.contactId === contact.id), [opportunities, contact.id]);
  const cCalls = useMemo(() => calls.filter((c) => c.contactId === contact.id), [calls, contact.id]);
  const cInvoices = useMemo(() => invoices.filter((i) => i.contactId === contact.id), [invoices, contact.id]);

  const timeline = useMemo<TimelineEvent[]>(() => {
    const ev: TimelineEvent[] = [{ id: 'created', kind: 'created', at: contact.createdAt, title: 'Contact created' }];
    cConvos.forEach((c) => {
      const last = messages.filter((m) => c.messageIds.includes(m.id)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
      ev.push({ id: `conv_${c.id}`, kind: 'message', at: c.lastMessageAt, title: `${CHANNEL_LABEL[c.channel] ?? c.channel} conversation`, detail: last?.body });
    });
    cTasks.forEach((t) => ev.push({ id: `task_${t.id}`, kind: 'task', at: t.dueDate, title: t.title, detail: `${t.status} · ${t.priority} priority` }));
    cAppts.forEach((a) => ev.push({ id: `appt_${a.id}`, kind: 'appointment', at: a.startTime, title: a.title, detail: a.status.replace('_', ' ') }));
    cOpps.forEach((o) => ev.push({ id: `opp_${o.id}`, kind: 'opportunity', at: o.lastActivityAt, title: o.name, detail: `${money(o.monetaryValue)} · ${o.status}` }));
    cCalls.forEach((c) => ev.push({ id: `call_${c.id}`, kind: 'call', at: c.createdAt, title: `${c.direction} call`, detail: c.durationSec ? `${Math.round(c.durationSec / 60)} min` : 'no answer' }));
    cInvoices.forEach((i) => ev.push({ id: `inv_${i.id}`, kind: 'invoice', at: i.issuedAt, title: `Invoice ${i.number}`, detail: `${money(i.total)} · ${i.status}` }));
    return [...ev, ...localNotes].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [contact.createdAt, cConvos, cTasks, cAppts, cOpps, cCalls, cInvoices, messages, localNotes]);

  function addNote() {
    const body = note.trim();
    if (!body) return;
    setLocalNotes((prev) => [{ id: `note_${Date.now()}`, kind: 'note', at: new Date().toISOString(), title: 'Note added', detail: body }, ...prev]);
    setNote('');
    pushToast({ title: 'Note added', description: 'Saved to this contact (demo session).', variant: 'success' });
  }

  function addTag() {
    const t = newTag.trim();
    if (!t || contact.tags.includes(t)) { setNewTag(''); return; }
    updateContact(contact.id, { tags: [...contact.tags, t] });
    setNewTag('');
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface-sunken" data-tour="contacts.detail" role="dialog" aria-modal="true" aria-label={`Contact: ${fullName(contact)}`}>
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-5 py-3">
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Back to contacts">
          <X size={18} />
        </button>
        <Avatar name={fullName(contact)} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-bold leading-tight text-ink">{fullName(contact)}</h2>
          <p className="truncate text-xs text-ink-muted">{company ? company.name : 'No company'} · {contact.source}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => openDialer(contact.phone)}><PhoneCall size={14} /> Call</Button>
        <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Compose email (demo)', description: `Would email ${contact.email}.`, variant: 'info' })}><Mail size={14} /> Email</Button>
      </div>

      {/* 3-pane body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Left: identity + fields */}
        <aside className="min-h-0 overflow-y-auto border-r border-line bg-surface px-4 py-4">
          <SectionLabel>Contact Info</SectionLabel>
          <div className="flex flex-col gap-2.5">
            <InfoRow icon={<Mail size={13} />} value={contact.email} />
            <InfoRow icon={<Phone size={13} />} value={contact.phone} />
            <InfoRow icon={<Building2 size={13} />} value={company?.name ?? '—'} />
            <InfoRow icon={<Tag size={13} />} value={contact.source} />
            <InfoRow icon={<CalendarDays size={13} />} value={`Added ${dateLabel(contact.createdAt)}`} />
            <InfoRow icon={<Clock size={13} />} value={`Active ${relativeTime(contact.lastActivityAt)}`} />
          </div>

          <SectionLabel className="mt-5">Owner</SectionLabel>
          <select
            value={contact.ownerId}
            onChange={(e) => updateContact(contact.id, { ownerId: e.target.value })}
            className={INPUT_CLS}
          >
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <SectionLabel className="mt-5">Status</SectionLabel>
          <button
            onClick={() => updateContact(contact.id, { dnd: !contact.dnd })}
            className={cx(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold',
              contact.dnd ? 'border-bad/30 bg-bad/5 text-bad' : 'border-line bg-surface-sunken text-ink',
            )}
          >
            <span className="flex items-center gap-1.5"><BellOff size={13} /> Do Not Disturb</span>
            <span>{contact.dnd ? 'ON' : 'OFF'}</span>
          </button>

          <SectionLabel className="mt-5">Tags</SectionLabel>
          <div className="mb-2 flex flex-wrap gap-1">
            {contact.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                {t}
                <button onClick={() => updateContact(contact.id, { tags: contact.tags.filter((x) => x !== t) })} aria-label={`Remove ${t}`} className="hover:text-bad">
                  <X size={10} />
                </button>
              </span>
            ))}
            {contact.tags.length === 0 && <span className="text-[11px] text-ink-subtle">No tags</span>}
          </div>
          <div className="flex gap-1.5">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="Add tag…" className={`${INPUT_CLS} py-1.5`} />
            <Button size="sm" variant="secondary" onClick={addTag}><Plus size={13} /></Button>
          </div>

          <SectionLabel className="mt-5">Custom Fields</SectionLabel>
          <CustomFields contact={contact} />
        </aside>

        {/* Center: activity */}
        <main className="flex min-h-0 flex-col bg-surface-sunken">
          <div className="shrink-0 border-b border-line bg-surface px-4" data-tour="contacts.detailTabs">
            <Tabs
              tabs={[
                { id: 'activity', label: 'Activity', count: timeline.length },
                { id: 'conversations', label: 'Conversations', count: cConvos.length || undefined },
                { id: 'notes', label: 'Notes', count: localNotes.length || undefined },
              ]}
              active={tab}
              onChange={setTab}
              variant="underline"
            />
          </div>

          {/* Composer */}
          <div className="shrink-0 border-b border-line bg-surface px-4 py-3">
            <div className="flex items-start gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a note or log an activity…"
                rows={2}
                className="min-h-[40px] flex-1 resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
              <Button size="sm" onClick={addNote} disabled={!note.trim()}><Send size={14} /> Note</Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {tab === 'activity' && <Timeline events={timeline} />}
            {tab === 'conversations' && <ConversationList convos={cConvos} messages={messages} />}
            {tab === 'notes' && (
              localNotes.length === 0
                ? <Empty text="No notes yet. Use the composer above to add one." />
                : <Timeline events={localNotes} />
            )}
          </div>
        </main>

        {/* Right: related records */}
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface px-4 py-4 lg:block">
          <RelatedBlock title="Opportunities" count={cOpps.length}>
            {cOpps.length === 0 ? <Empty text="No opportunities." /> : cOpps.map((o) => {
              const pipe = pipelines.find((p) => p.id === o.pipelineId);
              const stage = pipe?.stages.find((s) => s.id === o.stageId);
              return (
                <MiniCard key={o.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink">{o.name}</p>
                    <span className="shrink-0 text-xs font-bold text-ink">{money(o.monetaryValue)}</span>
                  </div>
                  <p className="text-[11px] text-ink-subtle">{pipe?.name} · {stage?.name}</p>
                </MiniCard>
              );
            })}
          </RelatedBlock>

          <RelatedBlock title="Appointments" count={cAppts.length}>
            {cAppts.length === 0 ? <Empty text="No appointments." /> : [...cAppts].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)).map((a) => (
              <MiniCard key={a.id}>
                <p className="truncate text-xs font-semibold text-ink">{a.title}</p>
                <p className="text-[11px] text-ink-subtle">{dateLabel(a.startTime)} · {clockTime(a.startTime)} · {a.status.replace('_', ' ')}</p>
              </MiniCard>
            ))}
          </RelatedBlock>

          <RelatedBlock title="Tasks" count={cTasks.length}>
            {cTasks.length === 0 ? <Empty text="No tasks." /> : cTasks.map((t) => (
              <MiniCard key={t.id}>
                <div className="flex items-center gap-1.5">
                  <CheckSquare size={12} className={t.status === 'completed' ? 'text-good' : 'text-ink-subtle'} />
                  <p className={cx('truncate text-xs font-medium text-ink', t.status === 'completed' && 'line-through opacity-70')}>{t.title}</p>
                </div>
                <p className="text-[11px] text-ink-subtle">Due {dateLabel(t.dueDate)}</p>
              </MiniCard>
            ))}
          </RelatedBlock>

          <RelatedBlock title="Invoices" count={cInvoices.length}>
            {cInvoices.length === 0 ? <Empty text="No invoices." /> : cInvoices.map((i) => (
              <MiniCard key={i.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-ink">{i.number}</p>
                  <span className="text-xs font-bold text-ink">{money(i.total)}</span>
                </div>
                <p className="text-[11px] text-ink-subtle capitalize">{i.status}</p>
              </MiniCard>
            ))}
          </RelatedBlock>
        </aside>
      </div>
    </div>
  );
}

const KIND_ICON: Record<TimelineEvent['kind'], ReactNode> = {
  created: <Sparkles size={13} />,
  message: <MessageSquare size={13} />,
  task: <CheckSquare size={13} />,
  appointment: <CalendarDays size={13} />,
  opportunity: <Banknote size={13} />,
  call: <PhoneCall size={13} />,
  invoice: <Banknote size={13} />,
  note: <UserIcon size={13} />,
};

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <Empty text="No activity recorded." />;
  return (
    <ul className="flex flex-col gap-0">
      {events.map((ev, i) => (
        <li key={ev.id} className="relative flex gap-3 pb-4">
          {i < events.length - 1 && <span className="absolute left-[13px] top-7 h-full w-px bg-line" aria-hidden="true" />}
          <span className="z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">{KIND_ICON[ev.kind]}</span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-ink">{ev.title}</p>
              <span className="shrink-0 text-[11px] text-ink-subtle">{relativeTime(ev.at)}</span>
            </div>
            {ev.detail && <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{ev.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ConversationList({ convos, messages }: { convos: Conversation[]; messages: Message[] }) {
  if (convos.length === 0) return <Empty text="No conversations yet." />;
  return (
    <ul className="flex flex-col gap-2.5">
      {convos.map((conv) => {
        const last = messages.filter((m) => conv.messageIds.includes(m.id)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        return (
          <li key={conv.id} className="rounded-xl border border-line bg-surface p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Badge tone="neutral" size="sm">{CHANNEL_LABEL[conv.channel] ?? conv.channel}</Badge>
              <span className="text-[11px] text-ink-subtle">{relativeTime(conv.lastMessageAt)}</span>
            </div>
            {last && <p className="line-clamp-2 text-xs text-ink-muted">{last.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function CustomFields({ contact }: { contact: Contact }) {
  const entries = Object.entries(contact.customFields).filter(([k]) => k !== 'contactType');
  if (entries.length === 0) return <p className="text-xs italic text-ink-subtle">No custom fields set.</p>;
  return (
    <dl className="flex flex-col gap-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-line px-2.5 py-1.5">
          <dt className="text-[11px] font-semibold capitalize text-ink-muted">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
          <dd className="truncate text-xs text-ink">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-subtle', className)}>{children}</p>;
}
function InfoRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="shrink-0 text-ink-subtle">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
function RelatedBlock({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{title}</p>
        <span className="rounded-full bg-surface-sunken px-1.5 text-[10px] font-bold text-ink-subtle">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
function MiniCard({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-line bg-surface px-3 py-2">{children}</div>;
}
function Empty({ text }: { text: string }) {
  return <p className="text-xs italic text-ink-subtle">{text}</p>;
}
