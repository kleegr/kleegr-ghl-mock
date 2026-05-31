/**
 * InvoiceBuilder — a full invoice/estimate authoring surface with a live
 * preview pane that updates from local state as you edit. Opened from the
 * "+ New" dropdown and from row actions; it is an in-page overlay (not a route)
 * so the Payments page stays mounted and the Tutorial Mode "create-invoice"
 * flow can still spotlight `payments.invoiceModal` + `payments.invoiceSubmit`.
 *
 * Demo-only: nothing is persisted and no email/payment is sent.
 */

import { useMemo, useState } from 'react';
import { Plus, Trash2, Send, Save, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { money, fullName } from '@/utils';
import type { Contact, Product } from '@/types';
import { Overlay, Field, TInput, TSelect, TArea } from './ui';

interface Line {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

let lineSeq = 0;
const newLine = (): Line => ({ id: `ln_${++lineSeq}`, name: '', qty: 1, unitPrice: 0 });

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);

export function InvoiceBuilder({
  open,
  onClose,
  mode,
  contacts,
  products,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'invoice' | 'estimate';
  contacts: Contact[];
  products: Product[];
  onSaved: (kind: 'draft' | 'sent') => void;
}) {
  const isEstimate = mode === 'estimate';
  const docWord = isEstimate ? 'Estimate' : 'Invoice';

  const [contactId, setContactId] = useState('');
  const [number, setNumber] = useState(isEstimate ? 'EST-2045' : 'INV-1007');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(plusDaysISO(14));
  const [lines, setLines] = useState<Line[]>([{ ...newLine(), name: 'Starter Package', unitPrice: 499 }]);
  const [taxRate, setTaxRate] = useState(8);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('Thank you for your business. Payment is due within 14 days.');

  const contact = contacts.find((c) => c.id === contactId);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.qty * l.unitPrice, 0), [lines]);
  const discountAmt = Math.round((subtotal * discount) / 100);
  const taxedBase = Math.max(0, subtotal - discountAmt);
  const taxAmt = Math.round((taxedBase * taxRate) / 100);
  const total = taxedBase + taxAmt;

  function setLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addProduct(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) => [...prev, { ...newLine(), name: p.name, unitPrice: p.price }]);
  }

  function finish(kind: 'draft' | 'sent') {
    onSaved(kind);
    onClose();
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      data-tour="payments.invoiceModal"
      title={`New ${docWord}`}
      subtitle={`${number} · Demo Business`}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => finish('draft')}>
            <Save size={15} /> Save draft
          </Button>
          <Button
            size="sm"
            data-tour="payments.invoiceSubmit"
            onClick={() => finish('sent')}
            disabled={!contactId || lines.length === 0}
          >
            <Send size={15} /> {isEstimate ? 'Send estimate' : 'Send invoice'}
          </Button>
        </>
      }
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── editor pane ── */}
        <div className="min-h-0 overflow-y-auto border-r border-line bg-surface px-5 py-5">
          <h3 className="mb-3 text-sm font-bold text-ink">{docWord} details</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer" className="col-span-2">
              <TSelect value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">Select a contact…</option>
                {contacts.slice(0, 60).map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(c)}
                  </option>
                ))}
              </TSelect>
            </Field>
            <Field label={`${docWord} number`}>
              <TInput value={number} onChange={(e) => setNumber(e.target.value)} />
            </Field>
            <Field label="Issue date">
              <TInput type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label={isEstimate ? 'Valid until' : 'Due date'}>
              <TInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Discount (%)">
              <TInput
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              />
            </Field>
          </div>

          {/* line items */}
          <div className="mb-2 mt-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Line items</h3>
            <div className="flex items-center gap-2">
              <TSelect
                className="h-8 w-44 text-xs"
                value=""
                onChange={(e) => {
                  if (e.target.value) addProduct(e.target.value);
                }}
              >
                <option value="">+ Add from catalog</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(p.price)}
                  </option>
                ))}
              </TSelect>
              <Button size="xs" variant="secondary" onClick={() => setLines((p) => [...p, newLine()])}>
                <Plus size={13} /> Item
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_64px_92px_92px_32px] gap-2 border-b border-line bg-surface-sunken px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {lines.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[1fr_64px_92px_92px_32px] items-center gap-2 border-b border-line/60 px-3 py-2 last:border-0"
              >
                <input
                  value={l.name}
                  placeholder="Product or service"
                  onChange={(e) => setLine(l.id, { name: e.target.value })}
                  className="h-8 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand"
                />
                <input
                  type="number"
                  min={1}
                  value={l.qty}
                  onChange={(e) => setLine(l.id, { qty: Math.max(1, Number(e.target.value)) })}
                  className="h-8 w-full rounded-md border border-line bg-surface px-2 text-right text-sm text-ink outline-none focus:border-brand"
                />
                <input
                  type="number"
                  min={0}
                  value={l.unitPrice}
                  onChange={(e) => setLine(l.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                  className="h-8 w-full rounded-md border border-line bg-surface px-2 text-right text-sm text-ink outline-none focus:border-brand"
                />
                <span className="text-right text-sm font-semibold text-ink">{money(l.qty * l.unitPrice)}</span>
                <button
                  onClick={() => setLines((p) => (p.length > 1 ? p.filter((x) => x.id !== l.id) : p))}
                  className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-bad/10 hover:text-bad"
                  aria-label="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Tax rate (%)">
              <TInput
                type="number"
                min={0}
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
              />
            </Field>
          </div>

          <Field label="Notes / terms" className="mt-3">
            <TArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        {/* ── live preview pane ── */}
        <div className="min-h-0 overflow-y-auto bg-surface-sunken px-5 py-5">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            <Eye size={13} /> Live preview
          </div>
          <div className="mx-auto max-w-xl rounded-xl border border-line bg-surface p-6 shadow-card">
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-fg">
                  <FileText size={18} />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-ink">Demo Business</p>
                  <p className="text-[11px] text-ink-muted">contact@example.com · +1 (555) 010-0100</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-extrabold uppercase text-ink">{docWord}</p>
                <p className="text-xs text-ink-muted">{number}</p>
              </div>
            </div>

            {/* meta */}
            <div className="grid grid-cols-2 gap-4 py-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Bill to</p>
                <p className="mt-0.5 font-semibold text-ink">{contact ? fullName(contact) : 'Select a customer'}</p>
                {contact && <p className="text-xs text-ink-muted">{contact.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">
                  Issued <span className="font-medium text-ink">{issueDate}</span>
                </p>
                <p className="text-xs text-ink-muted">
                  {isEstimate ? 'Valid until' : 'Due'} <span className="font-medium text-ink">{dueDate}</span>
                </p>
              </div>
            </div>

            {/* items */}
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
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-line/50">
                    <td className="py-2 text-ink">{l.name || <span className="text-ink-subtle">—</span>}</td>
                    <td className="py-2 text-right text-ink-muted">{l.qty}</td>
                    <td className="py-2 text-right text-ink-muted">{money(l.unitPrice)}</td>
                    <td className="py-2 text-right font-medium text-ink">{money(l.qty * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* totals */}
            <div className="ml-auto mt-3 w-56 space-y-1 text-sm">
              <Row label="Subtotal" value={money(subtotal)} />
              {discount > 0 && <Row label={`Discount (${discount}%)`} value={`−${money(discountAmt)}`} muted />}
              <Row label={`Tax (${taxRate}%)`} value={money(taxAmt)} muted />
              <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            {notes && (
              <div className="mt-5 border-t border-line pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Notes</p>
                <p className="mt-1 whitespace-pre-line text-xs text-ink-muted">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-ink-muted' : 'text-ink'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
