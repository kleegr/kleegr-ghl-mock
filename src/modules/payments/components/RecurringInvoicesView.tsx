/**
 * RecurringInvoicesView — subscriptions-style recurring invoice schedules.
 * Lightly populated from the module-local RECURRING_INVOICES fixture; if that
 * were empty it falls back to a polished empty state. "New Recurring Invoice"
 * opens a demo create modal (nothing is persisted or charged).
 */

import { useState } from 'react';
import { Plus, Repeat, Pause, Play, Pencil } from 'lucide-react';
import { Button, Badge, EmptyState } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { SimpleTable, type Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { money, dateLabel, fullName } from '@/utils';
import { ActionMenu, Field, TInput, TSelect } from './ui';
import { RECURRING_INVOICES, type RecurringInvoice } from '../data';

function RecurringStatusBadge({ status }: { status: RecurringInvoice['status'] }) {
  const tone = status === 'active' ? 'good' : status === 'paused' ? 'warn' : 'neutral';
  return <Badge tone={tone}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

export function RecurringInvoicesView() {
  const contacts = useStore((s) => s.contacts);
  const pushToast = useStore((s) => s.pushToast);
  const [createOpen, setCreateOpen] = useState(false);
  const [rows] = useState<RecurringInvoice[]>(RECURRING_INVOICES);

  const cols: Column<RecurringInvoice>[] = [
    { key: 'name', header: 'Schedule', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customer },
    { key: 'freq', header: 'Frequency', render: (r) => <Badge tone="neutral">{r.frequency}</Badge> },
    { key: 'next', header: 'Next send', render: (r) => <span className="text-ink-muted">{dateLabel(r.nextSendAt)}</span> },
    { key: 'occ', header: 'Sent', render: (r) => <span className="text-ink-muted">{r.occurrences}</span> },
    { key: 'amount', header: 'Amount', className: 'text-right', render: (r) => <span className="font-semibold">{money(r.amount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <RecurringStatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'edit', label: 'Edit schedule', icon: <Pencil size={15} />, onClick: () => setCreateOpen(true) },
            r.status === 'active'
              ? { id: 'pause', label: 'Pause', icon: <Pause size={15} />, onClick: () => pushToast({ title: 'Schedule paused', description: `${r.name} paused (demo).`, variant: 'info' }) }
              : { id: 'resume', label: 'Resume', icon: <Play size={15} />, onClick: () => pushToast({ title: 'Schedule resumed', description: `${r.name} resumed (demo).`, variant: 'success' }) },
            { id: 'd', label: '', divider: true },
            { id: 'end', label: 'End series', danger: true, onClick: () => pushToast({ title: 'Series ended', description: `${r.name} ended (demo).`, variant: 'info' }) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Recurring Invoices</h2>
          <p className="text-sm text-ink-muted">Automatic invoices on a repeating schedule.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> New Recurring Invoice
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Repeat size={26} />}
            title="No recurring invoices yet"
            body="Set up a repeating invoice to bill a customer automatically each week, month, or quarter."
            action={<Button onClick={() => setCreateOpen(true)}><Plus size={15} /> New Recurring Invoice</Button>}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <SimpleTable<RecurringInvoice> columns={cols} rows={rows} onRowClick={() => setCreateOpen(true)} />
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New recurring invoice"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setCreateOpen(false); pushToast({ title: 'Recurring invoice created', description: 'The schedule is active for this demo session.', variant: 'success' }); }}>
              Create schedule
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Schedule name" className="col-span-2">
            <TInput defaultValue="Monthly Retainer" />
          </Field>
          <Field label="Customer" className="col-span-2">
            <TSelect defaultValue="">
              <option value="">Select a contact…</option>
              {contacts.slice(0, 60).map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)}</option>
              ))}
            </TSelect>
          </Field>
          <Field label="Frequency">
            <TSelect defaultValue="Monthly">
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annually</option>
            </TSelect>
          </Field>
          <Field label="Amount (USD)">
            <TInput type="number" defaultValue={1200} min={0} />
          </Field>
          <Field label="First send date" className="col-span-2">
            <TInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
