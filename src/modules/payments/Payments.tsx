/**
 * Payments — the unified billing & documents workspace.
 *
 * GoHighLevel groups invoices, recurring invoices, documents/contracts,
 * templates, products, transactions, payment links, subscriptions, and payment
 * settings under a single "Payments" area with a horizontal sub-navigation.
 * This shell renders that sub-nav and routes between the section views; each
 * section lives in its own component under ./components.
 *
 * Routing note: the app exposes both `/payments` and `/documents`. Both render
 * this component; when the user deep-links to `/documents` we open directly on
 * the Documents & Contracts section. (The shared sidebar only lists
 * "Payments", matching GHL, so Documents lives here as a section.)
 *
 * Tutorial Mode anchors that must stay on this page:
 *   payments.page  → root container
 *   payments.tabs  → the sub-navigation strip
 * (the create-invoice flow's remaining anchors — payments.summary,
 *  payments.createInvoice, payments.invoiceList, payments.invoiceModal,
 *  payments.invoiceSubmit — live in InvoicesView / InvoiceBuilder.)
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard, Gift, Receipt, ShoppingBag } from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { InvoicesView } from './components/InvoicesView';
import { RecurringInvoicesView } from './components/RecurringInvoicesView';
import { InvoiceTemplatesView } from './components/InvoiceTemplatesView';
import { DocumentsView } from './components/DocumentsView';
import {
  ProductsView,
  TransactionsView,
  PaymentLinksView,
  SubscriptionsView,
  PaymentsSettingsView,
} from './components/BillingViews';

type SectionId =
  | 'invoices'
  | 'recurring'
  | 'documents'
  | 'templates'
  | 'products'
  | 'transactions'
  | 'links'
  | 'subscriptions'
  | 'settings';

type PrimarySection = SectionId | 'orders' | 'coupons' | 'gift-cards' | 'integrations';

const NAV: ModuleHeaderTab[] = [
  { id: 'invoices', label: 'Invoices & Estimates' },
  { id: 'documents', label: 'Documents & Contracts' },
  { id: 'orders', label: 'Orders' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'links', label: 'Payment Links' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'products', label: 'Products' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'gift-cards', label: 'Gift Cards' },
  { id: 'settings', label: 'Settings' },
  { id: 'integrations', label: 'Integrations' },
];

const PLACEHOLDER_META: Record<'orders' | 'coupons' | 'gift-cards' | 'integrations', { title: string; copy: string; icon: typeof Receipt; rows: string[] }> = {
  orders: { title: 'Orders', copy: 'Track every checkout and order from one place.', icon: ShoppingBag, rows: ['ORD-1048 · Website package · $1,850.00', 'ORD-1047 · Strategy session · $295.00', 'ORD-1046 · Monthly care plan · $425.00'] },
  coupons: { title: 'Coupons', copy: 'Create and manage promotional discounts.', icon: Receipt, rows: ['WELCOME20 · 20% off · Active', 'SPRING150 · $150 off · Active', 'LOYAL10 · 10% off · Scheduled'] },
  'gift-cards': { title: 'Gift Cards', copy: 'Issue and monitor customer gift cards.', icon: Gift, rows: ['$250 Digital Gift Card · 8 sold', '$100 Digital Gift Card · 17 sold', '$50 Digital Gift Card · 24 sold'] },
  integrations: { title: 'Payment Integrations', copy: 'Connect the providers used to collect payments.', icon: CreditCard, rows: ['Stripe · Connected', 'PayPal · Available', 'Authorize.net · Available'] },
};

function PaymentPlaceholder({ section }: { section: keyof typeof PLACEHOLDER_META }) {
  const meta = PLACEHOLDER_META[section];
  const Icon = meta.icon;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[29px] font-medium tracking-tight text-ink">{meta.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{meta.copy}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon size={16} className="text-brand" /> {meta.title}</div>
          <button className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">+ New</button>
        </div>
        {meta.rows.map((row) => <div key={row} className="border-b border-line/70 px-4 py-3 text-sm text-ink-muted last:border-0">{row}</div>)}
      </div>
    </div>
  );
}

export function Payments() {
  const location = useLocation();
  const [section, setSection] = useState<PrimarySection>(
    location.pathname.startsWith('/documents') ? 'documents' : 'invoices',
  );

  // Keep the section in sync with SPA route changes between /payments and
  // /documents (deriving state during render via a last-path guard — no effect).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    if (location.pathname.startsWith('/documents')) setSection('documents');
    else if (location.pathname.startsWith('/payments')) setSection('invoices');
  }

  return (
    <div data-tour="payments.page">
      <ModuleHeader
        title="Payments"
        tabs={NAV}
        activeTab={NAV.some((item) => item.id === section) ? section : 'invoices'}
        onTabChange={(id) => setSection(id as PrimarySection)}
        data-tour="payments.tabs"
      />

      {/* section body */}
      <div className="min-h-[calc(100vh-90px)] bg-[#f4f5f7] px-5 py-5">
        {section === 'invoices' && <InvoicesView onNavigate={(s) => setSection(s as PrimarySection)} />}
        {section === 'recurring' && <RecurringInvoicesView />}
        {section === 'documents' && <DocumentsView />}
        {section === 'templates' && <InvoiceTemplatesView />}
        {section === 'products' && <ProductsView />}
        {section === 'transactions' && <TransactionsView />}
        {section === 'links' && <PaymentLinksView />}
        {section === 'subscriptions' && <SubscriptionsView />}
        {section === 'settings' && <PaymentsSettingsView />}
        {(section === 'orders' || section === 'coupons' || section === 'gift-cards' || section === 'integrations') && <PaymentPlaceholder section={section} />}
      </div>
    </div>
  );
}
