/**
 * automationData.ts — DEMO-ONLY catalogs & derived display data for the
 * Automations / Workflows module.
 *
 * Everything here is cosmetic, in-memory, and never persisted. No real
 * triggers/actions fire, no API calls are made. These structures back the
 * screenshot-faithful Workflows list, Overview dashboard, and Builder pickers.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Phone, PhoneOutgoing, MessageSquare, MessagesSquare, Cake, Users, UserPlus, UserX,
  UserCheck, UserCog, UserSearch, Bell, Tag, CalendarClock, StickyNote,
  FileText, FilePen, FilePlus2, FileCheck2, CheckSquare, Mail, Plus, Sparkles,
  Upload, Building2, Link2,
} from 'lucide-react';

/* ── Picker catalogs (Add Trigger / Add Action panels) ─────────────────── */

export interface CatalogItem {
  id: string;
  label: string;
  icon: LucideIcon;
}
export interface CatalogGroup {
  id: string;
  label: string;
  items: CatalogItem[];
  defaultOpen?: boolean;
}

/** Add-Trigger panel groups (matches the trigger picker screenshot). */
export const TRIGGER_GROUPS: CatalogGroup[] = [
  {
    id: 'recent',
    label: 'Recent Triggers',
    defaultOpen: true,
    items: [
      { id: 'call_details', label: 'Call Details', icon: Phone },
      { id: 'customer_replied', label: 'Customer Replied', icon: MessagesSquare },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    defaultOpen: true,
    items: [
      { id: 'birthday_reminder', label: 'Birthday Reminder', icon: Cake },
      { id: 'contact_changed', label: 'Contact Changed', icon: Users },
      { id: 'contact_created', label: 'Contact Created', icon: UserPlus },
      { id: 'contact_dnd', label: 'Contact DND', icon: UserX },
      { id: 'contact_tag', label: 'Contact Tag', icon: Tag },
      { id: 'custom_date_reminder', label: 'Custom Date Reminder', icon: CalendarClock },
      { id: 'note_added', label: 'Note Added', icon: StickyNote },
      { id: 'note_changed', label: 'Note Changed', icon: FilePen },
      { id: 'task_added', label: 'Task Added', icon: CheckSquare },
    ],
  },
];

/** Add-Action panel groups (matches the action picker screenshot). */
export const ACTION_GROUPS: CatalogGroup[] = [
  {
    id: 'recent',
    label: 'Recent Actions',
    defaultOpen: true,
    items: [
      { id: 'create_assoc_record', label: 'Create Associated Record For Contact', icon: FilePlus2 },
      { id: 'assign_to_user', label: 'Assign To User', icon: UserCheck },
      { id: 'send_internal_notification', label: 'Send Internal Notification', icon: Bell },
      { id: 'log_external_call', label: 'Log external call', icon: PhoneOutgoing },
      { id: 'call', label: 'Call', icon: Phone },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    defaultOpen: true,
    items: [
      { id: 'create_contact', label: 'Create Contact', icon: UserPlus },
      { id: 'find_contact', label: 'Find Contact', icon: UserSearch },
      { id: 'update_contact_field', label: 'Update Contact Field', icon: UserCog },
      { id: 'add_contact_tag', label: 'Add Contact Tag', icon: Tag },
      { id: 'remove_contact_tag', label: 'Remove Contact Tag', icon: Tag },
      { id: 'assign_to_user_2', label: 'Assign To User', icon: UserCheck },
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
  'When form is submitted, send SMS to lead, wait 5 minutes for response - if no response create call',
  'If appointment status changes to no-show, wait 15 minutes then send SMS asking to reschedule',
  'Set up welcome series with 5 emails over 21 days introducing brand story, best sellers, customer reviews',
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

/* ── Folder rows (cosmetic, shown atop the All Workflows list) ──────────── */

export interface FolderRow { id: string; name: string; updated: string; created: string; }
export const FOLDERS: FolderRow[] = [
  { id: 'fld_archives', name: 'Archives', updated: 'Jan 06 2026, 10:43 AM', created: 'Jan 06 2026, 10:43 AM' },
  { id: 'fld_stage_timing', name: 'Stage Timing', updated: 'Jan 15 2026, 3:21 PM', created: 'Jan 15 2026, 3:21 PM' },
  { id: 'fld_david', name: 'Z.00 David Azuaje WFs', updated: 'Mar 03 2026, 11:07 AM', created: 'Mar 03 2026, 11:05 AM' },
];

/* ── Workflow templates (New Workflow modal) ───────────────────────────── */

export interface TemplateItem { id: string; name: string; desc: string; }
export const TEMPLATES: TemplateItem[] = [
  { id: 't1', name: 'New Lead Follow-up', desc: 'Instant text + email on form submit, task for owner.' },
  { id: 't2', name: 'Missed Call Text-Back', desc: 'Instant SMS reply when a call is missed.' },
  { id: 't3', name: 'Appointment Reminder', desc: '24h + 1h SMS/email reminders.' },
  { id: 't4', name: 'Review Request', desc: 'Ask for a Google review after a deal closes.' },
  { id: 't5', name: 'Blank Workflow', desc: 'Start from scratch with no steps.' },
];

/* ── Overview (Beta) demo metrics ──────────────────────────────────────── */

export interface EnrollPoint { week: string; value: number; }
export const ENROLLMENT_TREND: EnrollPoint[] = [
  { week: 'Apr 12 - Apr 18', value: 135 },
  { week: 'Apr 19 - Apr 25', value: 195 },
  { week: 'Apr 26 - May 2', value: 115 },
  { week: 'May 3 - May 9', value: 205 },
  { week: 'May 10 - May 16', value: 385 },
  { week: 'May 17 - May 23', value: 500 },
  { week: 'May 24 - May 30', value: 285 },
];

export const TRIGGER_ANALYSIS = { attempted: '8.9K', matched: '1.2K', unmatched: '7.7K' };

export interface OverviewError { id: string; name: string; lastError: string; }
export const OVERVIEW_ERRORS: OverviewError[] = [
  { id: 'err_yiddish', name: 'Yiddish Transcript', lastError: 'Last error: 15 days ago' },
];

/* ── Deterministic demo timestamps ─────────────────────────────────────── */
/* Workflow type carries no dates, so we synthesise stable per-id values for
 * the Last Updated / Created On columns. Captured once at module load so the
 * displayed strings don't drift between renders. */

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
  // Mostly 0 (mirrors the reference screenshots) with the occasional handful.
  return hashStr(seed) % 5 === 0 ? hashStr(seed) % 4 : 0;
}
