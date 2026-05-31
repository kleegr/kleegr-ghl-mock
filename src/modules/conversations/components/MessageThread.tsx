/**
 * MessageThread — center pane: thread header (action icons) and a day-grouped
 * stream that interleaves message bubbles, completed-call cards (audio player +
 * transcript) and inline system-event rows, plus — for showcase threads —
 * internal notes (distinct styling + @mention), collapsed email cards, and
 * appointment / opportunity / task event cards. The stream is derived in-memory
 * from the seed via `buildThreadItems`, so Reset Demo restores it exactly.
 */
import { Fragment, useMemo, useState } from 'react';
import {
  Reply,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  FolderInput,
  Star,
  MailOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Volume2,
  RotateCcw,
  Download,
  Check,
  CheckCheck,
  CornerDownRight,
  FileText,
  Lock,
  Mail,
  CalendarCheck,
  TrendingUp,
  CheckSquare,
} from 'lucide-react';
import { Avatar, Badge } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, clockTime, initials, relativeTime, money } from '@/utils';
import type { Conversation, Contact, Call, Message } from '@/types';
import { CHANNEL_META, threadDayLabel, dayKey } from '../utils';
import { buildThreadItems, formatCallDuration, type ThreadItem, type LocalNote } from '../threadModel';

// --- Thread header ---------------------------------------------------------

function HeaderAction({
  Icon,
  label,
  withChevron,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  withChevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 items-center gap-0.5 rounded-md px-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      <Icon size={17} aria-hidden />
      {withChevron && <ChevronDown size={12} aria-hidden />}
    </button>
  );
}

function ThreadHeader({ contact, onBack }: { contact: Contact; onBack?: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const demo = (title: string) =>
    pushToast({ title, description: 'This action is cosmetic in the demo.', variant: 'info' });
  const name = fullName(contact);

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="rounded p-1 text-ink-subtle hover:bg-surface-sunken lg:hidden"
          aria-label="Back to inbox"
        >
          <Reply size={18} aria-hidden />
        </button>
      )}
      <Avatar name={name} size="sm" />
      <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{name}</p>
      <div className="flex shrink-0 items-center gap-0.5">
        <HeaderAction Icon={Reply} label="Reply channel" withChevron onClick={() => demo('Channel')} />
        <HeaderAction Icon={Phone} label="Call contact" withChevron onClick={() => demo('Call')} />
        <HeaderAction Icon={FolderInput} label="Move conversation" onClick={() => demo('Move to folder')} />
        <HeaderAction Icon={Star} label="Star conversation" onClick={() => demo('Star')} />
        <HeaderAction Icon={MailOpen} label="Mark as unread" onClick={() => demo('Mark unread')} />
        <HeaderAction Icon={Trash2} label="Delete conversation" onClick={() => demo('Delete')} />
      </div>
    </div>
  );
}

// --- Date separator --------------------------------------------------------

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-ink-muted shadow-sm ring-1 ring-line">
        {label}
      </span>
    </div>
  );
}

// --- Read-status ticks -----------------------------------------------------

function StatusTicks({ status }: { status?: Message['status'] }) {
  if (!status) return null;
  if (status === 'sent') return <Check size={13} className="text-ink-subtle" aria-label="sent" />;
  if (status === 'read') return <CheckCheck size={13} className="text-brand" aria-label="read" />;
  if (status === 'failed') return <span className="text-[10px] font-semibold text-bad">failed</span>;
  return <CheckCheck size={13} className="text-ink-subtle" aria-label="delivered" />;
}

// --- Inline system-event row -----------------------------------------------

function SystemEventRow({ title, detail, iso }: { title: string; detail?: string; iso: string }) {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div className="my-2 flex items-center justify-center px-2">
      <div className="flex max-w-[88%] items-center gap-2 rounded-full bg-surface px-3 py-1 text-[11px] text-ink-muted shadow-sm ring-1 ring-line">
        <CornerDownRight size={12} className="shrink-0 text-ink-subtle" aria-hidden />
        <span className="min-w-0 truncate">
          <span className="font-semibold text-ink">{title}</span>
          {detail && <span className="text-ink-muted"> · {detail}</span>}
        </span>
        <button
          type="button"
          onClick={() => pushToast({ title: 'Activity detail', description: 'System events are cosmetic in the demo.', variant: 'info' })}
          className="shrink-0 font-semibold text-brand hover:underline"
        >
          Details
        </button>
        <span className="shrink-0 text-ink-subtle">{relativeTime(iso)}</span>
      </div>
    </div>
  );
}

