/**
 * Composer — multi-channel reply box matching GHL's composer.
 * Channel dropdown (SMS / WhatsApp / Email) · Internal Comment toggle ·
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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { Conversation, Contact } from '@/types';
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
}

export function Composer({ conv, contact }: ComposerProps) {
  const sendMessage = useStore((s) => s.sendMessage);
  const pushToast = useStore((s) => s.pushToast);

  // channel is initialised from the conversation but is visual-only; the real
  // send always routes through the conversation's own channel.
  const initial: ComposerChannelOption =
    COMPOSER_CHANNELS.find((c) => c.id === conv.channel) ?? COMPOSER_CHANNELS[0];
  const [channelOpt, setChannelOpt] = useState<ComposerChannelOption>(initial);
  const [channelMenu, setChannelMenu] = useState(false);
  const [internal, setInternal] = useState(false);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useClickOutside(menuRef, () => setChannelMenu(false));

  // reset draft when switching conversations
  useEffect(() => {
    setText('');
    setSubject('');
    setInternal(false);
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
      // internal notes are not outbound messages — kept demo-safe (no send)
      pushToast({
        title: 'Internal note added (demo)',
        description: 'Internal comments are not delivered to the contact.',
        variant: 'info',
      });
      setText('');
      return;
    }
    // Real in-memory reply via the store (routes on the conversation channel).
    sendMessage(conv.id, trimmed);
    setText('');
    setSubject('');
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
                  <button type="button" onClick={() => demo('CC')} className="hover:text-ink">CC</button>
                  <button type="button" onClick={() => demo('BCC')} className="hover:text-ink">BCC</button>
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
          <div className="border-b border-line px-3 py-1.5">
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

        {/* toolbar */}
        <div className="flex items-center justify-between gap-2 px-2.5 pb-2">
          <div className="flex items-center gap-0.5 text-ink-subtle">
            {isEmail && (
              <ToolBtn Icon={Type} label="Formatting" onClick={() => demo('Text formatting')} />
            )}
            <ToolBtn Icon={Smile} label="Emoji" onClick={() => demo('Emoji picker')} />
            {isEmail && <ToolBtn Icon={Link2} label="Insert link" onClick={() => demo('Insert link')} />}
            <ToolBtn Icon={Paperclip} label="Attach file" onClick={() => demo('Attach file')} />
            <ToolBtn Icon={FileText} label="Templates / snippets" onClick={() => demo('Templates')} />
            <ToolBtn Icon={Zap} label="Trigger links" onClick={() => demo('Trigger links')} />
            <ToolBtn Icon={Tag} label="Custom values" onClick={() => demo('Custom values')} />
            <ToolBtn Icon={DollarSign} label="Add payment" onClick={() => demo('Request payment')} />
            {isEmail && <ToolBtn Icon={ImageIcon} label="Insert image" onClick={() => demo('Insert image')} />}
            <ToolBtn Icon={Delete} label="Clear" onClick={() => setText('')} />
          </div>

          <div className="flex items-center gap-2">
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
