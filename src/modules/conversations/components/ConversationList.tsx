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
  Star, PenSquare, Plus, X, Check, MailOpen, Trash2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, fullName, relativeTime } from '@/utils';
import type { Conversation, Contact, Message } from '@/types';
import { CHANNEL_META, CHANNEL_LABEL, FILTER_TABS, type ConvFilter } from '../utils';
import { CreateViewModal, type SavedView } from './CreateViewModal';

type InboxScope = 'mine' | 'team';
type ReadFilter = 'any' | 'unread' | 'read';
type AssignmentFilter = 'any' | 'mine' | 'unassigned';
type SortMode = 'latest' | 'oldest' | 'latest-manual' | 'oldest-manual' | 'sla-overdue';

interface InboxFilters {
  channel: Conversation['channel'] | 'any';
  read: ReadFilter;
  assignment: AssignmentFilter;
}

const EMPTY_FILTERS: InboxFilters = { channel: 'any', read: 'any', assignment: 'any' };

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'latest', label: 'Latest All Messages' },
  { id: 'oldest', label: 'Oldest All Messages' },
  { id: 'latest-manual', label: 'Latest Manual Messages' },
  { id: 'oldest-manual', label: 'Oldest Manual Messages' },
  { id: 'sla-overdue', label: 'Longest SLA Overdue' },
];

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
  isChecked: boolean;
  isUnread: boolean;
  isStarred: boolean;
  unreadN: number;
  onClick: () => void;
  onCheck: (checked: boolean) => void;
  onToggleStar: () => void;
}