// --- Completed-call card (audio player + transcript) -----------------------

function CallCard({ call, agentName }: { call: Call; agentName: string }) {
  const pushToast = useStore((s) => s.pushToast);
  const [showTranscript, setShowTranscript] = useState(false);
  const isOut = call.direction === 'outbound';
  const missed = call.direction === 'missed';
  const DirIcon = missed ? PhoneMissed : isOut ? PhoneOutgoing : PhoneIncoming;
  const heading = missed ? 'Missed call' : isOut ? 'Outbound call' : 'Inbound call';
  const duration = formatCallDuration(call.durationSec);
  const playDemo = () =>
    pushToast({ title: 'Call playback', description: 'Recordings are cosmetic in the demo.', variant: 'info' });

  const onTranscript = () => {
    if (call.voicemailTranscript) setShowTranscript((v) => !v);
    else pushToast({ title: 'View Transcript', description: 'No transcript available for this call (demo).', variant: 'info' });
  };

  return (
    <div className={cx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}>
      {!isOut && <Avatar name="Call" size="xs" className="mb-5" />}
      <div className="flex flex-col items-stretch">
        <div className="w-full max-w-[460px] rounded-2xl bg-surface px-3 py-3 shadow-sm ring-1 ring-line">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <DirIcon size={13} className={missed ? 'text-bad' : 'text-good'} aria-hidden />
            {heading}
            {!missed && <span className="text-[11px] font-normal text-ink-subtle">· completed</span>}
          </div>

          {missed ? (
            <p className="text-[12px] text-ink-muted">No answer · the contact did not pick up.</p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playDemo}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white"
                aria-label="Play recording"
              >
                <Play size={14} className="ml-0.5" aria-hidden />
              </button>
              <div className="flex h-5 flex-1 items-center gap-px overflow-hidden">
                {Array.from({ length: 38 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-full rounded-full bg-ink-subtle/50"
                    style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 70}%` }}
                  />
                ))}
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-ink-muted">0:00 / {duration}</span>
              <span className="shrink-0 text-[11px] font-medium text-ink-muted">1x</span>
              <Volume2 size={13} className="shrink-0 text-ink-subtle" aria-hidden />
              <button type="button" onClick={playDemo} aria-label="Replay"><RotateCcw size={13} className="shrink-0 text-ink-subtle" aria-hidden /></button>
              <button type="button" onClick={playDemo} aria-label="Download"><Download size={13} className="shrink-0 text-ink-subtle" aria-hidden /></button>
            </div>
          )}

          <button
            type="button"
            onClick={onTranscript}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
          >
            <FileText size={12} aria-hidden /> View Transcript
          </button>
          {showTranscript && call.voicemailTranscript && (
            <p className="mt-2 rounded-lg bg-surface-sunken px-3 py-2 text-[12px] italic text-ink-muted">
              “{call.voicemailTranscript}”
            </p>
          )}
        </div>
        <div className={cx('mt-1 flex items-center gap-1 text-[10px] text-ink-subtle', isOut ? 'justify-end' : 'justify-start')}>
          <span>{clockTime(call.createdAt)}</span>
        </div>
      </div>
      {isOut && (
        <span className="mb-5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good/15 text-[9px] font-bold text-good ring-1 ring-surface">
          {initials(agentName.split(' ')[0], agentName.split(' ')[1])}
        </span>
      )}
    </div>
  );
}

// --- One message bubble ----------------------------------------------------

function MessageRow({ msg, contactName, agentName }: { msg: Message; contactName: string; agentName: string }) {
  const isOut = msg.direction === 'outbound';
  return (
    <div className={cx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}>
      {!isOut && <Avatar name={contactName} size="xs" className="mb-5" />}
      <div className={cx('flex max-w-[68%] flex-col', isOut ? 'items-end' : 'items-start')}>
        <div
          className={cx(
            'rounded-2xl px-3.5 py-2 text-[13px] leading-snug',
            isOut
              ? 'rounded-br-sm bg-[#eaf1fb] text-ink'
              : 'rounded-bl-sm bg-surface text-ink shadow-sm ring-1 ring-line',
          )}
        >
          <p className="whitespace-pre-wrap">{msg.body}</p>
        </div>
        <div className={cx('mt-1 flex items-center gap-1 text-[10px] text-ink-subtle', isOut ? 'justify-end' : 'justify-start')}>
          <span>{clockTime(msg.createdAt)}</span>
          {isOut && <StatusTicks status={msg.status} />}
        </div>
      </div>
      {isOut && (
        <span className="mb-5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-[9px] font-bold text-brand ring-1 ring-surface">
          {initials(agentName.split(' ')[0], agentName.split(' ')[1])}
        </span>
      )}
    </div>
  );
}

// --- Internal note (distinct styling + @mention) ---------------------------

function renderWithMentions(body: string) {
  return body.split(/(@[A-Za-z][\w-]*)/g).map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="rounded bg-ai-soft px-1 font-semibold text-ai">{part}</span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function NoteRow({ author, body, iso }: { author: string; body: string; iso: string }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[78%] rounded-xl border-l-4 border-warn bg-warn/10 px-3.5 py-2.5 shadow-sm">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-warn">
          <Lock size={11} aria-hidden /> Internal note
          <span className="ml-auto font-medium normal-case text-ink-subtle">
            {author} · {clockTime(iso)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-snug text-ink">{renderWithMentions(body)}</p>
      </div>
    </div>
  );
}

// --- Collapsed email card --------------------------------------------------

function EmailCard({
  direction, from, to, subject, body, iso,
}: { direction: 'inbound' | 'outbound'; from: string; to: string; subject: string; body: string; iso: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[560px] overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-line">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-surface-sunken">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef2f6] text-[#5b6b7c]">
            <Mail size={14} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{subject}</p>
            <p className="truncate text-[11px] text-ink-muted">
              {direction === 'inbound' ? `From ${from}` : `To ${to}`} · {clockTime(iso)}
            </p>
          </div>
          <Badge tone="neutral">{direction === 'inbound' ? 'Received' : 'Sent'}</Badge>
          {open ? <ChevronDown size={15} className="text-ink-subtle" aria-hidden /> : <ChevronRight size={15} className="text-ink-subtle" aria-hidden />}
        </button>
        {open && (
          <div className="border-t border-line px-3.5 py-3 text-[13px] leading-relaxed text-ink">
            <p className="mb-1 text-[11px] text-ink-subtle">From: {from} &nbsp;·&nbsp; To: {to}</p>
            <p className="whitespace-pre-wrap">{body}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Event cards (appointment / opportunity / task) ------------------------

function EventCard({
  Icon, tone, eyebrow, title, meta, badge, iso, onOpen,
}: {
  Icon: React.ElementType;
  tone: string;
  eyebrow: string;
  title: string;
  meta?: string;
  badge?: React.ReactNode;
  iso: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex justify-start">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full max-w-[460px] items-start gap-3 rounded-xl bg-surface px-3.5 py-3 text-left shadow-sm ring-1 ring-line transition-colors hover:bg-surface-sunken"
      >
        <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full', tone)}>
          <Icon size={15} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{eyebrow}</p>
          <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
          {meta && <p className="mt-0.5 truncate text-[12px] text-ink-muted">{meta}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {badge}
          <span className="text-[10px] text-ink-subtle">{clockTime(iso)}</span>
        </div>
      </button>
    </div>
  );
}

// --- One thread item -------------------------------------------------------

function ThreadItemRow({ item, contactName, agentName }: { item: ThreadItem; contactName: string; agentName: string }) {
  const pushToast = useStore((s) => s.pushToast);
  const open = (title: string) => pushToast({ title, description: 'Opens the related record (demo).', variant: 'info' });

  switch (item.kind) {
    case 'message':
      return <MessageRow msg={item.message} contactName={contactName} agentName={agentName} />;
    case 'call':
      return <CallCard call={item.call} agentName={agentName} />;
    case 'event':
      return <SystemEventRow title={item.title} detail={item.detail} iso={item.iso} />;
    case 'note':
      return <NoteRow author={item.author} body={item.body} iso={item.iso} />;
    case 'email':
      return <EmailCard direction={item.direction} from={item.from} to={item.to} subject={item.subject} body={item.body} iso={item.iso} />;
    case 'appointment':
      return (
        <EventCard
          Icon={CalendarCheck}
          tone="bg-good/15 text-good"
          eyebrow="Appointment"
          title={item.title}
          meta={new Date(item.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          badge={<Badge tone={item.status === 'confirmed' ? 'good' : item.status === 'cancelled' ? 'bad' : 'neutral'}>{item.status}</Badge>}
          iso={item.iso}
          onOpen={() => open('Appointment')}
        />
      );
    case 'opportunity':
      return (
        <EventCard
          Icon={TrendingUp}
          tone="bg-brand/15 text-brand"
          eyebrow="Opportunity"
          title={item.title}
          meta={`${money(item.value)} · ${item.stage}`}
          badge={<Badge tone={item.status === 'won' ? 'good' : item.status === 'lost' ? 'bad' : 'brand'}>{item.status}</Badge>}
          iso={item.iso}
          onOpen={() => open('Opportunity')}
        />
      );
    case 'task':
      return (
        <EventCard
          Icon={CheckSquare}
          tone="bg-ai-soft text-ai"
          eyebrow="Task"
          title={item.title}
          meta={`Due ${new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          badge={<Badge tone={item.done ? 'good' : 'neutral'}>{item.done ? 'completed' : 'open'}</Badge>}
          iso={item.iso}
          onOpen={() => open('Task')}
        />
      );
    default:
      return null;
  }
}

// --- Thread body -----------------------------------------------------------

interface ThreadProps {
  conv: Conversation;
  contact: Contact;
  messages: Message[];
  agentName: string;
  rich: boolean;
  localNotes: LocalNote[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onBack?: () => void;
}

export function MessageThread({ conv, contact, messages, agentName, rich, localNotes, scrollRef, onBack }: ThreadProps) {
  const contactName = fullName(contact);
  const meta = CHANNEL_META[conv.channel];

  const calls = useStore((s) => s.calls);
  const opportunities = useStore((s) => s.opportunities);
  const appointments = useStore((s) => s.appointments);
  const tasks = useStore((s) => s.tasks);
  const users = useStore((s) => s.users);
  const pipelines = useStore((s) => s.pipelines);

  // Build the interleaved item stream (messages + the contact's calls +
  // opportunity-driven events + showcase demo items), derived from the store.
  const items = useMemo(() => {
    const stageName = new Map<string, string>();
    pipelines.forEach((p) => p.stages.forEach((st) => stageName.set(st.id, st.name)));
    return buildThreadItems({
      conv,
      contact,
      messages,
      calls: calls.filter((c) => c.contactId === contact.id),
      opportunities: opportunities.filter((o) => o.contactId === contact.id),
      appointments: appointments.filter((a) => a.contactId === contact.id),
      tasks: tasks.filter((t) => t.contactId === contact.id),
      stageNameOf: (opp) => stageName.get(opp.stageId),
      agentName,
      teamFirstNames: users.map((u) => u.name.split(' ')[0]),
      rich,
      localNotes,
    });
  }, [conv, contact, messages, calls, opportunities, appointments, tasks, users, pipelines, agentName, rich, localNotes]);

  // Group items by calendar day for the separator pills.
  const groups: { key: string; label: string; items: ThreadItem[] }[] = [];
  items.forEach((it) => {
    const k = dayKey(it.iso);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(it);
    else groups.push({ key: k, label: threadDayLabel(it.iso), items: [it] });
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader contact={contact} onBack={onBack} />

      <div
        data-tour="conversations.thread"
        className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken px-5 py-4"
      >
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-subtle">
            <meta.Icon size={28} aria-hidden />
            <p className="text-sm">No messages in this {meta.label} thread yet.</p>
          </div>
        ) : (
          groups.map((g) => (
            <Fragment key={g.key}>
              <DateSeparator label={g.label} />
              <div className="space-y-2.5">
                {g.items.map((it) => (
                  <ThreadItemRow key={it.key} item={it} contactName={contactName} agentName={agentName} />
                ))}
              </div>
            </Fragment>
          ))
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
