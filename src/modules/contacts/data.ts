/**
 * Contacts module — local demo data & domain helpers.
 *
 * Everything here is module-scoped and session-only. It deliberately lives
 * inside the Contacts workstream (rather than the shared seed) so the CRM screen
 * can be enriched without touching src/data/seed.ts. All identities are
 * demo-safe (generic labels, no real people/businesses).
 */
import type { Contact } from '@/types';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/* ─────────────────────────── Smart lists / saved views ─────────────────────────── */

export interface SmartListDef {
  id: string;
  label: string;
  /** Short helper line shown in the saved-views rail. */
  hint: string;
  /** Lucide icon name resolved in the rail component. */
  icon: 'users' | 'sparkles' | 'flame' | 'star' | 'clock' | 'bell';
  predicate: (c: Contact) => boolean;
}

export const SMART_LISTS: SmartListDef[] = [
  { id: 'all', label: 'All Contacts', hint: 'Everyone in the database', icon: 'users', predicate: () => true },
  {
    id: 'new_leads',
    label: 'New Leads',
    hint: 'Tagged “lead”, added in the last 30 days',
    icon: 'sparkles',
    predicate: (c) => c.tags.includes('lead') && Date.now() - new Date(c.createdAt).getTime() < THIRTY_DAYS,
  },
  {
    id: 'hot_leads',
    label: 'Hot Leads',
    hint: 'Flagged hot or consult-booked',
    icon: 'flame',
    predicate: (c) => c.tags.includes('hot') || c.tags.includes('consult-booked'),
  },
  {
    id: 'customers',
    label: 'Customers',
    hint: 'VIPs and past clients',
    icon: 'star',
    predicate: (c) => c.tags.some((t) => t === 'vip' || t === 'past-client'),
  },
  {
    id: 'recently_active',
    label: 'Recently Active',
    hint: 'Activity in the last 7 days',
    icon: 'clock',
    predicate: (c) => Date.now() - new Date(c.lastActivityAt).getTime() < SEVEN_DAYS,
  },
  {
    id: 'needs_follow_up',
    label: 'Needs Follow-Up',
    hint: 'Follow-up tag or quiet for 30+ days',
    icon: 'bell',
    predicate: (c) =>
      c.tags.includes('follow-up') ||
      c.tags.includes('no-show') ||
      Date.now() - new Date(c.lastActivityAt).getTime() > THIRTY_DAYS,
  },
];

export function smartListById(id: string): SmartListDef {
  return SMART_LISTS.find((s) => s.id === id) ?? SMART_LISTS[0];
}

/* ─────────────────────────── Advanced filters ─────────────────────────── */

export type FilterFieldType = 'text' | 'select' | 'number' | 'date' | 'boolean';

export interface FilterFieldDef {
  id: string;
  label: string;
  type: FilterFieldType;
  /** For select fields, the choices (owners/sources are injected at runtime). */
  options?: string[];
  /** Marks owner/source fields whose options come from live store data. */
  dynamic?: 'owner' | 'source' | 'tag';
}

export const FILTER_FIELDS: FilterFieldDef[] = [
  { id: 'firstName', label: 'First Name', type: 'text' },
  { id: 'lastName', label: 'Last Name', type: 'text' },
  { id: 'email', label: 'Email', type: 'text' },
  { id: 'phone', label: 'Phone', type: 'text' },
  { id: 'tags', label: 'Tag', type: 'select', dynamic: 'tag' },
  { id: 'source', label: 'Source', type: 'select', dynamic: 'source' },
  { id: 'ownerId', label: 'Owner', type: 'select', dynamic: 'owner' },
  { id: 'dnd', label: 'DND', type: 'boolean' },
  { id: 'hasCompany', label: 'Has Company', type: 'boolean' },
  { id: 'leadScore', label: 'Lead Score', type: 'number' },
  { id: 'createdAt', label: 'Created Date', type: 'date' },
  { id: 'lastActivityAt', label: 'Last Activity', type: 'date' },
];

