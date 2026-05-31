/**
 * Calendar module — demo data (session-only, no PII, no real APIs).
 *
 * Provides the richer GoHighLevel-style calendar catalog used by the Calendar
 * Settings experience, plus a small deterministic set of extra appointments so
 * the newly-added calendars also appear "alive" on the grid and list.
 *
 * The first three catalog entries deliberately reuse the seed calendar ids
 * (`cal_discovery`, `cal_demo`, `cal_consult`) so the ~28 seeded appointments
 * and the `bookAppointment` store action keep resolving to a real calendar.
 */
import type { Appointment, Contact, ID } from '@/types';
import type {
  CalendarGroup,
  CalendarMeta,
  CalendarTypeDef,
  ConnectionAccount,
  DateOverride,
  ScheduleDay,
} from './types';

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (n: number) => iso(Date.now() - n * DAY);

/* ── Calendar type archetypes (the "create calendar" chooser) ─────────────── */
export const CALENDAR_TYPES: CalendarTypeDef[] = [
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Distribute bookings across a team by availability or priority.',
    detail:
      'Incoming bookings are automatically assigned to the next available team member. Great for sales and support teams that share a single booking link.',
    bestFor: ['Sales teams', 'Shared inboxes', 'Even workload distribution'],
  },
  {
    id: 'event',
    name: 'Event Calendar',
    description: 'A simple one-on-one calendar for a single host.',
    detail:
      'A classic personal booking calendar tied to one host. Invitees pick any open slot in your availability.',
    bestFor: ['1:1 meetings', 'Discovery calls', 'Personal scheduling'],
  },
  {
    id: 'service',
    name: 'Service Calendar',
    description: 'Book specific services with their own duration and staff.',
    detail:
      'Each service can carry its own duration, price and assigned staff. Ideal for service businesses presenting a menu of offerings.',
    bestFor: ['Service menus', 'Salons & clinics', 'Per-service durations'],
  },
  {
    id: 'class',
    name: 'Class Booking',
    description: 'One host, many attendees for the same time slot.',
    detail:
      'Sell multiple seats for the same session. Capacity and waitlists keep group sessions organised.',
    bestFor: ['Workshops', 'Webinars', 'Group classes'],
  },
  {
    id: 'collective',
    name: 'Collective Booking',
    description: 'Require several team members to attend together.',
    detail:
      'Only offers times when every required host is free, then books all of them at once. Perfect for panels and joint calls.',
    bestFor: ['Panel interviews', 'Joint demos', 'Multi-host calls'],
  },
];

export const CALENDAR_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CALENDAR_TYPES.map((t) => [t.id, t.name]),
);

/* ── Calendar groups / folders ─────────────────────────────────────────────── */
export const CALENDAR_GROUPS: CalendarGroup[] = [
  { id: 'grp_sales', name: 'Sales Team', description: 'Lead-facing booking calendars' },
  { id: 'grp_onboarding', name: 'Onboarding', description: 'New-client kickoff & setup' },
  { id: 'grp_support', name: 'Support', description: 'Customer success & support calls' },
  { id: 'grp_general', name: 'General', description: 'Uncategorised calendars' },
];

export const CALENDAR_GROUP_LABEL: Record<string, string> = Object.fromEntries(
  CALENDAR_GROUPS.map((g) => [g.id, g.name]),
);

