/**
 * AppointmentList — GoHighLevel-style appointment table.
 *
 * Renders the merged appointment set (store + locally-derived) as a sortable,
 * searchable table with status tabs and a per-row action menu. Status / cancel
 * actions are lifted to the Calendars container so the change is reflected
 * everywhere (grid, agenda, detail). No store mutation here.
 */
import React, { useMemo, useState } from 'react';
import {
  Search, MoreHorizontal, CalendarClock, CheckCircle2, XCircle, Eye, Ban,
  SlidersHorizontal, Plus,
} from 'lucide-react';
import type { Appointment, Contact, User } from '@/types';
import { Badge, Avatar, EmptyState, Button } from '@/components/ui/primitives';
import { cx, fullName, clockTime, dateLabel, userById } from '@/utils';
import { STATUS_TONE, STATUS_LABEL } from '../utils';
import type { CalendarMeta } from '../types';

type StatusFilter = 'upcoming' | 'past' | 'cancelled' | 'all';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

interface Props {
  appointments: Appointment[];
  catalog: CalendarMeta[];
  contacts: Contact[];
  users: User[];
  onOpen: (a: Appointment) => void;
  onStatusChange: (id: string, status: Appointment['status']) => void;
  onCancel: (id: string) => void;
  onBook: () => void;
}

