/**
 * Module-local demo data for the Payments + Documents & Contracts workspace.
 *
 * Per the Wave 3 brief, the shared seed (`src/data/seed.ts`) and shared types
 * (`src/types/index.ts`) are intentionally NOT edited by this module. The
 * Invoices list reads the real shared `invoices` from the store; everything
 * else that GoHighLevel surfaces under Payments (estimates, recurring invoices,
 * invoice templates, documents/contracts, document templates, public documents,
 * payment links) has no shared seed yet, so it lives here as small, curated,
 * demo-safe fixtures.
 *
 * Demo-safety (matches the repo guardrails):
 *   - No real people, businesses, phone numbers, or emails.
 *   - Fictional names + @example.com only; "Demo Business" is the account.
 *   - No real money is moved and nothing here hits a network.
 *
 * `DemoDocument` is this module's local extension of the foundation
 * `DocumentRecord` contract (src/types/index.ts) — the foundation type is
 * deliberately minimal and "safe to extend", and the live Documents & Contracts
 * surface needs the GHL status set (draft / waiting / completed / payments /
 * archived) plus per-recipient progress, so we model that here.
 */

/* ── tiny date helpers (relative to "now" so the demo always reads as current) ── */
const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

/* ─────────────────────────── Estimates ─────────────────────────── */

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export interface Estimate {
  id: string;
  number: string;
  customer: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
  amount: number;
  status: EstimateStatus;
}

export const ESTIMATES: Estimate[] = [
  { id: 'est_1', number: 'EST-2041', customer: 'Northwind Trading Co', email: 'ap@northwind.example.com', issuedAt: iso(-4), expiresAt: iso(10), amount: 4200, status: 'sent' },
  { id: 'est_2', number: 'EST-2042', customer: 'Riverside Group', email: 'hello@riverside.example.com', issuedAt: iso(-9), expiresAt: iso(5), amount: 1850, status: 'accepted' },
  { id: 'est_3', number: 'EST-2043', customer: 'Maple & Vine Co', email: 'owner@mapleandvine.example.com', issuedAt: iso(-1), expiresAt: iso(13), amount: 950, status: 'draft' },
  { id: 'est_4', number: 'EST-2044', customer: 'Harborline Studio', email: 'studio@harborline.example.com', issuedAt: iso(-16), expiresAt: iso(-2), amount: 3100, status: 'declined' },
];

/* ─────────────────────── Recurring invoices ────────────────────── */

export type RecurringStatus = 'active' | 'paused' | 'draft';
export type Frequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';

export interface RecurringInvoice {
  id: string;
  name: string;
  customer: string;
  frequency: Frequency;
  nextSendAt: string;
  amount: number;
  occurrences: string;
  status: RecurringStatus;
}

export const RECURRING_INVOICES: RecurringInvoice[] = [
  { id: 'rec_1', name: 'Growth Retainer — Monthly', customer: 'Northwind Trading Co', frequency: 'Monthly', nextSendAt: iso(6), amount: 1200, occurrences: '4 of 12', status: 'active' },
  { id: 'rec_2', name: 'Ad Management — Monthly', customer: 'Riverside Group', frequency: 'Monthly', nextSendAt: iso(13), amount: 900, occurrences: '7 of ∞', status: 'active' },
  { id: 'rec_3', name: 'Premium Plan — Quarterly', customer: 'Summit Studio', frequency: 'Quarterly', nextSendAt: iso(28), amount: 2500, occurrences: '2 of 8', status: 'paused' },
];

/* ─────────────────────── Invoice templates ─────────────────────── */

export interface InvoiceTemplate {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  items: number;
  total: number;
  status: 'active' | 'draft';
  updatedAt: string;
  notes: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  { id: 'itpl_1', name: 'Standard Service Invoice', prefix: 'INV-', nextNumber: 1007, items: 2, total: 1699, status: 'active', updatedAt: iso(-3), notes: 'Payment due within 14 days. Thank you for your business.' },
  { id: 'itpl_2', name: 'Monthly Retainer', prefix: 'RET-', nextNumber: 312, items: 1, total: 1200, status: 'active', updatedAt: iso(-11), notes: 'Recurring retainer billed on the 1st of each month.' },
  { id: 'itpl_3', name: 'One-off Consultation', prefix: 'CON-', nextNumber: 88, items: 1, total: 150, status: 'draft', updatedAt: iso(-24), notes: 'Due on receipt.' },
];