export interface OperatorDef {
  id: string;
  label: string;
}

export const OPERATORS: Record<FilterFieldType, OperatorDef[]> = {
  text: [
    { id: 'contains', label: 'contains' },
    { id: 'eq', label: 'is' },
    { id: 'neq', label: 'is not' },
    { id: 'starts', label: 'starts with' },
    { id: 'empty', label: 'is empty' },
  ],
  select: [
    { id: 'eq', label: 'is' },
    { id: 'neq', label: 'is not' },
  ],
  number: [
    { id: 'eq', label: '=' },
    { id: 'gt', label: '>' },
    { id: 'lt', label: '<' },
    { id: 'gte', label: '≥' },
    { id: 'lte', label: '≤' },
  ],
  date: [
    { id: 'before', label: 'before' },
    { id: 'after', label: 'after' },
    { id: 'last7', label: 'in last 7 days' },
    { id: 'last30', label: 'in last 30 days' },
  ],
  boolean: [
    { id: 'true', label: 'is yes' },
    { id: 'false', label: 'is no' },
  ],
};

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export type FilterMatch = 'all' | 'any';

export function fieldDef(id: string): FilterFieldDef | undefined {
  return FILTER_FIELDS.find((f) => f.id === id);
}

/** Evaluate a single condition against a contact. Unknown fields pass through. */
function matchCondition(c: Contact, cond: FilterCondition): boolean {
  const def = fieldDef(cond.field);
  if (!def) return true;
  const raw = cond.value.trim().toLowerCase();

  if (def.type === 'boolean') {
    const flag = cond.field === 'dnd' ? c.dnd : cond.field === 'hasCompany' ? Boolean(c.companyId) : false;
    return cond.operator === 'true' ? flag : !flag;
  }

  if (def.type === 'number') {
    const n = Number(c.customFields.leadScore ?? 0);
    const target = Number(cond.value);
    if (Number.isNaN(target)) return true;
    switch (cond.operator) {
      case 'eq': return n === target;
      case 'gt': return n > target;
      case 'lt': return n < target;
      case 'gte': return n >= target;
      case 'lte': return n <= target;
      default: return true;
    }
  }

  if (def.type === 'date') {
    const t = cond.field === 'createdAt' ? new Date(c.createdAt).getTime() : new Date(c.lastActivityAt).getTime();
    switch (cond.operator) {
      case 'last7': return Date.now() - t < SEVEN_DAYS;
      case 'last30': return Date.now() - t < THIRTY_DAYS;
      case 'before': return cond.value ? t < new Date(cond.value).getTime() : true;
      case 'after': return cond.value ? t > new Date(cond.value).getTime() : true;
      default: return true;
    }
  }

  // text / select
  if (cond.field === 'tags') {
    if (cond.operator === 'neq') return !c.tags.includes(cond.value);
    return c.tags.includes(cond.value);
  }
  const hay = String((c as unknown as Record<string, unknown>)[cond.field] ?? '').toLowerCase();
  switch (cond.operator) {
    case 'contains': return hay.includes(raw);
    case 'eq': return hay === raw;
    case 'neq': return hay !== raw;
    case 'starts': return hay.startsWith(raw);
    case 'empty': return hay.length === 0;
    default: return true;
  }
}

/** Apply a full advanced-filter set (AND/OR) to a contact list. */
export function applyAdvancedFilters(
  contacts: Contact[],
  conditions: FilterCondition[],
  match: FilterMatch,
): Contact[] {
  const active = conditions.filter((c) => c.field && c.operator);
  if (active.length === 0) return contacts;
  return contacts.filter((c) =>
    match === 'all' ? active.every((cond) => matchCondition(c, cond)) : active.some((cond) => matchCondition(c, cond)),
  );
}

/* ─────────────────────────── Add-contact options ─────────────────────────── */

export const CONTACT_TYPES = ['Lead', 'Customer', 'Prospect', 'Partner'] as const;

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

