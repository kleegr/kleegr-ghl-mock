/**
 * CatalogModal.tsx — the expanded, full-screen-style catalog opened from the
 * builder picker's expand (⤢) button.
 *
 * It shows the *entire* trigger or action library at once in a roomy two-column
 * grid with a single search box that filters across every group by label,
 * description, example, or category. Picking an item adds a real (demo-only)
 * node to the canvas through `onSelect`, mirroring the side drawer. Cosmetic,
 * in-memory only — no persistence, no API calls.
 */
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';
import { TRIGGER_GROUPS, ACTION_GROUPS, type CatalogItem, type CatalogGroup } from './automationData';

export function CatalogModal({
  kind, onClose, onSelect,
}: {
  kind: null | 'trigger' | 'action';
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}) {
  const [query, setQuery] = useState('');
  const isTrigger = kind === 'trigger';
  const groups = isTrigger ? TRIGGER_GROUPS : ACTION_GROUPS;
  const q = query.trim().toLowerCase();

  const filtered: CatalogGroup[] = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) =>
          [i.label, i.desc, i.example, i.category].some((t) => t?.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, groups]);

  const total = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <Modal
      open={kind !== null}
      onClose={onClose}
      title={isTrigger ? 'Add a trigger' : 'Add an action'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isTrigger ? 'Search every trigger…' : 'Search every action…'}
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <p className="text-xs text-ink-muted">
          {isTrigger
            ? 'A trigger is the event that starts your workflow.'
            : 'An action is a step the workflow runs in order.'}{' '}
          {q && <span className="font-medium text-ink">{total} match{total === 1 ? '' : 'es'}.</span>}
        </p>

        {total === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">No matches for “{query.trim()}”.</p>
        ) : (
          <div className="space-y-5">
            {filtered.map((group) => (
              <section key={group.id}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">{group.label}</p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => onSelect(item)}
                          className="group flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand/50 hover:bg-brand-soft/30"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-ink">{item.label}</span>
                              {item.category && (
                                <span className="shrink-0 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                                  {item.category}
                                </span>
                              )}
                            </span>
                            {item.desc && <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{item.desc}</span>}
                            {item.example && <span className="mt-0.5 block text-[11px] italic leading-snug text-ink-subtle">{item.example}</span>}
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
