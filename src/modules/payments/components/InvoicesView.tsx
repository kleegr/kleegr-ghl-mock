/**
 * InvoicesView — the "Invoices & Estimates" section of the Payments workspace.
 *
 * Reads the real shared `invoices` from the store (so the seeded INV-1000…1006
 * rows and the summary totals stay in sync with the rest of the app) and pairs
 * them with the module-local ESTIMATES fixture. Hosts the full-screen
 * InvoiceBuilder (live-preview authoring) and an in-page invoice detail modal.
 *
 * Tutorial Mode anchors preserved here:
 *   payments.summary     → the AR summary card row
 *   payments.createInvoice → primary "New Invoice" button (opens the builder)
 *   payments.invoiceList → the invoice/estimate table container
 *   payments.invoiceDetail → the invoice detail modal body
 */

import { useMemo, useState } from 'react';
import { Plus, FileText, Send, Download, CheckCircle2, Upload, CalendarDays, Filter, History, Settings2 } from 'lucide-react';
import { Button, Tabs } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { SimpleTable, type Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { money, dateLabel, fullName } from '@/utils';
import type { Invoice } from '@/types';
import {
  SummaryCard,
  SearchInput,
  Segmented,
  ActionMenu,
  Dropdown,
  InvoiceStatusBadge,
  EstimateStatusBadge,
  ChevronDown,
} from './ui';
import { InvoiceBuilder } from './InvoiceBuilder';
import { ESTIMATES, type Estimate } from '../data';

type Seg = 'invoices' | 'estimates';

export function InvoicesView({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const invoices = useStore((s) => s.invoices);
  const contacts = useStore((s) => s.contacts);
  const products = useStore((s) => s.products);
  const pushToast = useStore((s) => s.pushToast);

  const [seg, setSeg] = useState<Seg>('invoices');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<'invoice' | 'estimate'>('invoice');
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? fullName(c) : 'Unknown contact';
  };

  /* ── AR summary (always computed from the shared invoices) ── */
  const sumBy = (st: Invoice['status']) =>
    invoices.filter((i) => i.status === st).reduce((a, i) => a + i.total, 0);
  const countBy = (st: Invoice['status']) => invoices.filter((i) => i.status === st).length;
  function openBuilder(mode: 'invoice' | 'estimate') {
    setBuilderMode(mode);
    setBuilderOpen(true);
  }

  /* ── filtered rows ── */
  const filteredInvoices = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (!needle) return true;
      return i.number.toLowerCase().includes(needle) || contactName(i.contactId).toLowerCase().includes(needle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, q, statusFilter, contacts]);

  const filteredEstimates = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ESTIMATES.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!needle) return true;
      return e.number.toLowerCase().includes(needle) || e.customer.toLowerCase().includes(needle);
    });
  }, [q, statusFilter]);

  const invoiceTabs = [
    { id: 'all', label: 'All', count: invoices.length },
    { id: 'draft', label: 'Draft', count: countBy('draft') },
    { id: 'sent', label: 'Sent', count: countBy('sent') },
    { id: 'paid', label: 'Paid', count: countBy('paid') },
    { id: 'overdue', label: 'Overdue', count: countBy('overdue') },
  ];
  const estTabs = (() => {
    const c = (s: string) => ESTIMATES.filter((e) => e.status === s).length;
    return [
      { id: 'all', label: 'All', count: ESTIMATES.length },
      { id: 'draft', label: 'Draft', count: c('draft') },
      { id: 'sent', label: 'Sent', count: c('sent') },
      { id: 'accepted', label: 'Accepted', count: c('accepted') },
      { id: 'declined', label: 'Declined', count: c('declined') },
    ];
  })();

  const invoiceCols: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice', render: (r) => <span className="font-semibold text-ink">{r.number}</span> },
    { key: 'customer', header: 'Customer', render: (r) => contactName(r.contactId) },
    { key: 'issued', header: 'Issue date', render: (r) => <span className="text-ink-muted">{dateLabel(r.issuedAt)}</span> },
    { key: 'due', header: 'Due date', render: (r) => <span className="text-ink-muted">{dateLabel(r.dueAt)}</span> },
    { key: 'amount', header: 'Amount', className: 'text-right', render: (r) => <span className="font-semibold">{money(r.total)}</span> },
    { key: 'status', header: 'Status', render: (r) => <InvoiceStatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'view', label: 'View invoice', onClick: () => setDetail(r) },
            { id: 'send', label: 'Send to customer', onClick: () => pushToast({ title: 'Invoice sent', description: `${r.number} sent to ${contactName(r.contactId)} (demo).`, variant: 'success' }) },
            { id: 'paid', label: 'Mark as paid', onClick: () => pushToast({ title: 'Marked as paid', description: `${r.number} recorded as paid (demo).`, variant: 'success' }) },
            { id: 'd1', label: '', divider: true },
            { id: 'dl', label: 'Download PDF', onClick: () => pushToast({ title: 'Preparing PDF', description: `${r.number} — demo export.`, variant: 'info' }) },
          ]}
        />
      ),
    },
  ];

  const estimateCols: Column<Estimate>[] = [
    { key: 'number', header: 'Estimate', render: (r) => <span className="font-semibold text-ink">{r.number}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customer },
    { key: 'issued', header: 'Issued', render: (r) => <span className="text-ink-muted">{dateLabel(r.issuedAt)}</span> },
    { key: 'expires', header: 'Valid until', render: (r) => <span className="text-ink-muted">{dateLabel(r.expiresAt)}</span> },
    { key: 'amount', header: 'Amount', className: 'text-right', render: (r) => <span className="font-semibold">{money(r.amount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <EstimateStatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'view', label: 'View estimate', onClick: () => pushToast({ title: r.number, description: `${r.customer} · ${money(r.amount)} (demo).`, variant: 'info' }) },
            { id: 'conv', label: 'Convert to invoice', onClick: () => openBuilder('invoice') },
            { id: 'send', label: 'Resend', onClick: () => pushToast({ title: 'Estimate sent', description: `${r.number} resent (demo).`, variant: 'success' }) },
          ]}
        />
      ),
    },
  ];

  const rowCount = seg === 'invoices' ? filteredInvoices.length : filteredEstimates.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-medium leading-tight tracking-[-0.025em] text-ink">Invoices</h2>
          <p className="mt-1 text-sm text-ink-muted">Create and manage all invoices generated for your business</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onNavigate?.('settings')}><Settings2 size={15} /> Settings</Button>
          <div className="inline-flex">
            <Button data-tour="payments.createInvoice" className="rounded-r-none" onClick={() => openBuilder('invoice')}>
              <Plus size={15} /> New
            </Button>
            <Dropdown
              align="right"
              items={[
                { id: 'inv', label: 'New Invoice', icon: <FileText size={15} />, onClick: () => openBuilder('invoice') },
                { id: 'est', label: 'New Estimate', icon: <FileText size={15} />, onClick: () => openBuilder('estimate') },
                { id: 'rec', label: 'Recurring Invoice', icon: <Send size={15} />, onClick: () => (onNavigate ? onNavigate('recurring') : pushToast({ title: 'Recurring invoices', description: 'Open the Recurring Invoices tab.', variant: 'info' })) },
                { id: 'd', label: '', divider: true },
                { id: 'csv', label: 'Import CSV', icon: <Upload size={15} />, onClick: () => setImportOpen(true) },
              ]}
              trigger={({ toggle }) => (
                <Button variant="primary" className="rounded-l-none border-l border-brand-fg/25 px-2" onClick={toggle} aria-label="More create options">
                  <ChevronDown size={15} />
                </Button>
              )}
            />
          </div>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" data-tour="payments.summary">
        <SummaryCard label={`${countBy('draft')} Invoice(s) in Draft`} value={money(sumBy('draft'))} accent="neutral" active={statusFilter === 'draft'} onClick={() => { setSeg('invoices'); setStatusFilter('draft'); }} />
        <SummaryCard label={`${countBy('sent')} Invoice(s) in Due`} value={money(sumBy('sent'))} accent="warn" active={statusFilter === 'sent'} onClick={() => { setSeg('invoices'); setStatusFilter('sent'); }} />
        <SummaryCard label={`${countBy('paid')} Invoice(s) received`} value={money(sumBy('paid'))} accent="good" active={statusFilter === 'paid'} onClick={() => { setSeg('invoices'); setStatusFilter('paid'); }} />
        <SummaryCard label={`${countBy('overdue')} Invoice(s) Overdue`} value={money(sumBy('overdue'))} accent="bad" active={statusFilter === 'overdue'} onClick={() => { setSeg('invoices'); setStatusFilter('overdue'); }} />
      </div>

      {/* filters and table */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface" data-tour="payments.invoiceList">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<Seg>
              options={[{ id: 'invoices', label: 'Invoices' }, { id: 'estimates', label: 'Estimates' }]}
              value={seg}
              onChange={(v) => { setSeg(v); setStatusFilter('all'); }}
            />
            <button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink-muted"><CalendarDays size={14} /> Start Date <span className="text-ink-subtle">→</span> End Date</button>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder={seg === 'invoices' ? 'Search invoices' : 'Search estimates'} className="w-56" />
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink-muted"><Filter size={14} /> Filters</button>
            <button aria-label="Recent activity" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted"><History size={15} /></button>
          </div>
        </div>
        <div className="border-b border-line px-4 py-2.5">
          <Tabs
            variant="pill"
            tabs={seg === 'invoices' ? invoiceTabs : estTabs}
            active={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        {seg === 'invoices' ? (
          <SimpleTable<Invoice> columns={invoiceCols} rows={filteredInvoices} onRowClick={(r) => setDetail(r)} empty="No invoices match your filters." />
        ) : (
          <SimpleTable<Estimate> columns={estimateCols} rows={filteredEstimates} empty="No estimates match your filters." />
        )}
      </div>
      <p className="text-xs text-ink-subtle">
        Showing {rowCount} {seg === 'invoices' ? 'invoice' : 'estimate'}{rowCount === 1 ? '' : 's'}
        {statusFilter !== 'all' && ` · filtered by ${statusFilter}`}
      </p>

      {/* full-screen builder */}
      <InvoiceBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        mode={builderMode}
        contacts={contacts}
        products={products}
        onSaved={(kind) =>
          pushToast(
            kind === 'sent'
              ? { title: `${builderMode === 'estimate' ? 'Estimate' : 'Invoice'} sent`, description: 'Your customer will receive it shortly (demo).', variant: 'success' }
              : { title: 'Draft saved', description: 'Saved to this demo session.', variant: 'success' },
          )
        }
      />

      {/* invoice detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.number}` : ''}
        size="lg"
        footer={
          detail ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Preparing PDF', description: `${detail.number} — demo export.`, variant: 'info' })}>
                <Download size={15} /> Download
              </Button>
              <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Reminder sent', description: `Reminder for ${detail.number} sent (demo).`, variant: 'success' })}>
                <Send size={15} /> Send reminder
              </Button>
              <Button size="sm" onClick={() => { pushToast({ title: 'Marked as paid', description: `${detail.number} recorded as paid (demo).`, variant: 'success' }); setDetail(null); }}>
                <CheckCircle2 size={15} /> Mark as paid
              </Button>
            </>
          ) : null
        }
      >
        {detail && (
          <div data-tour="payments.invoiceDetail" className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Billed to</p>
                <p className="mt-0.5 font-semibold text-ink">{contactName(detail.contactId)}</p>
              </div>
              <InvoiceStatusBadge status={detail.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-sunken p-3 text-sm">
              <div><span className="text-ink-subtle">Issued</span><div className="font-medium text-ink">{dateLabel(detail.issuedAt)}</div></div>
              <div><span className="text-ink-subtle">Due</span><div className="font-medium text-ink">{dateLabel(detail.dueAt)}</div></div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line text-left text-[10px] uppercase tracking-wide text-ink-subtle">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {detail.lineItems.map((li, idx) => (
                  <tr key={idx} className="border-b border-line/50">
                    <td className="py-2 text-ink">{li.name}</td>
                    <td className="py-2 text-right text-ink-muted">{li.qty}</td>
                    <td className="py-2 text-right text-ink-muted">{money(li.unitPrice)}</td>
                    <td className="py-2 text-right font-medium text-ink">{money(li.qty * li.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto w-56 space-y-1 text-sm">
              <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{money(detail.subtotal)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>Tax</span><span>{money(detail.tax)}</span></div>
              <div className="flex justify-between border-t border-line pt-2 font-bold text-ink"><span>Total</span><span>{money(detail.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* import CSV (demo) */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import invoices from CSV"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setImportOpen(false); pushToast({ title: 'Import queued', description: 'Your CSV will be processed (demo).', variant: 'success' }); }}>
              <Upload size={15} /> Import
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid place-items-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface-sunken px-4 py-10 text-center">
            <Upload size={26} className="text-ink-subtle" />
            <p className="text-sm font-semibold text-ink">Drop a .csv file here</p>
            <p className="text-xs text-ink-muted">or click to browse — demo only, no file is uploaded</p>
          </div>
          <p className="text-xs text-ink-subtle">
            Columns: <span className="font-medium text-ink-muted">number, customer email, amount, status, due date</span>
          </p>
        </div>
      </Modal>
    </div>
  );
}
