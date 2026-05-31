import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/utils';

/**
 * Right-anchored slide-over drawer used across the Contacts module (Add Contact,
 * Advanced Filters, Company detail). Mirrors GoHighLevel's drawer pattern:
 * dimmed backdrop, header with title + close, scrollable body, sticky footer.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 'md',
  footer,
  children,
  bodyTour,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
  /** Optional data-tour attribute placed on the scrollable body. */
  bodyTour?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { md: 'max-w-[460px]', lg: 'max-w-[620px]' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cx('animate-in relative z-10 flex h-full w-full flex-col bg-surface shadow-pop', widths[width])}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div data-tour={bodyTour} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Small labeled form field wrapper used by the drawers. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ink">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-subtle">{hint}</p>}
    </div>
  );
}

export const INPUT_CLS =
  'w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30';
