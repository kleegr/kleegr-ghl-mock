// Mock data models — shapes lean on GoHighLevel conventions (plan §17).
// All IDs are fake strings. Dates are ISO; the seeder shifts them relative to "today".

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarColor: string;
  role: 'admin' | 'user';
  phone?: string;
  isCurrentUser?: boolean;
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
  // --- GHL-fidelity (optional, additive) ---
  /** Classification shown on contact panels (GHL "Contact Type"). */
  contactType?: 'lead' | 'customer';
  /** Business / company display name, mirrored for panels that show it inline. */
  businessName?: string;
  /** ISO date (date-only ok) of birth, used by birthday workflows & panels. */
  dateOfBirth?: string;
  /** User IDs "following" this contact (GHL Followers). */
  followerIds?: ID[];
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
  // --- GHL-fidelity (optional, additive) ---
  /**
   * Row kind for the thread. Defaults to a normal 'message' when omitted, so
   * existing seeded messages render unchanged.
   *  - 'note'   → internal note (not sent to the contact)
   *  - 'call'   → call event (pairs well with channel:'call' + callDurationSec)
   *  - 'system' → system/automation event (use `details` for the body)
   */
  kind?: 'message' | 'note' | 'call' | 'system';
  /** Optional subject line (useful for email-channel messages). */
  subject?: string;
  /** Call length in seconds, for call rows. */
  callDurationSec?: number;
  /** Call/voicemail transcript text. */
  transcript?: string;
  /** Extra detail body for system events / notes. */
  details?: string;
}

/** Lightweight activity-timeline entry for the contact/conversation panels. */
export interface ActivityEvent {
  id: ID;
  type: 'note' | 'call' | 'sms' | 'email' | 'appointment' | 'task' | 'stage_change' | 'system';
  title: string;
  body?: string;
  createdAt: string;
  actorId?: ID;
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
  /** Optional activity timeline for the conversation/contact panel. */
  activity?: ActivityEvent[];
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
/** Per-opportunity activity tallies shown on GHL opportunity cards/detail. */
export interface OpportunityActivity {
  calls: number;
  sms: number;
  tags: number;
  notes: number;
  tasks: number;
  appointments: number;
}
export interface Opportunity {
  id: ID;
  name: string;
  contactId: ID;
  pipelineId: ID;
  stageId: ID;
  monetaryValue: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  ownerId: ID;
  source?: string;
  createdAt: string;
  updatedAt: string;
  // --- GHL-fidelity (optional, additive) ---
  /** Business/company name displayed under the opportunity title. */
  businessName?: string;
  /** User IDs following the opportunity (GHL Followers). */
  followerIds?: ID[];
  /** Engagement tallies rendered as icons on the card. */
  activity?: OpportunityActivity;
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
  enrolled: number;
  trigger: string;
  explanation?: string;
  // --- GHL-fidelity (optional, additive) ---
  /** Folder this workflow lives in (GHL groups workflows in folders). */
  folder?: string;
  /** Currently-active enrollments. */
  activeEnrolled?: number;
  /** All-time enrollments. */
  totalEnrolled?: number;
  /** ISO timestamp the workflow was last edited. */
  lastUpdatedAt?: string;
  /** ISO timestamp the workflow was created. */
  createdAt?: string;
  /** Flag for the "Needs Review" workflows tab. */
  needsReview?: boolean;
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
}
