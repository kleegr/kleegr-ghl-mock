/**
 * BillingViews — the supporting Payments sections that round out the workspace:
 *   • ProductsView        — catalog grid + demo "Add product" modal
 *   • TransactionsView    — payments derived from the paid invoices in the store
 *   • PaymentLinksView    — shareable checkout links (module-local fixture)
 *   • SubscriptionsView   — recurring plans derived from recurring products
 *   • PaymentsSettingsView — provider connections + tax/branding placeholders
 *
 * Everything is demo-safe: no real processors, money, or PII.
 */

import { useMemo, useState } from 'react';
import {
  Plus, Package, CreditCard, Link2, Copy, Check, Percent, Building2,
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { SimpleTable, MiniStat, type Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { money, dateLabel, fullName } from '@/utils';
import type { Invoice, Product } from '@/types';
import { SearchInput, ActionMenu, Field, TInput, TSelect } from './ui';
import { PAYMENT_LINKS, type PaymentLink } from '../data';

/* ───────────────────────────── Products ──────────────────────── */

export function ProductsView() {
  const products = useStore((s) => s.products);
  const pushToast = useStore((s) => s.pushToast);
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Products &amp; Services</h2>
          <p className="text-sm text-ink-muted">The catalog used to build invoices and payment links.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search products…" className="w-56" />
          <Button onClick={() => setAddOpen(true)}><Plus size={15} /> Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Package size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
              <p className="text-xs text-ink-muted">{p.type === 'recurring' ? 'Recurring' : 'One-time'}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-bold text-ink">{money(p.price)}</p>
              {p.type === 'recurring' && <p className="text-[10px] text-ink-subtle">/mo</p>}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-ink-subtle">No products match “{q}”.</p>
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add product"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setAddOpen(false); pushToast({ title: 'Product added', description: 'Added to the catalog for this demo session.', variant: 'success' }); }}>Save product</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Product name" className="col-span-2"><TInput defaultValue="New Service" /></Field>
          <Field label="Price (USD)"><TInput type="number" defaultValue={199} min={0} /></Field>
          <Field label="Billing type">
            <TSelect defaultValue="one_time">
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring (monthly)</option>
            </TSelect>
          </Field>
          <Field label="Description" className="col-span-2"><TInput defaultValue="" placeholder="Optional short description" /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────── Transactions ─────────────────── */

interface Txn { id: string; date: string; customer: string; invoice: string; amount: number; method: string; }

export function TransactionsView() {
  const invoices = useStore((s) => s.invoices);
  const contacts = useStore((s) => s.contacts);
  const pushToast = useStore((s) => s.pushToast);

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? fullName(c) : 'Unknown';
  };

  const txns: Txn[] = useMemo(() => {
    const paid = invoices.filter((i: Invoice) => i.status === 'paid');
    const methods = ['Visa •••• 4242', 'Mastercard •••• 5253', 'ACH transfer', 'Amex •••• 1009'];
    return paid.map((i, idx) => ({
      id: `txn_${i.id}`,
      date: i.issuedAt,
      customer: contactName(i.contactId),
      invoice: i.number,
      amount: i.total,
      method: methods[idx % methods.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, contacts]);

  const total = txns.reduce((a, t) => a + t.amount, 0);

  const cols: Column<Txn>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="text-ink-muted">{dateLabel(r.date)}</span> },
    { key: 'customer', header: 'Customer', render: (r) => <span className="font-medium text-ink">{r.customer}</span> },
    { key: 'invoice', header: 'Invoice', render: (r) => r.invoice },
    { key: 'method', header: 'Method', render: (r) => <span className="text-ink-muted">{r.method}</span> },
    { key: 'amount', header: 'Amount', className: 'text-right', render: (r) => <span className="font-semibold">{money(r.amount)}</span> },
    { key: 'status', header: 'Status', render: () => <Badge tone="good">Succeeded</Badge> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (r) => (
        <ActionMenu items={[
          { id: 'receipt', label: 'View receipt', onClick: () => pushToast({ title: 'Receipt', description: `${r.invoice} · ${money(r.amount)} (demo).`, variant: 'info' }) },
          { id: 'refund', label: 'Refund', danger: true, onClick: () => pushToast({ title: 'Refund started', description: `${r.invoice} refund initiated (demo).`, variant: 'info' }) },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Transactions</h2>
        <p className="text-sm text-ink-muted">Completed payments across your invoices.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MiniStat label="Total received" value={money(total)} sub={`${txns.length} payments`} />
        <MiniStat label="Payments" value={txns.length} sub="all time" />
        <MiniStat label="Avg. payment" value={money(txns.length ? Math.round(total / txns.length) : 0)} />
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SimpleTable<Txn> columns={cols} rows={txns} empty="No transactions yet." />
      </div>
    </div>
  );
}

/* ─────────────────────── Payment Links ────────────────── */

export function PaymentLinksView() {
  const pushToast = useStore((s) => s.pushToast);
  const [newOpen, setNewOpen] = useState(false);

  const cols: Column<PaymentLink>[] = [
    { key: 'name', header: 'Payment link', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'product', header: 'Product', render: (r) => r.product },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold">{money(r.amount)}{r.type === 'recurring' && <span className="text-[10px] font-normal text-ink-subtle">/mo</span>}</span> },
    { key: 'url', header: 'Link', render: (r) => <span className="inline-flex items-center gap-1.5 text-ink-muted"><Link2 size={13} /> {r.url}</span> },
    { key: 'clicks', header: 'Clicks', render: (r) => <span className="text-ink-muted">{r.clicks}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'good' : 'neutral'}>{r.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (r) => (
        <ActionMenu items={[
          { id: 'copy', label: 'Copy link', icon: <Copy size={15} />, onClick: () => pushToast({ title: 'Link copied', description: r.url, variant: 'success' }) },
          { id: 'qr', label: 'Show QR code', onClick: () => pushToast({ title: 'QR code', description: `${r.name} (demo).`, variant: 'info' }) },
          { id: 'd', label: '', divider: true },
          { id: 'toggle', label: r.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => pushToast({ title: r.status === 'active' ? 'Deactivated' : 'Activated', description: `${r.name} (demo).`, variant: 'info' }) },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Payment Links</h2>
          <p className="text-sm text-ink-muted">Shareable checkout links for one-time and recurring payments.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus size={15} /> New Payment Link</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SimpleTable<PaymentLink> columns={cols} rows={PAYMENT_LINKS} />
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New payment link"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setNewOpen(false); pushToast({ title: 'Payment link created', description: 'Copy and share your new link (demo).', variant: 'success' }); }}>
              <Check size={15} /> Create link
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Link name" className="col-span-2"><TInput defaultValue="Starter Package Checkout" /></Field>
          <Field label="Amount (USD)"><TInput type="number" defaultValue={499} min={0} /></Field>
          <Field label="Type">
            <TSelect defaultValue="one_time">
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring (monthly)</option>
            </TSelect>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────── Subscriptions ────────────────── */

export function SubscriptionsView() {
  const products = useStore((s) => s.products);
  const pushToast = useStore((s) => s.pushToast);

  // Build subscription "plans" from the recurring products in the catalog,
  // with demo subscriber counts so the section reads like a real product.
  const plans = useMemo(() => {
    const recurring = products.filter((p: Product) => p.type === 'recurring');
    return recurring.map((p, i) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      subscribers: [12, 7, 23, 4, 15, 9][i % 6],
    }));
  }, [products]);

  const mrr = plans.reduce((a, p) => a + p.price * p.subscribers, 0);
  const subs = plans.reduce((a, p) => a + p.subscribers, 0);

  type Plan = (typeof plans)[number];
  const cols: Column<Plan>[] = [
    { key: 'name', header: 'Plan', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'price', header: 'Price', render: (r) => <span className="font-semibold">{money(r.price)}<span className="text-[10px] font-normal text-ink-subtle">/mo</span></span> },
    { key: 'subs', header: 'Active subscribers', render: (r) => <span className="text-ink-muted">{r.subscribers}</span> },
    { key: 'mrr', header: 'MRR', className: 'text-right', render: (r) => <span className="font-semibold">{money(r.price * r.subscribers)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (r) => (
        <ActionMenu items={[
          { id: 'view', label: 'View subscribers', onClick: () => pushToast({ title: r.name, description: `${r.subscribers} active subscribers (demo).`, variant: 'info' }) },
          { id: 'edit', label: 'Edit plan', onClick: () => pushToast({ title: 'Editing plan', description: `${r.name} (demo).`, variant: 'info' }) },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Subscriptions</h2>
        <p className="text-sm text-ink-muted">Recurring revenue plans and active subscribers.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MiniStat label="MRR" value={money(mrr)} sub="monthly recurring revenue" />
        <MiniStat label="Active subscribers" value={subs} />
        <MiniStat label="Plans" value={plans.length} />
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <SimpleTable<Plan> columns={cols} rows={plans} empty="No recurring plans yet." />
      </div>
    </div>
  );
}

/* ─────────────────────── Payments settings ───────────────────── */

export function PaymentsSettingsView() {
  const pushToast = useStore((s) => s.pushToast);

  const providers = [
    { id: 'stripe', name: 'Stripe', desc: 'Cards, wallets, ACH, and more.', connected: true },
    { id: 'paypal', name: 'PayPal', desc: 'Let customers pay with PayPal.', connected: false },
    { id: 'square', name: 'Square', desc: 'In-person and online payments.', connected: false },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Payments Settings</h2>
        <p className="text-sm text-ink-muted">Connect a processor and configure tax &amp; branding.</p>
      </div>

      <Card className="p-0">
        <div className="border-b border-line px-5 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><CreditCard size={15} /> Payment providers</p>
        </div>
        <div className="divide-y divide-line">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-sunken text-ink-muted"><CreditCard size={16} /></span>
                <div>
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.desc}</p>
                </div>
              </div>
              {p.connected ? (
                <div className="flex items-center gap-2">
                  <Badge tone="good">Connected</Badge>
                  <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Manage Stripe', description: 'Opening provider settings (demo).', variant: 'info' })}>Manage</Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => pushToast({ title: `Connect ${p.name}`, description: 'Provider connection flow (demo).', variant: 'info' })}>Connect</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-0">
          <div className="border-b border-line px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Percent size={15} /> Tax</p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4">
            <Field label="Default tax rate (%)"><TInput type="number" defaultValue={8} min={0} /></Field>
            <Field label="Currency">
              <TSelect defaultValue="USD"><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option></TSelect>
            </Field>
            <Field label="Tax label" className="col-span-2"><TInput defaultValue="Sales Tax" /></Field>
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-line px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Building2 size={15} /> Branding</p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4">
            <Field label="Business name" className="col-span-2"><TInput defaultValue="Demo Business" /></Field>
            <Field label="Support email"><TInput defaultValue="contact@example.com" /></Field>
            <Field label="Invoice footer" className="col-span-2"><TInput defaultValue="Thank you for your business." /></Field>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => pushToast({ title: 'Settings saved', description: 'Payments settings updated (demo).', variant: 'success' })}>
          <Check size={15} /> Save settings
        </Button>
      </div>
    </div>
  );
}
