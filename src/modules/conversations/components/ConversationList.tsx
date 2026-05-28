/**
 * ConversationList — left pane of the Conversations inbox.
 *
 * Shows channel filter tabs (pill variant) and a scrollable list of
 * conversation items. Selecting an item marks it read and calls onSelect.
 */
import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Avatar, Badge, EmptyState, Tabs } from '@/components/ui/primitives';
import type { TabItem } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, fullName } from '@/utils';
import type { Channel } from '@/types';
import type { ConvFilter } from '../Conversations';

// ── Channel display metadata ─────────────────────────────────────────────────

const CHANNEL_LABELS: Record<Channel, string> = {
  sms:       'SMS',
  email:     'Email',
  webchat:   'Chat',
  facebook:  'FB',
  instagram: 'IG',
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

// ── Props ────────────────────────────────────────────────────────────────────

interface ConversationListProps {
  selectedId: string | null;
  filter: ConvFilter;
  onFilterChange: (f: string) => void;
  onSelect: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ConversationList({
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: ConversationListProps) {
  const conversations    = useStore((s) => s.conversations);
  const contacts         = useStore((s) => s.contacts);
  const markConversationRead = useStore((s) => s.markConversationRead);

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread).length,
    [conversations],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return conversations;
    if (filter === 'unread') return conversations.filter((c) => c.unread);
    return conversations.filter((c) => c.channel === (filter as Channel));
  }, [conversations, filter]);

  const filterTabs: TabItem[] = [
    { id: 'all',     label: 'All',    count: conversations.length },
    { id: 'unread',  label: 'Unread', count: unreadCount },
    { id: 'sms',     label: 'SMS' },
    { id: 'email',   label: 'Email' },
    { id: 'webchat', label: 'Chat' },
    { id: 'call',    label: 'Calls' },
  ];

  function handleSelect(id: string) {
    markConversationRead(id);
    onSelect(id);
  }

  return (
    <div className="flex h-full flex-col" data-tour="conversations.list">

      {/* Channel filter tabs */}
      <div
        className="shrink-0 overflow-x-auto border-b border-line bg-surface px-3 py-2"
        data-tour="conversations.filters"
      >
        <Tabs
          tabs={filterTabs}
          active={filter}
          onChange={onFilterChange}
          variant="pill"
        />
      </div>

      {/* Scrollable conversation list */}
      <div className="flex-1 overflow-y-auto bg-surface">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title={filter === 'unread' ? 'All caught up!' : 'No conversations'}
            body={
              filter === 'unread'
                ? 'You have no unread messages right now.'
                : 'No conversations match this filter.'
            }
          />
        ) : (
          <ul role="listbox" aria-label="Conversations">
            {filtered.map((conv) => {
              const contact  = contacts.find((c) => c.id === conv.contactId);
              const name     = contact ? fullName(contact) : 'Unknown Contact';
              const isSelected = conv.id === selectedId;

              return (
                <li
                  key={conv.id}
                  role="option"
                  aria-selected={isSelected}
                  data-tour="conversations.threadItem"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(conv.id)}
                    className={cx(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                      'hover:bg-surface-sunken',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40',
                      isSelected ? 'bg-brand-soft' : '',
                    )}
                  >
                    {/* Avatar + unread dot */}
                    <div className="relative mt-0.5 shrink-0">
                      <Avatar name={name} size="sm" />
                      {conv.unread && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
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
                        <Badge tone={CHANNEL_TONES[conv.channel]}>
                          {CHANNEL_LABELS[conv.channel]}
                        </Badge>
                        {conv.starred && (
                          <span className="text-[11px] text-warn" title="Starred">★</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
