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
