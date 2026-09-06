import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronsUpDown, Building2, Search, Zap, Check,
} from 'lucide-react';
import { NAV, SETTINGS_NAV } from './nav';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

/**
 * Expanded-sidebar wordmark. We render the in-repo vector wordmark
 * (public/kleegr-logo-white.svg) directly rather than hotlinking the hosted
 * raster master: a committed asset is reliable, renders offline, and never
 * leaves a broken logo if the remote storage URL changes or is unreachable.
 * Collapsed rail uses the square mark (public/kleegr-mark-white.svg).
 */
const KLEEGR_WORDMARK = '/kleegr-logo.svg';

/** Single demo sub-account. The live portal can list many locations; the demo
 *  intentionally surfaces only the current one so the switcher stays clean. */
const DEMO_ACCOUNTS = [
  { id: 'a1', name: 'Kleegr Demo Account', region: 'Demo Business' },
];

interface SidebarProps {
  /** Called after a nav item is clicked — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const pushToast = useStore((s) => s.pushToast);

  const [acctOpen, setAcctOpen] = useState(false);
  const [selectedAcct, setSelectedAcct] = useState(DEMO_ACCOUNTS[0]);
  const acctRef = useRef<HTMLDivElement>(null);
  useClickOutside(acctRef, () => setAcctOpen(false));

  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden border-r border-white/10 text-white transition-[width] duration-200',
        'bg-sidebar bg-gradient-to-b from-[rgb(var(--sidebar-from))] via-[rgb(var(--sidebar-via))] to-[rgb(var(--sidebar-to))]',
        collapsed ? 'w-14' : 'w-56',
      )}
      aria-label="Sidebar"
      data-tour="sidebar.nav"
    >
      {/* Wordmark */}
      <div
        className={cx(
          'relative flex h-16 shrink-0 items-center',
          collapsed ? 'justify-center px-0' : 'px-3.5',
        )}
      >
        {collapsed ? (
          <img
            src="/kleegr-mark-white.svg"
            alt="Kleegr"
            className="h-6 w-6 select-none"
            draggable={false}
          />
        ) : (
          <img
            src={KLEEGR_WORDMARK}
            alt="Kleegr"
            className="h-[27px] w-auto max-w-[128px] select-none object-contain object-left"
            draggable={false}
            onError={(e) => {
              // Fall back to the in-repo square mark if the wordmark fails.
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/kleegr-mark-white.svg';
            }}
          />
        )}
        <button
          onClick={toggleSidebar}
          data-tour="nav.collapseToggle"
          className={cx(
            'absolute right-2 hidden h-7 w-7 items-center justify-center rounded text-white/65 hover:bg-white/10 hover:text-white lg:flex',
            collapsed && 'right-1/2 translate-x-1/2 translate-y-9 bg-white/10',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Account switcher + search (expanded only) */}
      {!collapsed && (
        <div className="space-y-1.5 px-2 pb-2.5">
          <div className="relative" ref={acctRef}>
            <button
              onClick={() => setAcctOpen((v) => !v)}
              data-tour="topbar.accountSwitcher"
              className="flex h-[43px] w-full items-center gap-2 rounded-[5px] border border-white/20 bg-[#0aafd0] px-2 text-left shadow-sm transition-colors hover:bg-[#12b9d8]"
              aria-haspopup="listbox"
              aria-expanded={acctOpen}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/15 text-white">
                <Building2 size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold leading-[15px] text-white">
                  {selectedAcct.name}
                </span>
                <span className="block truncate text-[10px] leading-[13px] text-white/75">
                  {selectedAcct.region}
                </span>
              </span>
              <ChevronsUpDown size={13} className="shrink-0 text-white/80" />
            </button>

            {acctOpen && (
              <div
                className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-pop"
                role="listbox"
              >
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
                  Current Sub-Account
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
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ai-soft text-ai">
                        <Building2 size={13} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left">{a.name}</span>
                      {isActive && <Check size={14} className="shrink-0 text-brand" />}
                    </button>
                  );
                })}
                <p className="border-t border-line px-3 py-2 text-[10px] text-ink-subtle">
                  Account switching is cosmetic in demo mode.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              data-tour="topbar.search"
              className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-[5px] border border-white/15 bg-[#069fc3]/80 px-2.5 text-[12px] text-white/85 transition-colors hover:bg-[#09a9ca]"
              aria-label="Search"
            >
              <Search size={14} className="shrink-0" />
              <span className="flex-1 text-left">Search</span>
              <kbd className="text-[9px] font-semibold uppercase text-white/60">ctrl k</kbd>
            </button>
            <button
              onClick={() => pushToast({ title: 'Quick actions', description: 'Use the + menu in the header to create a new record.', variant: 'info' })}
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[5px] border border-white/15 bg-[#069fc3]/80 text-white hover:bg-[#09a9ca]"
              aria-label="Quick actions"
            >
              <Zap size={14} />
            </button>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            data-tour="topbar.search"
            className="grid h-8 w-8 place-items-center rounded-[5px] border border-white/15 bg-white/10 text-white/80 hover:bg-white/15"
            aria-label="Search"
          >
            <Search size={15} />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav
        className="kleegr-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1"
        aria-label="Main navigation"
      >
        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.path}>
              {item.dividerBefore && (
                <div
                  aria-hidden="true"
                  className={cx('bg-white/15', collapsed ? 'mx-auto my-1.5 h-px w-7' : 'mx-3 my-1.5 h-px')}
                />
              )}

              <NavLink
                to={item.path}
                onClick={onNavigate}
                data-tour={item.tour}
                end={item.path === '/'}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) =>
                  cx(
                    'group relative flex h-9 items-center gap-2.5 text-[13px] font-medium transition-colors duration-100',
                    collapsed
                      ? 'mx-1.5 my-px justify-center rounded-[5px] px-0'
                      : 'mx-2 my-px rounded-[5px] px-2.5',
                    isActive
                      ? 'bg-sidebar-active text-white shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.3 : 1.9}
                      className={cx('shrink-0', isActive ? 'text-white' : 'text-white/75 group-hover:text-white')}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Pinned: Settings — docked at the bottom like the real GHL portal */}
      <div className="shrink-0 border-t border-white/15 py-1.5">
        <NavLink
          to={SETTINGS_NAV.path}
          onClick={onNavigate}
          data-tour={SETTINGS_NAV.tour}
          title={SETTINGS_NAV.label}
          aria-label={SETTINGS_NAV.label}
          className={({ isActive }) =>
            cx(
              'group relative flex h-9 items-center gap-2.5 text-[13px] font-medium transition-colors duration-100',
              collapsed
                ? 'mx-1.5 my-px justify-center rounded-[5px] px-0'
                : 'mx-2 my-px rounded-[5px] px-2.5',
              isActive
                ? 'bg-sidebar-active text-white shadow-sm'
                : 'text-white/75 hover:bg-white/10 hover:text-white',
            )
          }
        >
          {({ isActive }) => (
            <>
              <SETTINGS_NAV.icon
                size={16}
                strokeWidth={isActive ? 2.3 : 1.9}
                className={cx('shrink-0', isActive ? 'text-white' : 'text-white/75 group-hover:text-white')}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{SETTINGS_NAV.label}</span>}
            </>
          )}
        </NavLink>
      </div>

    </aside>
  );
}
