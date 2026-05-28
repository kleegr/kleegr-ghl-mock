/**
 * Tasks utilities — group/filter types and helpers.
 * Shared between Tasks.tsx and future tutorial configs.
 */
import type { Task } from '@/types';

export type TaskFilter = 'all' | 'mine' | 'today' | 'overdue' | 'completed';
export type TaskGroup = 'overdue' | 'today' | 'upcoming' | 'completed';

/**
 * Classifies a task into a display group based on its due date and status.
 * Always call with tasks from the store (ISO dueDate strings).
 */
export function getTaskGroup(task: Task): TaskGroup {
  if (task.status === 'completed') return 'completed';
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (due < today) return 'overdue';
  if (due < tomorrow) return 'today';
  return 'upcoming';
}

/** Render order for groups in the task list. */
export const GROUP_ORDER: TaskGroup[] = ['overdue', 'today', 'upcoming', 'completed'];

export const GROUP_LABEL: Record<TaskGroup, string> = {
  overdue: 'Overdue',
  today: 'Due Today',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

export const GROUP_TONE: Record<TaskGroup, 'bad' | 'warn' | 'neutral' | 'good'> = {
  overdue: 'bad',
  today: 'warn',
  upcoming: 'neutral',
  completed: 'good',
};