export function AppointmentList({
  appointments,
  catalog,
  contacts,
  users,
  onOpen,
  onStatusChange,
  onCancel,
  onBook,
}: Props) {
  const [filter, setFilter] = useState<StatusFilter>('upcoming');
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const calById = useMemo(() => {
    const m = new Map<string, CalendarMeta>();
    catalog.forEach((c) => m.set(c.id, c));
    return m;
  }, [catalog]);

  const contactById = useMemo(() => {
    const m = new Map<string, Contact>();
    contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contacts]);

  const now = Date.now();

  const counts = useMemo(() => {
    const c = { upcoming: 0, past: 0, cancelled: 0, all: appointments.length };
    for (const a of appointments) {
      const t = +new Date(a.startTime);
      if (a.status === 'cancelled') c.cancelled += 1;
      else if (t >= now) c.upcoming += 1;
      else c.past += 1;
    }
    return c;
  }, [appointments, now]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = appointments.filter((a) => {
      const t = +new Date(a.startTime);
      if (filter === 'cancelled') return a.status === 'cancelled';
      if (filter === 'upcoming') return a.status !== 'cancelled' && t >= now;
      if (filter === 'past') return a.status !== 'cancelled' && t < now;
      return true;
    });

    if (q) {
      list = list.filter((a) => {
        const contact = contactById.get(a.contactId);
        const cal = calById.get(a.calendarId);
        return (
          a.title.toLowerCase().includes(q) ||
          (contact && fullName(contact).toLowerCase().includes(q)) ||
          (cal && cal.name.toLowerCase().includes(q))
        );
      });
    }

    return list.sort((a, b) => {
      const ta = +new Date(a.startTime);
      const tb = +new Date(b.startTime);
      return filter === 'past' ? tb - ta : ta - tb;
    });
  }, [appointments, filter, query, now, contactById, calById]);

  return (
    <div className="m-4 flex min-h-[calc(100%-2rem)] flex-col overflow-visible rounded-xl border border-line bg-surface shadow-card">
      {/* Toolbar: status tabs + search */}
      <div className="flex min-h-[58px] flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center overflow-hidden rounded-[5px] border border-line">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                'inline-flex h-8 items-center gap-1.5 border-r border-line px-3 text-[12px] font-medium transition-colors last:border-r-0',
                filter === f.id
                  ? 'bg-brand-soft text-brand'
                  : 'bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {f.label}
              <span className={cx('text-[11px]', filter === f.id ? 'opacity-80' : 'opacity-60')}>
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button className="flex h-8 items-center gap-1.5 rounded-[5px] border border-line px-3 text-[12px] font-medium text-ink-muted hover:bg-surface-sunken">
          <SlidersHorizontal size={14} /> Filters
        </button>

        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search appointments"
            className="h-8 w-56 rounded-[5px] border border-line bg-surface pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none"
          />
        </div>
        <Button size="sm" className="rounded-[5px] text-[12px]" onClick={onBook}>
          <Plus size={14} /> New appointment
        </Button>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={32} />}
          title="No appointments"
          body={
            query
              ? 'No appointments match your search.'
              : filter === 'cancelled'
              ? 'No cancelled appointments.'
              : 'No appointments in this view yet.'
          }
          action={
            <Button size="sm" onClick={onBook}>
              Book Appointment
            </Button>
          }
          className="py-20"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-[#fafbfc] text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-subtle">
                <th className="px-5 py-2.5">Appointment</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5">Date &amp; time</th>
                <th className="px-3 py-2.5">Calendar</th>
                <th className="px-3 py-2.5">Owner</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => {
                const cal = calById.get(a.calendarId);
                const contact = contactById.get(a.contactId);
                const owner = cal ? userById(users, cal.ownerId) : undefined;
                const cancelled = a.status === 'cancelled';

                return (
                  <tr
                    key={a.id}
                    className={cx(
                      'group cursor-pointer transition-colors hover:bg-surface-sunken/60',
                      cancelled && 'opacity-60',
                    )}
                    onClick={() => onOpen(a)}
                  >
                    <td className="px-5 py-2.5">
                      <p className={cx('font-semibold text-ink', cancelled && 'line-through')}>
                        {a.title}
                      </p>
                      {a.location && (
                        <p className="text-xs text-ink-subtle">{a.location}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {contact ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={fullName(contact)} size="xs" />
                          <span className="text-ink">{fullName(contact)}</span>
                        </div>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">
                      <p className="text-ink">{dateLabel(a.startTime)}</p>
                      <p className="text-xs text-ink-subtle">
                        {clockTime(a.startTime)} – {clockTime(a.endTime)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      {cal ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: cal.color }} />
                          {cal.name}
                        </span>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">{owner?.name ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          aria-label="Appointment actions"
                          onClick={() => setMenuFor((p) => (p === a.id ? null : a.id))}
                          className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {menuFor === a.id && (
                          <>
                            <button
                              className="fixed inset-0 z-30 cursor-default"
                              aria-hidden="true"
                              tabIndex={-1}
                              onClick={() => setMenuFor(null)}
                            />
                            <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
                              <MenuItem
                                icon={<Eye size={14} />}
                                label="View details"
                                onClick={() => { setMenuFor(null); onOpen(a); }}
                              />
                              <MenuItem
                                icon={<CheckCircle2 size={14} />}
                                label="Mark as showed"
                                disabled={a.status === 'showed'}
                                onClick={() => { setMenuFor(null); onStatusChange(a.id, 'showed'); }}
                              />
                              <MenuItem
                                icon={<XCircle size={14} />}
                                label="Mark as no-show"
                                disabled={a.status === 'no_show'}
                                onClick={() => { setMenuFor(null); onStatusChange(a.id, 'no_show'); }}
                              />
                              <div className="my-1 h-px bg-line" />
                              <MenuItem
                                icon={<Ban size={14} />}
                                label="Cancel"
                                danger
                                disabled={cancelled}
                                onClick={() => { setMenuFor(null); onCancel(a.id); }}
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

      {/* Footer count */}
      <div className="mt-auto flex h-9 items-center gap-2 border-t border-line bg-[#fafbfc] px-5">
        <Badge tone="neutral">{rows.length} shown</Badge>
        <span className="text-xs text-ink-muted">{appointments.length} total appointments</span>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-ink-subtle'
          : danger
          ? 'text-bad hover:bg-bad/10'
          : 'text-ink hover:bg-surface-sunken',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
