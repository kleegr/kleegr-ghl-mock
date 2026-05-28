/**
 * Conversations — Unified Inbox (plan §7.2)
 * Three-pane GHL-style inbox: conversation list · message thread · contact context.
 * Channel filter tabs: All | Unread | SMS | Email | Chat | Calls.
 * Reply composer wired to store sendMessage().
 * Contact context panel shows related opportunities, tasks, and appointments.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  Globe,
  ChevronLeft,
  Send,
  Star,
  Tag,
  Briefcase,
  CheckSquare,
  Calendar,
  User,
  Sparkles,
  Paperclip,
  Smile,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge, Avatar, Tabs } from '@/components/ui/primitives';
import type { Channel, Conversation, Contact, Message } from '@/types';
import { cx, fullName, relativeTime, dateLabel, userById } from '@/utils';
import { ConvFilter, FILTER_TABS, CHANNEL_LABEL } from './utils';

// ─── Channel icon helper ───────────────────────────────────────────────────

const CHANNEL_ICON_MAP: Record<Channel, React.ElementType> = {
  sms: MessageSquare,
  email: Mail,
  webchat: Globe,
  facebook: Globe,
  instagram: Globe,
  whatsapp: Phone,
  call: Phone,
};

const CHANNEL_TONE: Record<Channel, 'brand' | 'neutral' | 'good' | 'warn'> = {
  sms: 'brand',
  email: 'neutral',
  webchat: 'good',
  facebook: 'brand',
  instagram: 'warn',
  whatsapp: 'good',
  call: 'neutral',
};

function ChannelIcon({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_ICON_MAP[channel];
  return <Icon size={12} className="shrink-0 text-ink-subtle" aria-hidden />;
}

// ─── Conversation list item ────────────────────────────────────────────────

interface ListItemProps {
  conv: Conversation;
  contact: Contact | undefined;
  lastMessage: Message | undefined;
  isSelected: boolean;
  onClick: () => void;
}

function ConvListItem({ conv, contact, lastMessage, isSelected, onClick }: ListItemProps) {
  const name = contact ? fullName(contact) : 'Unknown';
  return (
    <button
      data-tour="conversations.threadItem"
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-start gap-2.5 border-b border-line px-3 py-3 text-left transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40',
        isSelected ? 'bg-brand-soft' : 'bg-surface',
      )}
    >
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cx(
              'truncate text-sm',
              conv.unread ? 'font-bold text-ink' : 'font-medium text-ink',
            )}
          >
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-ink-subtle">
            {relativeTime(conv.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <ChannelIcon channel={conv.channel} />
          <span className="flex-1 truncate text-xs text-ink-muted">
            {lastMessage?.body ?? '—'}
          </span>
          {conv.unread && (
            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
          )}
          {conv.starred && (
            <Star size={11} className="shrink-0 text-warn" aria-label="Starred" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound';
  return (
    <div className={cx('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOut
            ? 'rounded-br-sm bg-brand text-white'
            : 'rounded-bl-sm bg-surface text-ink',
        )}
      >
        <p className="whitespace-pre-wrap leading-snug">{msg.body}</p>
        <p
          className={cx(
            'mt-1 text-[10px]',
            isOut ? 'text-white/60' : 'text-ink-subtle',
          )}
        >
          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
          {isOut && msg.status && ` · ${msg.status}`}
        </p>
      </div>
    </div>
  );
}

// ─── Reply composer ────────────────────────────────────────────────────────

const AI_REPLY_SUGGESTION =
  "Thanks for reaching out! I'd be happy to help. Could you share a little more about what you're looking for so I can point you in the right direction?";

interface ComposerProps {
  conversationId: string;
}

function ReplyComposer({ conversationId }: ComposerProps) {
  const sendMessage = useStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(conversationId, trimmed);
    setText('');
    setAiUsed(false);
  };

  const handleAI = () => {
    setText(AI_REPLY_SUGGESTION);
    setAiUsed(true);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      data-tour="conversations.composer"
      className="shrink-0 border-t border-line bg-surface px-4 py-3"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (aiUsed) setAiUsed(false);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Cmd+Enter to send)"
        rows={2}
        className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
        aria-label="Reply composer"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Attach file (demo)"
            className="rounded p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Paperclip size={14} aria-hidden />
          </button>
          <button
            type="button"
            title="Emoji (demo)"
            className="rounded p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Smile size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleAI}
            title="AI Suggest Reply — scripted demo, no API call"
            className={cx(
              'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors',
              aiUsed
                ? 'bg-brand-soft text-brand'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
            )}
          >
            <Sparkles size={12} aria-hidden />
            AI Suggest
          </button>
        </div>
        <Button
          data-tour="conversations.sendButton"
          size="sm"
          disabled={!text.trim()}
          onClick={handleSend}
        >
          <Send size={13} aria-hidden />
          Send
        </Button>
      </div>
    </div>
  );
}

// ─── Contact context panel ─────────────────────────────────────────────────

function ContextDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-ink-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-subtle">{label}</p>
        <p className="truncate text-xs font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

interface ContextPanelProps {
  contactId: string;
}

function ContactContextPanel({ contactId }: ContextPanelProps) {
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const opportunities = useStore((s) =>
    s.opportunities.filter((o) => o.contactId === contactId),
  );
  const tasks = useStore((s) =>
    s.tasks.filter((t) => t.contactId === contactId),
  );
  const appointments = useStore((s) =>
    s.appointments
      .filter((a) => a.contactId === contactId)
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)),
  );

  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return null;

  const name = fullName(contact);
  const owner = userById(users, contact.ownerId);

  return (
    <div
      data-tour="conversations.contactContext"
      className="flex h-full flex-col overflow-y-auto border-l border-line bg-surface"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-line px-4 py-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar name={name} size="lg" />
          <div>
            <p className="text-sm font-bold text-ink">{name}</p>
            <p className="text-xs text-ink-muted">{contact.email}</p>
            <p className="text-xs text-ink-subtle">{contact.phone}</p>
          </div>
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} tone="neutral" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <ContextDetail
          icon={<Tag size={12} />}
          label="Source"
          value={contact.source}
        />
        {owner && (
          <ContextDetail
            icon={<User size={12} />}
            label="Owner"
            value={owner.name}
          />
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Briefcase size={12} aria-hidden />
              Opportunities
            </div>
            <div className="space-y-1">
              {opportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-surface-sunken px-2 py-1.5"
                >
                  <span className="min-w-0 truncate text-xs text-ink">
                    {opp.name}
                  </span>
                  <Badge
                    tone={
                      opp.status === 'won'
                        ? 'good'
                        : opp.status === 'lost'
                        ? 'bad'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {opp.status}
                  </Badge>
                </div>
              ))}
              {opportunities.length > 3 && (
                <p className="text-[11px] text-ink-subtle">
                  +{opportunities.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <CheckSquare size={12} aria-hidden />
              Tasks
            </div>
            <div className="space-y-1">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-md bg-surface-sunken px-2 py-1.5"
                >
                  <span
                    className={cx(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      task.status === 'completed' ? 'bg-good' : 'bg-warn',
                    )}
                  />
                  <span className="min-w-0 truncate text-xs text-ink">
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments */}
        {appointments.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Calendar size={12} aria-hidden />
              Appointments
            </div>
            <div className="space-y-1">
              {appointments.slice(0, 2).map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-md bg-surface-sunken px-2 py-1.5"
                >
                  <p className="text-xs font-medium text-ink">{appt.title}</p>
                  <p className="text-[11px] text-ink-subtle">
                    {dateLabel(appt.startTime)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="shrink-0 border-t border-line px-4 py-3">
        <div className="grid grid-cols-2 gap-1.5">
          {['Add Note', 'Add Task', 'Book Appt', 'View Profile'].map((label) => (
            <button
              key={label}
              type="button"
              title={`${label} (demo)`}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-xs font-semibold text-ink transition-colors hover:bg-surface-sunken"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Conversations component ─────────────────────────────────────────

export function Conversations() {
  const conversations = useStore((s) => s.conversations);
  const allMessages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const markRead = useStore((s) => s.markConversationRead);
  const pushToast = useStore((s) => s.pushToast);

  const [activeFilter, setActiveFilter] = useState<ConvFilter>('all');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-compute last message per conversation for the list
  const lastMessageMap = useMemo(() => {
    const map: Record<string, Message | undefined> = {};
    conversations.forEach((conv) => {
      const msgs = allMessages
        .filter((m) => m.conversationId === conv.id)
        .sort(
          (a, b) =>
            +new Date(b.createdAt) - +new Date(a.createdAt),
        );
      map[conv.id] = msgs[0];
    });
    return map;
  }, [conversations, allMessages]);

  // Thread messages for selected conversation
  const threadMessages = useMemo(() =>
    allMessages
      .filter((m) => m.conversationId === selectedConvId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
  [allMessages, selectedConvId]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;
  const selectedContact = selectedConv
    ? contacts.find((c) => c.id === selectedConv.contactId)
    : null;

  // Filtered conversation list
  const filteredConvs = useMemo(() =>
    conversations.filter((c) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return c.unread;
      return c.channel === activeFilter;
    }),
  [conversations, activeFilter]);

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread).length,
    [conversations],
  );

  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    setMobileView('thread');
    markRead(convId);
  };

  // Scroll to latest message when thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConvId, threadMessages.length]);

  const filterTabs = FILTER_TABS.map((f) => ({
    ...f,
    count: f.id === 'unread' ? unreadCount : undefined,
  }));

  return (
    <div
      data-tour="conversations.page"
      className="flex h-full min-h-0 flex-col bg-surface-sunken"
    >
      {/* Page header + channel filter tabs */}
      <div className="shrink-0 border-b border-line bg-surface">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <h1 className="font-display text-xl font-bold leading-tight text-ink">
              Conversations
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              Unified inbox — SMS, Email, Chat, Social, Calls
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              pushToast({
                title: 'New message is demo-only',
                body: 'Select an existing conversation and use the reply composer to send a fake in-memory reply.',
                variant: 'info',
              })
            }
          >
            <MessageSquare size={13} aria-hidden />
            New Message
          </Button>
        </div>
        <div data-tour="conversations.filters" className="overflow-x-auto px-5">
          <Tabs
            tabs={filterTabs}
            active={activeFilter}
            onChange={(id) => setActiveFilter(id as ConvFilter)}
            variant="underline"
          />
        </div>
      </div>

      {/* 3-pane body */}
      <div
        data-tour="conversations.inbox"
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        {/* LEFT pane — conversation list */}
        <div
          data-tour="conversations.list"
          className={cx(
            'flex w-72 flex-none flex-col overflow-y-auto border-r border-line bg-surface',
            mobileView === 'thread' ? 'hidden lg:flex' : 'flex',
          )}
        >
          {filteredConvs.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-muted">
              No conversations match this filter.
            </p>
          ) : (
            filteredConvs.map((conv) => (
              <ConvListItem
                key={conv.id}
                conv={conv}
                contact={contacts.find((c) => c.id === conv.contactId)}
                lastMessage={lastMessageMap[conv.id]}
                isSelected={conv.id === selectedConvId}
                onClick={() => handleSelectConv(conv.id)}
              />
            ))
          )}
        </div>

        {/* CENTER pane — thread + composer */}
        <div
          className={cx(
            'flex min-w-0 flex-1 flex-col min-h-0',
            mobileView === 'list' ? 'hidden lg:flex' : 'flex',
          )}
        >
          {selectedConv && selectedContact ? (
            <>
              {/* Thread header */}
              <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
                <button
                  type="button"
                  className="rounded p-1 text-ink-subtle transition-colors hover:bg-surface-sunken lg:hidden"
                  onClick={() => setMobileView('list')}
                  aria-label="Back to list"
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <Avatar name={fullName(selectedContact)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">
                    {fullName(selectedContact)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <ChannelIcon channel={selectedConv.channel} />
                    <span className="text-xs text-ink-muted">
                      {CHANNEL_LABEL[selectedConv.channel]}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={CHANNEL_TONE[selectedConv.channel]} size="sm">
                    {CHANNEL_LABEL[selectedConv.channel]}
                  </Badge>
                  {selectedConv.starred && (
                    <Star size={14} className="text-warn" aria-hidden />
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                data-tour="conversations.thread"
                className="flex-1 overflow-y-auto bg-surface-sunken px-4 py-4"
              >
                <div className="space-y-3">
                  {threadMessages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply composer — wired to sendMessage() */}
              <ReplyComposer conversationId={selectedConv.id} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-sunken">
              <MessageSquare size={36} className="text-ink-subtle" aria-hidden />
              <p className="text-sm text-ink-muted">
                Select a conversation to start
              </p>
            </div>
          )}
        </div>

        {/* RIGHT pane — contact context (xl+ only) */}
        <div
          className={cx(
            'hidden w-56 xl:block',
            !selectedConv ? 'xl:hidden' : '',
          )}
        >
          {selectedConv && (
            <ContactContextPanel contactId={selectedConv.contactId} />
          )}
        </div>
      </div>
    </div>
  );
}
