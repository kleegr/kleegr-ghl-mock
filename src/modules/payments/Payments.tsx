import { useState } from 'react';
import { CreditCard, Plus, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card } from '@/components/ui/primitives';
import { SimpleTable, type Column, MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { money, dateLabel, fullName } from '@/utils';
import type { Invoice } from '@/types';

export function Payments() {
  const invoices = useStore((s) => s.invoices);
  const products = useStore((s) => s.products);
  const contacts = useStore((s) => s.contacts);
  const [detail, setDetail] = useState<Invoice | null>(null);

  const paid = invoices.filter((i) => i.status === 'paid');
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const contactName = (id: string) => { const c = contacts.find((x) => x.id === id); return c ? fullName(c) : '—'; };

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice', render: (i) => <span className="font-semibold text-ink">{i.number}</span> },
    { key: 'contact', header: 'Contact', render: (i) => <span className="text-ink-muted">{contactName(i.contactId)}</span> },
    { key: 'total', header: 'Amount', render: (i) => <span className="font-semibold text-ink">{money(i.total)}</span> },
    { key: 'status', header: 'Status', render: (i) => <Badge tone={i.status === 'paid' ? 'good' : i.status === 'overdue' ? 'bad' : i.status === 'sent' ? 'warn' : 'neutral'}>{i.status}</Badge> },
    { key: 'due', header: 'Due', render: (i) => <span className="text-ink-subtle">{dateLabel(i.dueAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Invoices, products, and revenue" actions={<Button><Plus size={16} /> New Invoice</Button>} />
      <div className="space-y-4 px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="Collected" value={money(paid.reduce((s, i) => s + i.total, 0))} sub={`${paid.length} paid`} />
          <MiniStat label="Outstanding" value={money(outstanding.reduce((s, i) => s + i.total, 0))} sub={`${outstanding.length} unpaid`} />
          <MiniStat label="Invoices" value={invoices.length} />
          <MiniStat label="Products" value={products.length} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <SimpleTable columns={columns} rows={invoices} onRowClick={setDetail} />
          </div>
          <Card>
            <div className="border-b border-line px-4 py-3"><h3 className="text-sm font-bold text-ink">Products & Services</h3></div>
            <div className="divide-y divide-line">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Package size={15} /></span>
                  <div className="flex-1"><p className="text-sm font-semibold text-ink">{p.name}</p><p className="text-xs text-ink-subtle capitalize">{p.type.replace('_', ' ')}</p></div>
                  <span className="text-sm font-bold text-ink">{money(p.price)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.number ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-ink-muted">Billed to</p><p className="font-semibold text-ink">{contactName(detail.contactId)}</p></div>
              <Badge tone={detail.status === 'paid' ? 'good' : detail.status === 'overdue' ? 'bad' : 'warn'}>{detail.status}</Badge>
            </div>
            <div className="rounded-lg border border-line">
              {detail.lineItems.map((li, idx) => (
                <div key={idx} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                  <span className="text-ink">{li.name} <span className="text-ink-subtle">×{li.qty}</span></span>
                  <span className="font-medium text-ink">{money(li.qty * li.unitPrice)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{money(detail.subtotal)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>Tax</span><span>{money(detail.tax)}</span></div>
              <div className="flex justify-between border-t border-line pt-1 font-bold text-ink"><span>Total</span><span>{money(detail.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
