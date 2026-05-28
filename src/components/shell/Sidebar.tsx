import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV } from './nav';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { kleegrTheme } from '@/theme/tokens';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  const groupStarts = new Set<number>();
  const seenGroups = new Set<string>();
  NAV.forEach((item, i) => {
    if (item.group && !seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupStarts.set(i);
    }
  });

  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      <div
        className={cx(
          'flex h-14 shrink-0 items-center border-b border-sidebar-fg/10',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-4',
        )}
      >
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-[11px] font-black tracking-tight text-brand-fg"
        >
          {kleegrTheme.wordmark[0]}
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold tracking-tight text-white">
            {kleegrTheme.wordmark}
          </span>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const showGroupHeader = groupStarts.has(i) && !collapsed;
          return (
            <div key={item.path}>
              {showGroupHeader && (
                <p className="mb-0.5 mt-3 px-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-fg/40">
                  {item.group}
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
                      : 'text-sidebar-fg hover:bg-white/10 hover:text-white',
                  )
                }
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        data-tour="nav.collapseToggle"
        className={cx(
          'hidden lg:flex h-10 w-full shrink-0 items-center border-t border-sidebar-fg/10 text-sidebar-fg/60',
          'hover:text-white transition-colors',
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
