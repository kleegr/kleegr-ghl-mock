/**
 * Popover.tsx — a minimal anchored popover used across the dashboard module
 * (widget menus, the dashboard switcher, the date-range picker). Handles
 * click-away and Escape to close; positioning is left to the caller via the
 * `align` prop. Purely local UI — no portal, no store.
 */
import { useEffect, useRef } from 'react';
import { cx } from '@/utils';

export function Popover({
  open, setOpen, trigger, children, align = 'right', width,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  /** Optional fixed width utility class, e.g. "w-64". */
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          className={cx(
            'absolute top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-in',
            align === 'right' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
