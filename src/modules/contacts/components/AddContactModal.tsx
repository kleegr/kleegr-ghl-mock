import { useState, type ReactNode, type ChangeEvent } from 'react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';

const SOURCES = [
  'Facebook Ads', 'Google Ads', 'Website Form', 'Referral',
  'Instagram', 'Cold Outreach', 'Walk-in', 'Webinar',
];

const INPUT_CLS =
  'w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  tags: string;
}

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  source: 'Website Form', tags: 'lead',
};

export function AddContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addContact = useStore(s => s.addContact);
  const [form, setForm] = useState<FormState>(INITIAL);

  function update(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    addContact({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      source: form.source,
      tags,
    });
    setForm(INITIAL);
    onClose();
  }

  const isValid = Boolean(form.firstName.trim() && form.lastName.trim() && form.email.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Contact"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button data-tour="contacts.addSubmit" onClick={handleSubmit} disabled={!isValid}>
            Add Contact
          </Button>
        </>
      }
    >
      <div data-tour="contacts.addModal" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name *">
            <input value={form.firstName} onChange={update('firstName')} placeholder="First" className={INPUT_CLS} autoFocus />
          </Field>
          <Field label="Last Name *">
            <input value={form.lastName} onChange={update('lastName')} placeholder="Last" className={INPUT_CLS} />
          </Field>
        </div>
        <Field label="Email *">
          <input type="email" value={form.email} onChange={update('email')} placeholder="contact@example.com" className={INPUT_CLS} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" className={INPUT_CLS} />
        </Field>
        <Field label="Source">
          <select value={form.source} onChange={update('source')} className={INPUT_CLS}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Tags" hint="Comma-separated, e.g. lead, hot">
          <input value={form.tags} onChange={update('tags')} placeholder="lead, hot" className={INPUT_CLS} />
        </Field>
      </div>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ink">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-subtle">{hint}</p>}
    </div>
  );
}
