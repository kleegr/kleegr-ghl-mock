import { useMemo } from 'react';
import { Users, Sparkles, Flame, Star, Clock, Bell, ArrowRight, type LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { useContactsModule } from '../context';
import { SMART_LISTS } from '../data';

const ICONS: Record<string, LucideIcon> = {
  users: Users, sparkles: Sparkles, flame: Flame, star: Star, clock: Clock, bell: Bell,
};

/** Manage Smart Lists — overview of all saved views with live counts. */
export function SmartListsView() {
  const contacts = useStore((s) => s.contacts);
  const { openSmartList } = useContactsModule();

  const counts = useMemo(
    () => Object.fromEntries(SMART_LISTS.map((sl) => [sl.id, contacts.filter(sl.predicate).length])),
    [contacts],
  );

  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-ink">Smart Lists</h2>
        <p className="text-sm text-ink-muted">Saved, auto-updating segments of your contacts. Counts refresh as records change.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SMART_LISTS.map((sl) => {
          const Icon = ICONS[sl.icon] ?? Users;
          return (
            <div key={sl.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={18} /></span>
                <span className="font-display text-2xl font-bold text-ink">{counts[sl.id]}</span>
              </div>
              <p className="text-sm font-bold text-ink">{sl.label}</p>
              <p className="mb-3 flex-1 text-xs text-ink-muted">{sl.hint}</p>
              <Button variant="secondary" size="sm" onClick={() => openSmartList(sl.id)}>
                Open list <ArrowRight size={13} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
