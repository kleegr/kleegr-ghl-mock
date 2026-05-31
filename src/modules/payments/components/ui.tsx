/**
 * Payments-local shared UI building blocks.
 *
 * These sit on top of the global primitives (Button, Badge, Card…) and exist
 * only inside the Payments module so the workspace can have richer surfaces
 * (dropdown menus, a full-screen builder/editor overlay, consistent form
 * controls, status chips) without changing any shared component.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, MoreHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';

/* ───────────────────────── useClickOutside ─────────────────────── */

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onOutside]);
  return ref;
}

/* ───────────────────────────── Dropdown ────────────────────────── */

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 'w-56',
  'data-tour': dataTour,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  width?: string;
  'data-tour'?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref} data-tour={dataTour}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cx(
            'absolute z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((it) =>
            it.divider ? (
              <div key={it.id} className="my-1 border-t border-line" />
            ) : (
              <button
                key={it.id}
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40',
                  it.danger
                    ? 'text-bad hover:bg-bad/10'
                    : 'text-ink hover:bg-surface-sunken',
                )}
              >
                {it.icon && <span className="shrink-0 text-ink-subtle">{it.icon}</span>}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Row "⋯" action menu. */
export function ActionMenu({ items }: { items: MenuItem[] }) {
  return (
    <Dropdown
      items={items}
      trigger={({ toggle }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink"
          aria-label="Row actions"
        >
          <MoreHorizontal size={16} />
        </button>
      )}
    />
  );
}

/* ───────────────────────── SearchInput ─────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

/* ───────────────────────── SummaryCard ─────────────────────────── */

const ACCENT: Record<string, string> = {
  neutral: 'text-ink',
  brand: 'text-brand',
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
};

export function SummaryCard({
  label,
  value,
  sub,
  accent = 'neutral',
  icon,
  active,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: keyof typeof ACCENT;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'rounded-xl border bg-surface p-4 text-left shadow-card transition-colors',
        active ? 'border-brand ring-1 ring-brand/30' : 'border-line',
        onClick && 'hover:border-brand/50',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
        {icon && <span className={cx('shrink-0', ACCENT[accent])}>{icon}</span>}
      </div>
      <p className={cx('mt-1 font-display text-2xl font-extrabold', ACCENT[accent])}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </Tag>
  );
}

/* ───────────────────────────── Overlay ─────────────────────────── */

/**
 * Full-screen workspace overlay used by the invoice builder and document
 * editor. It deliberately does NOT use the shared <Modal> (which is a small
 * centered dialog) — builders need the whole canvas. Rendered via a portal so
 * it sits above the app shell.
 */
export function Overlay({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  'data-tour': dataTour,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  'data-tour'?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-sunken" role="dialog" aria-modal="true" data-tour={dataTour}>
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-bold text-ink">{title}</div>
            {subtitle && <div className="truncate text-xs text-ink-muted">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {/* body */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>,
    document.body,
  );
}

/* ───────────────────────── Form controls ───────────────────────── */

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-semibold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>}
    </label>
  );
}

const CONTROL =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function TInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(CONTROL, props.className)} />;
}

export function TSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(CONTROL, 'pr-8', props.className)} />;
}

export function TArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20',
        props.className,
      )}
    />
  );
}

/* Small segmented control (e.g. Invoices | Estimates). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            o.id === value ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export { ChevronDown, Check };

/* ───────────────────────── Status badges ───────────────────────── */

export function InvoiceStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'paid' ? 'good' : status === 'overdue' ? 'bad' : status === 'sent' ? 'warn' : 'neutral';
  return <Badge tone={tone as 'good' | 'bad' | 'warn' | 'neutral'}>{status}</Badge>;
}

export function EstimateStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'accepted' ? 'good' : status === 'declined' ? 'bad' : status === 'sent' ? 'warn' : 'neutral';
  return <Badge tone={tone as 'good' | 'bad' | 'warn' | 'neutral'}>{status}</Badge>;
}

const DOC_TONE: Record<string, 'good' | 'bad' | 'warn' | 'neutral' | 'brand'> = {
  draft: 'neutral',
  waiting: 'warn',
  completed: 'good',
  payments: 'brand',
  archived: 'neutral',
};
const DOC_LABEL: Record<string, string> = {
  draft: 'Draft',
  waiting: 'Waiting',
  completed: 'Completed',
  payments: 'Payments',
  archived: 'Archived',
};
export function DocStatusBadge({ status }: { status: string }) {
  return <Badge tone={DOC_TONE[status] ?? 'neutral'}>{DOC_LABEL[status] ?? status}</Badge>;
}
