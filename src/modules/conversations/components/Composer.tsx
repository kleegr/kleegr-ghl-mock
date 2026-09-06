/**
 * Composer — multi-channel reply box matching GHL's composer.
 * Channel dropdown (SMS / email / social / chat) · Internal Comment toggle ·
 * From / To (+ From Name / Subject / CC·BCC for email) · formatting toolbar ·
 * Send. Sending a reply calls the store's sendMessage() — fully in-memory.
 */
import { Fragment, useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Eye,
  Minus,
  Maximize2,
  Smile,
  Paperclip,
  FileText,
  Zap,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Delete,
  Send,
  Type,
  Link2,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { Channel, Conversation, Contact } from '@/types';
import { COMPOSER_CHANNELS, type ComposerChannelOption } from '../utils';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

const BUSINESS_NUMBER = '+1 (555) 010-0100';
const BUSINESS_EMAIL = 'team@example.com';
const BUSINESS_FROM_NAME = 'Demo Business';

interface ComposerProps {
  conv: Conversation;
  contact: Contact;
  /** Adds an internal comment to the current thread in-memory (distinct styling). */
  onAddInternalNote: (body: string) => void;
  /** Lets the parent schedule a fictional reply after a successful demo send. */
  onMessageSent?: (channel: Channel, body: string) => void;
  onRequestPayment?: () => void;
}

const SNIPPETS = [
  'Thanks for reaching out! I’m happy to help. What day works best for you?',
  'I’ve shared the details with our team and will follow up shortly.',
  'Great question — let me confirm that for you and get right back to you.',
];
const EMOJIS = ['👍', '😊', '🎉', '✅', '👋', '🙌'];

export function Composer({ conv, contact, onAddInternalNote, onMessageSent, onRequestPayment }: ComposerProps) {
  const sendMessage = useStore((s) => s.sendMessage);
  const updateMessageStatus = useStore((s) => s.updateMessageStatus);
  const pushToast = useStore((s) => s.pushToast);
  const demoRevision = useStore((s) => s.demoRevision);

  const initial: ComposerChannelOption =
    COMPOSER_CHANNELS.find((c) => c.id === conv.channel) ?? COMPOSER_CHANNELS[0];
  const [channelOpt, setChannelOpt] = useState<ComposerChannelOption>(initial);
  const [channelMenu, setChannelMenu] = useState(false);
  const [internal, setInternal] = useState(false);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [picker, setPicker] = useState<'emoji' | 'snippets' | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const deliveryTimersRef = useRef<Set<number>>(new Set());
  useClickOutside(menuRef, () => setChannelMenu(false));

  useEffect(() => {
    const deliveryTimers = deliveryTimersRef.current;
    return () => {
      deliveryTimers.forEach((timer) => window.clearTimeout(timer));
      deliveryTimers.clear();
    };
  }, [demoRevision]);

  // reset draft when switching conversations
  useEffect(() => {
    setText('');
    setSubject('');
    setInternal(false);
    setAttachments([]);
    setPicker(null);
    setCc('');
    setBcc('');
    setShowCc(false);
    setShowBcc(false);
    setChannelOpt(COMPOSER_CHANNELS.find((c) => c.id === conv.channel) ?? COMPOSER_CHANNELS[0]);
  }, [conv.id, conv.channel]);

  const isEmail = channelOpt.kind === 'email';
  const segs = Math.max(1, Math.ceil(text.length / 160));

  const demo = (title: string) =>
    pushToast({ title, description: 'This composer control is cosmetic in the demo.', variant: 'info' });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (internal) {
      // Internal comments are not outbound messages, but they DO post to the
      // thread in-memory with distinct styling (handled by the container +
      // MessageThread NoteRow). Not delivered to the contact.
      onAddInternalNote(trimmed);
      pushToast({
        title: 'Internal comment added',
        description: 'Visible to your team only — not delivered to the contact.',
        variant: 'success',
      });
      setText('');
      return;
    }
    // Fully local send: the selected channel and email metadata are kept on the
    // in-memory message. Nothing leaves the demo.
    const sent = sendMessage(conv.id, trimmed, {
      channel: channelOpt.id,
      subject: isEmail ? subject.trim() || undefined : undefined,
      attachments,
      cc: isEmail ? cc.split(',').map((value) => value.trim()).filter(Boolean) : undefined,
      bcc: isEmail ? bcc.split(',').map((value) => value.trim()).filter(Boolean) : undefined,
    });
    if (sent) {
      const scheduleStatus = (status: 'delivered' | 'read', delay: number) => {
        const timer = window.setTimeout(() => {
          deliveryTimersRef.current.delete(timer);
          updateMessageStatus(sent.id, status);
        }, delay);
        deliveryTimersRef.current.add(timer);
      };
      scheduleStatus('delivered', 300);
      scheduleStatus('read', 900);
    }
    onMessageSent?.(channelOpt.id, trimmed);
    setText('');
    setSubject('');
    setAttachments([]);
    setPicker(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const ChannelIcon = channelOpt.Icon;

  const fieldChip = (value: string) => (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] text-ink ring-1 ring-line">
      {value}
    </span>
  );

  return (
    <div
      data-tour="conversations.composer"
      className="shrink-0 border-t border-line bg-surface px-3 pb-3 pt-2"
    >
      <div className="rounded-xl border border-line shadow-sm">
        {/* top bar: channel + internal toggle + window controls */}
        <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setChannelMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold text-brand hover:bg-brand-soft"
                aria-haspopup="listbox"
                aria-expanded={channelMenu}
              >
                <ChannelIcon size={15} aria-hidden />
                {channelOpt.label}
                <ChevronDown size={13} aria-hidden />
              </button>
              {channelMenu && (
                <div
                  className="absolute bottom-full left-0 z-20 mb-1 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
                  role="listbox"
                >
                  {COMPOSER_CHANNELS.map((opt) => {
                    const Icon = opt.Icon;
                    const isActive = opt.key === channelOpt.key;
                    return (
                      <Fragment key={opt.key}>
                        {opt.dividerBefore && <div className="my-1 h-px bg-line" aria-hidden />}
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setChannelOpt(opt);
                            setChannelMenu(false);
                          }}
                          className={cx(
                            'flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-surface-sunken',
                            isActive ? 'font-semibold text-brand' : 'text-ink',
                          )}
                        >
                          <Icon size={15} aria-hidden />
                          <span className="flex-1 text-left">{opt.label}</span>
                          {isActive && <Check size={14} className="text-brand" aria-hidden />}
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setInternal((v) => !v)}
              className={cx(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium transition-colors',
                internal ? 'bg-warn/15 text-warn' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
              aria-pressed={internal}
              title="Toggle internal comment"
            >
              <Eye size={15} aria-hidden />
              Internal Comment
            </button>
          </div>

          <div className="flex items-center gap-0.5 text-ink-subtle">
            <button type="button" onClick={() => demo('Minimize composer')} className="rounded p-1 hover:bg-surface-sunken hover:text-ink" aria-label="Minimize composer">
              <Minus size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => demo('Expand composer')} className="rounded p-1 hover:bg-surface-sunken hover:text-ink" aria-label="Expand composer">
              <Maximize2 size={14} aria-hidden />
            </button>
          </div>
        </div>

        {/* recipient fields */}
        {!internal && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b border-line px-3 py-2 text-[12px]">
            {isEmail ? (
              <>
                <span className="flex items-center gap-1.5 text-ink-muted">From {fieldChip(BUSINESS_EMAIL)}</span>
                <span className="flex items-center gap-1.5 text-ink-muted">From Name {fieldChip(BUSINESS_FROM_NAME)}</span>
                <span className="flex items-center gap-1.5 text-ink-muted">To {fieldChip(contact.email)}</span>
                <span className="ml-auto flex items-center gap-2 text-ink-subtle">
                  <button type="button" onClick={() => setShowCc((v) => !v)} className={cx('hover:text-ink', showCc && 'font-semibold text-brand')}>CC</button>
                  <button type="button" onClick={() => setShowBcc((v) => !v)} className={cx('hover:text-ink', showBcc && 'font-semibold text-brand')}>BCC</button>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-ink-muted">
                  From
                  <button type="button" onClick={() => demo('Change sender number')} className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] text-ink ring-1 ring-line hover:ring-brand/40">
                    {BUSINESS_NUMBER}
                    <ChevronDown size={11} aria-hidden />
                  </button>
                </span>
                <span className="flex items-center gap-1.5 text-ink-muted">To {fieldChip(contact.phone)}</span>
              </>
            )}
          </div>
        )}

        {/* email subject */}
        {isEmail && !internal && (
          <div className="space-y-1.5 border-b border-line px-3 py-1.5">
            {showCc && <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="CC recipients" className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-subtle" aria-label="CC recipients" />}
            {showBcc && <input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="BCC recipients" className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-subtle" aria-label="BCC recipients" />}
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject: Enter subject"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
              aria-label="Email subject"
            />
          </div>
        )}

        {/* body */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={isEmail ? 4 : 3}
          placeholder={internal ? 'Add an internal note…' : 'Type a message…'}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-subtle"
          aria-label="Message body"
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {attachments.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-1 text-[11px] text-ink-muted ring-1 ring-line">
                <Paperclip size={11} aria-hidden />
                <span className="max-w-40 truncate">{name}</span>
                <button type="button" onClick={() => setAttachments((items) => items.filter((item) => item !== name))} aria-label={`Remove ${name}`} className="hover:text-bad"><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {picker && (
          <div className="mx-2.5 mb-2 rounded-lg border border-line bg-surface p-2 shadow-pop">
            {picker === 'emoji' ? (
              <div className="flex gap-1">
                {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { setText((v) => `${v}${emoji}`); setPicker(null); textareaRef.current?.focus(); }} className="grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-surface-sunken">{emoji}</button>)}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Quick snippets</p>
                {SNIPPETS.map((snippet) => <button key={snippet} type="button" onClick={() => { setText(snippet); setPicker(null); textareaRef.current?.focus(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] text-ink hover:bg-surface-sunken">{snippet}</button>)}
              </div>
            )}
          </div>
        )}

        {/* toolbar */}
        <div className="flex min-w-0 items-center justify-between gap-2 px-2.5 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-ink-subtle">
            {isEmail && (
              <ToolBtn Icon={Type} label="Formatting" onClick={() => demo('Text formatting')} />
            )}
            <ToolBtn Icon={Smile} label="Emoji" onClick={() => setPicker((v) => v === 'emoji' ? null : 'emoji')} />
            {isEmail && <ToolBtn Icon={Link2} label="Insert link" onClick={() => demo('Insert link')} />}
            <ToolBtn Icon={Paperclip} label="Attach file" onClick={() => fileRef.current?.click()} />
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setAttachments((items) => Array.from(new Set([...items, ...names])).slice(0, 5)); e.currentTarget.value = ''; }} />
            <ToolBtn Icon={FileText} label="Templates / snippets" onClick={() => setPicker((v) => v === 'snippets' ? null : 'snippets')} />
            <ToolBtn Icon={Zap} label="Trigger links" onClick={() => demo('Trigger links')} />
            <ToolBtn Icon={Tag} label="Custom values" onClick={() => demo('Custom values')} />
            <ToolBtn Icon={DollarSign} label="Add payment" onClick={() => { onRequestPayment?.(); pushToast({ title: 'Payments opened', description: 'Add or refund a demo payment from the contact panel.', variant: 'info' }); }} />
            {isEmail && <ToolBtn Icon={ImageIcon} label="Insert image" onClick={() => demo('Insert image')} />}
            <ToolBtn Icon={Delete} label="Clear" onClick={() => { setText(''); setSubject(''); setAttachments([]); }} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isEmail && !internal && (
              <span className="text-[11px] text-ink-subtle">
                Chars: {text.length} | Segs: {text.trim() ? segs : 0}
              </span>
            )}
            <div className="flex overflow-hidden rounded-lg">
              <button
                data-tour="conversations.sendButton"
                type="button"
                onClick={handleSend}
                disabled={!text.trim()}
                className="flex items-center gap-1.5 bg-brand px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                <Send size={14} aria-hidden />
                <span className="hidden sm:inline">{internal ? 'Add note' : 'Send'}</span>
              </button>
              <button
                type="button"
                onClick={() => demo('Send options')}
                disabled={!text.trim()}
                className="grid w-7 place-items-center border-l border-white/20 bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
                aria-label="Send options"
              >
                <ChevronDown size={13} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ Icon, label, onClick }: { Icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-sunken hover:text-ink"
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}
