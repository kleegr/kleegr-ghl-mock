/**
 * ConversationList — the GHL "Team Inbox" left pane.
 *
 * View-switcher rail · header (My/Team inbox) · live search · Unread/All/Recents/
 * Starred tabs · a Views section with a working Create-View drawer · dense rows.
 * Channel is shown as a small badge overlapping each avatar.
 */
import { useMemo, useState } from 'react';
import {
  SlidersHorizontal, ArrowDownUp, InboxIcon, Search, User, Users, Workflow, Eye,
  Star, PenSquare, Plus, X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, relativeTime } from '@/utils';
import type { Conversation, Contact, Message } from '@/types';
import { CHANNEL_META, CHANNEL_LABEL, FILTER_TABS, type ConvFilter } from '../utils';
import { CreateViewModal, type SavedView } from './CreateViewModal';

type InboxScope = 'mine' | 'team';

// --- View-switcher rail ----------------------------------------------------

function ViewRail({ scope, onScope, onFocusSearch }: { scope: InboxScope; onScope: (s: InboxScope) => void; onFocusSearch: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const RAIL = [
    { id: 'team', Icon: InboxIcon, label: 'All conversations', onClick: () => onScope('team') },
    { id: 'search', Icon: Search, label: 'Search inbox', onClick: onFocusSearch },
    { id: 'mine', Icon: User, label: 'My Inbox', onClick: () => onScope('mine') },
    { id: 'teamInbox', Icon: Users, label: 'Team Inbox', onClick: () => onScope('team') },
    { id: 'flows', Icon: Workflow, label: 'Internal chat', onClick: () => pushToast({ title: 'Internal chat', description: 'Team chat is cosmetic in this demo.', variant: 'info' }) },
    { id: 'watch', Icon: Eye, label: 'Following', onClick: () => pushToast({ title: 'Following', description: 'Followed threads are cosmetic in this demo.', variant: 'info' }) },
  ] as const;

  const activeId = scope === 'mine' ? 'mine' : 'team';
  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-surface py-3">
      {RAIL.map(({ id, Icon, label, onClick }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            onClick={onClick}
            className={cx(
              'grid h-9 w-9 place-items-center rounded-lg transition-colors',
              isActive ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink-muted',
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

// --- Single conversation row -----------------------------------------------

interface RowProps {
  conv: Conversation;
  contact: Contact | undefined;
  lastMessage: Message | undefined;
  isSelected: boolean;
  unreadN: number;
  onClick: () => void;
}

function ConvRow({ conv, contact, lastMessage, isSelected, unreadN, onClick }: RowProps) {
  const name = contact ? fullName(contact) : 'Unknown';
  const meta = CHANNEL_META[conv.channel];
  const BadgeIcon = meta.Icon;
  const inboundWaiting = conv.unread && lastMessage?.direction === 'inbound';
  const preview = conv.channel === 'call' ? lastMessage?.body || 'Call' : lastMessage?.body || '—';

  return (
    <div
      data-tour="conversations.threadItem"
      className={cx(
        'group relative cursor-pointer px-2.5 py-2.5 transition-colors',
        isSelected ? 'rounded-lg border border-brand/40 bg-surface shadow-sm ring-1 ring-brand/10' : 'border-b border-line hover:bg-surface-sunken',
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-line text-brand opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          aria-label={`Select conversation with ${name}`}
        />

        <div className="relative shrink-0">
          <Avatar name={name} size="sm" />
          <span className={cx('absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-surface', meta.badge)} title={meta.label}>
            <BadgeIcon size={9} aria-hidden />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cx('truncate text-[13px]', conv.unread ? 'font-bold text-ink' : 'font-semibold text-ink')}>{name}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              {inboundWaiting && (
                <span className="flex items-center gap-1 rounded-full bg-bad/10 px-1.5 py-0.5 text-[10px] font-bold text-bad">
                  <span className="h-1.5 w-1.5 rounded-full bg-bad" aria-hidden />
                  -{relativeTime(conv.lastMessageAt)}
                </span>
              )}
              <span className="text-[11px] text-ink-subtle">{relativeTime(conv.lastMessageAt)}</span>
              {conv.unread && (
                <span className="grid min-w-[18px] place-items-center rounded bg-brand px-1 py-0.5 text-[10px] font-bold leading-none text-white">{unreadN}</span>
              )}
            </div>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cx('min-w-0 flex-1 truncate text-[12px]', conv.unread ? 'text-ink-muted' : 'text-ink-subtle')}>{preview}</span>
            <Star
              size={13}
              className={cx('shrink-0 transition-colors', conv.starred ? 'fill-warn text-warn' : 'text-ink-subtle opacity-0 group-hover:opacity-100')}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- List panel ------------------------------------------------------------

interface ListProps {
  conversations: Conversation[];
  contacts: Contact[];
  lastMessageMap: Record<string, Message | undefined>;
  unreadCountMap: Record<string, number>;
  selectedConvId: string | null;
  onSelect: (id: string) => void;
  activeFilter: ConvFilter;
  onFilterChange: (f: ConvFilter) => void;
  unreadTotal: number;
  onNewMessage: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  contacts,
  lastMessageMap,
  unreadCountMap,
  selectedConvId,
  onSelect,
  activeFilter,
  onFilterChange,
  unreadTotal,
  onNewMessage,
  className,
}: ListProps) {
  const pushToast = useStore((s) => s.pushToast);
  const currentUserId = useStore((s) => s.users.find((u) => u.isCurrentUser)?.id);

  const [scope, setScope] = useState<InboxScope>('team');
  const [search, setSearch] = useState('');
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;
  const effectiveScope: InboxScope = activeView ? (activeView.scope === 'mine' ? 'mine' : 'team') : scope;
  const channelFilter = activeView && activeView.channel !== 'any' ? activeView.channel : null;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (effectiveScope === 'mine' && currentUserId && c.assignedTo !== currentUserId) return false;
      if (channelFilter && c.channel !== channelFilter) return false;
      if (q) {
        const contact = contacts.find((x) => x.id === c.contactId);
        const name = contact ? fullName(contact).toLowerCase() : '';
        const preview = (lastMessageMap[c.id]?.body ?? '').toLowerCase();
        if (!name.includes(q) && !preview.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, contacts, lastMessageMap, effectiveScope, channelFilter, currentUserId, search]);

  const applyView = (v: SavedView) => {
    setActiveViewId(v.id);
    setScope(v.scope === 'mine' ? 'mine' : 'team');
    onFilterChange(v.status);
  };
  const handleCreateView = (v: SavedView) => {
    setViews((prev) => [...prev, v]);
    applyView(v);
  };

  return (
    <div className={cx('flex min-h-0 bg-surface', className)}>
      <ViewRail scope={effectiveScope} onScope={(s) => { setScope(s); setActiveViewId(null); }} onFocusSearch={() => document.getElementById('conv-search')?.focus()} />

      <div data-tour="conversations.list" className="flex min-h-0 w-72 flex-none flex-col border-r border-line">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
          <h2 className="text-[15px] font-bold text-ink">{effectiveScope === 'mine' ? 'My Inbox' : 'Team Inbox'}</h2>
          <div className="flex items-center gap-1">
            <button type="button" title="New message" aria-label="New message" onClick={onNewMessage} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink">
              <PenSquare size={15} aria-hidden />
            </button>
            <button type="button" title="Filter" aria-label="Filter conversations" onClick={() => pushToast({ title: 'Filters', description: 'Inbox filtering is cosmetic in this demo.', variant: 'info' })} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink">
              <SlidersHorizontal size={15} aria-hidden />
            </button>
            <button type="button" title="Sort" aria-label="Sort conversations" onClick={() => pushToast({ title: 'Sort', description: 'Inbox sorting is cosmetic in this demo.', variant: 'info' })} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink">
              <ArrowDownUp size={15} aria-hidden />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5">
            <Search size={14} className="shrink-0 text-ink-subtle" aria-hidden />
            <input
              id="conv-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
              aria-label="Search conversations"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="shrink-0 text-ink-subtle hover:text-ink" aria-label="Clear search">
                <X size={13} aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div data-tour="conversations.filters" className="flex shrink-0 items-center gap-5 border-b border-line px-4">
          {FILTER_TABS.map((t) => {
            const isActive = t.id === activeFilter;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { onFilterChange(t.id); setActiveViewId(null); }}
                className={cx('relative flex items-center gap-1.5 py-2 text-[13px] font-semibold transition-colors', isActive ? 'text-brand' : 'text-ink-muted hover:text-ink')}
                aria-pressed={isActive}
              >
                {t.label}
                {t.id === 'unread' && unreadTotal > 0 && (
                  <span className="grid h-4 min-w-[16px] place-items-center rounded bg-brand px-1 text-[10px] font-bold leading-none text-white">{unreadTotal}</span>
                )}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden />}
              </button>
            );
          })}
        </div>

        {/* Views section */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-line px-4 py-2">
          <span className="mr-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-subtle">Views</span>
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => applyView(v)}
              className={cx(
                'max-w-[120px] truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors',
                activeViewId === v.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
              title={v.name}
            >
              {v.name}
            </button>
          ))}
          {activeViewId && (
            <button type="button" onClick={() => setActiveViewId(null)} className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-ink-subtle hover:text-bad" title="Clear active view">
              <X size={11} aria-hidden />
            </button>
          )}
          <button type="button" onClick={() => setCreateOpen(true)} className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand-soft">
            <Plus size={12} aria-hidden /> Create View
          </button>
        </div>

        {/* Select all */}
        <label className="flex shrink-0 items-center gap-2 px-4 py-2 text-[12px] font-medium text-ink-muted">
          <input type="checkbox" className="h-3.5 w-3.5 rounded border-line text-brand" aria-label="Select all conversations" />
          Select all
        </label>

        {/* Rows */}
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5 pb-3">
          {rows.length === 0 ? (
            <p className="px-3 py-10 text-center text-xs text-ink-muted">
              {search ? `No conversations match “${search}”.` : 'No conversations match this view.'}
            </p>
          ) : (
            rows.map((conv) => (
              <ConvRow
                key={conv.id}
                conv={conv}
                contact={contacts.find((c) => c.id === conv.contactId)}
                lastMessage={lastMessageMap[conv.id]}
                unreadN={unreadCountMap[conv.id] ?? 1}
                isSelected={conv.id === selectedConvId}
                onClick={() => onSelect(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      <CreateViewModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateView} />
    </div>
  );
}
