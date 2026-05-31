/**
 * Productivity module — demo data + shared constants.
 *
 * EVERYTHING HERE IS FICTIONAL AND DEMO-SAFE:
 *  - No real names, emails, phones, or companies from the source repos.
 *  - Emails use @example.com; phones use +1 (555) ...
 *  - No backend, no network, no auth, no Supabase/Prisma. Pure in-memory seed
 *    data consumed by the Productivity workspace (see state.tsx).
 *
 * The shape lineage is documented in types.ts. Stage/status/priority catalogs
 * live here so every view (boards, lists, calendar, timeline, settings) reads
 * from one source of truth.
 */

import type {
  ActivityItem,
  Doc,
  DocCategory,
  Person,
  Priority,
  Project,
  ProjectStatus,
  Subtask,
  Task,
  TaskStatus,
  TaskType,
  Ticket,
  TicketChannel,
  TicketStage,
} from './types';

/* ───────────────────────────── helpers ───────────────────────────── */

let seq = 0;
/** Collision-resistant id for runtime-created records (demo session only). */
export function uid(prefix = 'p'): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

/** ISO timestamp `days` away from now (negative = past), at the given hour. */
export function iso(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* ───────────────────────────── people ───────────────────────────── */

export const TEAM: Person[] = [
  { id: 'u_me', name: 'Demo User', email: 'demo.user@example.com', role: 'Workspace Admin' },
  { id: 'u_alex', name: 'Alex Morgan', email: 'alex.morgan@example.com', role: 'Support Lead' },
  { id: 'u_jordan', name: 'Jordan Lee', email: 'jordan.lee@example.com', role: 'Project Manager' },
  { id: 'u_taylor', name: 'Taylor Brooks', email: 'taylor.brooks@example.com', role: 'Account Manager' },
  { id: 'u_riley', name: 'Riley Chen', email: 'riley.chen@example.com', role: 'Designer' },
  { id: 'u_sam', name: 'Sam Patel', email: 'sam.patel@example.com', role: 'Developer' },
];

export const CURRENT_USER_ID = 'u_me';

export function personById(id?: string): Person | undefined {
  return TEAM.find((p) => p.id === id);
}

export function personName(id?: string): string {
  return personById(id)?.name ?? 'Unassigned';
}

/** Demo-safe companies for ticket requesters / project clients. */
export const DEMO_COMPANIES = [
  'Acme Demo Co',
  'BrightPath Services',
  'Northstar Client Group',
  'Summit Studio',
  'Riverside Group',
];

/* ─────────────────────── catalogs / constants ─────────────────────── */

export type Tone = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';

export interface StageMeta<T extends string> {
  id: T;
  label: string;
  tone: Tone;
  /** Accent hex used for board column headers + dots (inline-styled). */
  accent: string;
}

export const TICKET_STAGES: StageMeta<TicketStage>[] = [
  { id: 'open', label: 'Open', tone: 'brand', accent: '#2563eb' },
  { id: 'in_progress', label: 'In Progress', tone: 'warn', accent: '#d97706' },
  { id: 'waiting', label: 'Waiting', tone: 'neutral', accent: '#7c3aed' },
  { id: 'resolved', label: 'Resolved', tone: 'good', accent: '#12895f' },
  { id: 'closed', label: 'Closed', tone: 'neutral', accent: '#64748b' },
];

export const TASK_STATUSES: StageMeta<TaskStatus>[] = [
  { id: 'todo', label: 'To Do', tone: 'neutral', accent: '#64748b' },
  { id: 'in_progress', label: 'In Progress', tone: 'brand', accent: '#2563eb' },
  { id: 'review', label: 'Review', tone: 'warn', accent: '#d97706' },
  { id: 'done', label: 'Done', tone: 'good', accent: '#12895f' },
];

export const PRIORITIES: { id: Priority; label: string; tone: Tone; accent: string }[] = [
  { id: 'urgent', label: 'Urgent', tone: 'bad', accent: '#dc2626' },
  { id: 'high', label: 'High', tone: 'bad', accent: '#ea580c' },
  { id: 'medium', label: 'Medium', tone: 'warn', accent: '#d97706' },
  { id: 'low', label: 'Low', tone: 'neutral', accent: '#64748b' },
];

export const CHANNEL_LABEL: Record<TicketChannel, string> = {
  email: 'Email',
  chat: 'Live Chat',
  phone: 'Phone',
  internal: 'Internal',
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  task: 'Task',
  bug: 'Bug',
  feature: 'Feature',
  chore: 'Chore',
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: Tone }> = {
  planning: { label: 'Planning', tone: 'neutral' },
  on_track: { label: 'On Track', tone: 'good' },
  at_risk: { label: 'At Risk', tone: 'bad' },
  on_hold: { label: 'On Hold', tone: 'warn' },
  completed: { label: 'Completed', tone: 'brand' },
};

export const DOC_CATEGORY_LABEL: Record<DocCategory, string> = {
  support: 'Support',
  onboarding: 'Onboarding',
  process: 'Process',
  project: 'Project',
};

/** Editable in Settings (seed values). */
export const TICKET_CATEGORIES = ['Billing', 'Technical', 'Onboarding', 'Feature Request', 'General'];
export const TASK_TYPES_SETTING = ['Task', 'Bug', 'Feature', 'Chore'];
export const PROJECT_TEMPLATES = ['Website Refresh', 'Customer Onboarding', 'Support Process Setup', 'Marketing Campaign'];

export const priorityMeta = (p: Priority) => PRIORITIES.find((x) => x.id === p)!;
export const ticketStageMeta = (s: TicketStage) => TICKET_STAGES.find((x) => x.id === s)!;
export const taskStatusMeta = (s: TaskStatus) => TASK_STATUSES.find((x) => x.id === s)!;

/* ───────────────────────────── seed: tickets ───────────────────────────── */

const note = (authorId: string, body: string, dayOffset: number): Comment0 => ({
  id: uid('note'),
  authorId,
  body,
  createdAt: iso(dayOffset, 11),
});

// local alias so the helper above stays readable
type Comment0 = { id: string; authorId: string; body: string; createdAt: string };

function act(kind: ActivityItem['kind'], text: string, dayOffset: number, actorId?: string): ActivityItem {
  return { id: uid('act'), kind, text, at: iso(dayOffset, 10), actorId };
}

export function seedTickets(): Ticket[] {
  return [
    {
      id: 'tk1', number: 'TK-1042', subject: 'Invoice total does not match plan',
      body: 'A customer reports their latest invoice is higher than the quoted monthly plan. Needs a billing review and a corrected statement.',
      stage: 'open', priority: 'high', channel: 'email',
      assigneeId: 'u_alex', requester: 'Dana Whitfield', requesterEmail: 'dana.w@example.com', company: 'Acme Demo Co',
      tags: ['billing', 'refund'], unread: true,
      createdAt: iso(-1, 8), updatedAt: iso(0, 9), dueAt: iso(1, 17),
      notes: [note('u_alex', 'Confirmed the proration ran twice this cycle. Drafting a corrected invoice.', 0)],
      activity: [act('created', 'Ticket created from inbound email', -1), act('assign', 'Assigned to Alex Morgan', -1, 'u_jordan')],
      linkedTaskIds: ['t3'],
    },
    {
      id: 'tk2', number: 'TK-1043', subject: 'Cannot log in after password reset',
      body: 'User completed a password reset but the new password is rejected at sign-in. Suspect a caching issue on their device.',
      stage: 'in_progress', priority: 'urgent', channel: 'chat',
      assigneeId: 'u_sam', requester: 'Marcus Reed', requesterEmail: 'marcus.r@example.com', company: 'BrightPath Services',
      tags: ['login', 'auth'], unread: false,
      createdAt: iso(-2, 14), updatedAt: iso(0, 8), dueAt: iso(0, 17),
      notes: [], activity: [act('created', 'Ticket created from live chat', -2), act('status', 'Moved to In Progress', 0, 'u_sam')],
      linkedTaskIds: [],
    },
    {
      id: 'tk3', number: 'TK-1044', subject: 'Request: export contacts to CSV',
      body: 'Customer would like a bulk export of all contacts including custom fields. Feature request for the data team to scope.',
      stage: 'waiting', priority: 'medium', channel: 'email',
      assigneeId: 'u_jordan', requester: 'Priya Nair', requesterEmail: 'priya.n@example.com', company: 'Northstar Client Group',
      tags: ['feature-request', 'export'], unread: false,
      createdAt: iso(-4, 10), updatedAt: iso(-1, 15),
      notes: [note('u_jordan', 'Waiting on product to confirm the export field list.', -1)],
      activity: [act('created', 'Ticket created', -4), act('status', 'Moved to Waiting (pending product)', -1, 'u_jordan')],
      linkedTaskIds: ['t9'],
    },
    {
      id: 'tk4', number: 'TK-1045', subject: 'Calendar booking link 404s on mobile',
      body: 'The public booking link returns a 404 on some mobile browsers. Needs reproduction and a fix.',
      stage: 'open', priority: 'high', channel: 'internal',
      assigneeId: 'u_sam', requester: 'Internal QA', company: 'Summit Studio',
      tags: ['bug', 'calendar', 'mobile'], unread: true,
      createdAt: iso(-1, 13), updatedAt: iso(-1, 13), dueAt: iso(2, 17),
      notes: [], activity: [act('created', 'Filed by internal QA sweep', -1)],
      linkedTaskIds: ['t2'],
    },
    {
      id: 'tk5', number: 'TK-1046', subject: 'How do I add a team member?',
      body: 'New customer asking how to invite teammates and set permissions. Send the onboarding doc and offer a walkthrough.',
      stage: 'resolved', priority: 'low', channel: 'chat',
      assigneeId: 'u_alex', requester: 'Erin Cole', requesterEmail: 'erin.c@example.com', company: 'Acme Demo Co',
      tags: ['onboarding', 'how-to'], unread: false,
      createdAt: iso(-3, 9), updatedAt: iso(-1, 16),
      notes: [note('u_alex', 'Shared the New Customer Checklist and offered a call.', -1)],
      activity: [act('created', 'Ticket created from live chat', -3), act('status', 'Marked Resolved', -1, 'u_alex')],
      linkedTaskIds: [],
    },
    {
      id: 'tk6', number: 'TK-1047', subject: 'Webhook deliveries failing intermittently',
      body: 'Customer integration is seeing ~10% webhook failures. Need to inspect retry logs and confirm endpoint health.',
      stage: 'in_progress', priority: 'high', channel: 'email',
      assigneeId: 'u_sam', requester: 'Owen Frye', requesterEmail: 'owen.f@example.com', company: 'Northstar Client Group',
      tags: ['integration', 'webhooks'], unread: false,
      createdAt: iso(-2, 11), updatedAt: iso(0, 9), dueAt: iso(3, 17),
      notes: [], activity: [act('created', 'Ticket created', -2), act('comment', 'Asked customer for a sample event id', -1, 'u_sam')],
      linkedTaskIds: [],
    },
    {
      id: 'tk7', number: 'TK-1048', subject: 'Double charge on annual upgrade',
      body: 'Customer upgraded to annual and was charged twice. Urgent billing correction and refund required.',
      stage: 'open', priority: 'urgent', channel: 'phone',
      assigneeId: 'u_alex', requester: 'Lena Hart', requesterEmail: 'lena.h@example.com', company: 'Riverside Group',
      tags: ['billing', 'refund', 'urgent'], unread: true,
      createdAt: iso(0, 8), updatedAt: iso(0, 8), dueAt: iso(0, 12),
      notes: [], activity: [act('created', 'Logged from inbound phone call', 0)],
      linkedTaskIds: [],
    },
    {
      id: 'tk8', number: 'TK-1049', subject: 'Feature idea: dark mode for dashboard',
      body: 'Customer suggestion to add a dark theme. Logged for the product backlog; low priority.',
      stage: 'waiting', priority: 'low', channel: 'chat',
      assigneeId: 'u_jordan', requester: 'Casey Lin', requesterEmail: 'casey.l@example.com', company: 'BrightPath Services',
      tags: ['feature-request', 'ui'], unread: false,
      createdAt: iso(-6, 15), updatedAt: iso(-2, 10),
      notes: [], activity: [act('created', 'Ticket created', -6)],
      linkedTaskIds: [],
    },
    {
      id: 'tk9', number: 'TK-1050', subject: 'Onboarding call no-show — reschedule',
      body: 'Customer missed the kickoff call. Reach out to reschedule and confirm the agenda.',
      stage: 'open', priority: 'medium', channel: 'email',
      assigneeId: 'u_taylor', requester: 'Grace Obi', requesterEmail: 'grace.o@example.com', company: 'Summit Studio',
      tags: ['onboarding'], unread: false,
      createdAt: iso(-1, 16), updatedAt: iso(-1, 16), dueAt: iso(-1, 17),
      notes: [], activity: [act('created', 'Ticket created', -1)],
      linkedTaskIds: ['t6'],
    },
    {
      id: 'tk10', number: 'TK-1051', subject: 'Spam submissions through contact form',
      body: 'A spike of spam form submissions. Recommend enabling captcha and a honeypot field.',
      stage: 'resolved', priority: 'medium', channel: 'internal',
      assigneeId: 'u_sam', requester: 'Internal QA', company: 'Acme Demo Co',
      tags: ['forms', 'spam'], unread: false,
      createdAt: iso(-5, 10), updatedAt: iso(-2, 14),
      notes: [note('u_sam', 'Enabled captcha + honeypot; submissions back to normal.', -2)],
      activity: [act('created', 'Filed by internal QA sweep', -5), act('status', 'Marked Resolved', -2, 'u_sam')],
      linkedTaskIds: [],
    },
    {
      id: 'tk11', number: 'TK-1052', subject: 'Email campaign images not loading',
      body: 'Images embedded in a marketing email are broken in some clients. Check hosting and alt text.',
      stage: 'closed', priority: 'low', channel: 'email',
      assigneeId: 'u_riley', requester: 'Tom Becker', requesterEmail: 'tom.b@example.com', company: 'Riverside Group',
      tags: ['marketing', 'email'], unread: false,
      createdAt: iso(-9, 9), updatedAt: iso(-7, 11),
      notes: [], activity: [act('created', 'Ticket created', -9), act('status', 'Closed — resolved by re-uploading assets', -7, 'u_riley')],
      linkedTaskIds: [],
    },
    {
      id: 'tk12', number: 'TK-1053', subject: 'Customer wants SSO / SAML support',
      body: 'Enterprise customer asking about SSO. Needs product scoping and a timeline estimate.',
      stage: 'waiting', priority: 'high', channel: 'phone',
      assigneeId: 'u_jordan', requester: 'Maria Santos', requesterEmail: 'maria.s@example.com', company: 'Northstar Client Group',
      tags: ['feature-request', 'security', 'enterprise'], unread: true,
      createdAt: iso(-3, 14), updatedAt: iso(-1, 9), dueAt: iso(5, 17),
      notes: [note('u_jordan', 'Flagged to product leadership for roadmap review.', -1)],
      activity: [act('created', 'Logged from inbound phone call', -3)],
      linkedTaskIds: [],
    },
  ];
}

/* ───────────────────────────── seed: tasks ───────────────────────────── */

const sub = (title: string, done = false): Subtask => ({ id: uid('sub'), title, done });
const comment = (authorId: string, body: string, dayOffset: number): Comment0 => ({
  id: uid('cm'), authorId, body, createdAt: iso(dayOffset, 13),
});

export function seedTasks(): Task[] {
  return [
    {
      id: 't1', title: 'Design new homepage hero section', description: 'Refresh the hero with the updated brand palette and a clearer primary CTA.',
      status: 'in_progress', priority: 'high', type: 'feature', assigneeId: 'u_riley', projectId: 'p1',
      tags: ['design', 'web'], startAt: iso(-2, 9), dueAt: iso(0, 17), points: 5,
      subtasks: [sub('Draft 3 layout options', true), sub('Pick palette', true), sub('Hand off to dev')],
      comments: [comment('u_jordan', 'Love option B — let’s run with that direction.', -1)],
      activity: [act('created', 'Task created', -2), act('status', 'Moved to In Progress', -1, 'u_riley')],
      createdAt: iso(-2, 9),
    },
    {
      id: 't2', title: 'Fix mobile booking link 404', description: 'Reproduce and fix the 404 on the public booking link for mobile browsers.',
      status: 'todo', priority: 'urgent', type: 'bug', assigneeId: 'u_sam', projectId: 'p3',
      tags: ['bug', 'calendar'], dueAt: iso(0, 17), points: 3,
      subtasks: [sub('Reproduce on iOS Safari'), sub('Reproduce on Android Chrome'), sub('Patch route')],
      comments: [], activity: [act('created', 'Created from ticket TK-1045', -1, 'u_sam')],
      createdAt: iso(-1, 13),
    },
    {
      id: 't3', title: 'Issue corrected invoice for Acme', description: 'Generate a corrected statement after the double-proration billing error.',
      status: 'in_progress', priority: 'high', type: 'task', assigneeId: 'u_alex', projectId: 'p4',
      tags: ['billing'], dueAt: iso(1, 17), points: 2,
      subtasks: [sub('Verify proration', true), sub('Generate corrected PDF'), sub('Email customer')],
      comments: [], activity: [act('created', 'Created from ticket TK-1042', 0, 'u_alex')],
      createdAt: iso(0, 9),
    },
    {
      id: 't4', title: 'Write Q3 onboarding email sequence', description: 'Three-email welcome series for new customers with checklist links.',
      status: 'review', priority: 'medium', type: 'task', assigneeId: 'u_taylor', projectId: 'p2',
      tags: ['onboarding', 'email'], startAt: iso(-5, 9), dueAt: iso(2, 17), points: 3,
      subtasks: [sub('Draft email 1', true), sub('Draft email 2', true), sub('Draft email 3', true)],
      comments: [comment('u_jordan', 'Tone is great. Tighten the subject lines before sending.', -1)],
      activity: [act('created', 'Task created', -5), act('status', 'Moved to Review', -1, 'u_taylor')],
      createdAt: iso(-5, 9),
    },
    {
      id: 't5', title: 'Audit pipeline stages and clean stale deals', description: 'Remove duplicate stages and archive deals older than 90 days.',
      status: 'todo', priority: 'medium', type: 'chore', assigneeId: 'u_jordan', projectId: 'p5',
      tags: ['crm', 'cleanup'], dueAt: iso(4, 17), points: 2,
      subtasks: [sub('Export current pipeline'), sub('Identify duplicates'), sub('Archive stale deals')],
      comments: [], activity: [act('created', 'Task created', -1)],
      createdAt: iso(-1, 10),
    },
    {
      id: 't6', title: 'Reschedule Summit Studio kickoff', description: 'Coordinate a new kickoff time after the missed call.',
      status: 'todo', priority: 'high', type: 'task', assigneeId: 'u_taylor', projectId: 'p2',
      tags: ['onboarding'], dueAt: iso(-1, 17), points: 1,
      subtasks: [], comments: [], activity: [act('created', 'Created from ticket TK-1050', -1, 'u_taylor')],
      createdAt: iso(-1, 16),
    },
    {
      id: 't7', title: 'Build reusable KPI card component', description: 'A small, themeable stat card for dashboards across the app.',
      status: 'done', priority: 'low', type: 'feature', assigneeId: 'u_sam', projectId: 'p1',
      tags: ['frontend', 'components'], startAt: iso(-7, 9), dueAt: iso(-2, 17), points: 3,
      subtasks: [sub('API design', true), sub('Implement', true), sub('Write stories', true)],
      comments: [], activity: [act('created', 'Task created', -7), act('status', 'Marked Done', -2, 'u_sam')],
      createdAt: iso(-7, 9),
    },
    {
      id: 't8', title: 'Prepare monthly support metrics report', description: 'Pull resolution times and CSAT for the leadership review.',
      status: 'todo', priority: 'medium', type: 'task', assigneeId: 'u_alex', projectId: 'p3',
      tags: ['support', 'reporting'], dueAt: iso(3, 17), points: 2,
      subtasks: [sub('Export ticket data'), sub('Chart resolution trend')],
      comments: [], activity: [act('created', 'Task created', 0)],
      createdAt: iso(0, 9),
    },
    {
      id: 't9', title: 'Scope CSV export with custom fields', description: 'Define the export field list and pagination approach.',
      status: 'in_progress', priority: 'medium', type: 'feature', assigneeId: 'u_jordan', projectId: 'p3',
      tags: ['export', 'product'], startAt: iso(-1, 9), dueAt: iso(2, 17), points: 5,
      subtasks: [sub('List exportable fields'), sub('Decide on async vs sync')],
      comments: [], activity: [act('created', 'Created from ticket TK-1044', -1, 'u_jordan')],
      createdAt: iso(-1, 9),
    },
    {
      id: 't10', title: 'Set up captcha on public forms', description: 'Add captcha + honeypot to reduce spam submissions.',
      status: 'done', priority: 'medium', type: 'chore', assigneeId: 'u_sam', projectId: 'p3',
      tags: ['forms', 'spam'], dueAt: iso(-2, 17), points: 1,
      subtasks: [sub('Add honeypot', true), sub('Enable captcha', true)],
      comments: [], activity: [act('created', 'Task created', -3), act('status', 'Marked Done', -2, 'u_sam')],
      createdAt: iso(-3, 10),
    },
    {
      id: 't11', title: 'Refresh help center article styling', description: 'Apply the new typography and spacing tokens to docs.',
      status: 'review', priority: 'low', type: 'task', assigneeId: 'u_riley', projectId: 'p1',
      tags: ['docs', 'design'], startAt: iso(-3, 9), dueAt: iso(1, 17), points: 2,
      subtasks: [sub('Update type scale', true), sub('Update code blocks')],
      comments: [], activity: [act('created', 'Task created', -3)],
      createdAt: iso(-3, 9),
    },
    {
      id: 't12', title: 'Draft support escalation policy', description: 'Document when and how to escalate Tier-1 tickets.',
      status: 'todo', priority: 'high', type: 'task', assigneeId: 'u_alex', projectId: 'p3',
      tags: ['process', 'support'], dueAt: iso(5, 17), points: 3,
      subtasks: [], comments: [], activity: [act('created', 'Task created', 0)],
      createdAt: iso(0, 9),
    },
    {
      id: 't13', title: 'Migrate avatars to new CDN', description: 'Move user avatars to the new CDN and update references.',
      status: 'todo', priority: 'low', type: 'chore', assigneeId: 'u_sam', projectId: 'p1',
      tags: ['infra'], dueAt: iso(7, 17), points: 2,
      subtasks: [], comments: [], activity: [act('created', 'Task created', -1)],
      createdAt: iso(-1, 11),
    },
    {
      id: 't14', title: 'Create welcome checklist template', description: 'A reusable in-app checklist for newly onboarded customers.',
      status: 'in_progress', priority: 'medium', type: 'feature', assigneeId: 'u_taylor', projectId: 'p2',
      tags: ['onboarding', 'template'], startAt: iso(-2, 9), dueAt: iso(3, 17), points: 3,
      subtasks: [sub('List checklist items', true), sub('Build template UI')],
      comments: [], activity: [act('created', 'Task created', -2)],
      createdAt: iso(-2, 9),
    },
    {
      id: 't15', title: 'Review and tag last week’s reviews', description: 'Triage new reviews and tag sentiment for the reputation report.',
      status: 'done', priority: 'low', type: 'task', assigneeId: 'u_jordan', projectId: 'p5',
      tags: ['reputation'], dueAt: iso(-3, 17), points: 1,
      subtasks: [], comments: [], activity: [act('created', 'Task created', -4), act('status', 'Marked Done', -3, 'u_jordan')],
      createdAt: iso(-4, 9),
    },
    {
      id: 't16', title: 'Plan Q3 marketing campaign calendar', description: 'Outline channels, cadence, and key dates for the campaign.',
      status: 'todo', priority: 'medium', type: 'task', assigneeId: 'u_taylor', projectId: 'p5',
      tags: ['marketing', 'planning'], dueAt: iso(6, 17), points: 3,
      subtasks: [sub('Pick channels'), sub('Draft calendar')],
      comments: [], activity: [act('created', 'Task created', 0)],
      createdAt: iso(0, 9),
    },
  ];
}

/* ───────────────────────────── seed: projects ───────────────────────────── */

const milestone = (title: string, dayOffset: number, done = false): Milestone0 => ({
  id: uid('ms'), title, dueAt: iso(dayOffset, 17), done,
});
type Milestone0 = { id: string; title: string; dueAt: string; done: boolean };

export function seedProjects(): Project[] {
  return [
    {
      id: 'p1', name: 'Website Refresh', description: 'Redesign the marketing site with the new brand system and faster pages.',
      status: 'on_track', ownerId: 'u_riley', startAt: iso(-10, 9), dueAt: iso(20, 17), color: '#2563eb',
      milestones: [milestone('Design system locked', -2, true), milestone('Homepage live', 8), milestone('Full site launch', 18)],
      activity: [act('created', 'Project kicked off', -10), act('system', 'Homepage hero in progress', -1)],
    },
    {
      id: 'p2', name: 'Customer Onboarding', description: 'Streamline the first-30-days experience for new customers.',
      status: 'at_risk', ownerId: 'u_taylor', startAt: iso(-14, 9), dueAt: iso(7, 17), color: '#d97706',
      milestones: [milestone('Welcome series drafted', -1, true), milestone('Checklist template shipped', 4), milestone('Process documented', 6)],
      activity: [act('created', 'Project kicked off', -14), act('system', 'Kickoff call rescheduled', -1)],
    },
    {
      id: 'p3', name: 'Support Process Setup', description: 'Stand up SLAs, escalation paths, and reporting for the support desk.',
      status: 'on_track', ownerId: 'u_alex', startAt: iso(-7, 9), dueAt: iso(14, 17), color: '#12895f',
      milestones: [milestone('Spam controls live', -2, true), milestone('Escalation policy', 5), milestone('Monthly report automated', 12)],
      activity: [act('created', 'Project kicked off', -7)],
    },
    {
      id: 'p4', name: 'Pipeline Cleanup', description: 'Tidy billing edge cases and reconcile recent invoice issues.',
      status: 'planning', ownerId: 'u_jordan', startAt: iso(-2, 9), dueAt: iso(12, 17), color: '#7c3aed',
      milestones: [milestone('Audit billing errors', 3), milestone('Corrected invoices sent', 6)],
      activity: [act('created', 'Project created', -2)],
    },
    {
      id: 'p5', name: 'Review Campaign', description: 'Drive more customer reviews and improve reputation reporting.',
      status: 'on_hold', ownerId: 'u_taylor', startAt: iso(-5, 9), dueAt: iso(25, 17), color: '#0ea5e9',
      milestones: [milestone('Channel plan', 6), milestone('Campaign calendar', 9), milestone('Launch', 20)],
      activity: [act('created', 'Project created', -5), act('system', 'Paused pending budget approval', -2)],
    },
  ];
}

/* ───────────────────────────── seed: docs ───────────────────────────── */

export function seedDocs(): Doc[] {
  return [
    {
      id: 'd1', title: 'Support SOP', category: 'support', authorId: 'u_alex', updatedAt: iso(-1, 16),
      tags: ['support', 'sop'],
      body: [
        '# Support Standard Operating Procedure',
        '',
        'This SOP describes how the support team triages, responds to, and resolves tickets.',
        '',
        '## 1. Triage',
        '- Check the Tickets board every morning and after lunch.',
        '- Set a priority: Urgent, High, Medium, or Low.',
        '- Assign an owner. Unassigned tickets are picked up by the Support Lead.',
        '',
        '## 2. First response',
        '- Acknowledge within 1 business hour for Urgent/High.',
        '- Use a friendly, plain-language tone. Avoid jargon.',
        '',
        '## 3. Resolution',
        '- Move the ticket through stages: Open → In Progress → Waiting → Resolved → Closed.',
        '- Add an internal note summarizing the fix before resolving.',
        '',
        '## 4. Escalation',
        '- See the Ticket Escalation Guide for when to escalate to engineering.',
      ].join('\n'),
    },
    {
      id: 'd2', title: 'New Customer Checklist', category: 'onboarding', authorId: 'u_taylor', updatedAt: iso(-3, 11),
      tags: ['onboarding', 'checklist'],
      body: [
        '# New Customer Checklist',
        '',
        'Use this checklist for every newly signed customer.',
        '',
        '- [ ] Send the welcome email and schedule a kickoff call.',
        '- [ ] Confirm the primary account contact and billing contact.',
        '- [ ] Walk through inviting team members and setting permissions.',
        '- [ ] Import existing contacts and verify custom fields.',
        '- [ ] Set up the first pipeline and a starter automation.',
        '- [ ] Share the help center and the Support SOP.',
        '- [ ] Book a 30-day check-in.',
      ].join('\n'),
    },
    {
      id: 'd3', title: 'Project Kickoff Notes', category: 'project', authorId: 'u_jordan', updatedAt: iso(-2, 15),
      tags: ['project', 'kickoff'],
      body: [
        '# Project Kickoff Notes',
        '',
        'A lightweight template to run a project kickoff.',
        '',
        '## Goals',
        'Describe the outcome in one or two sentences. What does success look like?',
        '',
        '## Scope',
        'List what is in scope and, just as important, what is out of scope.',
        '',
        '## Owners & roles',
        'Name the project owner and the contributors for each workstream.',
        '',
        '## Milestones',
        'Capture the 3–5 key milestones and target dates. Mirror these on the Timeline.',
        '',
        '## Risks',
        'Note anything that could put the timeline at risk and how you will mitigate it.',
      ].join('\n'),
    },
    {
      id: 'd4', title: 'Ticket Escalation Guide', category: 'process', authorId: 'u_alex', updatedAt: iso(-4, 10),
      tags: ['support', 'escalation', 'process'],
      body: [
        '# Ticket Escalation Guide',
        '',
        'When a Tier-1 agent cannot resolve a ticket, follow these steps.',
        '',
        '## When to escalate',
        '- The issue requires a code change or a backend investigation.',
        '- A customer is blocked and the priority is Urgent.',
        '- The ticket has been in Waiting for more than 3 business days.',
        '',
        '## How to escalate',
        '1. Add an internal note with everything you have tried.',
        '2. Create a linked task and assign it to the right engineer.',
        '3. Move the ticket to Waiting and tag it `escalated`.',
        '4. Notify the Support Lead in the team channel.',
        '',
        '## After escalation',
        'Keep the customer updated at least once per day until resolved.',
      ].join('\n'),
    },
    {
      id: 'd5', title: 'Brand & Voice Quick Reference', category: 'process', authorId: 'u_riley', updatedAt: iso(-6, 13),
      tags: ['brand', 'writing'],
      body: [
        '# Brand & Voice Quick Reference',
        '',
        'Keep customer-facing writing consistent.',
        '',
        '## Voice',
        'Warm, clear, and confident. Write like a helpful human, not a manual.',
        '',
        '## Do',
        '- Use short sentences and active voice.',
        '- Lead with the answer, then the detail.',
        '',
        '## Avoid',
        '- Jargon and internal acronyms.',
        '- Over-promising on timelines.',
      ].join('\n'),
    },
  ];
}
