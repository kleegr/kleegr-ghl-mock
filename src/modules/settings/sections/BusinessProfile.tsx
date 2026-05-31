import { useState } from 'react';
import { Building2, Upload, Globe, Mail, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { GroupCard, Field, TextInput, Select, CopyChip, KeyValue } from './ui';
import { TIMEZONES } from './staffData';

/**
 * Settings → Business Profile.
 *
 * GoHighLevel-style account profile: business identity, address, an authorized
 * contact person, and copyable account identifiers. Read-only by default; the
 * Edit button swaps every value for an input. Everything is local + demo-safe —
 * no real identity, nothing persisted (Save just shows confirmation feedback).
 */

const CATEGORIES = [
  'Professional Services',
  'Marketing Agency',
  'Real Estate',
  'Home Services',
  'Health & Wellness',
  'Fitness & Coaching',
  'Education',
  'Other',
];

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia'];

interface ProfileForm {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  timezone: string;
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const INITIAL: ProfileForm = {
  name: 'Demo Business',
  legalName: 'Demo Business LLC',
  email: 'contact@example.com',
  phone: '+1 (555) 010-0100',
  website: 'https://demo-business.example.com',
  category: 'Professional Services',
  timezone: 'America/Chicago (CT)',
  street: '100 Demo Street, Suite 200',
  city: 'Demo City',
  state: 'CA',
  postal: '94000',
  country: 'United States',
  contactName: 'Demo User',
  contactEmail: 'demo.user@example.com',
  contactPhone: '+1 (555) 010-0100',
};

export function BusinessProfile() {
  const pushToast = useStore((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<ProfileForm>(INITIAL);
  const [form, setForm] = useState<ProfileForm>(INITIAL);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startEdit = () => {
    setForm(saved);
    setEditing(true);
  };
  const cancel = () => {
    setForm(saved);
    setEditing(false);
  };
  const save = () => {
    setSaved(form);
    setEditing(false);
    pushToast({
      title: 'Business profile saved',
      description: 'Your changes were applied for this demo session.',
      variant: 'success',
    });
  };

  const cityLine = [saved.city, saved.state, saved.postal].filter(Boolean).join(', ');

  return (
    <div data-tour="settings.businessProfile" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Business Profile</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            How your business appears across the account and on outbound communications.
          </p>
        </div>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={startEdit}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Logo + identity strip */}
      <GroupCard title="Logo & branding" desc="Shown on invoices, booking pages, and emails.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Building2 size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{saved.name}</p>
            <p className="text-xs text-ink-muted">{saved.category}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Upload logo (demo)', description: 'File pickers are disabled in this demo.', variant: 'info' })}>
              <Upload size={13} /> Upload logo
            </Button>
          </div>
        </div>
      </GroupCard>

      {/* General information */}
      <GroupCard title="General information" bodyClassName={editing ? 'space-y-4' : 'p-0'}>
        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business name" required>
              <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Legal business name" hint="Used for invoicing & A2P registration.">
              <TextInput value={form.legalName} onChange={(e) => set('legalName', e.target.value)} />
            </Field>
            <Field label="Business email">
              <TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Business phone">
              <TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Website">
              <TextInput value={form.website} onChange={(e) => set('website', e.target.value)} />
            </Field>
            <Field label="Business category">
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Timezone" className="sm:col-span-2">
              <Select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
          </div>
        ) : (
          <div className="divide-y divide-line">
            <KeyValue label="Business name">{saved.name}</KeyValue>
            <KeyValue label="Legal business name">{saved.legalName}</KeyValue>
            <KeyValue label="Business email">
              <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-ink-subtle" />{saved.email}</span>
            </KeyValue>
            <KeyValue label="Business phone">
              <span className="inline-flex items-center gap-1.5"><PhoneIcon size={13} className="text-ink-subtle" />{saved.phone}</span>
            </KeyValue>
            <KeyValue label="Website">
              <span className="inline-flex items-center gap-1.5"><Globe size={13} className="text-ink-subtle" />{saved.website}</span>
            </KeyValue>
            <KeyValue label="Business category">{saved.category}</KeyValue>
            <KeyValue label="Timezone">{saved.timezone}</KeyValue>
          </div>
        )}
      </GroupCard>

      {/* Address */}
      <GroupCard title="Business address" bodyClassName={editing ? 'space-y-4' : 'p-0'}>
        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Street address" className="sm:col-span-2">
              <TextInput value={form.street} onChange={(e) => set('street', e.target.value)} />
            </Field>
            <Field label="City">
              <TextInput value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="State / Region">
              <TextInput value={form.state} onChange={(e) => set('state', e.target.value)} />
            </Field>
            <Field label="Postal code">
              <TextInput value={form.postal} onChange={(e) => set('postal', e.target.value)} />
            </Field>
            <Field label="Country">
              <Select value={form.country} onChange={(e) => set('country', e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
        ) : (
          <div className="divide-y divide-line">
            <KeyValue label="Street">
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-ink-subtle" />{saved.street}</span>
            </KeyValue>
            <KeyValue label="City / State / ZIP">{cityLine}</KeyValue>
            <KeyValue label="Country">{saved.country}</KeyValue>
          </div>
        )}
      </GroupCard>

      {/* Authorized contact */}
      <GroupCard
        title="Authorized representative"
        desc="Primary contact for compliance and account notices."
        bodyClassName={editing ? 'space-y-4' : 'p-0'}
      >
        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
          </div>
        ) : (
          <div className="divide-y divide-line">
            <KeyValue label="Full name">{saved.contactName}</KeyValue>
            <KeyValue label="Email">{saved.contactEmail}</KeyValue>
            <KeyValue label="Phone">{saved.contactPhone}</KeyValue>
          </div>
        )}
      </GroupCard>

      {/* Identifiers */}
      <GroupCard title="Account identifiers" desc="Reference these IDs when contacting support.">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-ink-subtle">Location ID</p>
            <CopyChip value="loc_DEMO1234ABCD" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-ink-subtle">Account ID</p>
            <CopyChip value="acct_DEMO5678WXYZ" />
          </div>
        </div>
      </GroupCard>
    </div>
  );
}
