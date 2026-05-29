/**
 * automationData.ts — DEMO-ONLY catalogs & derived display data for the
 * Automations / Workflows module.
 *
 * Everything here is cosmetic, in-memory, and never persisted. No real
 * triggers/actions fire, no API calls are made. These structures back the
 * screenshot-faithful Workflows list, Overview dashboard, and Builder pickers.
 *
 * The catalogs are intentionally small and educational: each picker item
 * carries a category, a one-line explanation, and an example use case so a
 * first-time demo visitor understands what every trigger and action does.
 */
import type { LucideIcon } from 'lucide-react';
import {
  PhoneMissed, MessageSquare, MessagesSquare, Cake, UserPlus, UserCheck,
  UserSearch, Bell, Tag, CalendarClock, CalendarCheck, StickyNote, GitBranch,
  Briefcase, CircleDollarSign, Star, ArrowRightLeft, Clock, Split,
  FileText, FileCheck2, CheckSquare, Mail, Plus, Sparkles, Upload, Building2, Link2,
} from 'lucide-react';

/* ── Picker catalogs (Add Trigger / Add Action panels) ─────────────────── */

export interface CatalogItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Short category tag shown under the item name. */
  category?: string;
  /** One-line "what this does" explanation. */
  desc?: string;
  /** Example use case shown in the picker. */
  example?: string;
}
export interface CatalogGroup {
  id: string;
  label: string;
  items: CatalogItem[];
  defaultOpen?: boolean;
}

