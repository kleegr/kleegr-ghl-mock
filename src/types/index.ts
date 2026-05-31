// Mock data models — shapes lean on GoHighLevel conventions (plan §17).
// All IDs are fake strings. Dates are ISO; the seeder shifts them relative to “today”.

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarColor: string;
  role: 'admin' | 'user';
  phone?: string;
  isCurrentUser?: boolean;
  /** Foundation fields for the upcoming Staff settings workstream (optional). */
  title?: string;
  status?: 'active' | 'invited' | 'disabled';
}

export interface Company {
  id: ID;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  contactIds: ID[];
  createdAt: string;
}

export interface Contact {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId?: ID;
  tags: string[];
  source: string;
  ownerId: ID;
  dnd: boolean;
  createdAt: string;
  lastActivityAt: string;
  customFields: Record<string, string | number | boolean>;
}

export type Channel =
  | 'sms'
  | 'email'
  | 'webchat'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'call';

export interface Message {
  id: ID;
  conversationId: ID;
  direction: 'inbound' | 'outbound';
  channel: Channel;
  body: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: ID;
  contactId: ID;
  channel: Channel;
  unread: boolean;
  starred?: boolean;
  lastMessageAt: string;
  assignedTo?: ID;
  messageIds: ID[];
}

export interface Stage {
  id: ID;
  name: string;
  order: number;
}
export interface Pipeline {
  id: ID;
  name: string;
  stages: Stage[];
}

export type OpportunityStatus = 'open' | 'won' | 'lost' | 'abandoned';

/**
 * Per-opportunity activity tallies. These drive the little icon badges on the
 * kanban card (calls / sms / emails / notes / tasks / appointments), so they
 * are real numbers on the record rather than a cosmetic hash.
 */
export interface OpportunityActivity {
  calls: number;
  sms: number;
  emails: number;
  notes: number;
  tasks: number;
  appointments: number;
}

export interface Opportunity {
  id: ID;
  name: string;
  contactId: ID;
  /** Denormalized business/company name shown on the card (GHL “Business Name”). */
  businessName?: string;
  pipelineId: ID;
  stageId: ID;
  monetaryValue: number;
  status: OpportunityStatus;
  ownerId: ID;
  /** User ids following the deal. */
  followers: ID[];
  source?: string;
  tags: string[];
  /** Real activity counts, surfaced on the card and used by the detail drawer. */
  activity: OpportunityActivity;
  /** Most recent touch (call/sms/email/note/etc). */
  lastActivityAt: string;
  /** When the next follow-up is due (set for the follow-up / appointment stages). */
  nextFollowUpAt?: string;
  /** Who created the record — a user name or an automation label like “Workflow”. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, string | number | boolean>;
}

export interface Calendar {
  id: ID;
  name: string;
  color: string;
}
export interface Appointment {
  id: ID;
  calendarId: ID;
  contactId: ID;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'showed' | 'no_show' | 'cancelled';
  location?: string;
  notes?: string;
}

export interface Workflow {
  id: ID;
  name: string;
  status: 'published' | 'draft';
  /** Lifetime "Total Enrolled" count shown in the list/overview. */
  enrolled: number;
  trigger: string;
  /** Plain-language "what this workflow does" note shown in the list + builder. */
  explanation?: string;
  /** Optional demo display metadata (all cosmetic, never persisted). */
  category?: string;
  /** Contacts currently moving through the workflow ("Active Enrolled" column). */
  activeEnrolled?: number;
  /** Pre-formatted display timestamps; fall back to derived values when absent. */
  lastUpdatedAt?: string;
  createdAt?: string;
  /** Flags a published workflow that has a recent execution error to review. */
  needsReview?: boolean;
  /** Short last-error string surfaced in the Needs Review tab + Overview. */
  lastError?: string;
}

export interface Campaign {
  id: ID;
  type: 'email' | 'sms';
  name: string;
  status: 'sent' | 'scheduled' | 'draft';
  audienceSize: number;
  sentAt?: string;
  metrics: {
    delivered?: number;
    openRate?: number;
    clickRate?: number;
    replyRate?: number;
    bounceRate?: number;
    optOutRate?: number;
  };
  content: { subject?: string; body: string };
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  dueDate: string;
  assigneeId: ID;
  contactId?: ID;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'completed';
}

export interface Review {
  id: ID;
  source: 'google' | 'facebook';
  rating: 1 | 2 | 3 | 4 | 5;
  author: string;
  text: string;
  createdAt: string;
  replied: boolean;
  replyText?: string;
}

export interface Call {
  id: ID;
  contactId: ID;
  direction: 'inbound' | 'outbound' | 'missed';
  durationSec: number;
  createdAt: string;
  voicemailTranscript?: string;
}

export interface Product {
  id: ID;
  name: string;
  price: number;
  type: 'one_time' | 'recurring';
}
export interface InvoiceLineItem {
  productId: ID;
  name: string;
  qty: number;
  unitPrice: number;
}
export interface Invoice {
  id: ID;
  number: string;
  contactId: ID;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedAt: string;
  dueAt: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface Notification {
  id: ID;
  type: 'new_lead' | 'missed_call' | 'appointment' | 'payment' | 'review';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface LeadSourceDatum {
  source: string;
  value: number;
}

export interface DemoData {
  users: User[];
  companies: Company[];
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  pipelines: Pipeline[];
  opportunities: Opportunity[];
  calendars: Calendar[];
  appointments: Appointment[];
  workflows: Workflow[];
  campaigns: Campaign[];
  tasks: Task[];
  reviews: Review[];
  calls: Call[];
  products: Product[];
  invoices: Invoice[];
  notifications: Notification[];
  leadSources: LeadSourceDatum[];
  phoneNumbers: PhoneNumber[];
}


/* ─────────────────────────────────────────────────────────────────────
 * FOUNDATION TYPES (Wave 3) — shared contracts for the next module workstreams.
 *
 * These are intentionally added ahead of the modules that will consume them so
 * the upcoming developers (Phone settings, Custom Fields, Dashboard editor,
 * Documents/Contracts) build against one agreed shape instead of inventing
 * their own. `PhoneNumber` is already wired (seed + store + Settings + dialer);
 * the rest are scaffolding and are safe to extend.
 * ───────────────────────────────────────────────────────────────────── */

/** A provisioned phone number on the account (Settings → Phone Numbers, dialer). */
export interface PhoneNumber {
  id: ID;
  number: string;
  label: string;
  type: 'local' | 'toll_free';
  status: 'active' | 'inactive' | 'porting';
}

/** A custom field definition (Settings → Custom Fields). */
export interface CustomFieldDefinition {
  id: ID;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox';
  scope: 'contact' | 'opportunity' | 'company';
  /** Folder/group the field is organized under (GHL groups custom fields). */
  folder?: string;
  options?: string[];
}

/** A single widget on a saved dashboard (Dashboard editor workstream). */
export interface DashboardWidget {
  id: ID;
  kind: 'kpi' | 'lineChart' | 'barChart' | 'pieChart' | 'table' | 'list';
  title: string;
  /** Free-form config consumed by the future dashboard renderer. */
  config?: Record<string, string | number | boolean>;
}

/** A user-saved dashboard layout (Dashboard editor workstream). */
export interface SavedDashboard {
  id: ID;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
}

/** A document / contract record (Documents & Contracts workstream). */
export interface DocumentRecord {
  id: ID;
  name: string;
  contactId?: ID;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'void';
  createdAt: string;
  updatedAt?: string;
  /** e.g. 'contract', 'proposal', 'invoice', 'form'. */
  kind?: string;
}
