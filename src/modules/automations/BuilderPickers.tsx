import { useMemo, useState } from 'react';
import { Search, X, Maximize2, LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react';
import { cx } from '@/utils';
import { TRIGGER_GROUPS, ACTION_GROUPS, type CatalogItem, type CatalogGroup } from './automationData';

interface PickerProps {
  kind: 'trigger' | 'action';
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
  /** Open the full-screen catalog (the drawer's expand button). */
  onExpand: () => void;
}

/**
 * Right-side Add Trigger / Add Action drawer used in the workflow builder.
 * Selecting an item adds a real (demo-only) node to the canvas via onSelect;
 * the expand button opens the full-screen searchable catalog via onExpand.
 */
export function BuilderPicker({ kind, onClose, onSelect, onExpand }: PickerProps) {
  const isTrigger = kind === 'trigger';
  const groups = isTrigger ? TRIGGER_GROUPS : ACTION_GROUPS;
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(groups.map((g) => [g.id, g.defaultOpen ?? true])),
  );
  const [tab, setTab] = useState<'main' | 'apps'>('main');

  const q = query.trim().toLowerCase();
  const filtered: CatalogGroup[] = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) =>
          [i.label, i.desc, i.category].some((t) => t?.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, groups]);

  return (
    <aside
      data-tour="automations.nodeDrawer"
      className="flex h-full w-full flex-col border-l border-line bg-surface sm:w-[420px]"
      aria-label={isTrigger ? 'Add Trigger' : 'Add Action'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-lg font-bold text-ink">{isTrigger ? 'Add Trigger' : 'Actions'}</h2>
        <div className="flex items-center gap-1 text-ink-subtle">
          <button onClick={onExpand} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" aria-label="Expand">
            <Maximize2 size={17} />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-subtle">
          <LayoutGrid size={18} />
        </span>
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-line px-3">
          <Search size={16} className="shrink-0 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isTrigger ? 'Search For Triggers' : 'Search For Actions'}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            aria-label={isTrigger ? 'Search for triggers' : 'Search for actions'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex border-b border-line px-5">
        <button
          onClick={() => setTab('main')}
          className={cx(
            'relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            tab === 'main' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          {isTrigger ? 'Triggers' : 'Actions'}
        </button>
        <button
          onClick={() => setTab('apps')}
          className={cx(
            'relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            tab === 'apps' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          Apps
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {tab === 'apps' ? (
          <div className="px-2 py-10 text-center text-sm text-ink-subtle">
            App integrations are not available in demo mode.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-10 text-center text-sm text-ink-subtle">No matches for &ldquo;{query.trim()}&rdquo;.</div>
        ) : (
          <>
            <p className="mb-2 px-2 text-xs text-ink-muted">
              {isTrigger
                ? 'A trigger is the event that starts your workflow. Pick one to begin.'
                : 'An action is a step the workflow runs. Pick one to add it to the flow.'}
            </p>
            {filtered.map((group) => {
            const open = openGroups[group.id] ?? true;
            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => setOpenGroups((s) => ({ ...s, [group.id]: !open }))}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-bold text-ink hover:bg-surface-sunken"
                >
                  <span>{group.label}</span>
                  <ChevronDown size={16} className={cx('text-ink-subtle transition-transform', !open && '-rotate-90')} />
                </button>
                {open && (
                  <div className="mt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onSelect(item)}
                          className="group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-surface-sunken"
                        >
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-ink">{item.label}</span>
                              {item.category && (
                                <span className="shrink-0 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                                  {item.category}
                                </span>
                              )}
                            </span>
                            {item.desc && <span className="mt-0.5 block text-xs text-ink-muted">{item.desc}</span>}
                            {item.example && <span className="mt-0.5 block text-[11px] italic text-ink-subtle">{item.example}</span>}
                          </span>
                          <ChevronRight size={16} className="mt-1 shrink-0 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </>
        )}
      </div>
    </aside>
  );
}
