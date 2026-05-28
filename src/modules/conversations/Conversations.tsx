import { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare, Phone, Mail, Globe, Send, Sparkles,
  Paperclip, User, Tag, Briefcase, CheckSquare, Calendar,
  PhoneCall, AtSign, ChevronRight, Search,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Avatar, Badge } from '@/components/ui/primitives';
import { relativeTime, clockTime, fullName, money } from '@/utils';
import type { Channel, Conversation } from '@/types';

const CHANNEL_CFG: Record<Channel, { label: string; color: string; bg: string }> = {
  sms:       { label: 'SMS',   color: '#1f6feb', bg: '#e8f0fe' },
  email:     { label: 'Email', color: '#71849b', bg: '#f0f1f3' },
  webchat:   { label: 'Chat',  color: '#12986a', bg: '#e6f7f2' },
  facebook:  { label: 'FB',    color: '#1877f2', bg: '#e7f0fd' },
  instagram: { label: 'IG',    color: '#e1306c', bg: '#fce8f0' },
  whatsapp:  { label: 'WA',    color: '#25d366', bg: '#e8faf0' },
  call:      { label: 'Call',  color: '#d99111', bg: '#fef9e7' },
};

const FILTER_TABS = [
  { id: 'all',    label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'sms',    label: 'SMS' },
  { id: 'email',  label: 'Email' },
  { id: 'webchat',label: 'Chat' },
  { id: 'call',   label: 'Calls' },
] as const;

type FilterId = (typeof FILTER_TABS)[number]['id'];

const AI_SUGGESTIONS = [
  'Happy to help! Let me check that for you.',
  'Absolutely — our consultation is completely free.',
  'No problem at all, I can move that for you right now.',
  "Great news! We still have a few slots open this week.",
  'Just sent it over — let me know if you have any questions!',
];

