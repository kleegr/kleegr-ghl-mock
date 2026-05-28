/**
 * MessageThread — center pane of the Conversations inbox.
 *
 * Renders the message bubbles for the selected conversation and a reply
 * composer wired to the store's sendMessage() action. Includes a scripted
 * AI-suggest button (no real API calls).
 */
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, MessageSquare } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, clockTime, fullName } from '@/utils';
import type { Channel } from '@/types';

// ── Channel display metadata ─────────────────────────────────────────────────

const CHANNEL_LABELS: Record<Channel, string> = {
  sms:       'SMS',
  email:     'Email',
  webchat:   'Chat',
  facebook:  'Facebook',
  instagram: 'Instagram',
  whatsapp:  'WhatsApp',
  call:      'Call',
};

type ToneValue = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';

const CHANNEL_TONES: Record<Channel, ToneValue> = {
  sms:       'good',
  email:     'brand',
  webchat:   'neutral',
  facebook:  'brand',
  instagram: 'bad',
  whatsapp:  'good',
  call:      'warn',
};

/** Scripted suggestions per channel — no real AI calls. */
const AI_SUGGESTIONS: Record<Channel, string[]> = {
  sms: [
    'Thanks for reaching out! Let me check on that and get back to you shortly.',
    'Absolutely! We have some availability — want me to book you in?',
    'Great question — I can help with that right now.',
  ],
  email: [
    'Thank you for your email. I will review this and follow up within 24 hours.',
    'Happy to assist! Here are the details you requested.',
    'Thanks for reaching out — let me look into this for you.',
  ],
  webchat: [
    'Hi there! Thanks for chatting in. How can I help you today?',
    'Great question! Let me pull that up for you.',
    'I would be happy to help. Could you tell me a bit more?',
  ],
  facebook: [
    'Thanks for your message! We typically respond within a few hours.',
    'Hi! Thanks for reaching out on Facebook. How can we help?',
  ],
  instagram: [
    'Hey! Thanks for the DM. How can we help you today?',
    'Hi! We saw your message and will get back to you shortly.',
  ],
  whatsapp: [
    'Hi! Thanks for reaching out on WhatsApp. How can we assist?',
    'Hello! We will get back to you as soon as possible.',
  ],
  call: [
    'Hi, following up on your recent call. How can we assist?',
    'Thank you for calling — I wanted to continue our conversation.',
  ],
};

// ── Props ────────────────────────────────────────────────────────────────────

interface MessageThreadProps {
  conversationId: string | null;
  onBack: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function MessageThread({ conversationId, onBack }: MessageThreadProps) {
  const [reply, setReply] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversations = useStore((s) => s.conversations);
  const messages      = useStore((s) => s.messages);
  const contacts      = useStore((s) => s.contacts);
  const users         = useStore((s) => s.users);
  const sendMessage   = useStore((s) => s.sendMessage);

  const conv    = conversations.find((c) => c.id === conversationId) ?? null;
  const contact = conv ? contacts.find((c) => c.id === conv.contactId) ?? null : null;

  // Safely resolve assignee without depending on conv narrowing inside callbacks
  const assigneeId = conv?.assignedTo;
  const assignee   = assigneeId ? users.find((u) => u.id === assigneeId) ?? null : null;

  const threadMessages = conv
    ? messages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    : [];

  // Scroll to bottom when messages change or conversation switches
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length, conversationId]);

  // Clear reply input when switching conversations
  useEffect(() => {
    setReply('');
  }, [conversationId]);

  function handleSend() {
    if (!conv || !reply.trim()) return;
    sendMessage(conv.id, reply.trim());
    setReply('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleAISuggest() {
    if (!conv) return;
    const options = AI_SUGGESTIONS[conv.channel];
    const idx = Math.floor(Math.random() * options.length);
    setReply(options[idx] ?? '');
  }

  // ── Empty state: no conversation selected ────────────────────────────────

  if (!conv) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-sunken">
        <EmptyState
          icon={<MessageSquare size={32} />}
          title="Select a conversation"
          body="Choose a thread from the list to start reading and replying."
        />
      </div>
    );
  }

  const contactName = contact ? fullName(contact) : 'Unknown Contact';

  return (
    <div className="flex h-full flex-col" data-tour="conversations.thread">

      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        {/* Back button — mobile only */}
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-lg p-1 text-ink-muted hover:bg-surface-sunken md:hidden"
          aria-label="Back to list"
        >
          <ArrowLeft size={18} />
        </button>

        <Avatar name={contactName} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{contactName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge tone={CHANNEL_TONES[conv.channel]}>
              {CHANNEL_LABELS[conv.channel]}
            </Badge>
            {assignee && (
              <span className="text-[11px] text-ink-subtle">
                {assignee.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message bubbles */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {threadMessages.map((msg) => {
          const isOut = msg.direction === 'outbound';
          return (
            <div
              key={msg.id}
              className={cx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}
            >
              {!isOut && (
                <Avatar name={contactName} size="xs" className="shrink-0" />
              )}
              <div
                className={cx(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isOut
                    ? 'rounded-br-sm bg-brand text-brand-fg'
                    : 'rounded-bl-sm bg-surface-sunken text-ink',
                )}
              >
                <p>{msg.body}</p>
                <p
                  className={cx(
                    'mt-1 text-[10px]',
                    isOut ? 'text-brand-fg/70' : 'text-ink-subtle',
                  )}
                >
                  {clockTime(msg.createdAt)}
                  {isOut && msg.status ? ` · ${msg.status}` : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Reply composer */}
      <div
        className="shrink-0 border-t border-line bg-surface px-4 py-3"
        data-tour="conversations.composer"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Reply via ${CHANNEL_LABELS[conv.channel]}\u2026`}
            rows={2}
            className={cx(
              'flex-1 resize-none rounded-xl border border-line bg-surface-sunken',
              'px-3 py-2 text-sm text-ink placeholder:text-ink-subtle',
              'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            )}
          />
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAISuggest}
              title="AI suggest reply (scripted, demo only)"
            >
              <Sparkles size={13} />
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!reply.trim()}
              onClick={handleSend}
              data-tour="conversations.sendButton"
            >
              <Send size={13} />
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-ink-subtle">
          &#8984;&#8629; to send &middot; Demo mode &mdash; no real messages sent
        </p>
      </div>
    </div>
  );
}
