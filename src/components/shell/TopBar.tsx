import { useEffect, useRef, useState } from 'react';
import {
  Bell, BookOpen, Briefcase, Calendar, Check, CheckSquare, FileText,
  HelpCircle, LogOut, Megaphone, Menu, MessageCircleQuestion, Phone,
  Plus, RotateCcw, Search, Settings, Sparkles, User, UserPlus, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { kleegrTheme } from '@/theme/tokens';
import { cx, initials, relativeTime } from '@/utils';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) cb();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [ref, cb]);
}

const NOTIF_DOT: Record<string, string> = {
  new_lead: '#1f6feb', missed_call: '#d9363e', appointment: '#12986b',
  payment: '#12986b', review: '#d99111',
};
const NOTIF_LABEL: Record<string, string> = {
  new_lead: 'Lead', missed_call: 'Call', appointment: 'Appt',
  payment: 'Payment', review: 'Review',
};

type ResultKind = 'Contact' | 'Deal' | 'Task' | 'Appointment';
interface SearchResult { kind: ResultKind; label: string; sub: string; path: string }
const KIND_CLASSES: Record<ResultKind, string> = {
  Contact: 'bg-brand-soft text-brand',
  Deal: 'bg-[#e9faf3] text-[#12986b]',
  Task: 'bg-[#fff8e6] text-[#d99111]',
  Appointment: 'bg-[#fff0f0] text-[#d9363e]',
};