export const CONTACT_SOURCES = [
  'Facebook Ads', 'Google Ads', 'Website Form', 'Referral',
  'Instagram', 'Cold Outreach', 'Walk-in', 'Webinar',
];

/* ─────────────────────────── Bulk actions / job history ─────────────────────────── */

export type BulkJobStatus = 'completed' | 'running' | 'queued' | 'failed';

export interface BulkJob {
  id: string;
  action: string;
  createdBy: string;
  status: BulkJobStatus;
  total: number;
  completed: number;
  createdAt: string;
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** Seed history so the Bulk Actions screen reads like a real, used account. */
export const INITIAL_BULK_JOBS: BulkJob[] = [
  { id: 'job_seed_1', action: 'Add Tag · “newsletter”', createdBy: 'Demo User', status: 'completed', total: 38, completed: 38, createdAt: minsAgo(60 * 26) },
  { id: 'job_seed_2', action: 'Assign Owner · Priya Raman', createdBy: 'Demo User', status: 'completed', total: 12, completed: 12, createdAt: minsAgo(60 * 9) },
  { id: 'job_seed_3', action: 'Export Contacts (CSV)', createdBy: 'Marcus Bell', status: 'completed', total: 52, completed: 52, createdAt: minsAgo(60 * 5) },
  { id: 'job_seed_4', action: 'Remove Tag · “no-show”', createdBy: 'Demo User', status: 'running', total: 7, completed: 4, createdAt: minsAgo(3) },
];

/* ─────────────────────────── Import wizard ─────────────────────────── */

export const IMPORT_TARGET_FIELDS = [
  { id: 'firstName', label: 'First Name' },
  { id: 'lastName', label: 'Last Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'source', label: 'Source' },
  { id: 'tags', label: 'Tags' },
  { id: 'company', label: 'Company' },
  { id: '__skip', label: '— Do not import —' },
];

export interface ImportColumn {
  csvHeader: string;
  /** Suggested mapping target id (editable in step 2). */
  suggested: string;
  sample: string;
}

/** A demo-safe sample file — what a user would see after “uploading” a CSV. */
export const SAMPLE_IMPORT = {
  fileName: 'contacts_import_sample.csv',
  rowCount: 24,
  columns: [
    { csvHeader: 'First Name', suggested: 'firstName', sample: 'Jordan' },
    { csvHeader: 'Last Name', suggested: 'lastName', sample: 'Avery' },
    { csvHeader: 'Email Address', suggested: 'email', sample: 'jordan.avery@example.com' },
    { csvHeader: 'Mobile', suggested: 'phone', sample: '+1 (555) 248-1190' },
    { csvHeader: 'Lead Source', suggested: 'source', sample: 'Website Form' },
    { csvHeader: 'Labels', suggested: 'tags', sample: 'lead; newsletter' },
    { csvHeader: 'Business', suggested: 'company', sample: 'Northwind Trading Co' },
    { csvHeader: 'Internal Note', suggested: '__skip', sample: 'imported batch 7' },
  ] as ImportColumn[],
  preview: [
    { firstName: 'Jordan', lastName: 'Avery', email: 'jordan.avery@example.com', phone: '+1 (555) 248-1190', source: 'Website Form' },
    { firstName: 'Sasha', lastName: 'Lindgren', email: 'sasha.lindgren@example.com', phone: '+1 (555) 771-0034', source: 'Referral' },
    { firstName: 'Mateo', lastName: 'Cordova', email: 'mateo.cordova@example.com', phone: '+1 (555) 410-2287', source: 'Google Ads' },
    { firstName: 'Priya', lastName: 'Nandakumar', email: 'priya.n@example.com', phone: '+1 (555) 902-6651', source: 'Walk-in' },
    { firstName: 'Devon', lastName: 'Mwangi', email: 'devon.mwangi@example.com', phone: '+1 (555) 338-7712', source: 'Instagram' },
  ],
};
