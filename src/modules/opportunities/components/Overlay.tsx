import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/utils';

/**
 * Large, screenshot-fidelity dialog shell for the Opportunities module.
 *
 * The shared `@/components/ui/Modal` caps at max-w-2xl / max-h-70vh, which is
 * too small for GHL-style full-bleed dialogs (the Edit Opportunity drawer and
 * the Create Pipeline modal). This local overlay gives the wider, taller panel
 * those screens need without touching the protected shared primitive.
 */
interface OverlayProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
  /** data-tour pass-through for the panel. */
  tour?: string;
}

export function Overlay({ onClose, children, maxWidth = 'max-w-5xl', tour }: OverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        data-tour={tour}
        className={cx(
          'animate-pop relative z-10 my-2 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-pop',
          maxWidth,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
