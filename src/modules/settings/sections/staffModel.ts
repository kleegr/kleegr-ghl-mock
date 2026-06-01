import type { User } from '@/types';

/**
 * Shared staff model for Settings -> Staff.
 *
 * Seeded from the demo store's users (so names/ids match the rest of the app)
 * and enriched with the fields a GHL-style staff editor needs (permissions,
 * call routing, availability). Everything here is session-local and demo-safe.
 */

export type StaffRole = 'Admin' | 'User';
export type StaffStatus = 'active' | 'invited' | 'disabled';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface DayAvailability {
  enabled: boolean;
  from: string;
  to: string;
}

export interface CallSettings {
  forwardToPhone: boolean;
  routing: 'web' | 'phone' | 'both';
  timeoutSec: number;
  recordCalls: boolean;
  whatsapp: boolean;
  voicemailGreeting: string;
}

export interface StaffMember {
  id: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  title: string;
  timezone: string;
  signature: string;
  isCurrentUser?: boolean;
  permissions: Record<string, boolean>;
  call: CallSettings;
  availability: Record<Weekday, DayAvailability>;
}

/* --- Permission catalog --- */
export interface PermissionGroup {
  id: string;
  label: string;
  permissions: { id: string; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'contacts',
    label: 'Contacts',
    permissions: [
      { id: 'contacts.view', label: 'View contacts' },
      { id: 'contacts.edit', label: 'Create & edit contacts' },
      { id: 'contacts.delete', label: 'Delete contacts' },
      { id: 'contacts.export', label: 'Export contacts' },
    ],
  },
  {
    id: 'conversations',
    label: 'Conversations',
    permissions: [
      { id: 'conv.view', label: 'View conversations' },
      { id: 'conv.send', label: 'Send messages' },
      { id: 'conv.delete', label: 'Delete conversations' },
    ],
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    permissions: [
      { id: 'opp.view', label: 'View opportunities' },
      { id: 'opp.edit', label: 'Edit opportunities' },
      { id: 'opp.delete', label: 'Delete opportunities' },
    ],
  },
  {
    id: 'calendars',
    label: 'Calendars',
    permissions: [
      { id: 'cal.view', label: 'View calendars' },
      { id: 'cal.book', label: 'Book appointments' },
      { id: 'cal.manage', label: 'Manage availability' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    permissions: [
      { id: 'pay.view', label: 'View invoices & payments' },
      { id: 'pay.create', label: 'Create invoices' },
      { id: 'pay.refund', label: 'Issue refunds' },
    ],
  },
  {
    id: 'phone',
    label: 'Phone & Voice',
    permissions: [
      { id: 'phone.call', label: 'Make & receive calls' },
      { id: 'phone.logs', label: 'View call logs' },
      { id: 'phone.numbers', label: 'Manage phone numbers' },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    permissions: [
      { id: 'rep.view', label: 'View dashboards & reports' },
      { id: 'rep.export', label: 'Export reports' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Account',
    permissions: [
      { id: 'set.staff', label: 'Manage staff & permissions' },
      { id: 'set.account', label: 'Manage account settings' },
      { id: 'set.billing', label: 'Access billing' },
    ],
  },
];

export const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));

/** Default permission map for a role - Admin gets everything, User a safe subset. */
export function defaultPermissions(role: StaffRole): Record<string, boolean> {
  const userGrants = new Set([
    'contacts.view', 'contacts.edit', 'contacts.export',
    'conv.view', 'conv.send',
    'opp.view', 'opp.edit',
    'cal.view', 'cal.book',
    'pay.view', 'pay.create',
    'phone.call', 'phone.logs',
    'rep.view',
  ]);
  const map: Record<string, boolean> = {};
  for (const id of ALL_PERMISSION_IDS) map[id] = role === 'Admin' ? true : userGrants.has(id);
  return map;
}

function defaultAvailability(): Record<Weekday, DayAvailability> {
  const out = {} as Record<Weekday, DayAvailability>;
  for (const d of WEEKDAYS) {
    const weekend = d === 'Sat' || d === 'Sun';
    out[d] = { enabled: !weekend, from: '09:00', to: '17:00' };
  }
  return out;
}

function defaultCall(): CallSettings {
  return {
    forwardToPhone: true,
    routing: 'web',
    timeoutSec: 25,
    recordCalls: true,
    whatsapp: false,
    voicemailGreeting: "You've reached Demo Business. Please leave a message and we'll call you right back.",
  };
}

const splitName = (name: string): [string, string] => {
  const parts = name.trim().split(/\s+/);
  return [parts[0] ?? '', parts.slice(1).join(' ')];
};

/** Build the staff list: store users first, then a couple of demo-only members. */
export function buildStaff(users: User[]): StaffMember[] {
  const fromStore = users.map((u): StaffMember => {
    const [first, last] = splitName(u.name);
    const role: StaffRole = u.role === 'admin' ? 'Admin' : 'User';
    return {
      id: u.id,
      first,
      last,
      email: u.email,
      phone: u.phone ?? '+1 (555) 010-0100',
      role,
      status: (u.status as StaffStatus) ?? 'active',
      title: u.title ?? (role === 'Admin' ? 'Account Admin' : 'Team Member'),
      timezone: 'America/New_York',
      signature: `${u.name}\n${u.title ?? 'Demo Business'}`,
      isCurrentUser: u.isCurrentUser,
      permissions: defaultPermissions(role),
      call: defaultCall(),
      availability: defaultAvailability(),
    };
  });

  const extras: StaffMember[] = [
    {
      id: 'u_demo_5',
      first: 'Jordan',
      last: 'Kim',
      email: 'jordan.kim@example.com',
      phone: '+1 (555) 010-0105',
      role: 'User',
      status: 'active',
      title: 'Onboarding Coordinator',
      timezone: 'America/Chicago',
      signature: 'Jordan Kim\nOnboarding Coordinator',
      permissions: defaultPermissions('User'),
      call: defaultCall(),
      availability: defaultAvailability(),
    },
    {
      id: 'u_demo_6',
      first: 'Sam',
      last: 'Rivera',
      email: 'sam.rivera@example.com',
      phone: '+1 (555) 010-0106',
      role: 'User',
      status: 'disabled',
      title: 'Marketing Assistant',
      timezone: 'America/Los_Angeles',
      signature: 'Sam Rivera\nMarketing Assistant',
      permissions: defaultPermissions('User'),
      call: defaultCall(),
      availability: defaultAvailability(),
    },
  ];

  return [...fromStore, ...extras];
}

export const STAFF_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'UTC',
];

export const fullStaffName = (m: StaffMember) => `${m.first} ${m.last}`.trim();

/** A blank member for the "Add User" flow (demo-safe defaults). */
export function blankStaffMember(): StaffMember {
  return {
    id: `u_new_${Date.now()}`,
    first: '',
    last: '',
    email: '',
    phone: '',
    role: 'User',
    status: 'invited',
    title: '',
    timezone: 'America/New_York',
    signature: '',
    permissions: defaultPermissions('User'),
    call: defaultCall(),
    availability: defaultAvailability(),
  };
}
