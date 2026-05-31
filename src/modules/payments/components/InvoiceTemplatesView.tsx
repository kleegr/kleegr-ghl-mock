/**
 * InvoiceTemplatesView — reusable invoice templates with a preview/edit panel.
 * Left: selectable template list. Right: a preview of the selected template
 * (numbering, line summary, totals, notes) with demo Use / Edit / Duplicate
 * actions. Backed by the module-local INVOICE_TEMPLATES fixture.
 */

import { useState } from 'react';
import { Plus, FileText, Pencil, Copy, Check } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { money, dateLabel, cx } from '@/utils';
import { INVOICE_TEMPLATES, type InvoiceTemplate } from '../data';

export function InvoiceTemplatesView() {
  const pushToast = useStore((s) => s.pushToast);
  const [selectedId, setSelectedId] = useState(INVOICE_TEMPLATES[0]?.id ?? '');
  const selected = INVOICE_TEMPLATES.find((t) => t.id === selectedId) ?? INVOICE_TEMPLATES[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Invoice Templates</h2>
          <p className="text-sm text-ink-muted">Pre-built invoices you can reuse and auto-number.</p>
        </div>
        <Button onClick={() => pushToast({ title: 'New template', description: 'Template builder opened (demo).', variant: 'info' })}>
          <Plus size={15} /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* list */}
        <div className="space-y-2">
          {INVOICE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl border bg-surface p-3 text-left shadow-card transition-colors',
                t.id === selectedId ? 'border-brand ring-1 ring-brand/30' : 'border-line hover:border-brand/40',
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <FileText size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{t.name}</span>
                <span className="block text-xs text-ink-muted">{t.prefix}{t.nextNumber} · {money(t.total)}</span>
              </span>
              <Badge tone={t.status === 'active' ? 'good' : 'neutral'}>{t.status}</Badge>
            </button>
          ))}
        </div>

        {/* preview */}
        {selected && (
          <Card className="p-0">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <p className="font-display text-base font-bold text-ink">{selected.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Updated {dateLabel(selected.updatedAt)} · {selected.items} line item{selected.items === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Duplicated', description: `Copy of “${selected.name}” created (demo).`, variant: 'success' })}>
                  <Copy size={14} /> Duplicate
                </Button>
                <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Editing template', description: `${selected.name} opened (demo).`, variant: 'info' })}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button size="sm" onClick={() => pushToast({ title: 'Template applied', description: `New invoice started from “${selected.name}” (demo).`, variant: 'success' })}>
                  <Check size={14} /> Use template
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 px-5 py-4">
              <Tile label="Numbering" value={`${selected.prefix}${selected.nextNumber}`} />
              <Tile label="Default total" value={money(selected.total)} />
              <Tile label="Status" value={selected.status === 'active' ? 'Active' : 'Draft'} />
            </div>

            {/* mini paper preview */}
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-line bg-surface-sunken p-5">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-fg"><FileText size={16} /></span>
                    <div>
                      <p className="font-display text-sm font-bold text-ink">Demo Business</p>
                      <p className="text-[11px] text-ink-muted">{selected.prefix}{selected.nextNumber}</p>
                    </div>
                  </div>
                  <p className="font-display text-sm font-extrabold uppercase text-ink">Invoice</p>
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Notes / terms</p>
                <p className="mt-1 text-xs text-ink-muted">{selected.notes}</p>
                <div className="ml-auto mt-4 w-44 border-t border-line pt-2 text-sm">
                  <div className="flex justify-between font-bold text-ink"><span>Total</span><span>{money(selected.total)}</span></div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
