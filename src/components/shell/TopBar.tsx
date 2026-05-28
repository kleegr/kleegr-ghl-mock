import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  RotateCcw,
  BookOpen,
  ChevronDown,
  X,
  User,
  LogOut,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, initials } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

const notifColor: Record<string, string> = {
  new_lead: 'text-brand',
  missed_call: 'text-bad',
  appointment: 'text-good',
  payment: 'text-good',
  review: 'text-warn',
};

const FAKE_ACCOUNTS = [
  { id: 'demo-main', name: 'Acme Home Services (Demo)' },
  { id: 'demo-alt1', name: 'Sunset Dental (Demo)' },
  { id: 'demo-alt2', name: 'Peak Fitness Studio (Demo)' },
];

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const resetDemo = useStore((s) => s.resetDemo);
  const notifications = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const users = useStore((s) => s.users);
  const navigate = useNavigate();

  const currentUser = users.find((u) => u.isCurrentUser) ?? users[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(accountRef, () => setAccountOpen(false));
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const conversations = useStore((s) => s.conversations);

  const searchResults =
    searchQuery.trim().length >= 2
      ? [
          ...contacts
            .filter((c) =>
              `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .slice(0, 3)
            .map((c) => ({ type: 'Contact' as const, label: `${c.firstName} ${c.lastName}`, sub: c.email, path: `/contacts` })),
          ...opportunities
            .filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 2)
            .map((o) => ({ type: 'Opportunity' as const, label: o.name, sub: `$${o.monetaryValue.toLocaleString()}`, path: `/opportunities` })),
          ...conversations
            .slice(0, 2)
            .map((c) => ({ type: 'Conversation' as const, label: `Conversation #${c.id.slice(-4)}`, sub: c.channel, path: `/conversations` })),
        ].slice(0, 6)
      : [];

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4"
      data-tour="topbar"
    >
      <button
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="relative" ref={accountRef}>
        <button
          onClick={() => setAccountOpen((v) => !v)}
          data-tour="topbar.accountSwitcher"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-surface-sunken"
          aria-label="Switch account"
          aria-haspopup="listbox"
          aria-expanded={accountOpen}
        >
          <span className="hidden max-w-[160px] truncate sm:block">{FAKE_ACCOUNTS[0].name}</span>
          <ChevronDown size={14} className="shrink-0 text-ink-subtle" />
        </button>
        {accountOpen && (
          <div
            role="listbox"
            aria-label="Demo accounts"
            className="absolute left-0 top-full mt-1 w-60 rounded-xl border border-line bg-surface shadow-pop"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              Demo Accounts
            </p>
            {FAKE_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                role="option"
                aria-selected={acc.id === 'demo-main'}
                onClick={() => setAccountOpen(false)}
                className={cx(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-sunken',
                  acc.id === 'demo-main' ? 'font-semibold text-brand' : 'text-ink',
                )}
              >
                {acc.name}
                {acc.id === 'demo-main' && <ChevronRight size={13} className="ml-auto text-brand" />}
              </button>
            ))}
            <p className="border-t border-line px-3 py-2 text-[10px] text-ink-subtle">
              Account switching is cosmetic in demo mode.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="relative" ref={searchRef}>
        <button
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => document.getElementById('topbar-search')?.focus(), 50);
          }}
          data-tour="topbar.search"
          className={cx(
            'flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-muted hover:border-brand/40 hover:text-ink',
            searchOpen ? 'hidden' : 'flex',
          )}
          aria-label="Search"
        >
          <Search size={14} />
          <span className="hidden sm:block">Search&hellip;</span>
          <kbd className="hidden rounded bg-surface-sunken px-1 text-[10px] sm:block">⌘K</kbd>
        </button>

        {searchOpen && (
          <div className="absolute right-0 top-0 w-80 rounded-xl border border-line bg-surface shadow-pop">
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={14} className="shrink-0 text-ink-subtle" />
              <input
                id="topbar-search"
                type="text"
                placeholder="Search contacts, deals, conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none"
                aria-label="Search"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="rounded p-0.5 text-ink-subtle hover:text-ink"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="border-t border-line py-1" role="listbox" aria-label="Search results">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      role="option"
                      aria-selected={false}
                      onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery(''); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-sunken"
                    >
                      <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        {r.type}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.label}</span>
                      <span className="text-xs text-ink-subtle">{r.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="border-t border-line px-4 py-3 text-sm text-ink-subtle">No results found.</p>
            )}
            {searchQuery.trim().length < 2 && (
              <p className="border-t border-line px-4 py-2.5 text-xs text-ink-subtle">
                Type at least 2 characters to search.
              </p>
            )}
          </div>
        )}
      </div>

      <div
        data-tour="topbar.modeToggle"
        className="hidden items-center rounded-lg border border-line bg-surface-sunken p-0.5 sm:flex"
        role="group"
        aria-label="App mode"
      >
        {(['demo', 'tutorial'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cx(
              'rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
              mode === m
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-muted hover:text-ink',
            )}
            aria-pressed={mode === m}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={resetDemo}
        data-tour="topbar.resetDemo"
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
        aria-label="Reset demo data"
      >
        <RotateCcw size={13} />
        <span className="hidden sm:block">Reset Demo</span>
      </button>

      <button
        onClick={() => navigate('/guides')}
        data-tour="topbar.guides"
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        aria-label="Guides and tutorials"
      >
        <BookOpen size={18} />
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markAllRead(); }}
          data-tour="topbar.notifications"
          className="relative flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-bad text-[8px] font-bold text-white" />
          )}
        </button>

        {notifOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
            role="dialog"
            aria-label="Notification center"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="text-sm font-bold text-ink">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="rounded p-0.5 text-ink-subtle hover:text-ink" aria-label="Close notifications">
                <X size={14} />
              </button>
            </div>
            <ul className="max-h-80 divide-y divide-line overflow-y-auto" role="list">
              {notifications.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-subtle">No notifications.</li>
              )}
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cx('flex items-start gap-3 px-4 py-3 text-sm', !n.read ? 'bg-brand-soft/40' : '')}
                >
                  <span
                    className={cx('mt-0.5 h-2 w-2 shrink-0 rounded-full', notifColor[n.type] ?? 'text-ink-subtle')}
                    style={{ backgroundColor: 'currentColor' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{n.title}</p>
                    <p className="text-ink-muted">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">{relativeTime(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          data-tour="topbar.userMenu"
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: currentUser?.avatarColor ?? '#1f6feb' }}
          aria-label="User menu"
          aria-haspopup="true"
          aria-expanded={userMenuOpen}
        >
          {currentUser ? initials(currentUser.name.split(' ')[0], currentUser.name.split(' ')[1]) : '??'}
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
            role="menu"
            aria-label="User menu"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">{currentUser?.name ?? 'Demo User'}</p>
              <p className="text-xs text-ink-muted">{currentUser?.email ?? ''}</p>
              <span className="mt-1 inline-block rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                {kleegrTheme.brandName} {currentUser?.role ?? 'admin'}
              </span>
            </div>
            <button
              role="menuitem"
              onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <Settings size={15} /> Settings
            </button>
            <button
              role="menuitem"
              onClick={() => { navigate('/guides'); setUserMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <User size={15} /> Guides &amp; Tutorials
            </button>
            <div className="border-t border-line">
              <button
                role="menuitem"
                onClick={() => { setUserMenuOpen(false); resetDemo(); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-sunken"
              >
                <LogOut size={15} /> Sign Out (Demo)
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