interface TopBarProps { onOpenMobileNav: () => void }

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const resetDemo = useStore((state) => state.resetDemo);
  const searchOpen = useStore((state) => state.searchOpen);
  const setSearchOpen = useStore((state) => state.setSearchOpen);
  const openDialer = useStore((state) => state.openDialer);
  const helpMode = useStore((state) => state.helpMode);
  const toggleHelpMode = useStore((state) => state.toggleHelpMode);
  const notifications = useStore((state) => state.notifications);
  const markAllRead = useStore((state) => state.markAllNotificationsRead);
  const pushToast = useStore((state) => state.pushToast);
  const users = useStore((state) => state.users);
  const contacts = useStore((state) => state.contacts);
  const opportunities = useStore((state) => state.opportunities);
  const tasks = useStore((state) => state.tasks);
  const appointments = useStore((state) => state.appointments);
  const navigate = useNavigate();

  const me = users.find((user) => user.isCurrentUser) ?? users[0];
  const unread = notifications.filter((notification) => !notification.read).length;
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
  const cosmetic = (title: string, description: string) =>
    pushToast({ title, description, variant: 'info' });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && searchOpen) {
        closeSearch();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => document.getElementById('tbsearch')?.focus(), 40);
  }, [searchOpen]);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length >= 2;
  const contactResults: SearchResult[] = hasQuery
    ? contacts.filter((contact) => `${contact.firstName} ${contact.lastName} ${contact.email}`.toLowerCase().includes(q)).slice(0, 4)
        .map((contact) => ({ kind: 'Contact', label: `${contact.firstName} ${contact.lastName}`, sub: contact.email, path: '/contacts' }))
    : [];
  const dealResults: SearchResult[] = hasQuery
    ? opportunities.filter((opportunity) => opportunity.name.toLowerCase().includes(q)).slice(0, 2)
        .map((opportunity) => ({ kind: 'Deal', label: opportunity.name, sub: `$${opportunity.monetaryValue.toLocaleString()}`, path: '/opportunities' }))
    : [];
  const taskResults: SearchResult[] = hasQuery
    ? tasks.filter((task) => task.title.toLowerCase().includes(q)).slice(0, 2)
        .map((task) => ({ kind: 'Task', label: task.title, sub: task.status === 'completed' ? 'Done' : `Due ${task.dueDate.slice(0, 10)}`, path: '/productivity' }))
    : [];
  const appointmentResults: SearchResult[] = hasQuery
    ? appointments.filter((appointment) => appointment.title.toLowerCase().includes(q)).slice(0, 2)
        .map((appointment) => ({
          kind: 'Appointment', label: appointment.title,
          sub: new Date(appointment.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          path: '/calendars',
        }))
    : [];
  const grouped = [
    { kind: 'Contact' as const, items: contactResults },
    { kind: 'Deal' as const, items: dealResults },
    { kind: 'Task' as const, items: taskResults },
    { kind: 'Appointment' as const, items: appointmentResults },
  ].filter((group) => group.items.length > 0);
  const totalResults = grouped.reduce((total, group) => total + group.items.length, 0);

  const quickAddItems = [
    { label: 'Add Contact', Icon: UserPlus, path: '/contacts' },
    { label: 'Book Appointment', Icon: Calendar, path: '/calendars' },
    { label: 'Create Opportunity', Icon: Briefcase, path: '/opportunities' },
    { label: 'Create Invoice', Icon: FileText, path: '/payments' },
    { label: 'New Task', Icon: CheckSquare, path: '/productivity' },
  ] as const;

  return (
    <>
      <header
        className="relative z-30 flex h-[50px] shrink-0 items-center overflow-visible bg-banner text-white"
        data-tour="topbar"
      >
        <button
          className="ml-2 grid h-8 w-8 place-items-center rounded-[4px] text-white/85 hover:bg-white/10 lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          data-tour="topbar.mobileNav"
        >
          <Menu size={19} />
        </button>
        <img src="/kleegr-logo.svg" alt="Kleegr" className="ml-2 h-5 w-auto lg:hidden" />

        <span className="ml-3 hidden rounded-[3px] border border-white/15 bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/65 lg:inline">
          Demo
        </span>

        <div className="min-w-4 flex-1" />

        <div className="relative flex h-full min-w-[190px] items-center justify-end pl-12 sm:min-w-[330px] lg:min-w-[390px]">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 right-0 bg-white"
            style={{ clipPath: 'polygon(42px 0, 100% 0, 100% 100%, 0 100%)' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[3px] right-0 bg-gradient-to-r from-banner-accent via-[#12b8df] to-[#1398d3]"
            style={{ clipPath: 'polygon(42px 0, 100% 0, 100% 100%, 0 100%)' }}
          />

          <div className="relative z-10 flex items-center gap-1.5 pr-3 sm:pr-4">
            <div className="relative" ref={quickAddRef}>
              <button
                onClick={() => setQuickAddOpen((open) => !open)}
                data-tour="topbar.quickAdd"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Quick add"
                aria-haspopup="true"
                aria-expanded={quickAddOpen}
              >
                <Plus size={17} />
              </button>
              {quickAddOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-pop" role="menu">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">Quick Add</p>
                  {quickAddItems.map(({ label, Icon, path }) => (
                    <button
                      key={label}
                      role="menuitem"
                      onClick={() => { setQuickAddOpen(false); navigate(path); cosmetic(label, 'Create it inside this section.'); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-surface-sunken"
                    >
                      <Icon size={15} className="text-ink-muted" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => openDialer()} data-tour="topbar.dialer" className="hidden h-8 w-8 place-items-center rounded-full bg-[#16a36f] text-white hover:bg-[#138c60] sm:grid" aria-label="Open dialer">
              <Phone size={15} />
            </button>
            <button onClick={() => cosmetic('Ask AI', 'AI assistance is limited in this public demo.')} className="hidden h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7d3fe4] to-[#6641c7] px-3 text-[11px] font-bold text-white shadow-sm sm:flex" aria-label="Ask AI">
              <Sparkles size={13} /><span className="hidden sm:inline">Ask AI</span>
            </button>
            <button onClick={() => cosmetic("What's new", 'Product updates are not available in demo mode.')} className="relative hidden h-8 w-8 place-items-center rounded-full bg-[#07999d] text-white hover:bg-[#087f84] md:grid" aria-label="What's new">
              <Megaphone size={15} />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-white/70" />
            </button>

            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen((open) => !open)} data-tour="topbar.notifications" className="relative grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/15" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} aria-haspopup="true" aria-expanded={notifOpen}>
                <Bell size={17} />
                {unread > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-0.5 text-[9px] font-bold">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-pop" role="dialog" aria-label="Notification center">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <h2 className="flex items-center gap-2 text-sm font-bold">Notifications {unread > 0 && <span className="rounded-full bg-bad px-1.5 py-0.5 text-[9px] text-white">{unread}</span>}</h2>
                    <div className="flex items-center gap-1">
                      {unread > 0 && <button onClick={markAllRead} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-soft"><Check size={11} /> Mark all read</button>}
                      <button onClick={() => setNotifOpen(false)} className="rounded p-0.5 text-ink-subtle hover:text-ink" aria-label="Close notifications"><X size={14} /></button>
                    </div>
                  </div>
                  <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                    {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-subtle">No notifications.</li>}
                    {notifications.map((notification) => (
                      <li key={notification.id} className={cx('flex items-start gap-3 px-4 py-3 text-sm', !notification.read && 'bg-brand-soft/40')}>
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: NOTIF_DOT[notification.type] ?? '#71849b' }} />
                        <div className="min-w-0 flex-1">
                          <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: NOTIF_DOT[notification.type] ?? '#71849b' }}>{NOTIF_LABEL[notification.type] ?? notification.type}</span>
                          <p className="mt-1 font-semibold">{notification.title}</p>
                          <p className="text-ink-muted">{notification.body}</p>
                          <p className="mt-0.5 text-[11px] text-ink-subtle">{relativeTime(notification.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button onClick={toggleHelpMode} className={cx('hidden h-8 w-8 place-items-center rounded-full transition-colors md:grid', helpMode ? 'bg-white/25 ring-1 ring-white/40' : 'hover:bg-white/15')} aria-label="Toggle help mode" aria-pressed={helpMode}>
              <MessageCircleQuestion size={17} />
            </button>
            <button onClick={() => navigate('/guides')} data-tour="topbar.guides" className="hidden h-8 w-8 place-items-center rounded-full hover:bg-white/15 lg:grid" aria-label="Guides and help"><HelpCircle size={17} /></button>

            <div className="relative" ref={userRef}>
              <button onClick={() => setUserOpen((open) => !open)} data-tour="topbar.userMenu" className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-white/35" style={{ backgroundColor: me?.avatarColor ?? '#1f6feb' }} aria-label="User menu" aria-haspopup="true" aria-expanded={userOpen}>
                {me ? initials(me.name.split(' ')[0], me.name.split(' ')[1]) : '?'}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-pop" role="menu">
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold">{me?.name ?? 'Demo User'}</p>
                    <p className="text-xs text-ink-muted">{me?.email ?? ''}</p>
                    <span className="mt-1 inline-block rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">{kleegrTheme.brandName} · {me?.role ?? 'admin'}</span>
                  </div>
                  <button role="menuitem" onClick={() => { setUserOpen(false); cosmetic('Profile', 'Profile editing is not available in demo mode.'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-sunken"><User size={15} /> Profile</button>
                  <button role="menuitem" onClick={() => { navigate('/settings'); setUserOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-sunken"><Settings size={15} /> Settings</button>
                  <button role="menuitem" onClick={() => { navigate('/guides'); setUserOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-sunken"><BookOpen size={15} /> Guides &amp; Tutorials</button>
                  <div className="border-t border-line py-1">
                    <p className="px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Demo tools</p>
                    <button role="menuitem" data-tour="topbar.modeToggle" onClick={() => { setMode(mode === 'demo' ? 'tutorial' : 'demo'); setUserOpen(false); if (mode === 'demo') navigate('/guides'); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surface-sunken"><Sparkles size={15} /> {mode === 'demo' ? 'Tutorial mode' : 'Exit tutorial mode'}</button>
                    <button role="menuitem" data-tour="topbar.resetDemo" onClick={() => { resetDemo(); setUserOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surface-sunken"><RotateCcw size={15} /> Reset demo data</button>
                  </div>
                  <div className="border-t border-line">
                    <button role="menuitem" onClick={() => { setUserOpen(false); cosmetic('Signed out (demo)', 'No real account is connected to this demo.'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-sunken"><LogOut size={15} /> Sign Out (Demo)</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh]" onMouseDown={closeSearch}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Search size={16} className="shrink-0 text-ink-subtle" />
              <input id="tbsearch" type="text" placeholder="Search contacts, deals, tasks & appointments…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle" aria-label="Search" />
              <button onClick={closeSearch} className="rounded p-0.5 text-ink-subtle hover:text-ink" aria-label="Close search"><X size={16} /></button>
            </div>
            {grouped.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto py-1" role="listbox" aria-label="Search results">
                {grouped.map((group) => (
                  <div key={group.kind}>
                    <p className="px-4 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">{group.kind}s</p>
                    {group.items.map((result) => (
                      <button key={`${result.kind}-${result.label}`} role="option" aria-selected={false} onClick={() => { navigate(result.path); closeSearch(); }} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-sunken">
                        <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold', KIND_CLASSES[result.kind])}>{result.kind}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{result.label}</span>
                        <span className="shrink-0 text-xs text-ink-subtle">{result.sub}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {hasQuery && totalResults === 0 && <p className="px-4 py-4 text-sm text-ink-subtle">No results for &ldquo;{query.trim()}&rdquo;.</p>}
            {!hasQuery && <p className="px-4 py-3 text-xs text-ink-subtle">Type at least 2 characters to search contacts, deals, tasks &amp; appointments.</p>}
          </div>
        </div>
      )}
    </>
  );
}
