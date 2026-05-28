/**
 * Conversations — Wave 1 implementation.
 *
 * A GoHighLevel-style unified inbox with:
 *  - Left pane: conversation list with channel filter tabs
 *  - Center pane: message thread with reply composer
 *  - Right pane: contact context panel (lg+ screens only)
 *
 * All data is read from the Zustand store (fake seed). No real API calls.
 * Mobile: list and thread swap; context panel hidden below lg.
 */
import { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { PageHeader, Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { ContactContextPanel } from './components/ContactContextPanel';
import type { Channel } from '@/types';

/** Union of channel values plus meta-filter options. */
export type ConvFilter = Channel | 'all' | 'unread';

export function Conversations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConvFilter>('all');

  const conversations = useStore((s) => s.conversations);

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  return (
    <div className="flex h-full flex-col" data-tour="conversations.page">
      <PageHeader
        title="Conversations"
        subtitle="Unified inbox — SMS, Email, Chat, Social, Calls"
        actions={
          <Button size="sm" variant="secondary">
            <MessageSquare size={14} />
            New Message
          </Button>
        }
      />

      {/* 3-pane inbox */}
      <div
        className="flex min-h-0 flex-1 overflow-hidden"
        data-tour="conversations.inbox"
      >
        {/* ── Left pane: conversation list + channel filters ── */}
        <div
          className={cx(
            'flex flex-col border-r border-line',
            selectedId
              ? 'hidden md:flex md:w-72 md:shrink-0'
              : 'w-full md:w-72 md:shrink-0',
          )}
        >
          <ConversationList
            selectedId={selectedId}
            filter={filter}
            onFilterChange={(f) => setFilter(f as ConvFilter)}
            onSelect={setSelectedId}
          />
        </div>

        {/* ── Center pane: message thread ── */}
        <div
          className={cx(
            'flex flex-col',
            selectedId
              ? 'min-w-0 flex-1'
              : 'hidden md:flex md:min-w-0 md:flex-1',
          )}
        >
          <MessageThread
            conversationId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        </div>

        {/* ── Right pane: contact context (lg+ only) ── */}
        <div className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-l lg:border-line">
          <ContactContextPanel conversation={selectedConv} />
        </div>
      </div>
    </div>
  );
}
