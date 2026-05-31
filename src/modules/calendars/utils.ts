// Calendar-specific date utilities — no external dependencies.

import type { Appointment } from '@/types';
import type { BadgeProps } from '@/components/ui/primitives';

/** Semantic badge tone for each appointment status. */
export const STATUS_TONE: Record<Appointment['status'], BadgeProps['tone']> = {
  confirmed: 'brand',
  showed: 'good',
  no_show: 'bad',
  cancelled: 'neutral',
};

/** Human label for each appointment status. */
export const STATUS_LABEL: Record<Appointment['status'], string> = {
  confirmed: 'Confirmed',
  showed: 'Showed',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

/** Selectable statuses (for the status menu in the detail/list views). */
export const STATUS_OPTIONS: Appointment['status'][] = [
  'confirmed',
  'showed',
  'no_show',
  'cancelled',
];

export interface CalDay {
  date: Date;
  /** false = previous/next month overflow day */
  inMonth: boolean;
}

/**
 * Build a 42-cell (6-row × 7-col) month grid for the given year/month.
 * Leading and trailing cells are filled with adjacent-month days.
 */
export function buildMonthGrid(year: number, month: number): CalDay[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: CalDay[] = [];

  // Leading days from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }

  // This month's days
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ date: new Date(year, month, d), inMonth: true });
  }

  // Trailing days from next month to fill to 42
  const trailing = 42 - grid.length;
  for (let d = 1; d <= trailing; d++) {
    grid.push({ date: new Date(year, month + 1, d), inMonth: false });
  }

  return grid;
}

/** Get the 7 days (Sun–Sat) of the week containing the given anchor date. */
export function buildWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - dow + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekRange(days: Date[]): string {
  if (days.length < 7) return '';
  const start = days[0];
  const end = days[6];
  const mo = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${mo(start)} – ${mo(end)}, ${end.getFullYear()}`;
}

/** Format a Date as "YYYY-MM-DD" for use in <input type="date">. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Combine a "YYYY-MM-DD" date string and "HH:MM" time string into an ISO
 * timestamp. Returns the current time as a fallback on parse failure.
 */
export function combineDatetime(date: string, time: string): string {
  if (!date || !time) return new Date().toISOString();
  try {
    const dt = new Date(`${date}T${time}:00`);
    if (isNaN(dt.getTime())) return new Date().toISOString();
    return dt.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/** Derive the end time string by adding 30 minutes to a start time. */
export function addThirtyMin(date: string, time: string): string {
  if (!date || !time) return '';
  try {
    const dt = new Date(`${date}T${time}:00`);
    if (isNaN(dt.getTime())) return time;
    dt.setMinutes(dt.getMinutes() + 30);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return time;
  }
}
