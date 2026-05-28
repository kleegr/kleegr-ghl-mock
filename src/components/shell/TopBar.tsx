import { useState, useRef, useEffect } from 'react';
import {
  Menu, Search, Bell, RotateCcw, BookOpen,
  ChevronDown, X, User, LogOut, Settings, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, initials } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

// ─── close when clicking outside ───
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void,
) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

const NOTIF_DOT: Record<string, string> = {
  new_lead: '#1f6feb',
  missed_call: '#d9363e',
  appointment: '#12986b',
  payment: '#12986b',
  review: '#d99111',
};

const DEMO_ACCOUNTS = [
  { id: 'a1', name: 'Acme Home Services (Demo)' },
  { id: 'a2', name: 'Sunset Dental (Demo)' },
  { id: 'a3', name: 'Peak Fitness Studio (Demo)' },
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
  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const navigate = useNavigate();

  const me = users.find((u) => u.isCurrentUser) ?? users[0];
  const unread = notifications.filter((n) => !n.read).length;

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const acctRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(acctRef, () => setAcctOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  const results =
    query.trim().length >= 2
      ? [
          ...contacts
            .filter((c) =>
              `${c.firstName} ${c.lastName} ${c.email}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 4)
            .map((c) => ({
              kind: 'Contact',
              label: `${c.firstName} ${c.lastName}`,
              sub: c.email,
              path: '/contacts',
            })),
          ...opportunities
            .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 2)
            .map((o) => ({
              kind: 'Deal',
              label: o.name,
              sub: `$${o.monetaryValue.toLocaleString()}`,
              path: '/opportunities',
            })),
        ].slice(0, 6)
      : [];

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4"
      data-tour="topbar"
    >
      {/* Mobile hamburger */}
      <button
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Account switcher */}
      <div className="relative" ref={acctRef}>
        <button
          onClick={() => setAcctOpen((v) => !v)}
          data-tour="topbar.accountSwitcher"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-surface-sunken"
          aria-haspopup="listbox"
          aria-expanded={acctOpen}
          aria-label="Switch account"
        >
          <span className="hidden max-w-[160px] truncate sm:block">{DEMO_ACCOUNTS[0].name}</span>
          <ChevronDown size={14} className="shrink-0 text-ink-subtle" />
        </button>

        {acctOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-line bg-surface shadow-pop"
            role="listbox"
            aria-label="Demo accounts"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              Demo Accounts
            </p>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                role="option"
                aria-selected={a.id === 'a1'}
                onClick={() => setAcctOpen(false)}
                className={cx(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-sunken',
                  a.id === 'a1' ? 'font-semibold text-brand' : 'text-ink',
                )}
              >
                {a.name}
                {a.id === 'a1' && (
                  <ChevronRight size={12} className="ml-auto text-brand" />
                )}
              </button>
            ))}
            <p className="border-t border-line px-3 py-2 text-[10px] text-ink-subtle">
              Account switching is cosmetic in demo mode.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Global search */}
      <div className="relative" ref={searchRef}>
        {!searchOpen ? (
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(
                () => document.getElementById('tbsearch')?.focus(),
                40,
              );
            }}
            data-tour="topbar.search"
            className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-muted hover:border-brand/40 hover:text-ink"
            aria-label="Search"
          >
            <Search size={14} />
            <span className="hidden sm:block">Search…</span>
            <kbd className="hidden rounded bg-surface-sunken px-1 text-[10px] sm:block">⌘K</kbd>
          </button>
        ) : (
          <div className="absolute right-0 top-0 w-80 rounded-xl border border-line bg-surface shadow-pop">
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={14} className="shrink-0 text-ink-subtle" />
              <input
                id="tbsearch"
                type="text"
                placeholder="Search contacts, deals…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                aria-label="Search"
              />
              <button
                onClick={closeSearch}
                className="rounded p-0.5 text-ink-subtle hover:text-ink"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>

            {results.length > 0 && (
              <ul
                className="border-t border-line py-1"
                role="listbox"
                aria-label="Search results"
              >
                {results.map((r, idx) => (
                  <li key={idx}>
                    <button
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        navigate(r.path);
                        closeSearch();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-sunken"
                    >
                      <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        {r.kind}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.label}</span>
                      <span className="text-xs text-ink-subtle">{r.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <p className="border-t border-line px-4 py-3 text-sm text-ink-subtle">
                No results found.
              </p>
            )}
            {query.trim().length < 2 && (
              <p className="border-t border-line px-4 py-2.5 text-xs text-ink-subtle">
                Type at least 2 characters…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle: Demo / Tutorial */}
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

      {/* Reset Demo */}
      <button
        onClick={resetDemo}
        data-tour="topbar.resetDemo"
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
        aria-label="Reset demo data"
      >
        <RotateCcw size={13} />
        <span className="hidden sm:block">Reset Demo</span>
      </button>

      {/* Guides launcher */}
      <button
        onClick={() => navigate('/guides')}
        data-tour="topbar.guides"
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        aria-label="Guides and tutorials"
      >
        <BookOpen size={18} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            const opening = !notifOpen;
            setNotifOpen(opening);
            if (opening) markAllRead();
          }}
          data-tour="topbar.notifications"
          className="relative flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-bad"
              aria-hidden="true"
            />
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
              <button
                onClick={() => setNotifOpen(false)}
                className="rounded p-0.5 text-ink-subtle hover:text-ink"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
            <ul
              className="max-h-80 divide-y divide-line overflow-y-auto"
              role="list"
            >
              {notifications.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-subtle">
                  No notifications.
                </li>
              )}
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cx(
                    'flex items-start gap-3 px-4 py-3 text-sm',
                    !n.read ? 'bg-brand-soft/40' : '',
                  )}
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: NOTIF_DOT[n.type] ?? '#71849b' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{n.title}</p>
                    <p className="text-ink-muted">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* User avatar / menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserOpen((v) => !v)}
          data-tour="topbar.userMenu"
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: me?.avatarColor ?? '#1f6feb' }}
          aria-label="User menu"
          aria-haspopup="true"
          aria-expanded={userOpen}
        >
          {me
            ? initials(me.name.split(' ')[0], me.name.split(' ')[1])
            : '?'}
        </button>

        {userOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
            role="menu"
            aria-label="User menu"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">{me?.name ?? 'Demo User'}</p>
              <p className="text-xs text-ink-muted">{me?.email ?? ''}</p>
              <span className="mt-1 inline-block rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                {kleegrTheme.brandName} &middot; {me?.role ?? 'admin'}
              </span>
            </div>

            <button
              role="menuitem"
              onClick={() => { navigate('/settings'); setUserOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <Settings size={15} /> Settings
            </button>
            <button
              role="menuitem"
              onClick={() => { navigate('/guides'); setUserOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <User size={15} /> Guides &amp; Tutorials
            </button>

            <div className="border-t border-line">
              <button
                role="menuitem"
                onClick={() => { setUserOpen(false); resetDemo(); }}
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
