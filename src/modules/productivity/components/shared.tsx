/**
 * Productivity module — shared presentational helpers.
 *
 * Small building blocks reused across the tabs so every view speaks the same
 * Kleegr visual language (tokens, Badge, Avatar, Card). Nothing here holds
 * state or talks to a backend.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail, MessageSquare, Phone, ShieldAlert, Bug, Sparkles, Wrench, CheckSquare, X,
} from 'lucide-react';
import { Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import type { Priority, TaskStatus, TaskType, TicketChannel, TicketStage } from '../types';
import {
  PROJECT_STATUS_META, personById, personName, priorityMeta, taskStatusMeta, ticketStageMeta,
} from '../data';
import type { ProjectStatus } from '../types';

/* ────────────────────────── badges ───────────────────────── */

export function PriorityBadge({ priority, size = 'sm' }: { priority: Priority; size?: 'sm' | 'md' }) {
  const meta = priorityMeta(priority);
  return <Badge tone={meta.tone} size={size}>{meta.label}</Badge>;
}

export function TicketStageBadge({ stage, size = 'sm' }: { stage: TicketStage; size?: 'sm' | 'md' }) {
  const meta = ticketStageMeta(stage);
  return <Badge tone={meta.tone} size={size}>{meta.label}</Badge>;
}

export function TaskStatusBadge({ status, size = 'sm' }: { status: TaskStatus; size?: 'sm' | 'md' }) {
  const meta = taskStatusMeta(status);
  return <Badge tone={meta.tone} size={size}>{meta.label}</Badge>;
}

export function ProjectStatusBadge({ status, size = 'sm' }: { status: ProjectStatus; size?: 'sm' | 'md' }) {
  const meta = PROJECT_STATUS_META[status];
  return <Badge tone={meta.tone} size={size}>{meta.label}</Badge>;
}

/* ────────────────────────── icons ───────────────────────── */

export function ChannelIcon({ channel, size = 14 }: { channel: TicketChannel; size?: number }) {
  const map = { email: Mail, chat: MessageSquare, phone: Phone, internal: ShieldAlert } as const;
  const Icon = map[channel];
  return <Icon size={size} aria-hidden />;
}

export function TaskTypeIcon({ type, size = 14 }: { type: TaskType; size?: number }) {
  const map = { task: CheckSquare, bug: Bug, feature: Sparkles, chore: Wrench } as const;
  const Icon = map[type];
  return <Icon size={size} aria-hidden />;
}

/* ────────────────────────── assignee pill ───────────────────────── */

export function AssigneePill({ id, size = 'xs' }: { id?: string; size?: 'xs' | 'sm' }) {
  const p = personById(id);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar name={p?.name} size={size} />
      <span className="truncate text-[12px] text-ink-muted">{personName(id)}</span>
    </span>
  );
}

/* ────────────────────────── tag chip ───────────────────────── */

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-sunken px-1.5 py-0.5 text-[10.5px] font-medium text-ink-muted">
      #{children}
    </span>
  );
}

/* ────────────────────────── form fields ───────────────────────── */

export const inputCls =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20';

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink">
        {label} {required && <span className="text-bad">*</span>}
      </span>
      {children}
    </label>
  );
}

export function SelectInput({
  value, onChange, children, className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, className)}>
      {children}
    </select>
  );
}

export function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[12px] font-medium text-ink-subtle">{label}</span>
      <span className="min-w-0 text-right text-[13px] text-ink">{children}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">{children}</p>;
}

/* ────────────────────────── right-side Drawer ───────────────────────── */

/**
 * Slide-over panel anchored to the right — the GHL/Meridian detail-drawer
 * pattern. Wider than the shared centered Modal and better for record detail.
 */
export function Drawer({
  open, onClose, children, width = 'max-w-xl', tour,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  tour?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        data-tour={tour}
        className={cx(
          'animate-in relative z-10 flex h-full w-full flex-col overflow-hidden bg-surface shadow-pop',
          width,
        )}
        style={{ animationName: 'fade-in' }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DrawerHeader({
  eyebrow, title, onClose, right,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  onClose: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 flex items-center gap-2 text-[12px] text-ink-subtle">{eyebrow}</div>}
        <h2 className="truncate text-lg font-bold leading-tight text-ink">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
