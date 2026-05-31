import { useState, useRef, useEffect } from 'react';
import {
  Menu, Search, Bell, RotateCcw, X, User, LogOut, Settings,
  Plus, UserPlus, Calendar, Briefcase, FileText, CheckSquare, Check,
  Phone, Sparkles, Megaphone, HelpCircle, BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cx, relativeTime, initials } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
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
  new_lead: 'Lead', missed_call: 'Call', appointment: 'Appt', payment: 'Payment', review: 'Review',
};

type ResultKind = 'Contact' | 'Deal' | 'Task' | 'Appointment';
interface SearchResult { kind: ResultKind; label: string; sub: string; path: string; }
const KIND_CLASSES: Record<ResultKind, string> = {
  Contact: 'bg-brand-soft text-brand',
  Deal: 'bg-[#e9faf3] text-[#12986b]',
  Task: 'bg-[#fff8e6] text-[#d99111]',
  Appointment: 'bg-[#fff0f0] text-[#d9363e]',
};

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const resetDemo = useStore((s) => s.resetDemo);
  const searchOpen = useStore((s) => s.searchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const openDialer = useStore((s) => s.openDialer);
  const notifications = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const pushToast = useStore((s) => s.pushToast);
  const users = useStore((s) => s.users);
  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const tasks = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);
  const navigate = useNavigate();

  const me = users.find((u) => u.isCurrentUser) ?? users[0];
  const unread = notifications.filter((n) => !n.read).length;

  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));
  useClickOutside(quickAddRef, () => setQuickAddOpen(false));

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  // ⌘K / Ctrl+K opens search; Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && searchOpen) {
        closeSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchOpen) setTimeout(() => document.getElementById('tbsearch')?.focus(), 40);
  }, [searchOpen]);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length >= 2;

  const contactResults: SearchResult[] = hasQuery
    ? contacts.filter((c) => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q)).slice(0, 4)
        .map((c) => ({ kind: 'Contact' as const, label: `${c.firstName} ${c.lastName}`, sub: c.email, path: '/contacts' }))
    : [];
  const dealResults: SearchResult[] = hasQuery
    ? opportunities.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 2)
        .map((o) => ({ kind: 'Deal' as const, label: o.name, sub: `$${o.monetaryValue.toLocaleString()}`, path: '/opportunities' }))
    : [];
  const taskResults: SearchResult[] = hasQuery
    ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 2)
        .map((t) => ({ kind: 'Task' as const, label: t.title, sub: t.status === 'completed' ? 'Done' : `Due ${t.dueDate.slice(0, 10)}`, path: '/tasks' }))
    : [];
  const apptResults: SearchResult[] = hasQuery
    ? appointments.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 2)
        .map((a) => ({ kind: 'Appointment' as const, label: a.title, sub: new Date(a.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), path: '/calendars' }))
    : [];

  const grouped = [
    { kind: 'Contact' as const, items: contactResults },
    { kind: 'Deal' as const, items: dealResults },
    { kind: 'Task' as const, items: taskResults },
    { kind: 'Appointment' as const, items: apptResults },
  ].filter((g) => g.items.length > 0);
  const totalResults = grouped.reduce((acc, g) => acc + g.items.length, 0);

  const quickAddItems = [
    { label: 'Add Contact', Icon: UserPlus, path: '/contacts' },
    { label: 'Book Appointment', Icon: Calendar, path: '/calendars' },
    { label: 'Create Opportunity', Icon: Briefcase, path: '/opportunities' },
    { label: 'Create Invoice', Icon: FileText, path: '/payments' },
    { label: 'New Task', Icon: CheckSquare, path: '/tasks' },
  ] as const;

  const cosmetic = (title: string, description: string) =>
    pushToast({ title, description, variant: 'info' });

  return (
    <>
      <header
        className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface pl-3 pr-0 sm:pl-4"
        data-tour="topbar"
      >
        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          data-tour="topbar.mobileNav"
        >
          <Menu size={20} />
        </button>

        {/* Left: demo chrome */}
        <div className="flex items-center gap-2">
          <div
            data-tour="topbar.modeToggle"
            className="hidden items-center rounded-lg bg-surface-sunken p-0.5 sm:flex"
            role="group"
            aria-label="App mode"
          >
            {(['demo', 'tutorial'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (m === 'tutorial') {
                    navigate('/guides');
                    cosmetic('Tutorial mode', 'Pick a guide below to start a walkthrough.');
                  } else {
                    cosmetic('Demo mode', 'Explore the demo freely.');
                  }
                }}
                className={cx(
                  'rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
                  mode === m ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-ink-subtle hover:text-ink-muted',
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
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink-muted"
            aria-label="Reset demo data"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:block">Reset Demo</span>
          </button>

          {/* Quick add */}
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => setQuickAddOpen((v) => !v)}
              data-tour="topbar.quickAdd"
              className="flex items-center justify-center rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink-muted"
              aria-label="Quick add"
              aria-haspopup="true"
              aria-expanded={quickAddOpen}
            >
              <Plus size={16} />
            </button>
            {quickAddOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop" role="menu">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">Quick Add</p>
                {quickAddItems.map(({ label, Icon, path }) => (
                  <button
                    key={label}
                    role="menuitem"
                    onClick={() => { setQuickAddOpen(false); navigate(path); cosmetic(label, 'Creation is handled inside that module.'); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-surface-sunken"
                  >
                    <Icon size={15} className="shrink-0 text-ink-muted" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Right: dark banner with diagonal cyan accent + action cluster */}
        <div className="relative flex h-full items-center self-stretch">
          {/* dark trapezoid background, bleeds to the right edge */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 left-9 bg-banner"
            style={{ clipPath: 'polygon(36px 0, 100% 0, 100% 100%, 0 100%)' }}
          />
          {/* cyan accent slice */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-9 w-12 bg-banner-accent/80"
            style={{ clipPath: 'polygon(36px 0, 52px 0, 16px 100%, 0 100%)' }}
          />
          <div className="relative z-10 flex items-center gap-1.5 pl-12 pr-3 sm:pr-4">
            {/* Phone (cosmetic) */}
            <button
              onClick={() => openDialer()}
              data-tour="topbar.dialer"
              className="grid h-8 w-8 place-items-center rounded-full bg-good text-white transition-transform hover:scale-105"
              aria-label="Open dialer"
            >
              <Phone size={15} />
            </button>

            {/* Ask AI pill (cosmetic) */}
            <button
              onClick={() => cosmetic('Ask AI', 'AI assistant is not available in demo mode.')}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.03]"
              aria-label="Ask AI"
            >
              <Sparkles size={14} />
              <span className="hidden sm:block">Ask AI</span>
            </button>

            {/* What's new (cosmetic) */}
            <button
              onClick={() => cosmetic("What's new", 'Product updates are not available in demo mode.')}
              className="relative grid h-8 w-8 place-items-center rounded-full bg-[#0ea5a3] text-white transition-transform hover:scale-105"
              aria-label="What's new"
            >
              <Megaphone size={15} />
              <span
                aria-hidden="true"
                className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-banner"
              />
            </button>

            {/* Notifications (functional) */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                data-tour="topbar.notifications"
                className="relative grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/10"
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                aria-haspopup="true"
                aria-expanded={notifOpen}
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[9px] font-bold leading-none text-white" aria-hidden="true">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-pop" role="dialog" aria-label="Notification center">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                      Notifications
                      {unread > 0 && <span className="rounded-full bg-bad px-1.5 py-0.5 text-[9px] font-semibold text-white">{unread}</span>}
                    </h2>
                    <div className="flex items-center gap-1">
                      {unread > 0 && (
                        <button onClick={() => markAllRead()} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-soft" aria-label="Mark all notifications as read">
                          <Check size={11} /> Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="rounded p-0.5 text-ink-subtle hover:text-ink" aria-label="Close notifications">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-80 divide-y divide-line overflow-y-auto" role="list">
                    {notifications.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-ink-subtle">No notifications.</li>
                    )}
                    {notifications.map((n) => (
                      <li key={n.id} className={cx('flex items-start gap-3 px-4 py-3 text-sm', !n.read ? 'bg-brand-soft/40' : '')}>
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: NOTIF_DOT[n.type] ?? '#71849b' }} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: NOTIF_DOT[n.type] ?? '#71849b' }}>
                              {NOTIF_LABEL[n.type] ?? n.type}
                            </span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />}
                          </div>
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

            {/* Help → guides */}
            <button
              onClick={() => navigate('/guides')}
              data-tour="topbar.guides"
              className="grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/10"
              aria-label="Guides and help"
            >
              <HelpCircle size={17} />
            </button>

            {/* User avatar / menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                data-tour="topbar.userMenu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/20"
                style={{ backgroundColor: me?.avatarColor ?? '#1f6feb' }}
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={userOpen}
              >
                {me ? initials(me.name.split(' ')[0], me.name.split(' ')[1]) : '?'}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-pop" role="menu">
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{me?.name ?? 'Demo User'}</p>
                    <p className="text-xs text-ink-muted">{me?.email ?? ''}</p>
                    <span className="mt-1 inline-block rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      {kleegrTheme.brandName} &middot; {me?.role ?? 'admin'}
                    </span>
                  </div>
                  <button role="menuitem" onClick={() => { setUserOpen(false); cosmetic('Profile', 'Profile editing is not available in demo mode.'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken">
                    <User size={15} /> Profile
                  </button>
                  <button role="menuitem" onClick={() => { navigate('/settings'); setUserOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken">
                    <Settings size={15} /> Settings
                  </button>
                  <button role="menuitem" onClick={() => { navigate('/guides'); setUserOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken">
                    <BookOpen size={15} /> Guides &amp; Tutorials
                  </button>
                  <div className="border-t border-line">
                    <button role="menuitem" onClick={() => { setUserOpen(false); cosmetic('Signed out (demo)', 'This is a demo — no real sign-out occurs.'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-sunken">
                      <LogOut size={15} /> Sign Out (Demo)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global search — command palette (triggered from the sidebar) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh]" onMouseDown={closeSearch}>
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-pop"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Search size={16} className="shrink-0 text-ink-subtle" />
              <input
                id="tbsearch"
                type="text"
                placeholder="Search contacts, deals, tasks &amp; appointments…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                aria-label="Search"
              />
              <button onClick={closeSearch} className="rounded p-0.5 text-ink-subtle hover:text-ink" aria-label="Close search">
                <X size={16} />
              </button>
            </div>

            {grouped.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto py-1" role="listbox" aria-label="Search results">
                {grouped.map((group) => (
                  <div key={group.kind}>
                    <p className="px-4 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">{group.kind}s</p>
                    {group.items.map((r, idx) => (
                      <button
                        key={idx}
                        role="option"
                        aria-selected={false}
                        onClick={() => { navigate(r.path); closeSearch(); }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-sunken"
                      >
                        <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', KIND_CLASSES[r.kind])}>{r.kind}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.label}</span>
                        <span className="shrink-0 text-xs text-ink-subtle">{r.sub}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {hasQuery && totalResults === 0 && (
              <p className="px-4 py-4 text-sm text-ink-subtle">No results for &ldquo;{query.trim()}&rdquo;.</p>
            )}
            {!hasQuery && (
              <p className="px-4 py-3 text-xs text-ink-subtle">Type at least 2 characters to search contacts, deals, tasks &amp; appointments.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
