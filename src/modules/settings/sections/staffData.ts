/* staffData.ts — demo-only catalogs for the Staff settings + edit drawer.
 * All cosmetic / session-only; nothing here is persisted or sent anywhere. */

export interface RoleOption {
  id: string;
  label: string;
  desc: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'admin', label: 'Admin', desc: 'Full access to every area and all settings.' },
  { id: 'user', label: 'User', desc: 'Day-to-day access; limited account settings.' },
  { id: 'restricted', label: 'Restricted', desc: 'Only the areas you explicitly enable below.' },
];

export interface PermissionItem {
  key: string;
  label: string;
}

export interface PermissionGroup {
  id: string;
  label: string;
  items: PermissionItem[];
}

/** GHL-style permission matrix — grouped toggles. Enough rows to feel real. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'crm',
    label: 'CRM',
    items: [
      { key: 'contacts', label: 'Contacts' },
      { key: 'opportunities', label: 'Opportunities' },
      { key: 'tasks', label: 'Tasks' },
      { key: 'companies', label: 'Companies' },
      { key: 'bulk_actions', label: 'Bulk actions' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    items: [
      { key: 'conversations', label: 'Conversations' },
      { key: 'phone_calls', label: 'Phone & calls' },
      { key: 'voicemail', label: 'Voicemail drops' },
      { key: 'templates', label: 'Message templates' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { key: 'campaigns', label: 'Email & SMS campaigns' },
      { key: 'workflows', label: 'Automations / workflows' },
      { key: 'funnels', label: 'Funnels & sites' },
      { key: 'reputation', label: 'Reputation / reviews' },
    ],
  },
  {
    id: 'commerce',
    label: 'Payments & Calendars',
    items: [
      { key: 'payments', label: 'Payments & invoices' },
      { key: 'calendars', label: 'Calendars & booking' },
      { key: 'reporting', label: 'Reporting dashboards' },
    ],
  },
  {
    id: 'admin',
    label: 'Account administration',
    items: [
      { key: 'settings', label: 'Account settings' },
      { key: 'manage_staff', label: 'Manage staff & roles' },
      { key: 'phone_numbers', label: 'Phone numbers & compliance' },
      { key: 'billing', label: 'Billing' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key),
);

/** Default enabled-permission set per role. */
export function defaultPermissions(role: string): Record<string, boolean> {
  const all = (v: boolean) =>
    Object.fromEntries(ALL_PERMISSION_KEYS.map((k) => [k, v])) as Record<string, boolean>;

  if (role === 'admin') return all(true);
  if (role === 'restricted') {
    const base = all(false);
    base.contacts = true;
    base.conversations = true;
    base.tasks = true;
    return base;
  }
  // 'user' (and anything else): everything except account-admin keys
  const base = all(true);
  base.settings = false;
  base.manage_staff = false;
  base.phone_numbers = false;
  base.billing = false;
  return base;
}

export const TIMEZONES: string[] = [
  'America/New_York (ET)',
  'America/Chicago (CT)',
  'America/Denver (MT)',
  'America/Los_Angeles (PT)',
  'America/Phoenix (MST)',
  'America/Anchorage (AKT)',
  'Pacific/Honolulu (HST)',
  'UTC',
  'Europe/London (GMT)',
  'Europe/Berlin (CET)',
  'Australia/Sydney (AET)',
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
