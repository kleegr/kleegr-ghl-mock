import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Settings as SettingsIcon, Search, Building2, Users, Phone,
  Sliders, Code2, Tag, GitBranch, Calendar, Plug, Bell, type LucideIcon,
} from 'lucide-react';
import { cx } from '@/utils';

/**
 * SettingsSidebar — the dedicated, screenshot-faithful left rail for the
 * Settings area. The real GoHighLevel portal swaps its whole left rail for a
 * grouped settings menu (with a "Back" affordance) the moment you enter
 * Settings; AppShell renders this in place of the main dark navigation rail
 * for any /settings route, so Settings reads as a separate area.
 *
 * Deliberately styled DISTINCT from the dark-navy main rail: a light surface
 * panel with grouped sub-headers and a brand-tinted active row. Section ids map
 * 1:1 to the routes consumed by SettingsLayout — do not rename the ids.
 */

interface SectionLink {
  id: string;
  label: string;
  icon: LucideIcon;
}
interface SectionGroup {
  id: string;
  label: string;
  items: SectionLink[];
}

export const SETTINGS_GROUPS: SectionGroup[] = [
  {
    id: 'business',
    label: 'My Business',
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2 },
      { id: 'staff', label: 'My Staff', icon: Users },
      { id: 'phones', label: 'Phone Numbers', icon: Phone },
    ],
  },
  {
    id: 'data',
    label: 'Data & Custom Fields',
    items: [
      { id: 'custom-fields', label: 'Custom Fields', icon: Sliders },
      { id: 'custom-values', label: 'Custom Values', icon: Code2 },
      { id: 'tags', label: 'Tags', icon: Tag },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Scheduling',
    items: [
      { id: 'pipelines', label: 'Pipelines', icon: GitBranch },
      { id: 'calendars', label: 'Calendars', icon: Calendar },
    ],
  },
  {
    id: 'connections',
    label: 'Connections',
    items: [
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

interface SettingsSidebarProps {
  /** Called after a section is chosen — lets the mobile drawer close itself. */
  onNavigate?: () => void;
}

export function SettingsSidebar({ onNavigate }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const active = params.section ?? 'business';
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!q) return SETTINGS_GROUPS;
    return SETTINGS_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  const go = (id: string) => {
    navigate(`/settings/${id}`);
    onNavigate?.();
  };

  return (
    <aside
      className="flex h-full w-[260px] flex-col overflow-hidden border-r border-line bg-surface text-ink"
      aria-label="Settings navigation"
      data-tour="settings.nav"
    >
      {/* Back + title — establishes "you are now inside Settings" */}
      <div className="shrink-0 border-b border-line px-3 pb-3 pt-3">
        <button
          onClick={() => { navigate('/'); onNavigate?.(); }}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          data-tour="settings.back"
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div className="mt-3 flex items-center gap-2.5 px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <SettingsIcon size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">Settings</p>
            <p className="truncate text-[11px] text-ink-subtle">Demo Business</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 py-2.5">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface-sunken px-2.5">
          <Search size={14} className="shrink-0 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            aria-label="Search settings"
          />
        </div>
      </div>

      {/* Grouped sections */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:thin]"
        aria-label="Settings sections"
      >
        {groups.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cx(
                    'group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors',
                    isActive
                      ? 'bg-brand-soft font-semibold text-brand'
                      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                  )}
                >
                  {isActive && (
                    <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-brand" />
                  )}
                  <Icon size={15} className={cx('shrink-0', isActive ? 'text-brand' : 'text-ink-subtle group-hover:text-ink')} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-ink-subtle">
            No settings match &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </nav>
    </aside>
  );
}
