/**
 * Ticket stat strip — a compact, clickable KPI row pinned above the ticket
 * board/list. Adapts Ticketing's dashboard stat cards (colored left accent,
 * big number, label) into an in-tab "support desk" header. Each card doubles
 * as a quick filter: clicking a stage card filters to that stage; Overdue and
 * Unread toggle their pseudo-filters. Counts derive live from the in-memory
 * ticket set.
 */

import { AlertTriangle, Bell, CheckCircle2, Inbox, PauseCircle, Timer } from 'lucide-react';
import { cx } from '@/utils';
import type { Ticket, TicketStage } from '../types';

function isOverdue(t: Ticket): boolean {
  return !!t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.stage !== 'resolved' && t.stage !== 'closed';
}

interface StatDef {
  key: TicketStage | 'overdue' | 'unread';
  label: string;
  icon: React.ReactNode;
  accent: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function StatCard({ def }: { def: StatDef }) {
  return (
    <button
      onClick={def.onClick}
      aria-pressed={def.active}
      className={cx(
        'group flex min-w-[124px] flex-1 items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop',
        def.active ? 'border-transparent ring-2' : 'border-line',
      )}
      style={{
        borderLeft: `3px solid ${def.accent}`,
        ...(def.active ? ({ ['--tw-ring-color' as string]: def.accent } as React.CSSProperties) : {}),
      }}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `${def.accent}1a`, color: def.accent }}
      >
        {def.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-none text-ink tabular-nums">{def.count}</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          {def.label}
        </span>
      </span>
    </button>
  );
}

export function TicketStats({
  tickets,
  activeStage,
  unreadOnly,
  overdueOnly,
  onPickStage,
  onToggleUnread,
  onToggleOverdue,
}: {
  tickets: Ticket[];
  activeStage: TicketStage | 'all';
  unreadOnly: boolean;
  overdueOnly: boolean;
  onPickStage: (s: TicketStage) => void;
  onToggleUnread: () => void;
  onToggleOverdue: () => void;
}) {
  const byStage = (s: TicketStage) => tickets.filter((t) => t.stage === s).length;

  const defs: StatDef[] = [
    { key: 'open', label: 'Open', icon: <Inbox size={17} />, accent: '#2563eb', count: byStage('open'), active: activeStage === 'open', onClick: () => onPickStage('open') },
    { key: 'in_progress', label: 'In Progress', icon: <Timer size={17} />, accent: '#d97706', count: byStage('in_progress'), active: activeStage === 'in_progress', onClick: () => onPickStage('in_progress') },
    { key: 'waiting', label: 'Waiting', icon: <PauseCircle size={17} />, accent: '#7c3aed', count: byStage('waiting'), active: activeStage === 'waiting', onClick: () => onPickStage('waiting') },
    { key: 'resolved', label: 'Resolved', icon: <CheckCircle2 size={17} />, accent: '#12895f', count: byStage('resolved'), active: activeStage === 'resolved', onClick: () => onPickStage('resolved') },
    { key: 'overdue', label: 'Overdue', icon: <AlertTriangle size={17} />, accent: '#dc2626', count: tickets.filter(isOverdue).length, active: overdueOnly, onClick: onToggleOverdue },
    { key: 'unread', label: 'Unread', icon: <Bell size={17} />, accent: '#4f46e5', count: tickets.filter((t) => t.unread).length, active: unreadOnly, onClick: onToggleUnread },
  ];

  return (
    <div className="mb-3 flex flex-wrap gap-2" data-tour="productivity.ticket-stats">
      {defs.map((d) => (
        <StatCard key={d.key} def={d} />
      ))}
    </div>
  );
}
