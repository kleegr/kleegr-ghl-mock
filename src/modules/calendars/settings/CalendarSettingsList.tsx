/**
 * CalendarSettingsList — the calendar management table in Calendar Settings.
 *
 * Left rail groups/folders + a searchable table of calendars showing name,
 * id, group, duration, type, status and created/updated. "Create calendar"
 * launches the type chooser; row actions edit or toggle a calendar's status.
 * Operates on the session-only catalog owned by the parent hub.
 */
import React, { useMemo, useState } from 'react';
import {
  Search, Plus, MoreHorizontal, Pencil, Power, Copy, Folder, CalendarDays,
} from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui/primitives';
import type { BadgeProps } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, dateLabel, relativeTime, userById } from '@/utils';
import {
  CALENDAR_GROUPS,
  CALENDAR_GROUP_LABEL,
  CALENDAR_TYPE_LABEL,
} from '../data';
import type { CalendarMeta, CalendarStatus } from '../types';

const STATUS_TONE: Record<CalendarStatus, BadgeProps['tone']> = {
  active: 'good',
  draft: 'warn',
  inactive: 'neutral',
};

const STATUS_LABEL: Record<CalendarStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  inactive: 'Inactive',
};

interface Props {
  calendars: CalendarMeta[];
  onCreate: () => void;
  onEdit: (meta: CalendarMeta) => void;
  onToggleStatus: (id: string) => void;
}

export function CalendarSettingsList({ calendars, onCreate, onEdit, onToggleStatus }: Props) {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);

  const [group, setGroup] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: calendars.length };
    for (const g of CALENDAR_GROUPS) counts[g.id] = 0;
    for (const c of calendars) counts[c.groupId] = (counts[c.groupId] ?? 0) + 1;
    return counts;
  }, [calendars]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calendars
      .filter((c) => (group === 'all' ? true : c.groupId === group))
      .filter((c) =>
        q
          ? c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [calendars, group, query]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
      {/* Groups rail */}
      <aside className="lg:border-r lg:border-line lg:pr-4">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          Groups
        </p>
        <nav className="space-y-0.5">
          <RailItem
            icon={<CalendarDays size={15} />}
            label="All calendars"
            count={groupCounts.all}
            active={group === 'all'}
            onClick={() => setGroup('all')}
          />
          {CALENDAR_GROUPS.map((g) => (
            <RailItem
              key={g.id}
              icon={<Folder size={15} />}
              label={g.name}
              count={groupCounts[g.id] ?? 0}
              active={group === g.id}
              onClick={() => setGroup(g.id)}
            />
          ))}
        </nav>
        <button
          onClick={() =>
            pushToast({
              title: 'Groups',
              description: 'Calendar groups keep related booking calendars organised.',
              variant: 'info',
            })
          }
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <Plus size={13} /> New group
        </button>
      </aside>

      {/* Table panel */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search calendars"
              className="w-60 rounded-lg border border-line bg-surface py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>
          <div className="flex-1" />
          <Button onClick={onCreate}>
            <Plus size={15} /> Create Calendar
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={32} />}
            title="No calendars"
            body={query ? 'No calendars match your search.' : 'Create your first calendar to start taking bookings.'}
            action={<Button size="sm" onClick={onCreate}>Create Calendar</Button>}
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-sunken text-left text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  <th className="px-4 py-2.5">Calendar</th>
                  <th className="px-3 py-2.5">Calendar ID</th>
                  <th className="px-3 py-2.5">Group</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Created / Updated</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => {
                  const owner = userById(users, c.ownerId);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-surface-sunken/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{c.name}</p>
                            <p className="truncate text-xs text-ink-subtle">
                              /book/{c.slug}{owner ? ` · ${owner.name}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <code className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-muted">{c.id}</code>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{CALENDAR_GROUP_LABEL[c.groupId] ?? '—'}</td>
                      <td className="px-3 py-3 text-ink-muted">{c.durationMin} min</td>
                      <td className="px-3 py-3 text-ink-muted">{CALENDAR_TYPE_LABEL[c.type] ?? c.type}</td>
                      <td className="px-3 py-3">
                        <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        <p>{dateLabel(c.createdAt)}</p>
                        <p className="text-xs text-ink-subtle">Updated {relativeTime(c.updatedAt)}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            aria-label="Calendar actions"
                            onClick={() => setMenuFor((p) => (p === c.id ? null : c.id))}
                            className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {menuFor === c.id && (
                            <>
                              <button
                                className="fixed inset-0 z-30 cursor-default"
                                aria-hidden="true"
                                tabIndex={-1}
                                onClick={() => setMenuFor(null)}
                              />
                              <div className="absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-pop">
                                <MenuItem
                                  icon={<Pencil size={14} />}
                                  label="Edit calendar"
                                  onClick={() => { setMenuFor(null); onEdit(c); }}
                                />
                                <MenuItem
                                  icon={<Copy size={14} />}
                                  label="Copy booking link"
                                  onClick={() => {
                                    setMenuFor(null);
                                    pushToast({
                                      title: 'Booking link copied',
                                      description: `/book/${c.slug}`,
                                      variant: 'success',
                                    });
                                  }}
                                />
                                <div className="my-1 h-px bg-line" />
                                <MenuItem
                                  icon={<Power size={14} />}
                                  label={c.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => { setMenuFor(null); onToggleStatus(c.id); }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-ink-subtle">
          {rows.length} calendar{rows.length !== 1 ? 's' : ''}
          {group !== 'all' ? ` in ${CALENDAR_GROUP_LABEL[group]}` : ''}
        </p>
      </div>
    </div>
  );
}

function RailItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
        active ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <span className={cx('text-[11px]', active ? 'text-brand' : 'text-ink-subtle')}>{count}</span>
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-sunken"
    >
      {icon}
      {label}
    </button>
  );
}
