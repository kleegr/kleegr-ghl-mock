/**
 * Conversations — GHL-style unified Team Inbox (screenshot-fidelity rebuild).
 *
 * Layout: module sub-nav · [view-rail + conversation list] · [thread + composer]
 * · [contextual right panel + icon rail].
 *
 * All behaviour is in-memory and demo-safe:
 *   • selecting a conversation marks it read (markConversationRead)
 *   • the composer sends a fake reply via the store (sendMessage)
 *   • "New Message" creates a local thread and a fictional contact reply
 *   • Reset Demo restores the original seed and removes sent replies
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { Channel, Message } from '@/types';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { Composer } from './components/Composer';
import { ConversationContextPanel } from './components/ConversationContextPanel';
import { NewMessageModal } from './components/NewMessageModal';
import { SUBNAV_TABS, type ConvFilter, type SubNavTab } from './utils';
import type { LocalNote } from './threadModel';
import { ConversationRecordsProvider } from './ConversationRecords';

export function Conversations() {
  const contacts = useStore((s) => s.contacts);
  const currentUserName = useStore((s) => s.users.find((user) => user.isCurrentUser)?.name ?? 'Demo Agent');
  const demoRevision = useStore((s) => s.demoRevision);
  return (
    <ConversationRecordsProvider key={demoRevision} contacts={contacts} currentUserName={currentUserName}>
      <ConversationsWorkspace />
    </ConversationRecordsProvider>
  );
}

function ConversationsWorkspace() {
  const [panelParams, setPanelParams] = useSearchParams();
  const conversations = useStore((s) => s.conversations);
  const allMessages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const calls = useStore((s) => s.calls);
  const opportunities = useStore((s) => s.opportunities);
  const markRead = useStore((s) => s.markConversationRead);
  const appendInboundReply = useStore((s) => s.appendInboundReply);
  const toggleConversationStar = useStore((s) => s.toggleConversationStar);
  const setConversationUnread = useStore((s) => s.setConversationUnread);
  const removeConversation = useStore((s) => s.removeConversation);
  const pushToast = useStore((s) => s.pushToast);

  // Default to a conversation that best showcases the thread. Preference order:
  // an *answered* call (audio player) or a call with a voicemail *transcript*,
  // paired with an opportunity (system-event rows), degrading to any call
  // thread, then the newest thread. Purely a cosmetic default selection.
  const defaultConvId = useMemo(() => {
    const answered = new Set(calls.filter((c) => c.direction !== 'missed').map((c) => c.contactId));
    const transcript = new Set(calls.filter((c) => c.voicemailTranscript).map((c) => c.contactId));
    const anyCall = new Set(calls.map((c) => c.contactId));
    const hasOpp = new Set(opportunities.map((o) => o.contactId));
    const pick =
      conversations.find((c) => answered.has(c.contactId) && hasOpp.has(c.contactId)) ??
      conversations.find((c) => transcript.has(c.contactId) && hasOpp.has(c.contactId)) ??
      conversations.find((c) => answered.has(c.contactId) || transcript.has(c.contactId)) ??
      conversations.find((c) => anyCall.has(c.contactId) && hasOpp.has(c.contactId)) ??
      conversations.find((c) => anyCall.has(c.contactId)) ??
      conversations[0];
    return pick?.id ?? null;
  }, [conversations, calls, opportunities]);

  const [activeFilter, setActiveFilter] = useState<ConvFilter>('all');
  const [subTab, setSubTab] = useState<SubNavTab>('Conversations');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(defaultConvId);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [threadNotes, setThreadNotes] = useState<Record<string, LocalNote[]>>({});
  const [pendingReplies, setPendingReplies] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimers = useRef<number[]>([]);
  const selectedConversationRef = useRef<string | null>(selectedConvId);

  useEffect(() => {
    selectedConversationRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => () => replyTimers.current.forEach((timer) => window.clearTimeout(timer)), []);

  // last message + a trailing-inbound "unread count" per conversation
  const { lastMessageMap, unreadCountMap } = useMemo(() => {
    const last: Record<string, Message | undefined> = {};
    const counts: Record<string, number> = {};
    conversations.forEach((conv) => {
      const msgs = allMessages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      last[conv.id] = msgs[msgs.length - 1];
      let n = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].direction === 'inbound') n++;
        else break;
      }
      counts[conv.id] = Math.max(n, conv.unread ? 1 : 0);
    });
    return { lastMessageMap: last, unreadCountMap: counts };
  }, [conversations, allMessages]);

  const threadMessages = useMemo(
    () =>
      allMessages
        .filter((m) => m.conversationId === selectedConvId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [allMessages, selectedConvId],
  );

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;
  const selectedContact = selectedConv ? contacts.find((c) => c.id === selectedConv.contactId) ?? null : null;
  const agentName =
    (selectedConv && users.find((u) => u.id === selectedConv.assignedTo)?.name) ||
    users.find((u) => u.isCurrentUser)?.name ||
    'Demo Agent';

  const filteredConvs = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
    if (activeFilter === 'unread') return sorted.filter((c) => c.unread);
    if (activeFilter === 'starred') return sorted.filter((c) => c.starred);
    if (activeFilter === 'recents') {
      const cutoff = Date.now() - 7 * 86_400_000;
      return sorted.filter((c) => +new Date(c.lastMessageAt) >= cutoff);
    }
    return sorted;
  }, [conversations, activeFilter]);

  const unreadTotal = useMemo(() => conversations.filter((c) => c.unread).length, [conversations]);

  const handleSelect = (id: string) => {
    setSelectedConvId(id);
    setMobileView('thread');
    markRead(id);
  };

  // The "New Message" button opens the session-only compose flow.
  const handleNewMessage = () => setNewMsgOpen(true);

  const openContextPanel = (panel: string) => {
    const next = new URLSearchParams(panelParams);
    next.set('panel', panel);
    setPanelParams(next, { replace: true });
  };

  const fictionalReply = (channel: Channel, sent: string) => {
    const lower = sent.toLowerCase();
    if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('day works')) {
      return 'Thursday afternoon works well for me. Could you send over the available times?';
    }
    if (lower.includes('price') || lower.includes('quote') || lower.includes('proposal')) {
      return 'Thanks! I’ve had a look and the range makes sense. What would the next step be?';
    }
    if (lower.includes('confirm')) return 'Confirmed — thank you. I’ll keep an eye out for the details.';
    if (channel === 'email') return 'Thanks for the thorough follow-up. I’ve received this and will review it with my team today.';
    if (channel === 'whatsapp' || channel === 'telegram') return 'Perfect, thanks for the quick reply! 👍';
    if (channel === 'instagram' || channel === 'facebook') return 'That sounds great! Can you share a little more info here?';
    return 'Thanks for getting back to me. Yes, I’d like to keep moving forward.';
  };

  const scheduleReply = (conversationId: string, channel: Channel, body: string) => {
    setPendingReplies((current) => ({ ...current, [conversationId]: (current[conversationId] ?? 0) + 1 }));
    const timer = window.setTimeout(() => {
      appendInboundReply(conversationId, fictionalReply(channel, body), channel);
      setPendingReplies((current) => ({ ...current, [conversationId]: Math.max(0, (current[conversationId] ?? 1) - 1) }));
      if (selectedConversationRef.current === conversationId) markRead(conversationId);
    }, 1500);
    replyTimers.current.push(timer);
  };

  const handleConversationCreated = (id: string, channel: Channel, body: string) => {
    setSelectedConvId(id);
    setMobileView('thread');
    scheduleReply(id, channel, body);
  };

  const handleConversationDeleted = (id: string) => {
    if (selectedConvId !== id) return;
    const next = filteredConvs.find((conversation) => conversation.id !== id) ?? null;
    setSelectedConvId(next?.id ?? null);
    if (!next) setMobileView('list');
  };

  const handleBulkDelete = (ids: string[]) => {
    ids.forEach(removeConversation);
    if (selectedConvId && ids.includes(selectedConvId)) {
      const next = conversations
        .filter((conversation) => !ids.includes(conversation.id))
        .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt))[0];
      setSelectedConvId(next?.id ?? null);
      if (!next) setMobileView('list');
    }
  };

  const addInternalNote = (body: string) => {
    if (!selectedConv) return;
    const note: LocalNote = {
      id: `thread-note-${selectedConv.id}-${Date.now()}`,
      at: new Date().toISOString(),
      author: agentName,
      body,
    };
    setThreadNotes((previous) => ({
      ...previous,
      [selectedConv.id]: [...(previous[selectedConv.id] ?? []), note],
    }));
  };

  const updateInternalNote = (id: string, body: string) => {
    if (!selectedConv) return;
    setThreadNotes((previous) => ({
      ...previous,
      [selectedConv.id]: (previous[selectedConv.id] ?? []).map((note) => note.id === id ? { ...note, body } : note),
    }));
    pushToast({ title: 'Internal comment updated', description: 'Saved for this demo session.', variant: 'success' });
  };

  const deleteInternalNote = (id: string) => {
    if (!selectedConv) return;
    setThreadNotes((previous) => ({
      ...previous,
      [selectedConv.id]: (previous[selectedConv.id] ?? []).filter((note) => note.id !== id),
    }));
    pushToast({ title: 'Internal comment deleted', description: 'Removed from this demo session.', variant: 'success' });
  };

  const handleSubTab = (t: SubNavTab) => {
    if (t === 'Conversations') {
      setSubTab(t);
      return;
    }
    pushToast({ title: t, description: 'This Conversations sub-tab is cosmetic in the demo.', variant: 'info' });
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConvId, threadMessages.length]);

  return (
    <div data-tour="conversations.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      {/* Module sub-nav */}
      <div className="flex shrink-0 items-end gap-6 border-b border-line bg-surface px-5">
        <h1 className="py-3 text-[20px] font-bold leading-none text-ink">Conversations</h1>
        <nav className="flex items-center gap-5 overflow-x-auto">
          {SUBNAV_TABS.map((t) => {
            const isActive = subTab === t && t === 'Conversations';
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSubTab(t)}
                className={cx(
                  'relative whitespace-nowrap py-3 text-[14px] font-semibold transition-colors',
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {t}
                {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3-pane body */}
      <div data-tour="conversations.inbox" className="flex min-h-0 flex-1 overflow-hidden">
        <ConversationList
          conversations={filteredConvs}
          contacts={contacts}
          lastMessageMap={lastMessageMap}
          unreadCountMap={unreadCountMap}
          selectedConvId={selectedConvId}
          onSelect={handleSelect}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadTotal={unreadTotal}
          onNewMessage={handleNewMessage}
          onToggleStar={(id) => toggleConversationStar(id)}
          onBulkMarkRead={(ids) => ids.forEach((id) => setConversationUnread(id, false))}
          onBulkDelete={handleBulkDelete}
          className={cx('min-h-0', mobileView === 'thread' ? 'hidden lg:flex' : 'flex')}
        />

        {/* Center: thread + composer */}
        <div
          className={cx(
            'flex min-w-0 flex-1 flex-col bg-surface-sunken',
            mobileView === 'list' ? 'hidden lg:flex' : 'flex',
          )}
        >
          {selectedConv && selectedContact ? (
            <>
              <MessageThread
                conv={selectedConv}
                contact={selectedContact}
                messages={threadMessages}
                agentName={agentName}
                rich
                localNotes={threadNotes[selectedConv.id] ?? []}
                typing={(pendingReplies[selectedConv.id] ?? 0) > 0}
                scrollRef={scrollRef}
                onBack={() => setMobileView('list')}
                onDeleted={() => handleConversationDeleted(selectedConv.id)}
                onUpdateLocalNote={updateInternalNote}
                onDeleteLocalNote={deleteInternalNote}
              />
              <Composer
                conv={selectedConv}
                contact={selectedContact}
                onAddInternalNote={addInternalNote}
                onMessageSent={(channel, body) => scheduleReply(selectedConv.id, channel, body)}
                onRequestPayment={() => openContextPanel('payments')}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-subtle">
              <p className="text-sm">Select a conversation to start.</p>
            </div>
          )}
        </div>

        {/* Right: contextual panel (xl+) */}
        {selectedContact && (
          <div className="hidden min-h-0 xl:flex">
            <ConversationContextPanel key={selectedContact.id} contact={selectedContact} />
          </div>
        )}
      </div>

      <NewMessageModal
        open={newMsgOpen}
        onClose={() => setNewMsgOpen(false)}
        contacts={contacts}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
