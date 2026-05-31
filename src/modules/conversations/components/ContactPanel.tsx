/**
 * ContactPanel — the GHL right rail + contextual panel.
 * A far-right icon rail switches between Contact Details, Activity,
 * Appointments, Tasks and Associations. All data comes from the in-memory
 * demo store; action buttons are demo-safe (toast feedback, never dead).
 */
import { useState } from 'react';
import {
  User,
  Clock,
  CalendarDays,
  CheckSquare,
  Share2,
  FileText,
  DollarSign,
  Sparkles,
  ClipboardList,
  X,
  Plus,
  ExternalLink,
  ChevronDown,
  CalendarPlus,
  Search,
  SlidersHorizontal,
  Video,
  Copy,
  MapPin,
  CircleUser,
} from 'lucide-react';
import { Avatar, Badge } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, userById, initials } from '@/utils';
import type { Contact } from '@/types';

type PanelKey = 'contact' | 'activity' | 'appts' | 'tasks' | 'assoc';

const RAIL: { key: PanelKey; Icon: React.ElementType; label: string }[] = [
  { key: 'contact', Icon: User, label: 'Contact details' },
  { key: 'activity', Icon: Clock, label: 'Activity' },
  { key: 'assoc', Icon: Share2, label: 'Associations' },
  { key: 'tasks', Icon: CheckSquare, label: 'Tasks' },
  { key: 'appts', Icon: CalendarDays, label: 'Appointments' },
];

const RAIL_COSMETIC: { Icon: React.ElementType; label: string }[] = [
  { Icon: FileText, label: 'Notes' },
  { Icon: DollarSign, label: 'Payments' },
  { Icon: Sparkles, label: 'AI summary' },
  { Icon: ClipboardList, label: 'Documents' },
];

export function ContactPanel({ contact }: { contact: Contact }) {
  const [active, setActive] = useState<PanelKey | null>('contact');
  const pushToast = useStore((s) => s.pushToast);

  return (
    <div
      data-tour="conversations.contactContext"
      className="flex h-full min-h-0 border-l border-line bg-surface"
    >
      {/* Panel content */}
      {active && (
        <div className="flex min-h-0 w-[332px] flex-none flex-col overflow-y-auto">
          {active === 'contact' && <ContactDetails contact={contact} onClose={() => setActive(null)} />}
          {active === 'activity' && <ActivityPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'appts' && <AppointmentsPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'tasks' && <TasksPanel contact={contact} onClose={() => setActive(null)} />}
          {active === 'assoc' && <AssociationsPanel contact={contact} onClose={() => setActive(null)} />}
        </div>
      )}

      {/* Far-right icon rail */}
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
        {RAIL_COSMETIC.map(({ Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => pushToast({ title: label, description: 'This panel is cosmetic in the demo.', variant: 'info' })}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink-muted"
          >
            <Icon size={18} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- shared header ---------------------------------------------------------

function PanelHeader({
  title,
  onClose,
  actions,
}: {
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
}) {
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

// --- Contact Details -------------------------------------------------------

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-ink-subtle">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}

function ContactDetails({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  const owner = userById(users, contact.ownerId);
  const name = fullName(contact);
  const [tab, setTab] = useState<'all' | 'dnd' | 'actions'>('all');

  return (
    <>
      <PanelHeader title="Contact Details" onClose={onClose} />
      <div className="space-y-4 px-4 pb-6">
        {/* identity */}
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

        {/* owner / followers */}
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
              {[owner, ...users.filter((u) => u.id !== owner?.id)]
                .filter((u): u is NonNullable<typeof u> => Boolean(u))
                .slice(0, 2)
                .map((u) => (
                  <span key={u.id} className="grid h-6 w-6 place-items-center rounded-full bg-ai-soft text-[9px] font-bold text-ai ring-2 ring-surface" title={u.name}>
                    {initials(u.name.split(' ')[0], u.name.split(' ')[1])}
                  </span>
                ))}
              <ChevronDown size={11} className="text-ink-subtle" aria-hidden />
            </div>
          </div>
        </div>

        {/* tags */}
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

        {/* sub-tabs */}
        <div className="flex items-center gap-5 border-b border-line">
          {([['all', 'All fields'], ['dnd', 'DND'], ['actions', 'Actions']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cx(
                'relative -mb-px py-2 text-[13px] font-semibold transition-colors',
                tab === id ? 'text-brand' : 'text-ink-muted hover:text-ink',
              )}
            >
              {label}
              {tab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
            </button>
          ))}
        </div>

        {/* search */}
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
            {['Add Note', 'Add Task', 'Book Appt', 'View Profile'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pushToast({ title: l, description: 'Demo-safe action.', variant: 'info' })}
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

// --- Appointments ----------------------------------------------------------

function AppointmentsPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const appts = useStore((s) => s.appointments.filter((a) => a.contactId === contact.id));
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  const owner = userById(users, contact.ownerId);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const now = Date.now();
  const list = appts.filter((a) =>
    tab === 'upcoming' ? +new Date(a.startTime) >= now : +new Date(a.startTime) < now,
  );
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
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarDays size={28} className="text-ink-subtle" aria-hidden />
            <p className="text-[13px] font-semibold text-ink">No appointments yet</p>
            <p className="max-w-[200px] text-[12px] text-ink-muted">Keep things moving by creating your first appointment.</p>
            <button type="button" onClick={add} className="mt-1 rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface-sunken">
              Add Appointment
            </button>
          </div>
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

// --- Tasks -----------------------------------------------------------------

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
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckSquare size={28} className="text-ink-subtle" aria-hidden />
            <p className="text-[13px] font-semibold text-ink">No tasks yet</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 rounded-xl border border-line p-3 shadow-sm">
              <button
                type="button"
                onClick={() => toggleTask(t.id)}
                className={cx(
                  'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2',
                  t.status === 'completed' ? 'border-good bg-good text-white' : 'border-ink-subtle',
                )}
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

// --- Activity --------------------------------------------------------------

function ActivityPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const opps = useStore((s) => s.opportunities.filter((o) => o.contactId === contact.id));
  const appts = useStore((s) => s.appointments.filter((a) => a.contactId === contact.id));
  type Item = { when: string; title: string; sub: string };
  const items: Item[] = [
    ...appts.map((a) => ({ when: a.startTime, title: 'Appointment booked', sub: a.title })),
    ...opps.map((o) => ({ when: o.updatedAt, title: 'Opportunity updated', sub: `${o.name} · ${o.status}` })),
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

// --- Associations ----------------------------------------------------------

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
