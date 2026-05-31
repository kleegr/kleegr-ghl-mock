import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MoreVertical, Copy, Check, ChevronDown } from 'lucide-react';
import { Card, Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { Toggle } from './Toggle';

/**
 * _ui.tsx - shared building blocks for the Settings workstream
 * (Business Profile / Staff / Phone System / Pipelines).
 *
 * These intentionally live inside the settings module so this workstream can
 * own them without touching the global primitives. They reuse the existing
 * Kleegr tokens (brand / ink / surface / line) and the Card primitive so every
 * settings surface looks like the rest of the GHL-style portal.
 */

/* Shared control styling - mirrors the input pattern used elsewhere in the app. */
export const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20';

/* --- Field (label + control) --- */
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
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </label>
  );
}

/* --- Text input --- */
export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(fieldCls, className)} {...rest} />;
  },
);

/* --- Textarea --- */
export function TextArea({ className, rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cx(
        'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/20',
        className,
      )}
      {...rest}
    />
  );
}

/* --- Select --- */
export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cx(fieldCls, 'appearance-none pr-9', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
    </div>
  );
}

/* --- Section card (titled panel) --- */
export function SettingsCard({
  title,
  desc,
  actions,
  children,
  bodyClass,
  className,
}: {
  title?: string;
  desc?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <p className="text-sm font-bold text-ink">{title}</p>}
            {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx('px-5 py-4', bodyClass)}>{children}</div>
    </Card>
  );
}

/* --- Copyable ID chip --- */
export function CopyId({ id, label = 'ID' }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(id);
    } catch {
      /* clipboard not available in this context - demo only */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] text-ink-muted transition-colors hover:text-ink"
    >
      <span className="max-w-[140px] truncate">{id}</span>
      {copied ? <Check size={11} className="text-good" /> : <Copy size={11} />}
    </button>
  );
}

/* --- Kebab action menu --- */
export interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

export function KebabMenu({ items, ariaLabel = 'Actions' }: { items: MenuItem[]; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        className="rounded p-1 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="animate-pop absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 text-left shadow-pop"
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cx(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-sunken',
                  item.danger ? 'text-bad' : 'text-ink',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* --- Right-side drawer --- */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  children,
  width = 'lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-2xl' };
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cx('animate-in relative z-10 flex h-full w-full flex-col bg-surface shadow-pop', widths[width])}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* --- Centered modal shell --- */
/** A wider centered overlay than the global Modal - used for tabbed editors. */
export function ModalShell({
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidth = 'max-w-2xl',
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cx('animate-pop relative z-10 flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl', maxWidth)}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* --- Labeled toggle row --- */
export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  className,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center justify-between gap-4 py-2.5', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* --- Save / Cancel action bar --- */
/** A consistent footer for editable panels. Primary action always does
 *  something (callers toast on save) so there are no silent primary buttons. */
export function SaveBar({
  onSave,
  onCancel,
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  className,
}: {
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
}) {
  return (
    <div className={cx('mt-5 flex items-center justify-end gap-2 border-t border-line pt-4', className)}>
      {onCancel && (
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button variant="primary" size="sm" onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
