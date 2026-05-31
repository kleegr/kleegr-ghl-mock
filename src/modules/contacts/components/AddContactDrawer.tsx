import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { AddContactInput } from '@/store/useStore';
import type { Contact } from '@/types';
import { Button } from '@/components/ui/primitives';
import { Drawer, Field, INPUT_CLS } from './Drawer';
import { CONTACT_TYPES, TIMEZONES, CONTACT_SOURCES } from '../data';

/**
 * Add Contact slide-over. A polished, GoHighLevel-style form that writes a real
 * record to the session store via `addContact`. The contact-type selector seeds
 * a sensible starter tag so the new record lands in the matching saved view, and
 * the two foundation custom fields (Lead Score / Preferred Channel) are captured
 * inline so the detail workspace reads consistently.
 *
 * Carries the tutorial-flow targets `contacts.addModal` (drawer body) and
 * `contacts.addSubmit` (primary submit button).
 */

const TYPE_TAG: Record<string, string> = {
  Lead: 'lead',
  Customer: 'past-client',
  Prospect: 'nurture',
  Partner: 'vip',
};

const CHANNELS = ['SMS', 'Email', 'Phone'] as const;

interface FormState {
  contactType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  ownerId: string;
  source: string;
  tags: string;
  dnd: boolean;
  leadScore: string;
  preferredChannel: string;
}

const EMPTY: FormState = {
  contactType: 'Lead',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  timezone: 'America/New_York',
  ownerId: 'u_me',
  source: CONTACT_SOURCES[0],
  tags: '',
  dnd: false,
  leadScore: '',
  preferredChannel: '',
};

export function AddContactDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}) {
  const users = useStore((s) => s.users);
  const addContact = useStore((s) => s.addContact);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  // Reset the form whenever the drawer is (re)opened.
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setTouched(false);
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
  const valid = form.firstName.trim() && form.lastName.trim() && emailValid;

  function submit() {
    setTouched(true);
    if (!valid) return;

    const typedTags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const starter = TYPE_TAG[form.contactType];
    const tags = Array.from(new Set([starter, ...typedTags].filter(Boolean)));

    const customFields: Record<string, string | number | boolean> = {};
    if (form.leadScore.trim() && !Number.isNaN(Number(form.leadScore))) {
      customFields.leadScore = Number(form.leadScore);
    }
    if (form.preferredChannel) customFields.preferredChannel = form.preferredChannel;

    const input: AddContactInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      source: form.source,
      tags,
      ownerId: form.ownerId,
      dnd: form.dnd,
      customFields,
    };

    const created = addContact(input);
    onClose();
    onCreated(created);
  }

  const showError = touched && !valid;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add Contact"
      subtitle="Create a new contact record"
      width="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" data-tour="contacts.addSubmit" onClick={submit} disabled={!valid}>
            Save Contact
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-tour="contacts.addModal">
        <Field label="Contact Type">
          <div className="flex flex-wrap gap-1.5">
            {CONTACT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('contactType', t)}
                className={
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (form.contactType === t
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken')
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name">
            <input
              className={INPUT_CLS}
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="Jordan"
            />
          </Field>
          <Field label="Last Name">
            <input
              className={INPUT_CLS}
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Avery"
            />
          </Field>
        </div>

        <Field label="Email" hint={touched && !emailValid ? 'Enter a valid email address.' : undefined}>
          <input
            className={INPUT_CLS}
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jordan.avery@example.com"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              className={INPUT_CLS}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+1 (555) 248-1190"
            />
          </Field>
          <Field label="Timezone">
            <select className={INPUT_CLS} value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner">
            <select className={INPUT_CLS} value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select className={INPUT_CLS} value={form.source} onChange={(e) => set('source', e.target.value)}>
              {CONTACT_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Tags" hint="Comma-separated. A starter tag is added from the contact type.">
          <input
            className={INPUT_CLS}
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="newsletter, follow-up"
          />
        </Field>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surface-sunken px-3 py-2.5">
          <span className="text-xs font-semibold text-ink">Do Not Disturb (DND)</span>
          <input
            type="checkbox"
            checked={form.dnd}
            onChange={(e) => set('dnd', e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-line accent-brand"
          />
        </label>

        <div className="rounded-xl border border-line bg-surface-sunken/50 p-3">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Custom Fields</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lead Score">
              <input
                className={INPUT_CLS}
                type="number"
                value={form.leadScore}
                onChange={(e) => set('leadScore', e.target.value)}
                placeholder="0–100"
              />
            </Field>
            <Field label="Preferred Channel">
              <select
                className={INPUT_CLS}
                value={form.preferredChannel}
                onChange={(e) => set('preferredChannel', e.target.value)}
              >
                <option value="">—</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {showError && (
          <p className="rounded-lg bg-bad/10 px-3 py-2 text-xs font-medium text-bad">
            First name, last name, and a valid email are required.
          </p>
        )}
      </div>
    </Drawer>
  );
}
