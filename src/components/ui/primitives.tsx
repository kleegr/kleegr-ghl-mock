/**
 * primitives.tsx — Kleegr GHL Mock shared UI components.
 *
 * Exports: PageHeader, Button, Badge, Card, CardHeader, Avatar, EmptyState, Tabs.
 *
 * Design rules:
 *  - Tailwind utility classes only; tokens from tailwind.config.js (brand, ink,
 *    surface, line, good, warn, bad, sidebar).
 *  - No external component libraries.
 *  - No real backend/API behavior — this is a demo-mode UI layer.
 *  - Every component is data-tour-friendly (accepts data-* pass-through).
 */

import React from 'react';
import { cx } from '@/utils';

/* ─────────────────────────────────────────────
   PageHeader
   ───────────────────────────────────────────── */

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header used at the top of every module view.
 * Matches GHL's sub-account top-of-page pattern: title + optional subtitle on
 * the left, optional action buttons on the right.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cx(
        'flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold leading-tight text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Button
   ───────────────────────────────────────────── */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:pointer-events-none disabled:opacity-50';

const BTN_VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand text-brand-fg hover:bg-brand/90 active:bg-brand/80',
  secondary:
    'border border-line bg-surface text-ink hover:bg-surface-sunken active:bg-line/40',
  ghost:
    'text-ink-muted hover:bg-surface-sunken hover:text-ink active:bg-line/40',
  danger:
    'bg-bad text-white hover:bg-bad/90 active:bg-bad/80',
};

const BTN_SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-6  px-2   text-[11px]',
  sm: 'h-8  px-3   text-xs',
  md: 'h-9  px-4   text-sm',
  lg: 'h-11 px-5   text-sm',
};

/**
 * Primary interactive control. Defaults to `variant="primary"` and
 * `size="md"`. All native button attributes are forwarded.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

/** Tiny inline spinner used by Button when loading=true. Not exported standalone. */
function Spinner({ size }: { size: ButtonProps['size'] }) {
  const dim = size === 'xs' || size === 'sm' ? 12 : 14;
  return (
    <svg
      className="animate-spin"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <circle cx={12} cy={12} r={9} strokeOpacity={0.25} />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Badge
   ───────────────────────────────────────────── */

export interface BadgeProps {
  tone?: 'good' | 'bad' | 'warn' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const BADGE_TONE: Record<NonNullable<BadgeProps['tone']>, string> = {
  good:    'bg-good/10    text-good',
  bad:     'bg-bad/10     text-bad',
  warn:    'bg-warn/10    text-warn',
  brand:   'bg-brand-soft text-brand',
  neutral: 'bg-surface-sunken text-ink-muted border border-line',
};

/**
 * Compact status/label chip. Tone maps to semantic color pairs from the
 * Kleegr token set (green=good, red=bad, amber=warn, blue=brand, grey=neutral).
 */
export function Badge({ tone = 'neutral', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full font-semibold capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Card
   ───────────────────────────────────────────── */

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Forward a data-tour attribute or other HTML div attributes. */
  [key: `data-${string}`]: string | undefined;
}

/**
 * Content surface — a white rounded card with a subtle shadow.
 * Matches the GHL "tile" visual language used across dashboards, pipelines,
 * and module detail views.
 */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-xl border border-line bg-surface shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CardHeader
   ───────────────────────────────────────────── */

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard header row inside a Card — title + optional subtitle + optional
 * right-side actions. Used by Reporting and other chart cards.
 */
export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div
      className={cx(
        'flex items-start justify-between border-b border-line px-4 py-3',
        className,
      )}
    >
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Avatar
   ───────────────────────────────────────────── */

export interface AvatarProps {
  /** Display name — used to derive initials when src is absent. */
  name?: string;
  /** Optional image URL. Falls back to initials on error. */
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6  w-6  text-[10px]',
  sm: 'h-7  w-7  text-xs',
  md: 'h-9  w-9  text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

/** Palette of soft background colors for initial avatars — cycles by char code. */
const AVATAR_PALETTE = [
  'bg-[#dbeafe] text-[#1e40af]', // blue
  'bg-[#dcfce7] text-[#166534]', // green
  'bg-[#fef9c3] text-[#854d0e]', // yellow
  'bg-[#fce7f3] text-[#9d174d]', // pink
  'bg-[#ede9fe] text-[#5b21b6]', // violet
  'bg-[#ffedd5] text-[#9a3412]', // orange
  'bg-[#e0f2fe] text-[#075985]', // sky
];

function avatarInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function avatarColor(name?: string): string {
  if (!name) return AVATAR_PALETTE[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

/**
 * Circular avatar — shows a photo when `src` is provided, otherwise renders
 * colored initials derived from `name`. Never shows broken img icons.
 */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showInitials = !src || imgFailed;

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        AVATAR_SIZE[size],
        showInitials ? avatarColor(name) : 'bg-surface-sunken',
        className,
      )}
      aria-label={name}
    >
      {showInitials ? (
        avatarInitials(name)
      ) : (
        <img
          src={src}
          alt={name ?? ''}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgFailed(true)}
        />
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────── */

export interface EmptyStateProps {
  /** Optional icon element (e.g. a lucide icon at size 32). */
  icon?: React.ReactNode;
  title: string;
  body?: string;
  /** Optional CTA — usually a <Button>. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Centered empty-state block for tables, lists, and modules with no data.
 * Renders an optional icon, title, explanatory body, and a call-to-action.
 */
export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-3 px-4 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-sunken text-ink-subtle">
          {icon}
        </span>
      )}
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        {body && <p className="mt-1 max-w-xs text-xs text-ink-muted">{body}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tabs
   ───────────────────────────────────────────── */

export interface TabItem {
  id: string;
  label: string;
  /** Optional badge count displayed next to the label. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** 'underline' (default) matches GHL's module-level tab style.
   *  'pill' is useful for filter chips inside a module. */
  variant?: 'underline' | 'pill';
  className?: string;
}

/**
 * Horizontal tab bar. Two visual variants:
 * - `underline` — GHL-style nav tabs with an active underline (default).
 * - `pill` — compact filter pills, useful inside cards.
 *
 * The active state is fully controlled — supply `active` + `onChange`.
 */
export function Tabs({ tabs, active, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div
        role="tablist"
        aria-label="tabs"
        className={cx('flex items-center gap-1 rounded-lg bg-surface-sunken p-1', className)}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              tab.id === active
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cx(
                  'rounded-full px-1.5 py-px text-[10px] font-bold',
                  tab.id === active ? 'bg-brand-soft text-brand' : 'bg-line text-ink-subtle',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // underline (default)
  return (
    <div
      role="tablist"
      aria-label="tabs"
      className={cx('flex items-end border-b border-line', className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          aria-disabled={tab.disabled}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.id)}
          className={cx(
            'relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            tab.id === active
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cx(
                'rounded-full px-1.5 py-px text-[10px] font-bold',
                tab.id === active ? 'bg-brand-soft text-brand' : 'bg-surface-sunken text-ink-subtle',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
