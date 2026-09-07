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
  MessageSquare,
  Type,
  Link2,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { Channel, Conversation, Contact } from '@/types';
import { COMPOSER_CHANNELS, type ComposerChannelOption } from '../utils';
import { useConversationWorkspaceStore } from '../conversationWorkspaceState';

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

const EMOJIS = ['👍', '😊', '🎉', '✅', '👋', '🙌'];

export function Composer({ conv, contact, onAddInternalNote, onMessageSent, onRequestPayment }: ComposerProps) {
  const sendMessage = useStore((s) => s.sendMessage);
  const updateMessageStatus = useStore((s) => s.updateMessageStatus);
  const pushToast = useStore((s) => s.pushToast);
  const phoneNumbers = useStore((s) => s.phoneNumbers);
  const snippets = useConversationWorkspaceStore((s) => s.snippets);
  const triggerLinks = useConversationWorkspaceStore((s) => s.triggerLinks);

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
  const [picker, setPicker] = useState<'emoji' | 'snippets' | 'trigger-links' | 'custom-values' | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [composerMode, setComposerMode] = useState<'normal' | 'minimized' | 'expanded'>('normal');
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [senderMenu, setSenderMenu] = useState(false);
  const [senderNumber, setSenderNumber] = useState(BUSINESS_NUMBER);
  const [sendMenu, setSendMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useClickOutside(menuRef, () => setChannelMenu(false));

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
    setFormattingOpen(false);
    setSenderMenu(false);
    setSendMenu(false);
    setChannelOpt(COMPOSER_CHANNELS.find((c) => c.id === conv.channel) ?? COMPOSER_CHANNELS[0]);
  }, [conv.id, conv.channel]);

  const isEmail = channelOpt.kind === 'email';
  const segs = Math.max(1, Math.ceil(text.length / 160));

  const sendCurrent = (simulateReply: boolean) => {
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
        // Store mutations are intentionally allowed to finish after the route
        // unmounts, so navigating away does not freeze a message at “sent”.
        window.setTimeout(() => updateMessageStatus(sent.id, status), delay);
      };
      scheduleStatus('delivered', 300);
      scheduleStatus('read', 900);
    }
    if (simulateReply) onMessageSent?.(channelOpt.id, trimmed);
    setText('');
    setSubject('');
    setAttachments([]);
    setPicker(null);
    setSendMenu(false);
  };

  const handleSend = () => sendCurrent(true);

  const appendText = (value: string) => {
    setText((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${value}`);
    textareaRef.current?.focus();
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
      className={cx(
        'shrink-0 border-t border-line bg-surface px-3 pb-3 pt-2',
        composerMode === 'expanded' && 'fixed inset-4 z-50 overflow-y-auto rounded-2xl border bg-surface p-4 shadow-pop',
      )}
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
              onClick={() => { setInternal((v) => !v); setSendMenu(false); }}
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
            <button type="button" onClick={() => setComposerMode((mode) => mode === 'minimized' ? 'normal' : 'minimized')} className="rounded p-1 hover:bg-surface-sunken hover:text-ink" aria-label={composerMode === 'minimized' ? 'Restore composer' : 'Minimize composer'}>
              <Minus size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => setComposerMode((mode) => mode === 'expanded' ? 'normal' : 'expanded')} className="rounded p-1 hover:bg-surface-sunken hover:text-ink" aria-label={composerMode === 'expanded' ? 'Restore composer size' : 'Expand composer'}>
              <Maximize2 size={14} aria-hidden />
            </button>
          </div>
        </div>

        {composerMode !== 'minimized' && <>

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
                <span className="relative flex items-center gap-1.5 text-ink-muted">
                  From
                  <button type="button" onClick={() => setSenderMenu((open) => !open)} className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] text-ink ring-1 ring-line hover:ring-brand/40" aria-haspopup="listbox" aria-expanded={senderMenu}>
                    {senderNumber}
                    <ChevronDown size={11} aria-hidden />
                  </button>
                  {senderMenu && <span className="absolute bottom-full left-8 z-20 mb-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop" role="listbox">{(phoneNumbers.length ? phoneNumbers : [{ id: 'demo-number', number: BUSINESS_NUMBER, label: 'Demo Business' }]).map((number) => <button key={number.id} type="button" role="option" aria-selected={senderNumber === number.number} onClick={() => { setSenderNumber(number.number); setSenderMenu(false); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-ink hover:bg-surface-sunken"><span><span className="block font-semibold">{number.label}</span><span className="text-[11px] text-ink-muted">{number.number}</span></span>{senderNumber === number.number && <Check size={13} className="text-brand" />}</button>)}</span>}
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

        {isEmail && formattingOpen && (
          <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-sunken px-3 py-1.5 text-[11px] text-ink-muted">
            <button type="button" onClick={() => appendText('**bold text**')} className="grid h-7 w-7 place-items-center rounded bg-surface font-serif font-bold hover:text-brand" aria-label="Insert bold text">B</button>
            <button type="button" onClick={() => appendText('_italic text_')} className="grid h-7 w-7 place-items-center rounded bg-surface font-serif italic hover:text-brand" aria-label="Insert italic text">I</button>
            <button type="button" onClick={() => appendText('__underlined text__')} className="grid h-7 w-7 place-items-center rounded bg-surface font-serif underline hover:text-brand" aria-label="Insert underlined text">U</button>
            <button type="button" onClick={() => appendText('• List item')} className="rounded bg-surface px-2 py-1.5 font-semibold hover:text-brand">Bullets</button>
            <button type="button" onClick={() => appendText('1. List item')} className="rounded bg-surface px-2 py-1.5 font-semibold hover:text-brand">Numbered list</button>
            <button type="button" onClick={() => appendText('> Quote')} className="rounded bg-surface px-2 py-1.5 font-semibold hover:text-brand">Quote</button>
          </div>
        )}

        {/* body */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={composerMode === 'expanded' ? 14 : isEmail ? 4 : 3}
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
            ) : picker === 'snippets' ? (
              <div className="max-h-52 space-y-1 overflow-y-auto">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Quick snippets</p>
                {snippets.slice(0, 8).map((snippet) => <button key={snippet.id} type="button" onClick={() => { setText(snippet.body); if (isEmail && snippet.type === 'Email') { if (!subject) setSubject(snippet.subject ?? snippet.name); if (snippet.attachments?.length) setAttachments((items) => Array.from(new Set([...items, ...snippet.attachments!])).slice(0, 5)); } setPicker(null); textareaRef.current?.focus(); }} className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-surface-sunken"><span className="block text-[12px] font-semibold text-ink">{snippet.name}</span><span className="block truncate text-[11px] text-ink-muted">{snippet.body}</span></button>)}
                {snippets.length === 0 && <p className="px-2 py-3 text-[12px] text-ink-muted">No snippets yet. Create one from the Snippets tab.</p>}
              </div>
            ) : picker === 'trigger-links' ? (
              <div className="max-h-52 space-y-1 overflow-y-auto">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Trigger links</p>
                {triggerLinks.map((link) => <button key={link.id} type="button" onClick={() => { appendText(`{{trigger_link.${link.slug}}}`); setPicker(null); }} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-surface-sunken"><span><span className="block text-[12px] font-semibold text-ink">{link.name}</span><span className="block max-w-sm truncate text-[11px] text-ink-muted">{link.destinationUrl}</span></span><Link2 size={13} className="text-brand" /></button>)}
              </div>
            ) : (
              <div className="grid max-h-52 gap-1 overflow-y-auto sm:grid-cols-2">
                <p className="col-span-full px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Custom values</p>
                {[
                  ['First name', '{{contact.first_name}}'],
                  ['Last name', '{{contact.last_name}}'],
                  ['Email', '{{contact.email}}'],
                  ['Phone', '{{contact.phone}}'],
                  ...Object.keys(contact.customFields).map((key) => [key.replace(/([A-Z])/g, ' $1'), `{{contact.${key}}}`]),
                ].map(([label, token]) => <button key={token} type="button" onClick={() => { appendText(token); setPicker(null); }} className="rounded-md px-2 py-1.5 text-left hover:bg-surface-sunken"><span className="block text-[12px] font-semibold capitalize text-ink">{label}</span><span className="font-mono text-[10px] text-ink-muted">{token}</span></button>)}
              </div>
            )}
          </div>
        )}

        {/* toolbar */}
        <div className="flex min-w-0 items-center justify-between gap-2 px-2.5 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-ink-subtle">
            {isEmail && (
              <ToolBtn Icon={Type} label="Formatting" onClick={() => setFormattingOpen((open) => !open)} />
            )}
            <ToolBtn Icon={Smile} label="Emoji" onClick={() => setPicker((v) => v === 'emoji' ? null : 'emoji')} />
            {isEmail && <ToolBtn Icon={Link2} label="Insert link" onClick={() => appendText('[link text](https://demo.example.com)')} />}
            <ToolBtn Icon={Paperclip} label="Attach file" onClick={() => fileRef.current?.click()} />
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); setAttachments((items) => Array.from(new Set([...items, ...names])).slice(0, 5)); e.currentTarget.value = ''; }} />
            <ToolBtn Icon={FileText} label="Templates / snippets" onClick={() => setPicker((v) => v === 'snippets' ? null : 'snippets')} />
            <ToolBtn Icon={Zap} label="Trigger links" onClick={() => setPicker((v) => v === 'trigger-links' ? null : 'trigger-links')} />
            <ToolBtn Icon={Tag} label="Custom values" onClick={() => setPicker((v) => v === 'custom-values' ? null : 'custom-values')} />
            <ToolBtn Icon={DollarSign} label="Add payment" onClick={() => { onRequestPayment?.(); pushToast({ title: 'Payments opened', description: 'Add or refund a demo payment from the contact panel.', variant: 'info' }); }} />
            {isEmail && <ToolBtn Icon={ImageIcon} label="Insert image" onClick={() => fileRef.current?.click()} />}
            <ToolBtn Icon={Delete} label="Clear" onClick={() => { setText(''); setSubject(''); setAttachments([]); }} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isEmail && !internal && (
              <span className="text-[11px] text-ink-subtle">
                Chars: {text.length} | Segs: {text.trim() ? segs : 0}
              </span>
            )}
            <div className="relative flex rounded-lg">
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
              {!internal && <button
                type="button"
                onClick={() => setSendMenu((open) => !open)}
                disabled={!text.trim()}
                className="grid w-7 place-items-center border-l border-white/20 bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
                aria-label="Send options"
              >
                <ChevronDown size={13} aria-hidden />
              </button>}
              {!internal && sendMenu && <div className="absolute bottom-full right-0 z-20 mb-1 w-56 overflow-hidden rounded-lg border border-line bg-surface py-1 text-left shadow-pop"><button type="button" onClick={handleSend} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] font-semibold text-ink hover:bg-surface-sunken"><Send size={13} className="text-brand" /> Send now</button><button type="button" onClick={() => { sendCurrent(false); pushToast({ title: 'Message sent without auto-reply', description: 'Use this option to continue the thread manually.', variant: 'success' }); }} className="flex w-full items-start gap-2 px-3 py-2 text-[12px] text-ink hover:bg-surface-sunken"><MessageSquare size={13} className="mt-0.5 text-ink-subtle" /><span><span className="block font-semibold">Send without simulated reply</span><span className="mt-0.5 block text-[10px] text-ink-muted">Useful for exploring one-sided follow-ups.</span></span></button></div>}
            </div>
          </div>
        </div>
        </>}
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
