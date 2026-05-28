import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV } from './nav';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

/**
 * Core CRM paths — visual emphasis only.
 * These items are styled brighter + get "Core" group treatment.
 * No edits to nav.ts required.
 */
const CORE_CRM_PATHS = new Set([
  '/',
  '/conversations',
  '/contacts',
  '/opportunities',
  '/calendars',
  '/tasks',
]);

interface SidebarProps {
  /** Called after a nav item is clicked — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  // Build group-start map.
  // Items 0-4 in nav.ts have no group — we inject a synthetic "Core" label
  // purely as a visual treatment inside Sidebar (nav.ts untouched).
  const groupStarts = new Map<number, string>();
  const seenGroups = new Set<string>();

  NAV.forEach((item, i) => {
    if (item.group && !seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupStarts.set(i, item.group);
    }
  });

  // Synthetic group for leading ungrouped items
  if (!NAV[0]?.group) {
    groupStarts.set(0, 'Core');
  }

  const initials = kleegrTheme.wordmark.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-[52px]' : 'w-[224px]',
      )}
      aria-label="Sidebar"
      data-tour="sidebar.nav"
    >
      {/* ── Account identity ─────────────────────────────────────────── */}
      <div
        className={cx(
          'flex h-14 shrink-0 items-center border-b border-white/10',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
        )}
      >
        {/* Avatar / logo mark */}
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-brand text-[11px] font-black tracking-tight text-white"
        >
          {initials}
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="truncate text-[13px] font-semibold text-white">
                {kleegrTheme.wordmark}
              </span>
              {/* Demo environment badge — purely visual */}
              <span
                aria-hidden="true"
                className="shrink-0 rounded-[3px] bg-brand/30 px-[5px] py-px text-[9px] font-bold uppercase tracking-wider text-white/70"
              >
                Demo
              </span>
            </div>
            <p className="mt-px truncate text-[10px] leading-tight text-white/35">
              Sub-Account
            </p>
          </div>
        )}
      </div>

      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const groupLabel = groupStarts.get(i);
          const isCore = CORE_CRM_PATHS.has(item.path);

          return (
            <div key={item.path}>
              {/* Group label / collapsed divider */}
              {groupLabel && (
                collapsed ? (
                  // Collapsed: thin divider between sections (skip very first)
                  i > 0 ? (
                    <div
                      aria-hidden="true"
                      className="mx-auto my-2 h-px w-7 bg-white/10"
                    />
                  ) : null
                ) : (
                  <p
                    className={cx(
                      'mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-widest',
                      i === 0 ? 'mt-2' : 'mt-4',
                      groupLabel === 'Core'
                        ? 'text-white/45'
                        : 'text-white/22',
                    )}
                  >
                    {groupLabel}
                  </p>
                )
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
                    'group relative flex items-center gap-2.5 text-[13px] font-medium transition-colors duration-100',
                    collapsed
                      ? 'mx-1 my-px justify-center rounded-md px-0 py-[7px]'
                      : 'mx-1.5 my-px rounded-md px-2.5 py-[6px]',
                    isActive
                      ? 'bg-brand text-white'
                      : cx(
                          'hover:bg-white/10 hover:text-white',
                          isCore ? 'text-white/75' : 'text-white/40',
                        ),
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Left-edge indicator for active item (expanded only) */}
                    {isActive && !collapsed && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-[3px] left-0 w-[3px] rounded-r-full bg-white/60"
                      />
                    )}

                    <Icon
                      size={16}
                      className="shrink-0"
                      aria-hidden="true"
                    />

                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {/* "Daily" badge on Tasks — it lives in Operate but is a
                        core daily CRM item. Badge is purely visual, no logic. */}
                    {!collapsed && item.path === '/tasks' && !isActive && (
                      <span
                        aria-hidden="true"
                        className="ml-auto shrink-0 rounded-[3px] bg-white/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white/35"
                      >
                        Daily
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* ── Collapse toggle (desktop only) ───────────────────────────── */}
      <button
        onClick={toggleSidebar}
        data-tour="nav.collapseToggle"
        className={cx(
          'hidden h-9 w-full shrink-0 items-center border-t border-white/10 lg:flex',
          'text-white/30 transition-colors hover:bg-white/5 hover:text-white/60',
          collapsed ? 'justify-center px-0' : 'gap-1.5 px-3',
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
