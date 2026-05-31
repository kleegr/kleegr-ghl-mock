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
import {
  Receipt, Repeat, FileText, LayoutTemplate, Package,
  ArrowLeftRight, Link2, RefreshCw, Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/primitives';
import { cx } from '@/utils';
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

const NAV: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'invoices', label: 'Invoices & Estimates', icon: Receipt },
  { id: 'recurring', label: 'Recurring Invoices', icon: Repeat },
  { id: 'documents', label: 'Documents & Contracts', icon: FileText },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'links', label: 'Payment Links', icon: Link2 },
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Payments() {
  const location = useLocation();
  const [section, setSection] = useState<SectionId>(
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
      <PageHeader title="Payments" subtitle="Invoices, documents, and everything you bill for." />

      {/* sub-navigation */}
      <div className="border-b border-line bg-surface">
        <div data-tour="payments.tabs" className="flex gap-1 overflow-x-auto px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors',
                  active
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-muted hover:text-ink',
                )}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* section body */}
      <div className="px-5 py-6">
        {section === 'invoices' && <InvoicesView onNavigate={(s) => setSection(s as SectionId)} />}
        {section === 'recurring' && <RecurringInvoicesView />}
        {section === 'documents' && <DocumentsView />}
        {section === 'templates' && <InvoiceTemplatesView />}
        {section === 'products' && <ProductsView />}
        {section === 'transactions' && <TransactionsView />}
        {section === 'links' && <PaymentLinksView />}
        {section === 'subscriptions' && <SubscriptionsView />}
        {section === 'settings' && <PaymentsSettingsView />}
      </div>
    </div>
  );
}
