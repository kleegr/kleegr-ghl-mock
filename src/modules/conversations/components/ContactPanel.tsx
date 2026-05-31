/**
 * ContactPanel — the GHL right rail + contextual panel.
 *
 * A far-right icon rail switches between Contact Details, Activity, Notes,
 * Tasks, Appointments, Documents, Payments and Associations. The active panel
 * is persisted in the URL (`?panel=…`) so it survives conversation switches and
 * is navigable. Data comes from the in-memory store (appointments / tasks /
 * invoices are REAL linked records); Notes & Documents are demo-safe,
 * session-editable, and seeded deterministically. No button is a silent no-op.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Clock, CalendarDays, CheckSquare, Share2, FileText, DollarSign, Sparkles,
  X, Plus, ExternalLink, ChevronDown, Search, SlidersHorizontal, Video, Copy,
  MapPin, CircleUser, StickyNote, Pin, Trash2, Upload, FileSignature, MoreHorizontal,
  Receipt,
} from 'lucide-react';
import { Avatar, Badge } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, userById, initials, money } from '@/utils';
import type { Contact } from '@/types';
import {
  seedNotesForContact, seedDocumentsForContact, type ContactNote, type DemoDocument,
} from '../panelData';

type PanelKey = 'contact' | 'activity' | 'notes' | 'tasks' | 'appts' | 'docs' | 'payments' | 'assoc';

const PANEL_KEYS: PanelKey[] = ['contact', 'activity', 'notes', 'tasks', 'appts', 'docs', 'payments', 'assoc'];

const RAIL: { key: PanelKey; Icon: React.ElementType; label: string }[] = [
  { key: 'contact', Icon: User, label: 'Contact details' },
  { key: 'activity', Icon: Clock, label: 'Activity' },
  { key: 'notes', Icon: StickyNote, label: 'Notes' },
  { key: 'tasks', Icon: CheckSquare, label: 'Tasks' },
  { key: 'appts', Icon: CalendarDays, label: 'Appointments' },
  { key: 'docs', Icon: FileText, label: 'Documents' },
  { key: 'payments', Icon: DollarSign, label: 'Payments' },
  { key: 'assoc', Icon: Share2, label: 'Associations' },
];

export function ContactPanel({ contact }: { contact: Contact }) {
  const pushToast = useStore((s) => s.pushToast);
  const currentUser = useStore((s) => s.users.find((u) => u.isCurrentUser));
  const authorName = currentUser?.name ?? 'Demo User';

  // active panel lives in the URL so it persists across conversation switches
  const [params, setParams] = useSearchParams();
  const raw = params.get('panel');
  const active: PanelKey | null = raw === 'closed' ? null : PANEL_KEYS.includes(raw as PanelKey) ? (raw as PanelKey) : 'contact';
  const setActive = (k: PanelKey | null) => {
    const next = new URLSearchParams(params);
    next.set('panel', k ?? 'closed');
    setParams(next, { replace: true });
  };

  // session-editable Notes & Documents (seeded deterministically on first view)
  const [notesByContact, setNotesByContact] = useState<Record<string, ContactNote[]>>({});
  const [docsByContact, setDocsByContact] = useState<Record<string, DemoDocument[]>>({});
  const notes = notesByContact[contact.id] ?? seedNotesForContact(contact, authorName);
  const docs = docsByContact[contact.id] ?? seedDocumentsForContact(contact);

  const addNote = (body: string) =>
    setNotesByContact((prev) => ({
      ...prev,
      [contact.id]: [
        { id: `note_${Date.now()}`, author: authorName, body, createdAt: new Date().toISOString() },
        ...(prev[contact.id] ?? seedNotesForContact(contact, authorName)),
      ],
    }));
  const deleteNote = (id: string) =>
    setNotesByContact((prev) => ({
      ...prev,
      [contact.id]: (prev[contact.id] ?? seedNotesForContact(contact, authorName)).filter((n) => n.id !== id),
    }));
  const addDoc = (kind: DemoDocument['kind']) =>
    setDocsByContact((prev) => ({
      ...prev,
      [contact.id]: [
        { id: `doc_${Date.now()}`, name: `${kind} — ${fullName(contact)}`, status: 'draft', kind, createdAt: new Date().toISOString() },
        ...(prev[contact.id] ?? seedDocumentsForContact(contact)),
      ],
    }));

  return (
    <div data-tour="conversations.contactContext" className="flex h-full min-h-0 border-l border-line bg-surface">
      {active && (
        <div className="flex min-h-0 w-[332px] flex-none flex-col overflow-y-auto">
          {active === 'contact' && <ContactDetails contact={contact} onClose={() => setActive(null)} onGoTo={setActive} />}
          {active === 'activity' && <ActivityPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'notes' && <NotesPanel notes={notes} onAdd={addNote} onDelete={deleteNote} onClose={() => setActive(null)} />}
          {active === 'tasks' && <TasksPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'appts' && <AppointmentsPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'docs' && <DocumentsPanel docs={docs} onAdd={addDoc} onClose={() => setActive(null)} />}
          {active === 'payments' && <PaymentsPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'assoc' && <AssociationsPanel contact={contact} onClose={() => setActive(null)} />}
        </div>
      )}

      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-line py-3">
        {RAIL.map(({ key, Icon, label }) => {
          const on = key === active;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={on}
              onClick={() => setActive(on ? null : key)}
              className={cx(
                'grid h-9 w-9 place-items-center rounded-lg transition-colors',
                on ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink-muted',
              )}
            >
              <Icon size={18} strokeWidth={on ? 2.3 : 2} aria-hidden />
            </button>
          );
        })}
        <div className="my-1 h-px w-6 bg-line" aria-hidden />
        <button
          type="button"
          title="AI summary"
          aria-label="AI summary"
          onClick={() => pushToast({ title: 'AI summary', description: 'Conversation summaries are cosmetic in the demo.', variant: 'info' })}
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink-muted"
        >
          <Sparkles size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function PanelHeader({ title, onClose, actions }: { title: string; onClose: () => void; actions?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      <div className="flex items-center gap-1">
        {actions}
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Close panel"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ Icon, title, sub, action }: { Icon: React.ElementType; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon size={28} className="text-ink-subtle" aria-hidden />
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {sub && <p className="max-w-[210px] text-[12px] text-ink-muted">{sub}</p>}
      {action}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-ink-subtle">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}

function ContactDetails({ contact, onClose, onGoTo }: { contact: Contact; onClose: () => void; onGoTo: (k: PanelKey) => void }) {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  const owner = userById(users, contact.ownerId);
  const name = fullName(contact);
  const [tab, setTab] = useState<'all' | 'dnd' | 'actions'>('all');
  const followers = users.filter((u) => u.id !== contact.ownerId).slice(0, 2);

  return (
    <>
      <PanelHeader title="Contact Details" onClose={onClose} />
      <div className="space-y-4 px-4 pb-6">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="md" />
          <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{name}</p>
          <button
            type="button"
            onClick={() => pushToast({ title: 'Open contact', description: 'Full contact record opens in the Contacts module (demo).', variant: 'info' })}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Open full contact record"
          >
            <ExternalLink size={15} aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[12px] text-ink-subtle">Owner</p>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-surface-sunken px-2 py-1 text-[12px] text-ink ring-1 ring-line">
              <CircleUser size={13} className="text-ink-subtle" aria-hidden />
              {owner?.name ?? 'Unassigned'}
              <ChevronDown size={11} className="text-ink-subtle" aria-hidden />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[12px] text-ink-subtle">Followers</p>
            <div className="flex items-center gap-1">
              {followers.map((f) => (
                <span key={f.id} className="grid h-6 w-6 place-items-center rounded-full bg-ai-soft text-[9px] font-bold text-ai ring-2 ring-surface" title={f.name}>
                  {initials(f.name.split(' ')[0], f.name.split(' ')[1])}
                </span>
              ))}
              <ChevronDown size={11} className="text-ink-subtle" aria-hidden />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1 text-[12px] text-ink-subtle">
            Tags ({contact.tags.length})
            <Plus size={12} className="text-brand" aria-hidden />
          </p>
          <div className="flex flex-wrap gap-1">
            {contact.tags.length === 0 ? (
              <span className="text-[12px] text-ink-subtle">No tags</span>
            ) : (
              contact.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                  {t}
                  <X size={10} aria-hidden />
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 border-b border-line">
          {([['all', 'All fields'], ['dnd', 'DND'], ['actions', 'Actions']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cx('relative -mb-px py-2 text-[13px] font-semibold transition-colors', tab === id ? 'text-brand' : 'text-ink-muted hover:text-ink')}
            >
              {label}
              {tab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[13px] text-ink-subtle">
          <Search size={14} aria-hidden />
          <span className="flex-1">Search fields and folders</span>
          <SlidersHorizontal size={14} aria-hidden />
        </div>

        {tab === 'dnd' ? (
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[12px] text-ink-muted">
            Do-Not-Disturb is {contact.dnd ? 'ON' : 'OFF'} for all channels (demo).
          </p>
        ) : tab === 'actions' ? (
          <div className="grid grid-cols-2 gap-1.5">
            {([['Add Note', () => onGoTo('notes')], ['Add Task', () => onGoTo('tasks')], ['Book Appt', () => onGoTo('appts')], ['Documents', () => onGoTo('docs')]] as const).map(([l, fn]) => (
              <button
                key={l}
                type="button"
                onClick={fn}
                className="rounded-lg border border-line px-2 py-1.5 text-center text-[12px] font-semibold text-ink hover:bg-surface-sunken"
              >
                {l}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="flex items-center justify-between text-[13px] font-bold text-ink">
              Contact <ChevronDown size={14} className="text-ink-subtle" aria-hidden />
            </p>
            <Field label="First name" value={contact.firstName} />
            <Field label="Last name" value={contact.lastName} />
            <Field label="Email" value={contact.email} />
            <Field label="Phone" value={contact.phone} />
            <Field label="Date of birth" value={<span className="text-ink-subtle">--</span>} />
            <Field label="Contact source" value={contact.source} />
            <Field label="Contact type" value={<span className="capitalize">{String(contact.tags[0] ?? 'lead')}</span>} />
          </div>
        )}
      </div>
    </>
  );
}

function NotesPanel({
  notes, onAdd, onDelete, onClose,
}: { notes: ContactNote[]; onAdd: (body: string) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const filtered = query.trim() ? notes.filter((n) => n.body.toLowerCase().includes(query.trim().toLowerCase())) : notes;
  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAdd(body);
    setDraft('');
  };

  return (
    <>
      <PanelHeader title={`Notes (${notes.length})`} onClose={onClose} />
      <div className="space-y-3 px-4 pb-6">
        <div className="rounded-xl border border-line p-2 shadow-sm">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Write a note…"
            className="block w-full resize-none bg-transparent px-1 py-1 text-[13px] text-ink outline-none placeholder:text-ink-subtle"
            aria-label="Write a note"
          />
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              <Plus size={12} aria-hidden /> Add note
            </button>
          </div>
        </div>

        {notes.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[13px] text-ink-subtle">
            <Search size={14} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
              aria-label="Search notes"
            />
          </div>
        )}

        {notes.length === 0 ? (
          <EmptyState Icon={StickyNote} title="No notes yet" sub="Add a note to keep the team in the loop on this contact." />
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-ink-muted">No notes match “{query}”.</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className="group rounded-xl border border-line p-3 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-subtle">
                {n.pinned && <Pin size={11} className="text-warn" aria-hidden />}
                <span className="font-semibold text-ink-muted">{n.author}</span>
                <span>· {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="ml-auto text-ink-subtle opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 size={13} aria-hidden />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-snug text-ink">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

const DOC_TONE: Record<DemoDocument['status'], 'good' | 'brand' | 'warn' | 'neutral'> = {
  signed: 'good',
  sent: 'brand',
  viewed: 'warn',
  draft: 'neutral',
};

function DocumentsPanel({ docs, onAdd, onClose }: { docs: DemoDocument[]; onAdd: (kind: DemoDocument['kind']) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'all' | 'sent' | 'signed'>('all');
  const list = docs.filter((d) => (tab === 'all' ? true : tab === 'sent' ? d.status === 'sent' || d.status === 'viewed' : d.status === 'signed'));

  return (
    <>
      <PanelHeader
        title="Documents & Contracts"
        onClose={onClose}
        actions={
          <button type="button" onClick={() => onAdd('Proposal')} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-brand hover:bg-brand-soft">
            <Plus size={13} aria-hidden /> New
          </button>
        }
      />
      <div className="space-y-3 px-4 pb-6">
        <div className="flex items-center gap-5 border-b border-line">
          {(['all', 'sent', 'signed'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx('relative -mb-px py-2 text-[13px] font-semibold capitalize', tab === t ? 'text-brand' : 'text-ink-muted hover:text-ink')}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            Icon={FileSignature}
            title="No documents yet"
            sub="Send a proposal or contract for e-signature and track it from draft to signed."
            action={
              <div className="mt-1 flex items-center gap-2">
                <button type="button" onClick={() => onAdd('Proposal')} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand/90">
                  <Plus size={12} aria-hidden /> New document
                </button>
                <button type="button" onClick={() => onAdd('Contract')} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface-sunken">
                  <Upload size={12} aria-hidden /> Upload
                </button>
              </div>
            }
          />
        ) : (
          list.map((d) => (
            <div key={d.id} className="flex items-start gap-2.5 rounded-xl border border-line p-3 shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted">
                <FileText size={15} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{d.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {d.kind} · {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <Badge tone={DOC_TONE[d.status]}>{d.status}</Badge>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function PaymentsPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const invoices = useStore((s) => s.invoices.filter((i) => i.contactId === contact.id));
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<'invoices' | 'subscriptions' | 'transactions'>('invoices');

  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0);
  const tone = (st: string): 'good' | 'brand' | 'bad' | 'neutral' =>
    st === 'paid' ? 'good' : st === 'sent' ? 'brand' : st === 'overdue' ? 'bad' : 'neutral';

  return (
    <>
      <PanelHeader
        title="Payments"
        onClose={onClose}
        actions={
          <button
            type="button"
            onClick={() => pushToast({ title: 'New invoice', description: 'Invoicing lives in the Payments module (demo).', variant: 'info' })}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Payments actions"
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
        }
      />
      <div className="space-y-3 px-4 pb-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-surface-sunken px-3 py-2">
            <p className="text-[11px] text-ink-subtle">Paid</p>
            <p className="text-[15px] font-bold text-good">{money(paid)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-sunken px-3 py-2">
            <p className="text-[11px] text-ink-subtle">Outstanding</p>
            <p className="text-[15px] font-bold text-ink">{money(outstanding)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-line">
          {(['invoices', 'subscriptions', 'transactions'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx('relative -mb-px py-2 text-[13px] font-semibold capitalize', tab === t ? 'text-brand' : 'text-ink-muted hover:text-ink')}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
            </button>
          ))}
        </div>

        {tab === 'invoices' ? (
          invoices.length === 0 ? (
            <EmptyState
              Icon={Receipt}
              title="No invoices yet"
              sub="Invoices sent to this contact will appear here with their payment status."
              action={
                <button
                  type="button"
                  onClick={() => pushToast({ title: 'New invoice', description: 'Invoicing lives in the Payments module (demo).', variant: 'info' })}
                  className="mt-1 flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface-sunken"
                >
                  <Plus size={12} aria-hidden /> New invoice
                </button>
              }
            />
          ) : (
            invoices
              .slice()
              .sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt))
              .map((inv) => (
                <div key={inv.id} className="flex items-center gap-2.5 rounded-xl border border-line p-3 shadow-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted">
                    <Receipt size={15} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{inv.number}</p>
                    <p className="text-[12px] text-ink-muted">
                      Issued {new Date(inv.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-ink">{money(inv.total)}</span>
                    <Badge tone={tone(inv.status)}>{inv.status}</Badge>
                  </div>
                </div>
              ))
          )
        ) : (
          <EmptyState
            Icon={DollarSign}
            title={`No ${tab} yet`}
            sub={tab === 'subscriptions' ? 'Recurring plans for this contact will show here.' : 'One-off charges and refunds will show here.'}
          />
        )}
      </div>
    </>
  );
}

function AppointmentsPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const appts = useStore((s) => s.appointments.filter((a) => a.contactId === contact.id));
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  const owner = userById(users, contact.ownerId);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const now = Date.now();
  const list = appts.filter((a) => (tab === 'upcoming' ? +new Date(a.startTime) >= now : +new Date(a.startTime) < now));
  const add = () => pushToast({ title: 'Add appointment', description: 'Booking happens in the Calendars module (demo).', variant: 'info' });

  return (
    <>
      <PanelHeader
        title="Appointments"
        onClose={onClose}
        actions={
          <button type="button" onClick={add} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-brand hover:bg-brand-soft">
            <Plus size={13} aria-hidden /> Add
          </button>
        }
      />
      <div className="space-y-3 px-4 pb-6">
        <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[13px] text-ink-subtle">
          <Search size={14} aria-hidden />
          <span className="flex-1">Search by Calendar Name</span>
        </div>
        <div className="flex items-center gap-6 border-b border-line">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx('relative -mb-px py-2 text-[13px] font-semibold capitalize', tab === t ? 'text-brand' : 'text-ink-muted hover:text-ink')}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            Icon={CalendarDays}
            title="No appointments yet"
            sub="Keep things moving by creating your first appointment."
            action={
              <button type="button" onClick={add} className="mt-1 rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface-sunken">
                Add Appointment
              </button>
            }
          />
        ) : (
          list.map((a) => (
            <div key={a.id} className="rounded-xl border border-line p-3 shadow-sm">
              <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {new Date(a.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              <span className="mt-1.5 inline-block">
                <Badge tone={a.status === 'confirmed' ? 'good' : a.status === 'cancelled' ? 'bad' : 'neutral'}>{a.status}</Badge>
              </span>
              <div className="mt-2 space-y-1 text-[12px] text-ink-muted">
                <p className="flex items-center gap-1.5"><MapPin size={12} aria-hidden /> {a.location ?? 'Google Meet'}</p>
                <p className="flex items-center gap-1.5"><CircleUser size={12} aria-hidden /> {owner?.name ?? 'Unassigned'}</p>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={() => pushToast({ title: 'Join call', description: 'Cosmetic in the demo.', variant: 'info' })} className="grid h-6 w-6 place-items-center rounded bg-brand/10 text-brand"><Video size={12} aria-hidden /></button>
                <button type="button" onClick={() => pushToast({ title: 'Copy link', description: 'Cosmetic in the demo.', variant: 'info' })} className="grid h-6 w-6 place-items-center rounded bg-surface-sunken text-ink-muted"><Copy size={12} aria-hidden /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function TasksPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const tasks = useStore((s) => s.tasks.filter((t) => t.contactId === contact.id));
  const toggleTask = useStore((s) => s.toggleTask);
  const pushToast = useStore((s) => s.pushToast);

  return (
    <>
      <PanelHeader
        title="Tasks"
        onClose={onClose}
        actions={
          <button type="button" onClick={() => pushToast({ title: 'Add task', description: 'Task creation lives in Tasks / Projects (demo).', variant: 'info' })} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-brand hover:bg-brand-soft">
            <Plus size={13} aria-hidden /> Add
          </button>
        }
      />
      <div className="space-y-2 px-4 pb-6">
        <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-[13px] text-ink-subtle">
          <Search size={14} aria-hidden />
          <span className="flex-1">Search by title</span>
        </div>
        {tasks.length === 0 ? (
          <EmptyState Icon={CheckSquare} title="No tasks yet" sub="Tasks linked to this contact will appear here." />
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 rounded-xl border border-line p-3 shadow-sm">
              <button
                type="button"
                onClick={() => toggleTask(t.id)}
                className={cx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', t.status === 'completed' ? 'border-good bg-good text-white' : 'border-ink-subtle')}
                aria-label={t.status === 'completed' ? 'Mark task open' : 'Mark task complete'}
              >
                {t.status === 'completed' && <CheckSquare size={9} aria-hidden />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cx('text-[13px] font-semibold', t.status === 'completed' ? 'text-ink-subtle line-through' : 'text-ink')}>{t.title}</p>
                {t.description && <p className="mt-0.5 text-[12px] text-ink-muted">{t.description}</p>}
                <p className="mt-0.5 text-[12px] text-ink-subtle">
                  Due: {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function ActivityPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const opps = useStore((s) => s.opportunities.filter((o) => o.contactId === contact.id));
  const appts = useStore((s) => s.appointments.filter((a) => a.contactId === contact.id));
  const invoices = useStore((s) => s.invoices.filter((i) => i.contactId === contact.id));
  type Item = { when: string; title: string; sub: string };
  const items: Item[] = [
    ...appts.map((a) => ({ when: a.startTime, title: 'Appointment booked', sub: a.title })),
    ...opps.map((o) => ({ when: o.updatedAt, title: 'Opportunity updated', sub: `${o.name} · ${o.status}` })),
    ...invoices.map((i) => ({ when: i.issuedAt, title: `Invoice ${i.status}`, sub: `${i.number} · ${money(i.total)}` })),
    { when: contact.createdAt, title: 'Contact created', sub: `Source: ${contact.source}` },
  ].sort((a, b) => +new Date(b.when) - +new Date(a.when));

  return (
    <>
      <PanelHeader title="Activity (EDT)" onClose={onClose} />
      <div className="space-y-4 px-4 pb-6">
        {items.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-muted">No recent activity.</p>
        ) : (
          items.map((it, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" aria-hidden />
                {i < items.length - 1 && <span className="my-0.5 w-px flex-1 bg-line" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[13px] font-semibold text-ink">{it.title}</p>
                <p className="truncate text-[12px] text-ink-muted">{it.sub}</p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {new Date(it.when).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function AssociationsPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const companies = useStore((s) => s.companies.filter((c) => c.id === contact.companyId));
  const pushToast = useStore((s) => s.pushToast);
  const demo = (t: string) => pushToast({ title: t, description: 'Associations are cosmetic in the demo.', variant: 'info' });

  return (
    <>
      <PanelHeader
        title="Associations"
        onClose={onClose}
        actions={
          <button type="button" onClick={() => demo('Manage associations')} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-brand hover:bg-brand-soft">
            <ExternalLink size={12} aria-hidden /> Manage
          </button>
        }
      />
      <div className="space-y-3 px-4 pb-6">
        <p className="flex items-center justify-between text-[13px] font-bold text-ink">
          Companies ({companies.length})
          <button type="button" onClick={() => demo('Add company')} className="flex items-center gap-1 text-[12px] font-semibold text-brand">
            <Plus size={12} aria-hidden /> Add
          </button>
        </p>
        {companies.length === 0 ? (
          <>
            <p className="py-4 text-center text-[13px] text-ink-muted">No Company associated</p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={() => demo('Create new company')} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface-sunken">Create new</button>
              <button type="button" onClick={() => demo('Link existing company')} className="text-[12px] font-semibold text-brand hover:underline">Link existing</button>
            </div>
          </>
        ) : (
          companies.map((c) => (
            <div key={c.id} className="rounded-xl border border-line p-3 shadow-sm">
              <p className="text-[13px] font-semibold text-ink">{c.name}</p>
              {c.industry && <p className="text-[12px] text-ink-muted">{c.industry}</p>}
            </div>
          ))
        )}
      </div>
    </>
  );
}
