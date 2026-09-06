import type { ReactNode } from 'react';
import { cx } from '@/utils';

export interface ModuleHeaderTab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  tabs?: ModuleHeaderTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  actions?: ReactNode;
  className?: string;
  'data-tour'?: string;
}

/**
 * The second row of Kleegr's 90px module masthead. It sits immediately below
 * the 50px global action row and keeps each module title and its primary tabs
 * inside the same navy field. Dashboard intentionally uses its own white
 * control row instead.
 */
export function ModuleHeader({
  title, subtitle, tabs = [], activeTab, onTabChange, actions, className,
  'data-tour': dataTour,
}: ModuleHeaderProps) {
  return (
    <div
      className={cx('flex h-10 shrink-0 items-stretch border-b border-white/15 bg-banner px-5 text-white', className)}
      data-tour={dataTour}
    >
      <div className="flex shrink-0 items-center pr-7" title={subtitle}>
        <h1 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h1>
        {subtitle && <span className="sr-only">{subtitle}</span>}
      </div>

      {tabs.length > 0 && (
        <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto" role="tablist" aria-label={`${title} sections`}>
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onTabChange?.(tab.id)}
                className={cx(
                  'relative flex shrink-0 items-center gap-1.5 px-3 pt-px text-[12px] font-medium text-white/70 transition-colors hover:text-white disabled:opacity-40',
                  selected && 'text-white after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-t after:bg-banner-accent',
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cx('rounded-full px-1.5 py-px text-[9px] font-bold', selected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/65')}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {actions && <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">{actions}</div>}
    </div>
  );
}