/* ── Calendar catalog (10 calendars; first three reuse seed ids) ──────────── */
export const CALENDAR_CATALOG: CalendarMeta[] = [
  {
    id: 'cal_discovery', name: 'Discovery Call', color: '#1f6feb', groupId: 'grp_sales',
    type: 'event', durationMin: 30, status: 'active', slug: 'discovery-call', ownerId: 'u_2',
    createdAt: daysAgo(146), updatedAt: daysAgo(4),
    description: 'Intro call for new inbound leads.', inviteTitle: 'Discovery Call with {{contact.first_name}}',
  },
  {
    id: 'cal_demo', name: 'Demo', color: '#12986a', groupId: 'grp_sales',
    type: 'event', durationMin: 45, status: 'active', slug: 'product-demo', ownerId: 'u_2',
    createdAt: daysAgo(132), updatedAt: daysAgo(9),
    description: 'Live product walkthrough.', inviteTitle: 'Product Demo with {{contact.first_name}}',
  },
  {
    id: 'cal_consult', name: 'Consultation', color: '#d99111', groupId: 'grp_sales',
    type: 'round_robin', durationMin: 30, status: 'active', slug: 'consultation', ownerId: 'u_3',
    createdAt: daysAgo(120), updatedAt: daysAgo(2),
    description: 'Strategy consultation, round-robin across the sales team.', inviteTitle: 'Consultation',
  },
  {
    id: 'cal_sales', name: 'Sales Call Calendar', color: '#7c3aed', groupId: 'grp_sales',
    type: 'round_robin', durationMin: 30, status: 'active', slug: 'sales-call', ownerId: 'u_3',
    createdAt: daysAgo(98), updatedAt: daysAgo(11),
    description: 'Outbound sales calls shared across reps.', inviteTitle: 'Sales Call',
  },
  {
    id: 'cal_service', name: 'Service Appointment Calendar', color: '#0d9488', groupId: 'grp_support',
    type: 'service', durationMin: 60, status: 'active', slug: 'service-appointment', ownerId: 'u_4',
    createdAt: daysAgo(80), updatedAt: daysAgo(6),
    description: 'On-site and remote service appointments.', inviteTitle: 'Service Appointment',
  },
  {
    id: 'cal_followup', name: 'Follow-Up Calendar', color: '#4f46e5', groupId: 'grp_sales',
    type: 'event', durationMin: 15, status: 'active', slug: 'follow-up', ownerId: 'u_2',
    createdAt: daysAgo(64), updatedAt: daysAgo(1),
    description: 'Quick 15-minute follow-up touchpoints.', inviteTitle: 'Follow-Up Call',
  },
  {
    id: 'cal_booking', name: 'Demo Booking Calendar', color: '#db2777', groupId: 'grp_sales',
    type: 'collective', durationMin: 45, status: 'active', slug: 'demo-booking', ownerId: 'u_2',
    createdAt: daysAgo(52), updatedAt: daysAgo(7),
    description: 'Joint demo with an SE and an AE.', inviteTitle: 'Team Demo',
  },
  {
    id: 'cal_support', name: 'Support Call Calendar', color: '#0891b2', groupId: 'grp_support',
    type: 'round_robin', durationMin: 30, status: 'active', slug: 'support-call', ownerId: 'u_4',
    createdAt: daysAgo(40), updatedAt: daysAgo(3),
    description: 'Customer support call queue.', inviteTitle: 'Support Call',
  },
  {
    id: 'cal_onboarding', name: 'Onboarding Session', color: '#ea580c', groupId: 'grp_onboarding',
    type: 'collective', durationMin: 60, status: 'active', slug: 'onboarding-session', ownerId: 'u_3',
    createdAt: daysAgo(28), updatedAt: daysAgo(5),
    description: 'New-client kickoff and account setup.', inviteTitle: 'Onboarding Session',
  },
  {
    id: 'cal_class', name: 'Group Class Booking', color: '#e11d48', groupId: 'grp_general',
    type: 'class', durationMin: 90, status: 'draft', slug: 'group-class', ownerId: 'u_me',
    createdAt: daysAgo(12), updatedAt: daysAgo(12),
    description: 'Group training class (draft — not yet published).', inviteTitle: 'Group Class',
  },
];

