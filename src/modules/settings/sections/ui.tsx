import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MoreHorizontal, Check, Copy } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { cx } from '@/utils';

/**
 * ui.tsx — local building blocks shared across the Settings sections owned by
 * the Settings / Staff / Phone / Pipelines workstream.
 *
 * These intentionally live inside the settings module (not the global UI layer)
 * so this workstream can iterate without touching shared files. Everything here
 * is presentational + demo-safe: no network calls, no persistence.
 */

/* ── shared input styles ──────────────────────────────────────────── */

export const INPUT_CX =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20';

/* ── Field (label + control) ──────────────────────────────────────── */

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 flex items-center gap-1 text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-bad">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cx(INPUT_CX, className)} {...rest} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cx(
        'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20',
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(INPUT_CX, 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/* ── GroupCard (titled settings card) ─────────────────────────────── */

export function GroupCard({
  title,
  desc,
  action,
  children,
  className,
  bodyClassName,
  ...rest
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <Card className={cx('overflow-hidden', className)} {...rest}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{title}</p>
          {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cx('px-5 py-4', bodyClassName)}>{children}</div>
    </Card>
  );
}

/* ── Kebab (row action menu) ──────────────────────────────────────── */

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export function Kebab({
  items,
  label = 'Actions',
  align = 'right',
}: {
  items: MenuItem[];
  label?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className={cx(
            'absolute z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={cx(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                it.danger
                  ? 'text-bad hover:bg-bad/5'
                  : 'text-ink hover:bg-surface-sunken',
              )}
            >
              {it.icon && <span className="shrink-0">{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── CopyChip (copyable id / value) ───────────────────────────────── */

export function CopyChip({ value, prefix }: { value: string; prefix?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(value);
        } catch {
          /* clipboard unavailable in some sandboxes — ignore in demo */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy"
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-sunken px-2 py-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-ink"
    >
      {prefix && <span className="text-ink-subtle">{prefix}</span>}
      <span>{value}</span>
      {copied ? <Check size={12} className="text-good" /> : <Copy size={12} />}
    </button>
  );
}

/* ── Drawer (right-side slide-in panel) ───────────────────────────── */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  width = 'max-w-xl',
  tabBar,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  width?: string;
  tabBar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        className={cx(
          'animate-in relative z-10 flex h-full w-full flex-col bg-surface shadow-pop',
          width,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <span className="mt-0.5 shrink-0 text-ink-muted">{icon}</span>}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        {tabBar}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer}
      </aside>
    </div>,
    document.body,
  );
}

/* ── SaveBar (sticky footer save/cancel) ──────────────────────────── */

export function SaveBar({
  onCancel,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  dirty = true,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  dirty?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
      {dirty && (
        <span className="mr-auto text-xs font-medium text-warn">Unsaved changes</span>
      )}
      <Button variant="secondary" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button size="sm" onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}

/* ── KeyValue row (read-only display) ─────────────────────────────── */

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <p className="w-44 shrink-0 text-xs font-semibold text-ink-subtle">{label}</p>
      <div className="min-w-0 flex-1 text-sm text-ink">{children}</div>
    </div>
  );
}
