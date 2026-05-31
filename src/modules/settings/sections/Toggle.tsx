import { cx } from '@/utils';

/** Shared on/off switch used across Settings sections. */
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span className={cx('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-1')} />
    </button>
  );
}
