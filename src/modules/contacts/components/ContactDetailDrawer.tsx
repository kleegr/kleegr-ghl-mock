import { useState, useEffect, type ReactNode } from 'react';
import { X, Building2, User, Tag, CalendarDays, Clock, CheckSquare } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx, fullName, dateLabel, relativeTime, userById, money } from '@/utils';
import { Avatar, Badge, Tabs } from '@/components/ui/primitives';
import type {
  Contact, Conversation, Message, Task, Appointment, Opportunity, Pipeline, Calendar,
} from '@/types';

const CHANNEL_LABEL: Record<string, string> = {
  sms: 'SMS', email: 'Email', webchat: 'Web Chat',
  facebook: 'Facebook', instagram: 'Instagram', whatsapp: 'WhatsApp', call: 'Call',
};

const DETAIL_TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'notes', label: 'Notes' },
  { id: 'fields', label: 'Fields' },
];

export function ContactDetailDrawer({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState('activity');

  const users = useStore(s => s.users);
  const companies = useStore(s => s.companies);
  const allConversations = useStore(s => s.conversations);
  const allMessages = useStore(s => s.messages);
  const allTasks = useStore(s => s.tasks);
  const allAppointments = useStore(s => s.appointments);
  const allOpportunities = useStore(s => s.opportunities);
  const pipelines = useStore(s => s.pipelines);
  const calendars = useStore(s => s.calendars);

  const conversations = allConversations.filter(c => c.contactId === contact.id);
  const tasks = allTasks.filter(t => t.contactId === contact.id);
  const appointments = allAppointments.filter(a => a.contactId === contact.id);
  const opportunities = allOpportunities.filter(o => o.contactId === contact.id);

  const owner = userById(users, contact.ownerId);
  const company = companies.find(co => co.id === contact.companyId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const tabs = DETAIL_TABS.map(t => ({
    id: t.id,
    label: t.label,
    count:
      t.id === 'conversations' ? (conversations.length || undefined)
      : t.id === 'tasks' ? (tasks.length || undefined)
      : t.id === 'appointments' ? (appointments.length || undefined)
      : t.id === 'opportunities' ? (opportunities.length || undefined)
      : undefined,
  }));

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      data-tour="contacts.detail"
      role="dialog"
      aria-modal="true"
      aria-label={`Contact detail: ${fullName(contact)}`}
    >
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-surface shadow-pop">

        {/* Header */}
        <div className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4">
          <Avatar name={fullName(contact)} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold leading-tight text-ink">{fullName(contact)}</h2>
            <p className="text-xs text-ink-muted">{contact.email}</p>
            <p className="text-xs text-ink-muted">{contact.phone}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {contact.tags.map(tag => <Badge key={tag} tone="brand" size="sm">{tag}</Badge>)}
              {contact.dnd && <Badge tone="bad" size="sm">DND</Badge>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="shrink-0 grid grid-cols-2 gap-x-6 gap-y-2 border-b border-line px-5 py-3">
          {company && <MetaItem icon={<Building2 size={11} />} text={company.name} />}
          {owner && <MetaItem icon={<User size={11} />} text={owner.name} />}
          <MetaItem icon={<Tag size={11} />} text={contact.source} />
          <MetaItem icon={<CalendarDays size={11} />} text={`Added ${dateLabel(contact.createdAt)}`} />
          <MetaItem icon={<Clock size={11} />} text={`Active ${relativeTime(contact.lastActivityAt)}`} />
        </div>

        {/* Tabs nav */}
        <div data-tour="contacts.detailTabs" className="shrink-0 overflow-x-auto border-b border-line px-2">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />
        </div>

        {/* Tab body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'activity' && (
            <ActivityTab contact={contact} conversations={conversations} tasks={tasks} appointments={appointments} />
          )}
          {activeTab === 'conversations' && (
            <ConversationsTab conversations={conversations} messages={allMessages} />
          )}
          {activeTab === 'tasks' && <TasksTab tasks={tasks} />}
          {activeTab === 'appointments' && (
            <AppointmentsTab appointments={appointments} calendars={calendars} />
          )}
          {activeTab === 'opportunities' && (
            <OpportunitiesTab opportunities={opportunities} pipelines={pipelines} />
          )}
          {activeTab === 'notes' && (
            <p className="text-sm italic text-ink-muted">No notes yet. Notes can be added in the full platform.</p>
          )}
          {activeTab === 'fields' && <CustomFieldsTab contact={contact} />}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
      <span className="shrink-0 text-ink-subtle">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return <p className="text-sm italic text-ink-muted">{text}</p>;
}

function ActivityTab({
  contact, conversations, tasks, appointments,
}: {
  contact: Contact;
  conversations: Conversation[];
  tasks: Task[];
  appointments: Appointment[];
}) {
  const events = [
    { time: contact.createdAt, label: 'Contact created', icon: '...' },
    ...conversations.map(c => ({ time: c.lastMessageAt, label: `${CHANNEL_LABEL[c.channel] ?? c.channel} conversation`, icon: 'msg' })),
    ...tasks.map(t => ({ time: t.dueDate, label: t.title, icon: t.status === 'completed' ? 'done' : 'task' })),
    ...appointments.map(a => ({ time: a.startTime, label: a.title, icon: 'cal' })),
  ].sort((a, b) => +new Date(b.time) - +new Date(a.time));

  const iconMap: Record<string, string> = { '...': '✨', msg: '💬', done: '✅', task: '📋', cal: '📅' };

  if (events.length === 0) return <SectionEmpty text="No activity recorded." />;
  return (
    <ul className="flex flex-col gap-3">
      {events.map((ev, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-0.5 text-base leading-none">{iconMap[ev.icon] ?? ev.icon}</span>
          <div className="min-w-0">
            <p className="text-sm text-ink">{ev.label}</p>
            <p className="text-xs text-ink-subtle">{relativeTime(ev.time)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ConversationsTab({ conversations, messages }: { conversations: Conversation[]; messages: Message[] }) {
  if (conversations.length === 0) return <SectionEmpty text="No conversations yet." />;
  return (
    <ul className="flex flex-col gap-3">
      {conversations.map(conv => {
        const lastMsg = messages
          .filter(m => conv.messageIds.includes(m.id))
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        return (
          <li key={conv.id} className="rounded-lg border border-line p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Badge tone="neutral" size="sm">{CHANNEL_LABEL[conv.channel] ?? conv.channel}</Badge>
              <span className="text-[11px] text-ink-subtle">{relativeTime(conv.lastMessageAt)}</span>
            </div>
            {lastMsg && <p className="line-clamp-2 text-xs text-ink-muted">{lastMsg.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function TasksTab({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <SectionEmpty text="No tasks assigned to this contact." />;
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map(task => (
        <li
          key={task.id}
          className={cx('flex items-start gap-2.5 rounded-lg border border-line p-3', task.status === 'completed' && 'opacity-60')}
        >
          <CheckSquare size={14} className={cx('mt-0.5 shrink-0', task.status === 'completed' ? 'text-good' : 'text-ink-subtle')} />
          <div className="min-w-0 flex-1">
            <p className={cx('text-sm font-medium text-ink', task.status === 'completed' && 'line-through')}>{task.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] text-ink-subtle">Due {dateLabel(task.dueDate)}</span>
              <Badge tone={task.priority === 'high' ? 'bad' : task.priority === 'medium' ? 'warn' : 'neutral'} size="sm">{task.priority}</Badge>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AppointmentsTab({ appointments, calendars }: { appointments: Appointment[]; calendars: Calendar[] }) {
  if (appointments.length === 0) return <SectionEmpty text="No appointments scheduled." />;
  const sorted = [...appointments].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
  return (
    <ul className="flex flex-col gap-2">
      {sorted.map(appt => {
        const cal = calendars.find(c => c.id === appt.calendarId);
        const tone: 'good' | 'bad' | 'neutral' =
          appt.status === 'showed' ? 'good'
          : (appt.status === 'no_show' || appt.status === 'cancelled') ? 'bad'
          : 'neutral';
        return (
          <li key={appt.id} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{appt.title}</p>
                {cal && <p className="text-[11px] text-ink-subtle">{cal.name}</p>}
                <p className="text-xs text-ink-muted">{dateLabel(appt.startTime)}</p>
              </div>
              <Badge tone={tone} size="sm">{appt.status.replace('_', ' ')}</Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function OpportunitiesTab({ opportunities, pipelines }: { opportunities: Opportunity[]; pipelines: Pipeline[] }) {
  if (opportunities.length === 0) return <SectionEmpty text="No opportunities for this contact." />;
  return (
    <ul className="flex flex-col gap-2">
      {opportunities.map(opp => {
        const pipeline = pipelines.find(p => p.id === opp.pipelineId);
        const stage = pipeline?.stages.find(s => s.id === opp.stageId);
        const tone: 'good' | 'bad' | 'brand' =
          opp.status === 'won' ? 'good'
          : (opp.status === 'lost' || opp.status === 'abandoned') ? 'bad'
          : 'brand';
        return (
          <li key={opp.id} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{opp.name}</p>
                <p className="text-[11px] text-ink-subtle">{pipeline?.name} / {stage?.name}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-sm font-bold text-ink">{money(opp.monetaryValue)}</p>
                <Badge tone={tone} size="sm">{opp.status}</Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CustomFieldsTab({ contact }: { contact: Contact }) {
  const entries = Object.entries(contact.customFields);
  if (entries.length === 0) return <SectionEmpty text="No custom fields defined." />;
  return (
    <dl className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-line px-3 py-2">
          <dt className="text-xs font-semibold capitalize text-ink-muted">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
          <dd className="text-sm text-ink">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
