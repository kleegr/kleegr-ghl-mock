/**
 * Productivity module — local type definitions.
 *
 * These types are intentionally self-contained (not imported from
 * src/types/index.ts) so the Productivity demo module owns its own shapes and
 * can evolve without touching the protected global data layer. All data is
 * in-memory and demo-safe — see data.ts.
 *
 * UX lineage:
 *  - Ticket shapes adapt the support-desk model from kleegr/Ticketing
 *    (stage workflow, channel, priority, read/unread, assignee, ticket number).
 *  - Task / Project / Doc shapes adapt the project-management model from
 *    kleegr/meridian (statuses, subtasks, comments, activity, story points,
 *    milestones, SOP/wiki docs).
 */

export type ID = string;

/** Shared priority scale used by both tickets and tasks. */
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

/** A lightweight activity/timeline entry shown in detail drawers. */
export interface ActivityItem {
  id: ID;
  /** Coarse category — drives the icon shown in the timeline. */
  kind: 'created' | 'status' | 'comment' | 'assign' | 'note' | 'due' | 'system';
  text: string;
  /** ISO timestamp. */
  at: string;
  actorId?: ID;
}

/** A threaded comment (tasks) or internal note body. */
export interface Comment {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: string;
}

/* ───────────────────────── Tickets (from Ticketing) ───────────────────────── */

export type TicketStage = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketChannel = 'email' | 'chat' | 'phone' | 'internal';

export interface Ticket {
  id: ID;
  /** Human-facing reference, e.g. "TK-1042". */
  number: string;
  subject: string;
  body: string;
  stage: TicketStage;
  priority: Priority;
  channel: TicketChannel;
  assigneeId?: ID;
  /** Demo-safe requester display name. */
  requester: string;
  requesterEmail?: string;
  company?: string;
  tags: string[];
  unread: boolean;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  /** Internal notes (Ticketing's TicketNotesPanel). */
  notes: Comment[];
  /** Threaded activity timeline (Ticketing's ThreadAwareTimeline). */
  activity: ActivityItem[];
  /** Optional links to follow-up tasks (Ticketing's TicketTasksPanel). */
  linkedTaskIds: ID[];
}

/* ────────────────────────── Tasks (from Meridian) ────────────────────────── */

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskType = 'task' | 'bug' | 'feature' | 'chore';

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  assigneeId?: ID;
  projectId?: ID;
  tags: string[];
  startAt?: string;
  dueAt?: string;
  /** Story points (Meridian). */
  points?: number;
  subtasks: Subtask[];
  comments: Comment[];
  activity: ActivityItem[];
  createdAt: string;
}

/* ───────────────────────── Projects (from Meridian) ───────────────────────── */

export type ProjectStatus =
  | 'planning'
  | 'on_track'
  | 'at_risk'
  | 'on_hold'
  | 'completed';

export interface Milestone {
  id: ID;
  title: string;
  dueAt: string;
  done: boolean;
}

export interface Project {
  id: ID;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: ID;
  startAt: string;
  dueAt: string;
  /** Hex color used for the timeline bar + accents. */
  color: string;
  milestones: Milestone[];
  activity: ActivityItem[];
}

/* ─────────────────────────── Docs / Wiki (Meridian SOP) ─────────────────────── */

export type DocCategory = 'support' | 'onboarding' | 'process' | 'project';

export interface Doc {
  id: ID;
  title: string;
  category: DocCategory;
  authorId: ID;
  updatedAt: string;
  /** Plain-text / lightweight markdown body. */
  body: string;
  tags: string[];
}

/* ───────────────────────────────── People ──────────────────────────────────── */

/** Demo-safe team member used for assignees, owners, and comment authors. */
export interface Person {
  id: ID;
  name: string;
  email: string;
  role: string;
}
