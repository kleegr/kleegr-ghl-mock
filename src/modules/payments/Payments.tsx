import { useState, useMemo } from 'react';
import { Plus, Package, ArrowDownLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card, Tabs } from '@/components/ui/primitives';
import { SimpleTable, type Column, MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { money, dateLabel, fullName } from '@/utils';
import type { Invoice } from '@/types';

type InvoiceStatus = 'all' | 'paid' | 'sent' | 'overdue' | 'draft';

const MODULE_TABS = [
  { id: 'invoices', label: 'Invoices' },
  { id: 'products', label: 'Products' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'subscriptions', label: 'Subscriptions' },
];

export function Payments() {
  const invoices = useStore((s) => s.invoices);
  const products = useStore((s) => s.products);
  const contacts = useStore((s) => s.contacts);
  const pushToast = useStore((s) => s.pushToast);

  const [tab, setTab] = useState('invoices');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create invoice form
  const [newContact, setNewContact] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newDue, setNewDue] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? fullName(c) : '—';
  };

  const paid = invoices.filter((i) => i.status === 'paid');
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const overdue = invoices.filter((i) => i.status === 'overdue');

  const filtered = useMemo(
    () => (statusFilter === 'all' ? invoices : invoices.filter((i) => i.status === statusFilter)),
    [invoices, statusFilter],
  );

  const transactions = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'paid')
        .map((inv, idx) => ({
          id: `tx_${inv.id}`,
          invoice: inv.number,
          contact: contactName(inv.contactId),
          amount: inv.total,
          method: (['Card', 'ACH', 'Cash'] as const)[idx % 3],
          date: inv.dueAt,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices],
  );

  const selectedProduct = products.find((p) => p.id === newProduct);
  const lineTotal = selectedProduct ? selectedProduct.price * newQty : 0;

  function handleCreateSubmit() {
    pushToast({ title: 'Invoice created', description: 'Demo only — no real payment processed.', variant: 'success' });
    setCreateOpen(false);
    setNewContact('');
    setNewProduct('');
    setNewQty(1);
    setNewDue('');
    setNewNotes('');
  }

  const statusTabs = [
    { id: 'all', label: 'All', count: invoices.length },
    { id: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'sent', label: 'Sent', count: invoices.filter((i) => i.status === 'sent').length },
    { id: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
    { id: 'draft', label: 'Draft', count: invoices.filter((i) => i.status === 'draft').length },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      render: (i) => <span className="font-semibold text-ink">{i.number}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (i) => <span className="text-ink-muted">{contactName(i.contactId)}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      render: (i) => <span className="text-ink-subtle">{i.lineItems.length} item{i.lineItems.length !== 1 ? 's' : ''}</span>,
    },
    {
      key: 'total',
      header: 'Amount',
      render: (i) => <span className="font-semibold text-ink">{money(i.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge
          tone={
            i.status === 'paid' ? 'good'
            : i.status === 'overdue' ? 'bad'
            : i.status === 'sent' ? 'warn'
            : 'neutral'
          }
        >
          {i.status}
        </Badge>
      ),
    },
    {
      key: 'due',
      header: 'Due date',
      render: (i) => <span className="text-ink-subtle">{dateLabel(i.dueAt)}</span>,
    },
  ];

  return (
    <div data-tour="payments.page">
      <PageHeader
        title="Payments"
        subtitle="Invoices, products, transactions, and revenue"
        actions={
          <Button data-tour="payments.createInvoice" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New Invoice
          </Button>
        }
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="payments.summary">
          <MiniStat
            label="Revenue collected"
            value={money(paid.reduce((s, i) => s + i.total, 0))}
            sub={`${paid.length} paid invoices`}
          />
          <MiniStat
            label="Outstanding"
            value={money(outstanding.reduce((s, i) => s + i.total, 0))}
            sub={`${outstanding.length} unpaid`}
          />
          <MiniStat
            label="Overdue"
            value={overdue.length}
            sub={
              overdue.length > 0
                ? `${money(overdue.reduce((s, i) => s + i.total, 0))} at risk`
                : 'None overdue'
            }
          />
          <MiniStat label="Products" value={products.length} sub="in catalog" />
        </div>

        {/* Module tabs */}
        <div data-tour="payments.tabs">
          <Tabs tabs={MODULE_TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Invoices tab ── */}
        {tab === 'invoices' && (
          <div className="space-y-3">
            <Tabs
              tabs={statusTabs}
              active={statusFilter}
              onChange={(id) => setStatusFilter(id as InvoiceStatus)}
              variant="pill"
            />
            <div
              className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
              data-tour="payments.invoiceList"
            >
              <SimpleTable
                columns={invoiceColumns}
                rows={filtered}
                onRowClick={(row) => setDetail(row)}
                empty="No invoices match this filter"
              />
            </div>
          </div>
        )}

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Package size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs capitalize text-ink-muted">{p.type.replace('_', ' ')}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">{money(p.price)}</span>
              </Card>
            ))}
          </div>
        )}

        {/* ── Transactions tab ── */}
        {tab === 'transactions' && (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">Transaction history</h3>
            </div>
            {transactions.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-subtle">No transactions found</p>
            ) : (
              <div className="divide-y divide-line">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-good/10 text-good">
                      <ArrowDownLeft size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{tx.contact}</p>
                      <p className="text-xs text-ink-muted">Invoice {tx.invoice} · {tx.method}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-good">{money(tx.amount)}</p>
                      <p className="text-[11px] text-ink-subtle">{dateLabel(tx.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Subscriptions tab ── */}
        {tab === 'subscriptions' && (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">Recurring subscriptions</h3>
            </div>
            <div className="divide-y divide-line">
              {products
                .filter((p) => p.type === 'recurring')
                .map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">Monthly · {i + 2} active subscriber{i > 0 ? 's' : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold text-ink">{money(p.price)}/mo</span>
                      <Badge tone="good">active</Badge>
                    </div>
                  </div>
                ))}
              {products.filter((p) => p.type === 'recurring').length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-ink-subtle">No recurring subscriptions</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Invoice ${detail.number}` : ''}
        size="lg"
      >
        {detail && (
          <div data-tour="payments.invoiceDetail" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-subtle">Billed to</p>
                <p className="mt-0.5 font-semibold text-ink">{contactName(detail.contactId)}</p>
              </div>
              <Badge
                tone={
                  detail.status === 'paid' ? 'good'
                  : detail.status === 'overdue' ? 'bad'
                  : detail.status === 'sent' ? 'warn'
                  : 'neutral'
                }
                size="md"
              >
                {detail.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-ink-subtle">Issue date</p>
                <p className="font-medium text-ink">{dateLabel(detail.issuedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Due date</p>
                <p className="font-medium text-ink">{dateLabel(detail.dueAt)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-left">
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-subtle">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-subtle">Price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-subtle">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lineItems.map((li, idx) => (
                    <tr key={idx} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-2.5 text-ink">{li.name}</td>
                      <td className="px-3 py-2.5 text-right text-ink-muted">{li.qty}</td>
                      <td className="px-3 py-2.5 text-right text-ink-muted">{money(li.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-ink">{money(li.qty * li.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 rounded-lg bg-surface-sunken p-3 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span><span>{money(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Tax</span><span>{money(detail.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
                <span>Total</span><span>{money(detail.total)}</span>
              </div>
            </div>

            {detail.status !== 'paid' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    pushToast({ title: 'Invoice sent', description: 'Demo only — no real email was sent.', variant: 'success' });
                    setDetail(null);
                  }}
                >
                  Send Invoice
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    pushToast({ title: 'Marked as paid', description: 'Demo only — no payment recorded.', variant: 'success' });
                    setDetail(null);
                  }}
                >
                  Mark Paid
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create invoice modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Invoice"
        size="md"
      >
        <div data-tour="payments.invoiceModal" className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Contact / Customer</label>
            <select
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Select contact…</option>
              {contacts.slice(0, 40).map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Product / Service</label>
            <select
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Quantity</label>
              <input
                type="number"
                min={1}
                value={newQty}
                onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Due date</label>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Notes (optional)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Add a note for the client…"
              rows={2}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {selectedProduct && (
            <div className="rounded-lg border border-line bg-surface-sunken p-3 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Line total ({newQty} × {money(selectedProduct.price)})</span>
                <span>{money(lineTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
                <span>Invoice total</span>
                <span>{money(lineTotal)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              data-tour="payments.invoiceSubmit"
              onClick={handleCreateSubmit}
              disabled={!newContact || !newProduct}
            >
              Create Invoice
            </Button>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