/* ── Default weekly availability (Mon–Fri 9–5, Sat half day) ──────────────── */
export const DEFAULT_SCHEDULE: ScheduleDay[] = [
  { day: 'sun', label: 'Sunday',    enabled: false, ranges: [] },
  { day: 'mon', label: 'Monday',    enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
  { day: 'tue', label: 'Tuesday',   enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
  { day: 'wed', label: 'Wednesday', enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
  { day: 'thu', label: 'Thursday',  enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
  { day: 'fri', label: 'Friday',    enabled: true,  ranges: [{ start: '09:00', end: '16:00' }] },
  { day: 'sat', label: 'Saturday',  enabled: false, ranges: [{ start: '10:00', end: '14:00' }] },
];

export const DEFAULT_OVERRIDES: DateOverride[] = [
  { id: 'ovr_1', date: nextDateStr(20), label: 'Team offsite', unavailable: true },
  { id: 'ovr_2', date: nextDateStr(34), label: 'Half day', unavailable: false, ranges: [{ start: '09:00', end: '12:00' }] },
];

export const TIMEZONES: string[] = [
  '(GMT-08:00) Pacific Time — US & Canada',
  '(GMT-07:00) Mountain Time — US & Canada',
  '(GMT-06:00) Central Time — US & Canada',
  '(GMT-05:00) Eastern Time — US & Canada',
  '(GMT+00:00) UTC',
  '(GMT+01:00) Central European Time',
];

/* ── Connections (mock connected accounts, keyed by staff user id) ────────── */
export const CONNECTIONS_BY_USER: Record<ID, ConnectionAccount[]> = {
  u_me: [
    { id: 'conn_1', provider: 'google', label: 'Google Calendar', email: 'demo.user@example.com', status: 'connected', primary: true, kind: 'calendar' },
    { id: 'conn_2', provider: 'google_meet', label: 'Google Meet', status: 'connected', kind: 'video' },
  ],
  u_2: [
    { id: 'conn_3', provider: 'outlook', label: 'Outlook Calendar', email: 'priya.raman@example.com', status: 'connected', primary: true, kind: 'calendar' },
    { id: 'conn_4', provider: 'zoom', label: 'Zoom', status: 'syncing', kind: 'video' },
  ],
  u_3: [
    { id: 'conn_5', provider: 'google', label: 'Google Calendar', email: 'marcus.bell@example.com', status: 'error', primary: true, kind: 'calendar' },
  ],
  u_4: [], // no connections yet → exercises the empty state
};

/* ── Deterministic extra appointments for the new calendars ───────────────── */

/** Build a "YYYY-MM-DD" string `n` days from today. */
function nextDateStr(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ExtraSpec {
  calId: ID;
  dayOffset: number; // relative to today
  hour: number;
  minute: number;
  durationMin: number;
  contactIdx: number; // index into the contacts array (wrapped)
  location: string;
}

// Spread across the visible month for the 7 newer calendars so every calendar
// shows activity. Offsets are deterministic (no Math.random) for a stable demo.
const EXTRA_SPECS: ExtraSpec[] = [
  { calId: 'cal_sales',      dayOffset: -3, hour: 11, minute: 0,  durationMin: 30, contactIdx: 4,  location: 'Phone' },
  { calId: 'cal_sales',      dayOffset: 2,  hour: 14, minute: 30, durationMin: 30, contactIdx: 9,  location: 'Phone' },
  { calId: 'cal_service',    dayOffset: 1,  hour: 9,  minute: 0,  durationMin: 60, contactIdx: 14, location: 'On-site' },
  { calId: 'cal_service',    dayOffset: 6,  hour: 13, minute: 0,  durationMin: 60, contactIdx: 21, location: 'On-site' },
  { calId: 'cal_followup',   dayOffset: 0,  hour: 16, minute: 0,  durationMin: 15, contactIdx: 2,  location: 'Phone' },
  { calId: 'cal_followup',   dayOffset: 4,  hour: 10, minute: 15, durationMin: 15, contactIdx: 30, location: 'Phone' },
  { calId: 'cal_booking',    dayOffset: 3,  hour: 15, minute: 0,  durationMin: 45, contactIdx: 7,  location: 'Zoom (link in invite)' },
  { calId: 'cal_support',    dayOffset: -1, hour: 10, minute: 30, durationMin: 30, contactIdx: 12, location: 'Zoom (link in invite)' },
  { calId: 'cal_support',    dayOffset: 8,  hour: 11, minute: 30, durationMin: 30, contactIdx: 25, location: 'Zoom (link in invite)' },
  { calId: 'cal_onboarding', dayOffset: 5,  hour: 9,  minute: 30, durationMin: 60, contactIdx: 18, location: 'Zoom (link in invite)' },
];

/**
 * Generate extra appointments for the newer calendars. Past entries get a
 * realistic completed/outcome status; future entries are confirmed.
 */
export function buildExtraAppointments(contacts: Contact[]): Appointment[] {
  if (contacts.length === 0) return [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const base = startOfToday.getTime();
  const now = Date.now();

  return EXTRA_SPECS.map((spec, i) => {
    const cal = CALENDAR_CATALOG.find((c) => c.id === spec.calId);
    const contact = contacts[spec.contactIdx % contacts.length];
    const start = base + spec.dayOffset * DAY + spec.hour * 3_600_000 + spec.minute * 60_000;
    const end = start + spec.durationMin * 60_000;
    const past = start < now;
    const status: Appointment['status'] = past
      ? (i % 4 === 0 ? 'no_show' : 'showed')
      : 'confirmed';
    return {
      id: `appt_x${i + 1}`,
      calendarId: spec.calId,
      contactId: contact.id,
      title: `${cal?.name ?? 'Appointment'} — ${contact.firstName} ${contact.lastName}`,
      startTime: iso(start),
      endTime: iso(end),
      status,
      location: spec.location,
    };
  });
}
