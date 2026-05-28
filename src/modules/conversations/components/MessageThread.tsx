/**
 * MessageThread — center pane: thread header (action icons), day-grouped
 * message bubbles (inbound gray / outbound blue-grey, with avatars + read
 * ticks), and call-completed cards for call-channel threads.
 */
import { Fragment } from 'react';
import {
  Reply,
  Phone,
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
} from 'lucide-react';
import { Avatar } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, clockTime, initials } from '@/utils';
import type { Conversation, Contact, Message } from '@/types';
import { CHANNEL_META, threadDayLabel, dayKey } from '../utils';

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
  if (status === 'read')
    return <CheckCheck size={13} className="text-brand" aria-label="read" />;
  if (status === 'failed')
    return <span className="text-[10px] font-semibold text-bad">failed</span>;
  return <CheckCheck size={13} className="text-ink-subtle" aria-label="delivered" />;
}

// --- Fake audio player (call card) -----------------------------------------

function CallCard({ duration }: { duration: string }) {
  const pushToast = useStore((s) => s.pushToast);
  const demo = () =>
    pushToast({ title: 'Call playback', description: 'Recordings are cosmetic in the demo.', variant: 'info' });
  return (
    <div className="w-full max-w-[460px] rounded-2xl bg-surface px-3 py-3 shadow-sm ring-1 ring-line">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        <Phone size={13} className="text-good" aria-hidden />
        Call completed
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={demo}
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
        <button type="button" onClick={demo} aria-label="Replay"><RotateCcw size={13} className="shrink-0 text-ink-subtle" aria-hidden /></button>
        <button type="button" onClick={demo} aria-label="Download"><Download size={13} className="shrink-0 text-ink-subtle" aria-hidden /></button>
      </div>
      <button
        type="button"
        onClick={demo}
        className="mt-2 text-[12px] font-semibold text-brand hover:underline"
      >
        View Transcript
      </button>
    </div>
  );
}

// --- One message -----------------------------------------------------------

function MessageRow({
  msg,
  contactName,
  agentName,
}: {
  msg: Message;
  contactName: string;
  agentName: string;
}) {
  const isOut = msg.direction === 'outbound';

  if (msg.channel === 'call') {
    return (
      <div className={cx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}>
        {!isOut && <Avatar name={contactName} size="xs" className="mb-5" />}
        <div className="flex flex-col items-stretch">
          <CallCard duration={isOut ? '0:43' : '1:22'} />
          <div className={cx('mt-1 flex items-center gap-1 text-[10px] text-ink-subtle', isOut ? 'justify-end' : 'justify-start')}>
            <span>{clockTime(msg.createdAt)}</span>
            {isOut && <StatusTicks status={msg.status} />}
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

  // group messages by calendar day for the separator pills
  const groups: { key: string; label: string; items: Message[] }[] = [];
  messages.forEach((m) => {
    const k = dayKey(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(m);
    else groups.push({ key: k, label: threadDayLabel(m.createdAt), items: [m] });
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader contact={contact} onBack={onBack} />

      <div
        data-tour="conversations.thread"
        className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken px-5 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-subtle">
            <meta.Icon size={28} aria-hidden />
            <p className="text-sm">No messages in this {meta.label} thread yet.</p>
          </div>
        ) : (
          groups.map((g) => (
            <Fragment key={g.key}>
              <DateSeparator label={g.label} />
              <div className="space-y-2.5">
                {g.items.map((m) => (
                  <MessageRow key={m.id} msg={m} contactName={contactName} agentName={agentName} />
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
