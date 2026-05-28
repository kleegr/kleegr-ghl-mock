import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV } from './nav';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

interface SidebarProps {
  /** Called after a nav item is clicked — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  // Track which indices introduce a new group label
  const groupStarts = new Map<number, string>();
  const seenGroups = new Set<string>();
  NAV.forEach((item, i) => {
    if (item.group && !seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupStarts.set(i, item.group);
    }
  });

  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
      aria-label="Sidebar"
    >
      {/* Logo / wordmark */}
      <div
        className={cx(
          'flex h-14 shrink-0 items-center border-b border-white/10',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-4',
        )}
      >
        {/* Kleegr logo placeholder — swap with verified SVG per plan §13 */}
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-[11px] font-black tracking-tight text-white"
        >
          {kleegrTheme.wordmark[0]}
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold tracking-tight text-white">
            {kleegrTheme.wordmark}
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const groupLabel = groupStarts.get(i);
          return (
            <div key={item.path}>
              {groupLabel && !collapsed && (
                <p className="mb-0.5 mt-3 px-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {groupLabel}
                </p>
              )}
              <NavLink
                to={item.path}
                onClick={onNavigate}
                data-tour={item.tour}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cx(
                    'group flex items-center gap-3 rounded-lg py-1.5 text-sm font-medium transition-colors',
                    collapsed ? 'mx-1.5 justify-center px-2' : 'mx-2 px-3',
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white',
                  )
                }
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={toggleSidebar}
        data-tour="nav.collapseToggle"
        className={cx(
          'hidden lg:flex h-10 w-full shrink-0 items-center border-t border-white/10',
          'text-white/40 hover:text-white transition-colors',
          collapsed ? 'justify-center px-0' : 'gap-2 px-4',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        {!collapsed && <span className="text-xs">Collapse</span>}
      </button>
    </aside>
  );
}