/* ─────────────────────── Documents & contracts ─────────────────── */

export type DocStatus = 'draft' | 'waiting' | 'completed' | 'payments' | 'archived';
export type DocKind = 'Contract' | 'Proposal' | 'Agreement' | 'Form' | 'Estimate';

export interface DemoDocument {
  id: string;
  title: string;
  kind: DocKind;
  customer: string;
  email: string;
  status: DocStatus;
  value: number;
  createdAt: string;
  sentAt?: string;
  expiresAt?: string;
  recipients: number;
  completedRecipients: number;
}

export const DEMO_DOCUMENTS: DemoDocument[] = [
  { id: 'doc_1', title: 'Service Agreement', kind: 'Agreement', customer: 'Northwind Trading Co', email: 'ap@northwind.example.com', status: 'waiting', value: 4200, createdAt: iso(-5), sentAt: iso(-4), expiresAt: iso(9), recipients: 2, completedRecipients: 1 },
  { id: 'doc_2', title: 'Marketing Proposal', kind: 'Proposal', customer: 'Riverside Group', email: 'hello@riverside.example.com', status: 'completed', value: 1850, createdAt: iso(-12), sentAt: iso(-11), expiresAt: iso(-1), recipients: 1, completedRecipients: 1 },
  { id: 'doc_3', title: 'Client Onboarding Agreement', kind: 'Agreement', customer: 'Maple & Vine Co', email: 'owner@mapleandvine.example.com', status: 'draft', value: 950, createdAt: iso(-1), recipients: 1, completedRecipients: 0 },
  { id: 'doc_4', title: 'Payment Authorization', kind: 'Form', customer: 'Summit Studio', email: 'studio@summit.example.com', status: 'payments', value: 2500, createdAt: iso(-7), sentAt: iso(-6), expiresAt: iso(7), recipients: 1, completedRecipients: 1 },
  { id: 'doc_5', title: 'Estimate Approval', kind: 'Estimate', customer: 'Harborline Studio', email: 'studio@harborline.example.com', status: 'waiting', value: 3100, createdAt: iso(-3), sentAt: iso(-3), expiresAt: iso(11), recipients: 2, completedRecipients: 0 },
  { id: 'doc_6', title: 'Authorization Form', kind: 'Form', customer: 'Cedar Park Realty', email: 'office@cedarpark.example.com', status: 'completed', value: 0, createdAt: iso(-20), sentAt: iso(-19), recipients: 1, completedRecipients: 1 },
  { id: 'doc_7', title: 'Master Services Contract', kind: 'Contract', customer: 'Lumen Labs', email: 'contracts@lumenlabs.example.com', status: 'archived', value: 12000, createdAt: iso(-64), sentAt: iso(-60), recipients: 3, completedRecipients: 3 },
];

/* ─────────────────────── Document templates ────────────────────── */

export interface DocumentTemplate {
  id: string;
  name: string;
  kind: DocKind;
  pages: number;
  fields: number;
  updatedAt: string;
  uses: number;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  { id: 'dtpl_1', name: 'Standard Service Agreement', kind: 'Agreement', pages: 3, fields: 6, updatedAt: iso(-6), uses: 18 },
  { id: 'dtpl_2', name: 'Project Proposal', kind: 'Proposal', pages: 4, fields: 4, updatedAt: iso(-15), uses: 11 },
  { id: 'dtpl_3', name: 'Photo / Media Release', kind: 'Form', pages: 1, fields: 3, updatedAt: iso(-30), uses: 7 },
];

/* ─────────────────────── Public documents ──────────────────────── */

export interface PublicDocument {
  id: string;
  name: string;
  kind: 'Form' | 'Survey' | 'Agreement';
  url: string;
  responses: number;
  status: 'live' | 'paused';
  updatedAt: string;
}

