import { useState, useRef, useEffect } from 'react';
import {
  Menu, Search, Bell, RotateCcw, BookOpen,
  ChevronDown, X, User, LogOut, Settings, ChevronRight,
  Plus, UserPlus, Calendar, Briefcase, FileText, CheckSquare,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, initials } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

// --- close when clicking outside ---
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

const NOTIF_LABEL: Record<string, string> = {
  new_lead: 'Lead',
  missed_call: 'Call',
  appointment: 'Appt',
  payment: 'Payment',
  review: 'Review',
};

const DEMO_ACCOUNTS = [
  { id: 'a1', name: 'Acme Home Services (Demo)' },
  { id: 'a2', name: 'Sunset Dental (Demo)' },
  { id: 'a3', name: 'Peak Fitness Studio (Demo)' },
  { id: 'a4', name: 'Metro Law Group (Demo)' },
];

type ResultKind = 'Contact' | 'Deal' | 'Task' | 'Appointment';

interface SearchResult {
  kind: ResultKind;
  label: string;
  sub: string;
  path: string;
}

// Tailwind-safe class strings (no dynamic class construction)
const KIND_CLASSES: Record<ResultKind, string> = {
  Contact: 'bg-brand-soft text-brand',
  Deal:    'bg-[#e9faf3] text-[#12986b]',
  Task:    'bg-[#fff8e6] text-[#d99111]',
  Appointment: 'bg-[#fff0f0] text-[#d9363e]',
};

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const mode         = useStore((s) => s.mode);
  const setMode      = useStore((s) => s.setMode);
  const resetDemo    = useStore((s) => s.resetDemo);
  const notifications = useStore((s) => s.notifications);
  const markAllRead  = useStore((s) => s.markAllNotificationsRead);
  const pushToast    = useStore((s) => s.pushToast);
  const users        = useStore((s) => s.users);
  const contacts     = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const tasks        = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);
  const navigate     = useNavigate();

  const me     = users.find((u) => u.isCurrentUser) ?? users[0];
  const unread = notifications.filter((n) => !n.read).length;

  // -- dropdown open flags --
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [query,        setQuery]        = useState('');
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [acctOpen,     setAcctOpen]     = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // -- local selected account (cosmetic only) --
  const [selectedAcct, setSelectedAcct] = useState(DEMO_ACCOUNTS[0]);

  // -- refs for click-outside --
  const notifRef    = useRef<HTMLDivElement>(null);
  const acctRef     = useRef<HTMLDivElement>(null);
  const userRef     = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef,    () => setNotifOpen(false));
  useClickOutside(acctRef,     () => setAcctOpen(false));
  useClickOutside(userRef,     () => setUserOpen(false));
  useClickOutside(searchRef,   () => { setSearchOpen(false); setQuery(''); });
  useClickOutside(quickAddRef, () => setQuickAddOpen(false));

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  // -- Search: build grouped results --
  const q        = query.trim().toLowerCase();
  const hasQuery = q.length >= 2;

  const contactResults: SearchResult[] = hasQuery
    ? contacts
        .filter((c) =>
          `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q),
        )
        .slice(0, 4)
        .map((c) => ({
          kind: 'Contact' as const,
          label: `${c.firstName} ${c.lastName}`,
          sub: c.email,
          path: '/contacts',
        }))
    : [];

  const dealResults: SearchResult[] = hasQuery
    ? opportunities
        .filter((o) => o.name.toLowerCase().includes(q))
        .slice(0, 2)
        .map((o) => ({
          kind: 'Deal' as const,
          label: o.name,
          sub: `$${o.monetaryValue.toLocaleString()}`,
          path: '/opportunities',
        }))
    : [];

  const taskResults: SearchResult[] = hasQuery
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(q))
        .slice(0, 2)
        .map((t) => ({
          kind: 'Task' as const,
          label: t.title,
          sub: t.status === 'completed' ? 'Done' : `Due ${t.dueDate.slice(0, 10)}`,
          path: '/tasks',
        }))
    : [];

  const apptResults: SearchResult[] = hasQuery
    ? appointments
        .filter((a) => a.title.toLowerCase().includes(q))
        .slice(0, 2)
        .map((a) => ({
          kind: 'Appointment' as const,
          label: a.title,
          sub: new Date(a.startTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          path: '/calendars',
        }))
    : [];

  // Use `as const` on `kind` so TypeScript keeps the literal type through .filter()
  const grouped = [
    { kind: 'Contact'     as const, items: contactResults },
    { kind: 'Deal'        as const, items: dealResults    },
    { kind: 'Task'        as const, items: taskResults    },
    { kind: 'Appointment' as const, items: apptResults    },
  ].filter((g) => g.items.length > 0);

  const totalResults = grouped.reduce((acc, g) => acc + g.items.length, 0);

  // -- Quick-add menu items --
  const quickAddItems = [
    { label: 'Add Contact',        Icon: UserPlus,    path: '/contacts'     },
    { label: 'Book Appointment',   Icon: Calendar,    path: '/calendars'    },
    { label: 'Create Opportunity', Icon: Briefcase,   path: '/opportunities'},
    { label: 'Create Invoice',     Icon: FileText,    path: '/payments'     },
    { label: 'New Task',           Icon: CheckSquare, path: '/tasks'        },
  ] as const;

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4"
      data-tour="topbar"
    >
      {/* -- Mobile hamburger -- */}
      <button
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        data-tour="topbar.mobileNav"
      >
        <Menu size={20} />
      </button>

      {/* -- Account switcher -- */}
      <div className="relative" ref={acctRef}>
        <button
          onClick={() => setAcctOpen((v) => !v)}
          data-tour="topbar.accountSwitcher"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-surface-sunken"
          aria-haspopup="listbox"
          aria-expanded={acctOpen}
          aria-label="Switch account"
        >
          <span className="hidden max-w-[160px] truncate sm:block">{selectedAcct.name}</span>
          <ChevronDown
            size={14}
            className={cx(
              'shrink-0 text-ink-subtle transition-transform duration-150',
              acctOpen ? 'rotate-180' : '',
            )}
          />
        </button>

        {acctOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-line bg-surface shadow-pop"
            role="listbox"
            aria-label="Demo sub-accounts"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              Demo Sub-Accounts
            </p>
            {DEMO_ACCOUNTS.map((a) => {
              const isActive = a.id === selectedAcct.id;
              return (
                <button
                  key={a.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    if (!isActive) {
                      setSelectedAcct(a);
                      pushToast({
                        title: 'Account switched',
                        description: `Now viewing: ${a.name}`,
                        variant: 'info',
                      });
                    }
                    setAcctOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-sunken',
                    isActive ? 'font-semibold text-brand' : 'text-ink',
                  )}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: isActive ? '#1f6feb' : '#71849b' }}
                  >
                    {a.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  {isActive && (
                    <ChevronRight size={12} className="ml-auto shrink-0 text-brand" />
                  )}
                </button>
              );
            })}
            <p className="border-t border-line px-3 py-2 text-[10px] text-ink-subtle">
              Account switching is cosmetic in demo mode.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* -- Global search -- */}
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
          <div
            className="absolute right-0 top-0 w-80 rounded-xl border border-line bg-surface shadow-pop"
            data-tour="topbar.search"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={14} className="shrink-0 text-ink-subtle" />
              <input
                id="tbsearch"
                type="text"
                placeholder="Search contacts, deals, tasks…"
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

            {grouped.length > 0 && (
              <div
                className="border-t border-line py-1"
                role="listbox"
                aria-label="Search results"
              >
                {grouped.map((group) => (
                  <div key={group.kind}>
                    <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
                      {group.kind}s
                    </p>
                    {group.items.map((r, idx) => (
                      <button
                        key={idx}
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          navigate(r.path);
                          closeSearch();
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-sunken"
                      >
                        <span
                          className={cx(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                            KIND_CLASSES[r.kind],
                          )}
                        >
                          {r.kind}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {r.label}
                        </span>
                        <span className="shrink-0 text-xs text-ink-subtle">{r.sub}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {hasQuery && totalResults === 0 && (
              <p className="border-t border-line px-4 py-3 text-sm text-ink-subtle">
                No results for &ldquo;{query.trim()}&rdquo;.
              </p>
            )}
            {!hasQuery && (
              <p className="border-t border-line px-4 py-2.5 text-xs text-ink-subtle">
                Search contacts, deals, tasks &amp; appointments.
              </p>
            )}
          </div>
        )}
      </div>

      {/* -- Quick Add -- */}
      <div className="relative" ref={quickAddRef}>
        <button
          onClick={() => setQuickAddOpen((v) => !v)}
          data-tour="topbar.quickAdd"
          className="flex items-center justify-center rounded-lg bg-brand p-1.5 text-white hover:bg-brand/90"
          aria-label="Quick add"
          aria-haspopup="true"
          aria-expanded={quickAddOpen}
        >
          <Plus size={16} />
        </button>

        {quickAddOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
            role="menu"
            aria-label="Quick add actions"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              Quick Add
            </p>
            {quickAddItems.map(({ label, Icon, path }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigate(path);
                  pushToast({
                    title: label,
                    description: 'Creation is handled inside that module.',
                    variant: 'info',
                  });
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-surface-sunken"
              >
                <Icon size={15} className="shrink-0 text-ink-muted" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -- Mode toggle: Demo / Tutorial -- */}
      <div
        data-tour="topbar.modeToggle"
        className="hidden items-center rounded-lg border border-line bg-surface-sunken p-0.5 sm:flex"
        role="group"
        aria-label="App mode"
      >
        {(['demo', 'tutorial'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              pushToast({
                title: `${m === 'demo' ? 'Demo' : 'Tutorial'} mode`,
                description:
                  m === 'tutorial'
                    ? 'Follow the on-screen guides.'
                    : 'Explore the demo freely.',
                variant: 'info',
              });
            }}
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

      {/* -- Reset Demo -- */}
      <button
        onClick={resetDemo}
        data-tour="topbar.resetDemo"
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
        aria-label="Reset demo data"
      >
        <RotateCcw size={13} />
        <span className="hidden sm:block">Reset Demo</span>
      </button>

      {/* -- Guides launcher -- */}
      <button
        onClick={() => navigate('/guides')}
        data-tour="topbar.guides"
        className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        aria-label="Guides and tutorials"
      >
        <BookOpen size={18} />
      </button>

      {/* -- Notifications -- */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((v) => !v)}
          data-tour="topbar.notifications"
          className="relative flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[9px] font-bold leading-none text-white"
              aria-hidden="true"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
            role="dialog"
            aria-label="Notification center"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                Notifications
                {unread > 0 && (
                  <span className="rounded-full bg-bad px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-soft"
                    aria-label="Mark all notifications as read"
                  >
                    <Check size={11} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className="rounded p-0.5 text-ink-subtle hover:text-ink"
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
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
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span
                        className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                        style={{ backgroundColor: NOTIF_DOT[n.type] ?? '#71849b' }}
                      >
                        {NOTIF_LABEL[n.type] ?? n.type}
                      </span>
                      {!n.read && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-brand"
                          aria-label="Unread"
                        />
                      )}
                    </div>
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

      {/* -- User avatar / menu -- */}
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
            className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
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
              onClick={() => {
                setUserOpen(false);
                pushToast({
                  title: 'Profile',
                  description: 'Profile editing is not available in demo mode.',
                  variant: 'info',
                });
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
            >
              <User size={15} /> Profile
            </button>
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
              <BookOpen size={15} /> Guides &amp; Tutorials
            </button>

            <div className="border-t border-line">
              <button
                role="menuitem"
                onClick={() => {
                  setUserOpen(false);
                  pushToast({
                    title: 'Signed out (demo)',
                    description: 'This is a demo — no real sign-out occurs.',
                    variant: 'info',
                  });
                }}
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