export function Conversations() {
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const tasks = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);
  const users = useStore((s) => s.users);
  const sendMessage = useStore((s) => s.sendMessage);
  const markRead = useStore((s) => s.markConversationRead);

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(() => conversations[0]?.id ?? null);
  const [draft, setDraft] = useState('');
  const [listSearch, setListSearch] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  // Filter conversation list
  const filtered = useMemo(() => {
    let list = conversations;
    if (activeFilter === 'unread') list = list.filter((c) => c.unread);
    else if (activeFilter !== 'all') list = list.filter((c) => c.channel === activeFilter);
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter((c) => {
        const contact = contacts.find((x) => x.id === c.contactId);
        return contact && `${contact.firstName} ${contact.lastName} ${contact.email}`.toLowerCase().includes(q);
      });
    }
    return list;
  }, [conversations, activeFilter, listSearch, contacts]);

  // Unread count per filter
  const unreadCount = useMemo(() => conversations.filter((c) => c.unread).length, [conversations]);

  // Select first in list when filter changes
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.find((c) => c.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered]);

  // Auto-scroll thread to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [selectedId, messages.length]);

  // Mark read when opened
  useEffect(() => {
    if (selectedId) markRead(selectedId);
  }, [selectedId]);

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const selectedContact = selectedConv ? contacts.find((c) => c.id === selectedConv.contactId) : null;
  const threadMessages = useMemo(() =>
    selectedConv ? messages.filter((m) => m.conversationId === selectedConv.id)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)) : [],
    [messages, selectedConv]);

  const contactOpps = useMemo(() =>
    selectedContact ? opportunities.filter((o) => o.contactId === selectedContact.id) : [],
    [opportunities, selectedContact]);
  const contactTasks = useMemo(() =>
    selectedContact ? tasks.filter((t) => t.contactId === selectedContact.id) : [],
    [tasks, selectedContact]);
  const contactAppts = useMemo(() =>
    selectedContact ? appointments.filter((a) => a.contactId === selectedContact.id)
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)).slice(0, 3) : [],
    [appointments, selectedContact]);

  const handleSend = () => {
    if (!draft.trim() || !selectedId) return;
    sendMessage(selectedId, draft.trim());
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  const handleAiSuggest = () => {
    const suggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setDraft(suggestion);
  };

  return (
    <div data-tour="conversations.page" className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      <PageHeader
        title="Conversations"
        subtitle="Unified inbox — SMS, Email, Chat, Social, Calls"
      />

      {/* 3-pane inbox */}
      <div data-tour="conversations.inbox" className="flex flex-1 min-h-0 overflow-hidden border-t border-line">

        {/* ── Left: Conversation List ── */}
        <div className="flex w-72 shrink-0 flex-col border-r border-line bg-surface">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-3 py-1.5">
              <Search size={13} className="text-ink-subtle" />
              <input
                type="text"
                placeholder="Search contacts…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div data-tour="conversations.filters" className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeFilter === tab.id
                    ? 'bg-brand text-white'
                    : 'bg-surface-sunken text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-white/30 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div data-tour="conversations.list" className="flex-1 overflow-y-auto divide-y divide-line">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-ink-subtle">No conversations found.</p>
            )}
            {filtered.map((conv) => {
              const contact = contacts.find((c) => c.id === conv.contactId);
              const lastMsg = messages.filter((m) => m.conversationId === conv.id).at(-1);
              const cfg = CHANNEL_CFG[conv.channel];
              const isSelected = selectedId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-surface-sunken'
                  }`}
                >
                  <div className="relative mt-0.5 shrink-0">
                    <Avatar name={contact ? fullName(contact) : '?'} size="sm" />
                    {conv.unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand ring-1 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`truncate text-xs ${conv.unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                        {contact ? fullName(contact) : 'Unknown'}
                      </p>
                      <span className="shrink-0 text-[10px] text-ink-subtle">{relativeTime(conv.lastMessageAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="shrink-0 rounded px-1 py-px text-[10px] font-bold"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <p className="truncate text-[11px] text-ink-muted">{lastMsg?.body ?? '—'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Center: Thread ── */}
        <div className="flex flex-1 min-w-0 flex-col bg-surface-sunken">
          {selectedConv && selectedContact ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
                <Avatar name={fullName(selectedContact)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{fullName(selectedContact)}</p>
                  <p className="text-[11px] text-ink-muted">
                    {CHANNEL_CFG[selectedConv.channel].label} · {selectedContact.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink">
                    <PhoneCall size={15} />
                  </button>
                  <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink">
                    <AtSign size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div data-tour="conversations.thread" ref={threadRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                {threadMessages.map((msg) => {
                  const isOut = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg.id}
                      data-tour="conversations.threadItem"
                      className={`flex flex-col ${ isOut ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isOut
                            ? 'rounded-br-sm bg-brand text-white'
                            : 'rounded-bl-sm bg-surface text-ink shadow-card'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div className={`mt-1 flex items-center gap-1.5 text-[10px] text-ink-subtle ${ isOut ? 'flex-row-reverse' : '' }`}>
                        <span>{relativeTime(msg.createdAt)}</span>
                        {isOut && msg.status && (
                          <span className="text-[10px] text-ink-subtle capitalize">{msg.status}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div data-tour="conversations.composer" className="border-t border-line bg-surface px-4 py-3">
                <div className="rounded-xl border border-line bg-surface-sunken p-2.5 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/20">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply via ${CHANNEL_CFG[selectedConv.channel].label}… (⌘↵ to send)`}
                    rows={3}
                    className="block w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiSuggest}
                        className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-ink-muted hover:border-brand/40 hover:text-brand"
                        title="AI-suggested reply (demo)"
                      >
                        <Sparkles size={12} /> AI Suggest
                      </button>
                      <button className="rounded-lg p-1 text-ink-subtle hover:text-ink" title="Attach file (demo)">
                        <Paperclip size={14} />
                      </button>
                    </div>
                    <button
                      data-tour="conversations.sendButton"
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={13} /> Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-ink-subtle">Select a conversation to start.</p>
            </div>
          )}
        </div>

        {/* ── Right: Contact Context ── */}
        {selectedContact && (
          <div data-tour="conversations.contactContext" className="hidden w-72 shrink-0 flex-col border-l border-line bg-surface overflow-y-auto xl:flex">
            <div className="border-b border-line px-4 py-4">
              <Avatar name={fullName(selectedContact)} size="lg" />
              <p className="mt-2 text-sm font-bold text-ink">{fullName(selectedContact)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {selectedContact.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-ink-muted border border-line">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact details */}
            <div className="border-b border-line px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <AtSign size={13} className="shrink-0 text-ink-subtle" />
                <span className="truncate text-xs text-ink-muted">{selectedContact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-ink-subtle" />
                <span className="text-xs text-ink-muted">{selectedContact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={13} className="shrink-0 text-ink-subtle" />
                <span className="text-xs text-ink-muted">Source: {selectedContact.source}</span>
              </div>
            </div>

            {/* Quick actions (cosmetic) */}
            <div className="border-b border-line flex gap-2 px-4 py-3">
              {[
                { icon: Phone, label: 'Call' },
                { icon: Mail, label: 'Email' },
                { icon: CheckSquare, label: 'Task' },
                { icon: Calendar, label: 'Appt' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-line py-2 text-[10px] font-semibold text-ink-muted hover:border-brand/30 hover:bg-surface-sunken hover:text-brand transition-colors"
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Related Opportunities */}
            {contactOpps.length > 0 && (
              <div className="border-b border-line px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Opportunities</p>
                {contactOpps.slice(0, 3).map((o) => (
                  <div key={o.id} className="mb-1.5 flex items-center gap-2">
                    <Briefcase size={12} className="shrink-0 text-ink-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-ink">{o.name}</p>
                      <p className="text-[10px] text-ink-muted">{money(o.monetaryValue)} · {o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Related Tasks */}
            {contactTasks.length > 0 && (
              <div className="border-b border-line px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Tasks</p>
                {contactTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="mb-1.5 flex items-center gap-2">
                    <CheckSquare size={12} className={`shrink-0 ${t.status === 'completed' ? 'text-good' : 'text-ink-subtle'}`} />
                    <p className={`truncate text-[11px] ${t.status === 'completed' ? 'text-ink-muted line-through' : 'text-ink'}`}>
                      {t.title}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Related Appointments */}
            {contactAppts.length > 0 && (
              <div className="px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Appointments</p>
                {contactAppts.map((a) => (
                  <div key={a.id} className="mb-1.5 flex items-center gap-2">
                    <Calendar size={12} className="shrink-0 text-ink-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-ink">{a.title}</p>
                      <p className="text-[10px] text-ink-muted">{clockTime(a.startTime)} · {a.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