function ConvRow({
  conv,
  contact,
  lastMessage,
  isSelected,
  isChecked,
  isUnread,
  isStarred,
  unreadN,
  onClick,
  onCheck,
  onToggleStar,
}: RowProps) {
  const name = contact ? fullName(contact) : 'Unknown';
  const meta = CHANNEL_META[conv.channel];
  const BadgeIcon = meta.Icon;
  const inboundWaiting = isUnread && lastMessage?.direction === 'inbound';
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
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheck(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cx(
            'mt-1.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-line text-brand transition-opacity',
            isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
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
            <span className={cx('truncate text-[13px]', isUnread ? 'font-bold text-ink' : 'font-semibold text-ink')}>{name}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              {inboundWaiting && (
                <span className="flex items-center gap-1 rounded-full bg-bad/10 px-1.5 py-0.5 text-[10px] font-bold text-bad">
                  <span className="h-1.5 w-1.5 rounded-full bg-bad" aria-hidden />
                  -{relativeTime(conv.lastMessageAt)}
                </span>
              )}
              <span className="text-[11px] text-ink-subtle">{relativeTime(conv.lastMessageAt)}</span>
              {isUnread && (
                <span className="grid min-w-[18px] place-items-center rounded bg-brand px-1 py-0.5 text-[10px] font-bold leading-none text-white">{unreadN}</span>
              )}
            </div>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cx('min-w-0 flex-1 truncate text-[12px]', isUnread ? 'text-ink-muted' : 'text-ink-subtle')}>{preview}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
              onKeyDown={(e) => e.stopPropagation()}
              className={cx(
                'grid h-6 w-6 shrink-0 place-items-center rounded transition-colors hover:bg-warn/10 focus:opacity-100',
                isStarred ? 'text-warn' : 'text-ink-subtle opacity-0 group-hover:opacity-100',
              )}
              aria-label={isStarred ? `Unstar conversation with ${name}` : `Star conversation with ${name}`}
              aria-pressed={isStarred}
            >
              <Star size={13} className={cx(isStarred && 'fill-current')} aria-hidden />
            </button>
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
  /** Persist a star change in the parent store. Falls back to session-local UI state. */
  onToggleStar?: (id: string, starred: boolean) => void;
  /** Apply the bulk action in the parent store. The list still updates immediately. */
  onBulkMarkRead?: (ids: string[]) => void;
  /** Remove selected conversations in the parent store. The list still hides them immediately. */
  onBulkDelete?: (ids: string[]) => void;
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
  onToggleStar,
  onBulkMarkRead,
  onBulkDelete,
  className,
}: ListProps) {
  const currentUserId = useStore((s) => s.users.find((u) => u.isCurrentUser)?.id);

  const [scope, setScope] = useState<InboxScope>('team');
  const [search, setSearch] = useState('');
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<InboxFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<InboxFilters>(EMPTY_FILTERS);
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [starredOverrides, setStarredOverrides] = useState<Record<string, boolean>>({});
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;
  const effectiveScope: InboxScope = activeView ? (activeView.scope === 'mine' ? 'mine' : 'team') : scope;
  const channelFilter = activeView && activeView.channel !== 'any' ? activeView.channel : filters.channel === 'any' ? null : filters.channel;
  const usesStoreStars = Boolean(onToggleStar);
  const usesStoreRead = Boolean(onBulkMarkRead);

  const isUnread = (conv: Conversation) => usesStoreRead ? conv.unread : readOverrides[conv.id] ?? conv.unread;
  const isStarred = (conv: Conversation) => usesStoreStars ? Boolean(conv.starred) : starredOverrides[conv.id] ?? Boolean(conv.starred);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (deletedIds.has(c.id)) return false;
      if (effectiveScope === 'mine' && currentUserId && c.assignedTo !== currentUserId) return false;
      if (channelFilter && c.channel !== channelFilter) return false;
      const unread = usesStoreRead ? c.unread : readOverrides[c.id] ?? c.unread;
      const starred = usesStoreStars ? Boolean(c.starred) : starredOverrides[c.id] ?? Boolean(c.starred);
      if (activeFilter === 'unread' && !unread) return false;
      if (activeFilter === 'starred' && !starred) return false;
      if (filters.read === 'unread' && !unread) return false;
      if (filters.read === 'read' && unread) return false;
      if (filters.assignment === 'mine' && currentUserId && c.assignedTo !== currentUserId) return false;
      if (filters.assignment === 'unassigned' && c.assignedTo) return false;
      if (q) {
        const contact = contacts.find((x) => x.id === c.contactId);
        const name = contact ? fullName(contact).toLowerCase() : '';
        const details = contact ? `${contact.email} ${contact.phone}`.toLowerCase() : '';
        const preview = (lastMessageMap[c.id]?.body ?? '').toLowerCase();
        if (!name.includes(q) && !details.includes(q) && !preview.includes(q) && !CHANNEL_LABEL[c.channel].toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortMode === 'sla-overdue') {
        const aWaiting = (usesStoreRead ? a.unread : readOverrides[a.id] ?? a.unread) && lastMessageMap[a.id]?.direction === 'inbound';
        const bWaiting = (usesStoreRead ? b.unread : readOverrides[b.id] ?? b.unread) && lastMessageMap[b.id]?.direction === 'inbound';
        if (aWaiting !== bWaiting) return aWaiting ? -1 : 1;
        return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
      }
      const oldestFirst = sortMode === 'oldest' || sortMode === 'oldest-manual';
      const delta = new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      return oldestFirst ? -delta : delta;
    });
  }, [
    conversations, contacts, lastMessageMap, effectiveScope, channelFilter, currentUserId,
    search, activeFilter, filters, sortMode, deletedIds, readOverrides, starredOverrides, usesStoreRead, usesStoreStars,
  ]);

  const applyView = (v: SavedView) => {
    setActiveViewId(v.id);
    setScope(v.scope === 'mine' ? 'mine' : 'team');
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    onFilterChange(v.status);
  };
  const handleCreateView = (v: SavedView) => {
    setViews((prev) => [...prev, v]);
    applyView(v);
  };

  const allVisibleChecked = rows.length > 0 && rows.every((row) => checkedIds.has(row.id));
  const visibleCheckedIds = rows.filter((row) => checkedIds.has(row.id)).map((row) => row.id);

  const setChecked = (id: string, checked: boolean) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setConfirmBulkDelete(false);
  };

  const toggleAllVisible = (checked: boolean) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      rows.forEach((row) => checked ? next.add(row.id) : next.delete(row.id));
      return next;
    });
    setConfirmBulkDelete(false);
  };

  const handleToggleStar = (conv: Conversation) => {
    const next = !isStarred(conv);
    if (onToggleStar) onToggleStar(conv.id, next);
    else setStarredOverrides((current) => ({ ...current, [conv.id]: next }));
  };

  const handleBulkMarkRead = () => {
    if (!visibleCheckedIds.length) return;
    if (onBulkMarkRead) onBulkMarkRead(visibleCheckedIds);
    else setReadOverrides((current) => ({
      ...current,
      ...Object.fromEntries(visibleCheckedIds.map((id) => [id, false])),
    }));
    setCheckedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const handleBulkDelete = () => {
    if (!visibleCheckedIds.length) return;
    setDeletedIds((current) => new Set([...current, ...visibleCheckedIds]));
    onBulkDelete?.(visibleCheckedIds);
    setCheckedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const appliedFilterCount = Number(filters.channel !== 'any') + Number(filters.read !== 'any') + Number(filters.assignment !== 'any');

  return (
    <div className={cx('flex min-h-0 bg-surface', className)}>
      <ViewRail scope={effectiveScope} onScope={(s) => { setScope(s); setActiveViewId(null); }} onFocusSearch={() => document.getElementById('conv-search')?.focus()} />

      <div data-tour="conversations.list" className="flex min-h-0 w-72 flex-none flex-col border-r border-line">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
          <h2 className="text-[15px] font-bold text-ink">{effectiveScope === 'mine' ? 'My Inbox' : 'Team Inbox'}</h2>
          <div className="relative flex items-center gap-1">
            <button type="button" title="New message" aria-label="New message" onClick={onNewMessage} className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-sunken hover:text-ink">
              <PenSquare size={15} aria-hidden />
            </button>
            <button
              type="button"
              title="Filter"
              aria-label="Filter conversations"
              aria-expanded={filtersOpen}
              onClick={() => { setDraftFilters(filters); setFiltersOpen((open) => !open); setSortOpen(false); }}
              className={cx('relative grid h-7 w-7 place-items-center rounded-md hover:bg-surface-sunken', filtersOpen || appliedFilterCount ? 'text-brand' : 'text-ink-subtle hover:text-ink')}
            >
              <SlidersHorizontal size={15} aria-hidden />
              {appliedFilterCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand px-0.5 text-[8px] font-bold text-white">{appliedFilterCount}</span>}
            </button>
            <button
              type="button"
              title="Sort"
              aria-label="Sort conversations"
              aria-expanded={sortOpen}
              onClick={() => { setSortOpen((open) => !open); setFiltersOpen(false); }}
              className={cx('grid h-7 w-7 place-items-center rounded-md hover:bg-surface-sunken', sortOpen || sortMode !== 'latest' ? 'text-brand' : 'text-ink-subtle hover:text-ink')}
            >
              <ArrowDownUp size={15} aria-hidden />
            </button>

            {filtersOpen && (
              <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border border-line bg-surface p-3 shadow-xl" role="dialog" aria-label="Conversation filters">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">Filters</span>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="grid h-6 w-6 place-items-center rounded text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close filters"><X size={14} /></button>
                </div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                  Channel
                  <select value={draftFilters.channel} onChange={(e) => setDraftFilters((f) => ({ ...f, channel: e.target.value as InboxFilters['channel'] }))} className="mt-1 h-8 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium normal-case tracking-normal text-ink outline-none focus:border-brand">
                    <option value="any">Any channel</option>
                    {(Object.keys(CHANNEL_LABEL) as Conversation['channel'][]).map((channel) => <option key={channel} value={channel}>{CHANNEL_LABEL[channel]}</option>)}
                  </select>
                </label>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                  Status
                  <select value={draftFilters.read} onChange={(e) => setDraftFilters((f) => ({ ...f, read: e.target.value as ReadFilter }))} className="mt-1 h-8 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium normal-case tracking-normal text-ink outline-none focus:border-brand">
                    <option value="any">Read or unread</option><option value="unread">Unread</option><option value="read">Read</option>
                  </select>
                </label>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                  Assigned to
                  <select value={draftFilters.assignment} onChange={(e) => setDraftFilters((f) => ({ ...f, assignment: e.target.value as AssignmentFilter }))} className="mt-1 h-8 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium normal-case tracking-normal text-ink outline-none focus:border-brand">
                    <option value="any">Anyone</option><option value="mine">Me</option><option value="unassigned">Unassigned</option>
                  </select>
                </label>
                <div className="mt-3 flex justify-between border-t border-line pt-3">
                  <button type="button" onClick={() => { setDraftFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); }} className="text-xs font-semibold text-ink-muted hover:text-ink">Clear</button>
                  <button type="button" onClick={() => { setFilters(draftFilters); setFiltersOpen(false); }} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Apply filters</button>
                </div>
              </div>
            )}

            {sortOpen && (
              <div className="absolute right-0 top-9 z-30 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-xl" role="menu" aria-label="Sort conversations">
                <div className="border-b border-line px-3 py-2 text-xs font-bold text-ink">Sort by</div>
                {SORT_OPTIONS.map((option) => (
                  <button key={option.id} type="button" role="menuitemradio" aria-checked={sortMode === option.id} onClick={() => { setSortMode(option.id); setSortOpen(false); }} className={cx('flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-sunken', sortMode === option.id ? 'font-bold text-brand' : 'font-medium text-ink-muted')}>
                    {option.label}{sortMode === option.id && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            )}
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

        {/* Select all / bulk actions */}
        {visibleCheckedIds.length ? (
          <div className="flex min-h-10 shrink-0 items-center gap-1.5 border-b border-line bg-brand-soft/50 px-3 py-1.5">
            {confirmBulkDelete ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-bad">Delete {visibleCheckedIds.length} selected?</span>
                <button type="button" onClick={() => setConfirmBulkDelete(false)} className="rounded px-1.5 py-1 text-[11px] font-semibold text-ink-muted hover:bg-surface">Cancel</button>
                <button type="button" onClick={handleBulkDelete} className="rounded bg-bad px-2 py-1 text-[11px] font-bold text-white">Delete</button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-[11px] font-bold text-brand">{visibleCheckedIds.length} selected</span>
                <button type="button" onClick={handleBulkMarkRead} title="Mark selected as read" aria-label="Mark selected conversations as read" className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:bg-surface hover:text-brand"><MailOpen size={14} /></button>
                <button type="button" onClick={() => setConfirmBulkDelete(true)} title="Delete selected" aria-label="Delete selected conversations" className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:bg-surface hover:text-bad"><Trash2 size={14} /></button>
                <button type="button" onClick={() => setCheckedIds(new Set())} title="Clear selection" aria-label="Clear conversation selection" className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:bg-surface hover:text-ink"><X size={14} /></button>
              </>
            )}
          </div>
        ) : (
          <label className="flex min-h-10 shrink-0 items-center gap-2 border-b border-line px-4 py-2 text-[12px] font-medium text-ink-muted">
            <input type="checkbox" checked={allVisibleChecked} onChange={(e) => toggleAllVisible(e.target.checked)} className="h-3.5 w-3.5 rounded border-line text-brand" aria-label="Select all visible conversations" />
            Select all <span className="ml-auto text-[11px] font-normal text-ink-subtle">{rows.length}</span>
          </label>
        )}

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
                isChecked={checkedIds.has(conv.id)}
                isUnread={isUnread(conv)}
                isStarred={isStarred(conv)}
                onClick={() => onSelect(conv.id)}
                onCheck={(checked) => setChecked(conv.id, checked)}
                onToggleStar={() => handleToggleStar(conv)}
              />
            ))
          )}
        </div>
      </div>

      <CreateViewModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateView} />
    </div>
  );
}