export const PUBLIC_DOCUMENTS: PublicDocument[] = [
  { id: 'pub_1', name: 'New Client Intake Form', kind: 'Form', url: 'docs.example.com/intake', responses: 42, status: 'live', updatedAt: iso(-2) },
  { id: 'pub_2', name: 'Satisfaction Survey', kind: 'Survey', url: 'docs.example.com/survey', responses: 17, status: 'live', updatedAt: iso(-8) },
  { id: 'pub_3', name: 'Photo Consent Agreement', kind: 'Agreement', url: 'docs.example.com/consent', responses: 5, status: 'paused', updatedAt: iso(-21) },
];

/* ─────────────────────── Payment links ─────────────────────────── */

export type PaymentLinkStatus = 'active' | 'inactive';

export interface PaymentLink {
  id: string;
  name: string;
  product: string;
  amount: number;
  type: 'one_time' | 'recurring';
  url: string;
  clicks: number;
  status: PaymentLinkStatus;
}

export const PAYMENT_LINKS: PaymentLink[] = [
  { id: 'lnk_1', name: 'Starter Package Checkout', product: 'Starter Package', amount: 499, type: 'one_time', url: 'pay.example.com/starter', clicks: 128, status: 'active' },
  { id: 'lnk_2', name: 'Growth Retainer Subscription', product: 'Growth Retainer', amount: 1200, type: 'recurring', url: 'pay.example.com/growth', clicks: 64, status: 'active' },
  { id: 'lnk_3', name: 'Consultation Booking', product: 'Consultation', amount: 150, type: 'one_time', url: 'pay.example.com/consult', clicks: 211, status: 'active' },
  { id: 'lnk_4', name: 'Website Audit', product: 'Website Audit', amount: 350, type: 'one_time', url: 'pay.example.com/audit', clicks: 19, status: 'inactive' },
];

/* ─────────── Document editor: element library + signer roles ────── */

export interface DocElementDef {
  id: string;
  label: string;
  /** lucide icon name resolved in the editor. */
  group: 'block' | 'field';
  hint: string;
}

export const DOC_BLOCKS: DocElementDef[] = [
  { id: 'heading', label: 'Heading', group: 'block', hint: 'Section title' },
  { id: 'text', label: 'Text', group: 'block', hint: 'Paragraph copy' },
  { id: 'image', label: 'Image', group: 'block', hint: 'Logo or photo' },
  { id: 'table', label: 'Pricing Table', group: 'block', hint: 'Line items + totals' },
  { id: 'divider', label: 'Divider', group: 'block', hint: 'Horizontal rule' },
  { id: 'pagebreak', label: 'Page Break', group: 'block', hint: 'Start a new page' },
];

export const DOC_FIELDS: DocElementDef[] = [
  { id: 'signature', label: 'Signature', group: 'field', hint: 'Drawn / typed signature' },
  { id: 'initials', label: 'Initials', group: 'field', hint: 'Initial each page' },
  { id: 'textfield', label: 'Text Field', group: 'field', hint: 'Free-text input' },
  { id: 'date', label: 'Date', group: 'field', hint: 'Date signed' },
  { id: 'checkbox', label: 'Checkbox', group: 'field', hint: 'Agree / opt-in' },
];

export interface SignerRole {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
}

export const DEFAULT_SIGNERS: SignerRole[] = [
  { id: 'sgn_1', name: 'Demo Business', email: 'contact@example.com', role: 'Sender', color: '#1f6feb' },
  { id: 'sgn_2', name: 'Client', email: 'client@example.com', role: 'Signer', color: '#12986a' },
];

/* Default blocks pre-placed on a new document's canvas (so the editor never
 * opens to a blank page in the demo). */
export const STARTER_CANVAS: { id: string; kind: string; label: string }[] = [
  { id: 'el_h', kind: 'heading', label: 'Service Agreement' },
  { id: 'el_t', kind: 'text', label: 'This agreement is made between Demo Business and the Client…' },
  { id: 'el_tbl', kind: 'table', label: 'Pricing Table' },
];
