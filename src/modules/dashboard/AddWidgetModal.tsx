/**
 * AddWidgetModal.tsx — the "Add widget" library shown in dashboard edit mode.
 *
 * Lists every widget kind from WIDGET_CATALOG grouped by category, with a
 * search box that filters by title/description. Clicking a row adds that
 * widget to the working dashboard (duplicates are allowed — a subtle "On
 * dashboard" hint shows what's already present).
 */
import { useMemo, useState } from 'react';
import { Plus, Search, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';
import {
  WIDGET_CATALOG, WIDGET_META, type WidgetKind,
} from './dashboardData';

export function AddWidgetModal({
  open, onClose, present, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  present: WidgetKind[];
  onAdd: (kind: WidgetKind) => void;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const groups = useMemo(() => {
    return WIDGET_CATALOG.map((group) => ({
      category: group.category,
      kinds: group.kinds.filter((k) => {
        if (!query) return true;
        const m = WIDGET_META[k];
        return (
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query)
        );
      }),
    })).filter((g) => g.kinds.length > 0);
  }, [query]);

  const empty = groups.length === 0;

  return (
    <Modal open={open} onClose={onClose} title="Add a widget" size="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search widgets…"
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {empty ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            No widgets match “{q}”.
          </p>
        ) : (
          <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
            {groups.map((group) => (
              <section key={group.category}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {group.category}
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.kinds.map((kind) => {
                    const meta = WIDGET_META[kind];
                    const Icon = meta.icon;
                    const onBoard = present.includes(kind);
                    return (
                      <li key={kind}>
                        <button
                          onClick={() => onAdd(kind)}
                          className="group flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand/50 hover:bg-brand-soft/30"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted group-hover:bg-brand-soft group-hover:text-brand">
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-ink">{meta.title}</span>
                              {onBoard && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-surface-sunken px-1 py-0.5 text-[9px] font-semibold uppercase text-ink-subtle">
                                  <Check size={9} /> On dashboard
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{meta.description}</span>
                          </span>
                          <span className={cx(
                            'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-subtle',
                            'group-hover:bg-brand group-hover:text-brand-fg',
                          )}>
                            <Plus size={14} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