/** Add-Trigger panel groups — real GHL triggers, each explained. */
export const TRIGGER_GROUPS: CatalogGroup[] = [
  {
    id: 'recommended',
    label: 'Recommended',
    defaultOpen: true,
    items: [
      { id: 'form_submitted', label: 'Form Submitted', icon: FileText, category: 'Contacts & Leads', desc: 'Starts the workflow when a contact submits a form.', example: 'e.g. follow up the second someone completes your "Free Quote" form.' },
      { id: 'missed_call', label: 'Missed Call', icon: PhoneMissed, category: 'Calls', desc: 'Starts when an inbound call is missed (no-answer or busy).', example: 'e.g. text back every caller you could not reach.' },
      { id: 'appointment_status', label: 'Appointment Status Changed', icon: CalendarClock, category: 'Appointments', desc: 'Starts when an appointment is booked or its status changes.', example: 'e.g. send reminders, then recover no-shows.' },
      { id: 'opportunity_stage', label: 'Opportunity Stage Changed', icon: GitBranch, category: 'Sales Pipeline', desc: 'Starts when a deal moves to a new pipeline stage.', example: 'e.g. follow up when a deal enters "Follow-Up".' },
    ],
  },
  {
    id: 'contact',
    label: 'Contacts & Leads',
    defaultOpen: true,
    items: [
      { id: 'contact_created', label: 'Contact Created', icon: UserPlus, category: 'Contacts & Leads', desc: 'Starts when a new contact is added in any way.', example: 'e.g. send a welcome text to every new contact.' },
      { id: 'tag_added', label: 'Tag Added', icon: Tag, category: 'Contacts & Leads', desc: 'Starts when a specific tag is applied to a contact.', example: 'e.g. begin onboarding when "new-client" is added.' },
      { id: 'customer_replied', label: 'Customer Replied', icon: MessagesSquare, category: 'Conversations', desc: 'Starts when a contact replies by SMS or email.', example: 'e.g. stop a drip the moment someone responds.' },
      { id: 'birthday_reminder', label: 'Birthday', icon: Cake, category: 'Contacts & Leads', desc: 'Starts on a contact\u2019s birthday.', example: 'e.g. send a birthday greeting with a small offer.' },
    ],
  },
  {
    id: 'appointments',
    label: 'Appointments',
    items: [
      { id: 'appointment_booked', label: 'Appointment Booked', icon: CalendarCheck, category: 'Appointments', desc: 'Starts when a new appointment is scheduled.', example: 'e.g. send prep instructions right after booking.' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Payments',
    items: [
      { id: 'opportunity_created', label: 'Opportunity Created', icon: Briefcase, category: 'Sales Pipeline', desc: 'Starts when a new opportunity (deal) is created.', example: 'e.g. assign and notify on every new deal.' },
      { id: 'invoice_paid', label: 'Invoice Paid', icon: CircleDollarSign, category: 'Payments', desc: 'Starts when an invoice is paid.', example: 'e.g. send a receipt and kick off onboarding.' },
    ],
  },
];

/** Add-Action panel groups — real GHL actions, each explained. */
export const ACTION_GROUPS: CatalogGroup[] = [
  {
    id: 'communication',
    label: 'Communication',
    defaultOpen: true,
    items: [
      { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, category: 'Communication', desc: 'Texts the contact from your business number.', example: 'e.g. instant reply to a brand-new lead.' },
      { id: 'send_email', label: 'Send Email', icon: Mail, category: 'Communication', desc: 'Sends a templated email to the contact.', example: 'e.g. a branded booking confirmation.' },
      { id: 'request_review', label: 'Request Review', icon: Star, category: 'Reputation', desc: 'Sends a Google review link by SMS or email.', example: 'e.g. ask for a review after a completed visit.' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact & Tags',
    defaultOpen: true,
    items: [
      { id: 'add_tag', label: 'Add Tag', icon: Tag, category: 'Contact & Tags', desc: 'Adds a tag to the contact.', example: 'e.g. tag "missed-call" for reporting.' },
      { id: 'remove_tag', label: 'Remove Tag', icon: Tag, category: 'Contact & Tags', desc: 'Removes a tag from the contact.', example: 'e.g. clear "lead" once they convert.' },
      { id: 'add_note', label: 'Add Note', icon: StickyNote, category: 'Contact & Tags', desc: 'Writes an internal note on the contact record.', example: 'e.g. log why the contact entered this flow.' },
      { id: 'create_contact', label: 'Create Contact', icon: UserPlus, category: 'Contact & Tags', desc: 'Creates a new contact record.', example: 'e.g. capture a referred friend.' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Pipeline',
    items: [
      { id: 'create_opportunity', label: 'Create Opportunity', icon: Briefcase, category: 'Sales Pipeline', desc: 'Opens a new deal in a pipeline stage.', example: 'e.g. create a deal when a lead form is submitted.' },
      { id: 'move_opportunity', label: 'Move Opportunity', icon: ArrowRightLeft, category: 'Sales Pipeline', desc: 'Moves a deal to a different pipeline stage.', example: 'e.g. advance to "No-Show / Re-engage".' },
      { id: 'assign_user', label: 'Assign To User', icon: UserCheck, category: 'Sales Pipeline', desc: 'Assigns the contact or deal to a team member.', example: 'e.g. round-robin new leads to sales.' },
    ],
  },
  {
    id: 'flow',
    label: 'Flow Control',
    items: [
      { id: 'wait', label: 'Wait', icon: Clock, category: 'Flow Control', desc: 'Pauses the workflow for a set time or until an event.', example: 'e.g. wait until 24 hours before an appointment.' },
      { id: 'if_else', label: 'If / Else Condition', icon: Split, category: 'Flow Control', desc: 'Branches the workflow based on a condition.', example: 'e.g. only continue for contacts marked no-show.' },
    ],
  },
  {
    id: 'internal',
    label: 'Internal & Tasks',
    items: [
      { id: 'send_notification', label: 'Send Internal Notification', icon: Bell, category: 'Internal', desc: 'Alerts a team member in-app or by email.', example: 'e.g. notify the rep about a missed call.' },
      { id: 'create_task', label: 'Create Task', icon: CheckSquare, category: 'Tasks', desc: 'Creates a task with a due date and an owner.', example: 'e.g. a "Call back" task due in 15 minutes.' },
      { id: 'find_contact', label: 'Find Contact', icon: UserSearch, category: 'Internal', desc: 'Looks up a contact to use later in the workflow.', example: 'e.g. match an inbound reply to an existing record.' },
    ],
  },
];

/* ── AI "What do you want to automate?" panel ──────────────────────────── */

export interface AiChip { id: string; label: string; icon: LucideIcon; tone: 'brand' | 'good' | 'bad'; }
export const AI_CHIPS: AiChip[] = [
  { id: 'lead_nurturing', label: 'Lead Nurturing', icon: UserPlus, tone: 'brand' },
  { id: 'form_automation', label: 'Form Automation', icon: FileText, tone: 'good' },
  { id: 'email_campaigns', label: 'Email Campaigns', icon: Mail, tone: 'bad' },
];

/** Rotating placeholder prompts shown in the AI composer (purely cosmetic). */
export const AI_PROMPTS: string[] = [
  'When a form is submitted, text the lead, assign a rep, and create a 1-hour call-back task',
  'If appointment status changes to no-show, wait 15 minutes then send an SMS asking to reschedule',
  'One hour after an appointment is completed, ask the client for a Google review by SMS and email',
];

/* ── "Create Workflow" dropdown options ────────────────────────────────── */

export interface CreateOption { id: string; label: string; icon: LucideIcon; }
export const CREATE_OPTIONS: CreateOption[] = [
  { id: 'scratch', label: 'Start from Scratch', icon: Plus },
  { id: 'ai', label: 'Build Using AI', icon: Sparkles },
  { id: 'template', label: 'Select from Template', icon: FileCheck2 },
  { id: 'campaign', label: 'Import from a campaign', icon: Upload },
  { id: 'company', label: 'Company based workflow', icon: Building2 },
  { id: 'urls', label: 'Urls based workflow', icon: Link2 },
];

/* ── Folder row (cosmetic, shown atop the All Workflows list) ──────────── */
/* Kept to a single archive folder so the five live workflows stay the focus. */

export interface FolderRow { id: string; name: string; updated: string; created: string; }
export const FOLDERS: FolderRow[] = [
  { id: 'fld_archives', name: 'Archived Workflows', updated: 'Jan 06 2026, 10:43 AM', created: 'Nov 22 2025, 9:15 AM' },
];

/* ── Workflow templates (New Workflow modal) ───────────────────────────── */

export interface TemplateItem { id: string; name: string; desc: string; }
export const TEMPLATES: TemplateItem[] = [
  { id: 't1', name: 'New Lead Speed-to-Lead', desc: 'Instant text + email, assign a rep, create a task, open the deal.' },
  { id: 't2', name: 'Missed Call Text-Back', desc: 'Instant SMS reply when an inbound call is missed.' },
  { id: 't3', name: 'Appointment Reminder + No-Show', desc: '24h & 1h reminders, then recover no-shows automatically.' },
  { id: 't4', name: 'Review Request', desc: 'Ask for a Google review after a completed appointment.' },
  { id: 't5', name: 'Pipeline Stage Follow-Up', desc: 'Keep deals moving when they enter the Follow-Up stage.' },
  { id: 't6', name: 'Blank Workflow', desc: 'Start from scratch with no steps.' },
];

/* ── Overview (Beta) demo metrics ──────────────────────────────────────── */
/* Scaled to match a five-workflow account: a few hundred enrollments total,
 * tens of new enrollments per week — never thousands. */

export interface EnrollPoint { week: string; value: number; }
export const ENROLLMENT_TREND: EnrollPoint[] = [
  { week: 'Apr 12 - Apr 18', value: 22 },
  { week: 'Apr 19 - Apr 25', value: 35 },
  { week: 'Apr 26 - May 2', value: 28 },
  { week: 'May 3 - May 9', value: 41 },
  { week: 'May 10 - May 16', value: 39 },
  { week: 'May 17 - May 23', value: 53 },
  { week: 'May 24 - May 30', value: 48 },
];

/** Number of actions executed across all workflows in the last 7 days. */
export const ACTIONS_THIS_WEEK = 28;

/** Trigger-match funnel, coherent with ~312 lifetime enrollments. */
export const TRIGGER_ANALYSIS = { attempted: '486', matched: '312', unmatched: '174' };

export interface OverviewError { id: string; name: string; lastError: string; }
export const OVERVIEW_ERRORS: OverviewError[] = [
  { id: 'wf_3', name: 'Appointment Reminder + No-Show Recovery', lastError: 'SMS step failed — invalid phone number · 2 days ago' },
];

/* ── Deterministic demo timestamps ─────────────────────────────────────── */
/* Used only as a fallback when a workflow has no explicit lastUpdatedAt /
 * createdAt. Captured once at module load so displayed strings don't drift. */

const NOW = Date.now();
const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function fmtStamp(d: Date): string {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')} ${d.getFullYear()}, ${h}:${m} ${ampm}`;
}

export function demoTimestamps(seed: string): { updated: string; created: string } {
  const h = hashStr(seed);
  const createdDaysAgo = 45 + (h % 320);
  const updatedDaysAgo = h % 30;
  const created = new Date(NOW - createdDaysAgo * DAY - (h % 18) * 3_600_000);
  const updated = new Date(NOW - updatedDaysAgo * DAY - (h % 11) * 3_600_000);
  return { updated: fmtStamp(updated), created: fmtStamp(created) };
}

/** Deterministic small "active enrolled" demo number derived from id. */
export function demoActiveEnrolled(seed: string, total: number): number {
  if (total === 0) return 0;
  return hashStr(seed) % 5 === 0 ? hashStr(seed) % 4 : 0;
}
