import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronsUpDown, Building2, Search, Zap, Check,
} from 'lucide-react';
import { NAV } from './nav';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

/**
 * Core CRM paths — visual emphasis only (rendered slightly darker).
 */
const CORE_CRM_PATHS = new Set([
  '/',
  '/conversations',
  '/contacts',
  '/opportunities',
  '/calendars',
  '/payments',
  '/tasks',
]);

/** Cosmetic demo sub-accounts (account switching is visual-only in demo mode). */
const DEMO_ACCOUNTS = [
  { id: 'a1', name: 'Kleegr Inc', region: 'Monsey, New York' },
  { id: 'a2', name: 'Acme Home Services', region: 'Austin, Texas' },
  { id: 'a3', name: 'Sunset Dental', region: 'San Diego, California' },
  { id: 'a4', name: 'Peak Fitness Studio', region: 'Denver, Colorado' },
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

  // Build group-start map (synthetic "Core" label for leading ungrouped items).
  const groupStarts = new Map<number, string>();
  const seenGroups = new Set<string>();
  NAV.forEach((item, i) => {
    if (item.group && !seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupStarts.set(i, item.group);
    }
  });
  if (!NAV[0]?.group) groupStarts.set(0, 'Core');

  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden border-r border-white/10 text-white transition-[width] duration-200',
        'bg-gradient-to-b from-[#0a1f44] via-[#123070] to-[#1c50bd]',
        collapsed ? 'w-[60px]' : 'w-[248px]',
      )}
      aria-label="Sidebar"
      data-tour="sidebar.nav"
    >
      {/* Wordmark */}
      <div
        className={cx(
          'flex h-14 shrink-0 items-center',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        {collapsed ? (
          <span
            aria-label="Kleegr"
            className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] bg-clip-text text-[20px] font-black leading-none text-transparent"
          >
            k
          </span>
        ) : (
          <span
            aria-label="Kleegr"
            className="select-none bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed] bg-clip-text text-[24px] font-black lowercase tracking-tight text-transparent"
          >
            kleegr
          </span>
        )}
      </div>

      {/* Account switcher + search (expanded only) */}
      {!collapsed && (
        <div className="space-y-2 px-3 pb-2">
          <div className="relative" ref={acctRef}>
            <button
              onClick={() => setAcctOpen((v) => !v)}
              data-tour="topbar.accountSwitcher"
              className="flex w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-left transition-colors hover:bg-white/15"
              aria-haspopup="listbox"
              aria-expanded={acctOpen}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/15 text-white">
                <Building2 size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold leading-tight text-white">
                  {selectedAcct.name}
                </span>
                <span className="block truncate text-[11px] leading-tight text-white/55">
                  {selectedAcct.region}
                </span>
              </span>
              <ChevronsUpDown size={14} className="shrink-0 text-white/55" />
            </button>

            {acctOpen && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
                role="listbox"
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

          <button
            onClick={() => setSearchOpen(true)}
            data-tour="topbar.search"
            className="flex w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-[13px] text-white/60 transition-colors hover:border-white/30 hover:bg-white/15"
            aria-label="Search"
          >
            <Search size={14} className="shrink-0" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded bg-white/15 px-1 text-[10px] font-medium text-white/70">ctrlK</kbd>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white/15 text-white">
              <Zap size={11} />
            </span>
          </button>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            data-tour="topbar.search"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:bg-white/15"
            aria-label="Search"
          >
            <Search size={15} />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const groupLabel = groupStarts.get(i);
          const isCore = CORE_CRM_PATHS.has(item.path);

          return (
            <div key={item.path}>
              {groupLabel &&
                (collapsed ? (
                  i > 0 ? (
                    <div aria-hidden="true" className="mx-auto my-2 h-px w-7 bg-white/15" />
                  ) : null
                ) : (
                  <p
                    className={cx(
                      'mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-white/40',
                      i === 0 ? 'mt-1.5' : 'mt-4',
                    )}
                  >
                    {groupLabel}
                  </p>
                ))}

              <NavLink
                to={item.path}
                onClick={onNavigate}
                data-tour={item.tour}
                end={item.path === '/'}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) =>
                  cx(
                    'group relative flex items-center gap-3 text-[13.5px] font-medium transition-colors duration-100',
                    collapsed
                      ? 'mx-1.5 my-px justify-center rounded-lg px-0 py-2'
                      : 'mx-2 my-px rounded-lg px-3 py-[7px]',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : cx(
                          'hover:bg-white/10 hover:text-white',
                          isCore ? 'text-white/90' : 'text-white/65',
                        ),
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !collapsed && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#38bdf8]"
                      />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.4 : 2}
                      className={cx('shrink-0', isActive ? 'text-white' : 'text-white/60 group-hover:text-white')}
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

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={toggleSidebar}
        data-tour="nav.collapseToggle"
        className={cx(
          'hidden h-9 w-full shrink-0 items-center border-t border-white/10 lg:flex',
          'text-white/55 transition-colors hover:bg-white/10 hover:text-white',
          collapsed ? 'justify-center px-0' : 'gap-1.5 px-4',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight size={14} />
        ) : (
          <>
            <ChevronLeft size={14} />
            <span className="text-[11px] font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
