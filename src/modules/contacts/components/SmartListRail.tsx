import { useMemo } from 'react';
import { Users, Sparkles, Flame, Star, Clock, Bell, type LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { SMART_LISTS } from '../data';

const ICONS: Record<string, LucideIcon> = {
  users: Users, sparkles: Sparkles, flame: Flame, star: Star, clock: Clock, bell: Bell,
};

/** Saved-views rail — GHL keeps Smart Lists in a left column with live counts. */
export function SmartListRail({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  const contacts = useStore((s) => s.contacts);

  const counts = useMemo(
    () => Object.fromEntries(SMART_LISTS.map((sl) => [sl.id, contacts.filter(sl.predicate).length])),
    [contacts],
  );

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface-sunken/60 md:flex" data-tour="contacts.smartLists">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Smart Lists</p>
        <span className="text-[11px] text-ink-subtle">{SMART_LISTS.length}</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pb-3">
        {SMART_LISTS.map((sl) => {
          const Icon = ICONS[sl.icon] ?? Users;
          const isActive = sl.id === active;
          return (
            <button
              key={sl.id}
              onClick={() => onSelect(sl.id)}
              className={cx(
                'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                isActive ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-surface hover:text-ink',
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{sl.label}</span>
              <span
                className={cx(
                  'rounded-full px-1.5 py-px text-[10px] font-bold',
                  isActive ? 'bg-brand/15 text-brand' : 'bg-line/70 text-ink-subtle',
                )}
              >
                {counts[sl.id]}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
