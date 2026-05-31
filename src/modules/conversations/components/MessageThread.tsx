/**
 * MessageThread — center pane: thread header (action icons) and a day-grouped
 * stream that interleaves message bubbles, completed-call cards (audio player +
 * transcript), and inline system-event rows. The stream is derived in-memory
 * from the seed via `buildThreadItems` (messages + the contact's calls +
 * opportunity-driven events), so Reset Demo restores it exactly.
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
  Play,
  Volume2,
  RotateCcw,
  Download,
  Check,
  CheckCheck,
  CornerDownRight,
  FileText,
} from 'lucide-react';
import { Avatar } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, clockTime, initials, relativeTime } from '@/utils';
import type { Conversation, Contact, Call, Message } from '@/types';
import { CHANNEL_META, threadDayLabel, dayKey } from '../utils';
import { buildThreadItems, formatCallDuration, type ThreadItem } from '../threadModel';

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

// --- One thread item -------------------------------------------------------

function ThreadItemRow({ item, contactName, agentName }: { item: ThreadItem; contactName: string; agentName: string }) {
  if (item.kind === 'message') return <MessageRow msg={item.message} contactName={contactName} agentName={agentName} />;
  if (item.kind === 'call') return <CallCard call={item.call} agentName={agentName} />;
  return <SystemEventRow title={item.title} detail={item.detail} iso={item.iso} />;
}

// --- Thread body -----------------------------------------------------------

interface ThreadProps {
  conv: Conversation;
  contact: Contact;
  messages: Message[];
  agentName: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  onBack?: () => void;
}

export function MessageThread({ conv, contact, messages, agentName, scrollRef, onBack }: ThreadProps) {
  const contactName = fullName(contact);
  const meta = CHANNEL_META[conv.channel];

  const calls = useStore((s) => s.calls);
  const opportunities = useStore((s) => s.opportunities);
  const pipelines = useStore((s) => s.pipelines);

  // Build the interleaved item stream (messages + this contact's calls +
  // opportunity-driven system events), derived from the in-memory store.
  const items = useMemo(() => {
    const stageName = new Map<string, string>();
    pipelines.forEach((p) => p.stages.forEach((st) => stageName.set(st.id, st.name)));
    const contactCalls = calls.filter((c) => c.contactId === contact.id);
    const contactOpps = opportunities.filter((o) => o.contactId === contact.id);
    return buildThreadItems({
      conv,
      contact,
      messages,
      calls: contactCalls,
      opportunities: contactOpps,
      stageNameOf: (opp) => stageName.get(opp.stageId),
    });
  }, [conv, contact, messages, calls, opportunities, pipelines]);

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
