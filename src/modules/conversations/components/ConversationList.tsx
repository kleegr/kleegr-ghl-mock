/**
 * ConversationList — left pane of the Conversations inbox.
 *
 * Shows a search bar, channel filter pills, and a scrollable list of
 * conversation items. Selecting an item marks it read and calls onSelect.
 *
 * data-tour targets:
 *  conversations.list     — outer wrapper
 *  conversations.filters  — channel filter strip
 *  conversations.threadItem — each conversation button
 */
import { useMemo, useState } from 'react';
import { MessageSquare, Search, X } from 'lucide-react';
import { Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, fullName } from '@/utils';
import type { Channel } from '@/types';
import type { ConvFilter } from '../Conversations';

// ── Channel display metadata ──────────────────────────────────────────────────

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

// ── Filter tab config ─────────────────────────────────────────────────────────

const FILTER_TABS: { id: ConvFilter; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'unread',    label: 'Unread' },
  { id: 'sms',       label: 'SMS' },
  { id: 'email',     label: 'Email' },
  { id: 'webchat',   label: 'Chat' },
  { id: 'facebook',  label: 'FB' },
  { id: 'instagram', label: 'IG' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'call',      label: 'Calls' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ConversationListProps {
  selectedId: string | null;
  filter: ConvFilter;
  onFilterChange: (f: string) => void;
  onSelect: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConversationList({
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: ConversationListProps) {
  const conversations        = useStore((s) => s.conversations);
  const contacts             = useStore((s) => s.contacts);
  const messages             = useStore((s) => s.messages);
  const markConversationRead = useStore((s) => s.markConversationRead);

  const [search, setSearch] = useState('');

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread).length,
    [conversations],
  );

  // Pre-compute last message per conversation to show as preview
  const lastMsgBody = useMemo(() => {
    const map = new Map<string, string>();
    messages.forEach((m) => {
      const existing = map.get(m.conversationId);
      // Keep the latest message (messages array is not sorted, so compare by id suffix isn't reliable —
      // we rely on insertion order and always overwrite, since seed sorts conversations desc)
      if (!existing) map.set(m.conversationId, m.direction === 'outbound' ? `You: ${m.body}` : m.body);
    });
    return map;
  }, [messages]);

  const filtered = useMemo(() => {
    let list = [...conversations];

    // Channel / meta filter
    if (filter === 'unread') {
      list = list.filter((c) => c.unread);
    } else if (filter !== 'all') {
      list = list.filter((c) => c.channel === (filter as Channel));
    }

    // Search by contact name / email / phone
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((conv) => {
        const contact = contacts.find((c) => c.id === conv.contactId);
        if (!contact) return false;
        return (
          fullName(contact).toLowerCase().includes(q) ||
          contact.email.toLowerCase().includes(q) ||
          contact.phone.includes(q)
        );
      });
    }

    return list;
  }, [conversations, contacts, filter, search]);

  function handleSelect(id: string) {
    markConversationRead(id);
    onSelect(id);
  }

  return (
    <div className="flex h-full flex-col" data-tour="conversations.list">

      {/* Search bar */}
      <div className="shrink-0 border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-line/60 bg-surface-sunken px-2.5 py-1.5">
          <Search size={13} className="shrink-0 text-ink-subtle" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations\u2026"
            aria-label="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="shrink-0 text-ink-subtle hover:text-ink"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Channel filter pills */}
      <div
        className="shrink-0 overflow-x-auto border-b border-line bg-surface px-2.5 py-2"
        data-tour="conversations.filters"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.id;
            const isUnread = tab.id === 'unread';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cx(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-brand text-brand-fg'
                    : 'bg-surface-sunken text-ink-muted hover:text-ink',
                )}
              >
                {tab.label}
                {isUnread && unreadCount > 0 && (
                  <span
                    className={cx(
                      'rounded-full px-1 py-px text-[10px] font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-brand-soft text-brand',
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable conversation list */}
      <div className="flex-1 overflow-y-auto bg-surface">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title={
              search
                ? 'No results'
                : filter === 'unread'
                ? 'All caught up!'
                : 'No conversations'
            }
            body={
              search
                ? `No conversations matching \u201C${search}\u201D.`
                : filter === 'unread'
                ? 'You have no unread messages right now.'
                : 'No conversations match this filter.'
            }
          />
        ) : (
          <ul role="listbox" aria-label="Conversations">
            {filtered.map((conv) => {
              const contact    = contacts.find((c) => c.id === conv.contactId);
              const name       = contact ? fullName(contact) : 'Unknown Contact';
              const isSelected = conv.id === selectedId;
              const preview    = lastMsgBody.get(conv.id);

              return (
                <li key={conv.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    data-tour="conversations.threadItem"
                    onClick={() => handleSelect(conv.id)}
                    className={cx(
                      'flex w-full items-start gap-3 border-b border-line/50 border-l-2 px-4 py-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40',
                      isSelected
                        ? 'border-l-brand bg-brand-soft'
                        : 'border-l-transparent hover:bg-surface-sunken',
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
                            'truncate text-sm leading-tight',
                            conv.unread ? 'font-bold text-ink' : 'font-medium text-ink',
                          )}
                        >
                          {name}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-subtle">
                          {relativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 min-w-0">
                        <Badge tone={CHANNEL_TONES[conv.channel]} size="sm" className="shrink-0">
                          {CHANNEL_LABELS[conv.channel]}
                        </Badge>
                        {preview && (
                          <p className="min-w-0 flex-1 truncate text-[11px] text-ink-muted leading-tight">
                            {preview}
                          </p>
                        )}
                      </div>
                      {conv.starred && (
                        <span className="mt-0.5 text-[10px] text-warn" aria-label="Starred">★ Starred</span>
                      )}
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
