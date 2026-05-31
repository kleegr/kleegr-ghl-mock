/**
 * Conversations — GHL-style unified Team Inbox (screenshot-fidelity rebuild).
 *
 * Layout: module sub-nav · [view-rail + conversation list] · [thread + composer]
 * · [contextual right panel + icon rail].
 *
 * All behaviour is in-memory and demo-safe:
 *   • selecting a conversation marks it read (markConversationRead)
 *   • the composer sends a fake reply via the store (sendMessage)
 *   • "New Message" opens a demo-safe compose modal (no real inbox integration)
 *   • Reset Demo restores the original seed and removes sent replies
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { Message } from '@/types';
import type { LocalNote } from './threadData';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { Composer } from './components/Composer';
import { ContactPanel } from './components/ContactPanel';
import { NewMessageModal } from './components/NewMessageModal';
import { SUBNAV_TABS, type ConvFilter, type SubNavTab } from './utils';

export function Conversations() {
  const conversations = useStore((s) => s.conversations);
  const allMessages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const markRead = useStore((s) => s.markConversationRead);
  const pushToast = useStore((s) => s.pushToast);

  const [activeFilter, setActiveFilter] = useState<ConvFilter>('all');
  const [subTab, setSubTab] = useState<SubNavTab>('Conversations');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(conversations[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  // Internal comments added via the composer, per conversation (in-memory).
  const [threadNotes, setThreadNotes] = useState<Record<string, LocalNote[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserName = users.find((u) => u.isCurrentUser)?.name ?? 'Demo User';
  const addInternalNote = (convId: string, body: string) =>
    setThreadNotes((prev) => ({
      ...prev,
      [convId]: [
        ...(prev[convId] ?? []),
        { id: `inote_${Date.now()}`, at: new Date().toISOString(), author: currentUserName, body },
      ],
    }));

  // The first few (most recent) threads render the full mixed timeline.
  const richConvIds = useMemo(() => new Set(conversations.slice(0, 4).map((c) => c.id)), [conversations]);

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
    'Demo User';

  const filteredConvs = useMemo(() => {
    if (activeFilter === 'unread') return conversations.filter((c) => c.unread);
    if (activeFilter === 'starred') return conversations.filter((c) => c.starred);
    // 'all' and 'recents' both show everything (already sorted newest-first by seed)
    return conversations;
  }, [conversations, activeFilter]);

  const unreadTotal = useMemo(() => conversations.filter((c) => c.unread).length, [conversations]);

  const handleSelect = (id: string) => {
    setSelectedConvId(id);
    setMobileView('thread');
    markRead(id);
  };

  // The "New Message" button opens a demo-safe compose modal (no real send).
  const handleNewMessage = () => setNewMsgOpen(true);

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
                rich={richConvIds.has(selectedConv.id)}
                localNotes={threadNotes[selectedConv.id] ?? []}
                scrollRef={scrollRef}
                onBack={() => setMobileView('list')}
              />
              <Composer
                conv={selectedConv}
                contact={selectedContact}
                onAddInternalNote={(body) => addInternalNote(selectedConv.id, body)}
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
            <ContactPanel contact={selectedContact} />
          </div>
        )}
      </div>

      <NewMessageModal open={newMsgOpen} onClose={() => setNewMsgOpen(false)} contacts={contacts} />
    </div>
  );
}
