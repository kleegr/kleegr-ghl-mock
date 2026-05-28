/**
 * tasks/utils.ts — date helpers and display formatters for the Tasks module.
 * Self-contained: no imports from @/utils (only what exists in this module).
 */

const DAY = 86_400_000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * True if the given ISO dueDate falls strictly before today (midnight).
 * Only applies to open tasks; completed tasks are never considered overdue.
 */
export function isOverdue(dueDate: string): boolean {
  const today = startOfDay(new Date());
  const due   = startOfDay(new Date(dueDate));
  return due < today;
}

/** True if dueDate falls on today (any time within today). */
export function isDueToday(dueDate: string): boolean {
  const today = startOfDay(new Date());
  const due   = startOfDay(new Date(dueDate));
  return due.getTime() === today.getTime();
}

/**
 * Human-readable due-date label:
 * "Yesterday" / "Today" / "Tomorrow" / "Mon, Jun 2" / "Jun 2, 2025"
 */
export function formatDueDate(dueDate: string): string {
  const today     = startOfDay(new Date());
  const tomorrow  = new Date(today.getTime() + DAY);
  const yesterday = new Date(today.getTime() - DAY);
  const due       = startOfDay(new Date(dueDate));

  if (due.getTime() === today.getTime())     return 'Today';
  if (due.getTime() === tomorrow.getTime())  return 'Tomorrow';
  if (due.getTime() === yesterday.getTime()) return 'Yesterday';

  if (due.getFullYear() === today.getFullYear()) {
    return due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Full due-date label for a task row: prepends "Overdue · " for open overdue tasks.
 */
export function dueDateLabel(dueDate: string, status: 'open' | 'completed'): string {
  if (status === 'completed') return formatDueDate(dueDate);
  if (isOverdue(dueDate))     return `Overdue · ${formatDueDate(dueDate)}`;
  return formatDueDate(dueDate);
}

/** Returns "FirstName LastName" from a contact-like object. */
export function fullName(contact: { firstName: string; lastName: string }): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}
