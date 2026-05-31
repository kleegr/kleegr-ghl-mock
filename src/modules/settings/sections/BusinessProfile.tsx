import { useState } from 'react';
import { Building2, Upload, MapPin, User2, Globe2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Badge, Button } from '@/components/ui/primitives';
import { Field, TextInput, Select, SettingsCard, SaveBar, CopyId } from './_ui';

/**
 * Settings -> Business Profile.
 *
 * A GHL-style account profile: business identity, contact details, locale, and
 * an authorized representative, plus a copyable Location ID chip. All values are
 * generic demo data and edits are session-local (committed on Save, reverted on
 * Cancel) - nothing is persisted or sent anywhere.
 */

interface ProfileForm {
  name: string;
  legalName: string;
  category: string;
  website: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  timezone: string;
  repName: string;
  repEmail: string;
  repPhone: string;
}

const INITIAL: ProfileForm = {
  name: 'Demo Business',
  legalName: 'Demo Business LLC',
  category: 'Professional Services',
  website: 'https://demo-business.example.com',
  email: 'contact@example.com',
  phone: '+1 (555) 010-0100',
  street: '100 Demo Street, Suite 200',
  city: 'Demo City',
  state: 'NY',
  postal: '10001',
  country: 'United States',
  timezone: 'America/New_York',
  repName: 'Demo User',
  repEmail: 'demo.user@example.com',
  repPhone: '+1 (555) 010-0101',
};

const CATEGORIES = [
  'Professional Services',
  'Home Services',
  'Health & Wellness',
  'Real Estate',
  'Marketing Agency',
  'Retail',
  'Other',
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'UTC',
];

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia'];

const LOCATION_ID = 'loc_DEMO000111222';

export function BusinessProfile() {
  const pushToast = useStore((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const [committed, setCommitted] = useState<ProfileForm>(INITIAL);
  const [form, setForm] = useState<ProfileForm>(INITIAL);

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const startEdit = () => {
    setForm(committed);
    setEditing(true);
  };
  const cancel = () => {
    setForm(committed);
    setEditing(false);
  };
  const save = () => {
    setCommitted(form);
    setEditing(false);
    pushToast({ title: 'Business profile saved', description: 'Profile details updated for this demo session.', variant: 'success' });
  };

  /* Read-only value or an editable control depending on mode. */
  const ro = (value: string) => <p className="text-sm text-ink">{value || <span className="text-ink-subtle">-</span>}</p>;

  return (
    <div data-tour="settings.businessProfile" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Business Profile</p>
          <p className="mt-0.5 text-xs text-ink-muted">How your business appears across the account.</p>
        </div>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={startEdit}>Edit profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={save}>Save changes</Button>
          </div>
        )}
      </div>

      {/* Identity / logo */}
      <SettingsCard>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={committed.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-ink">{committed.name}</p>
              <Badge tone="neutral">{committed.category}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">Location ID</p>
            <div className="mt-1"><CopyId id={LOCATION_ID} label="Location ID" /></div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast({ title: 'Upload logo', description: 'Logo upload is simulated in the demo.', variant: 'info' })}
          >
            <Upload size={14} /> Upload logo
          </Button>
        </div>
      </SettingsCard>

      {/* Business details */}
      <SettingsCard title="Business details" desc="Name, category, and public website." actions={<Building2 size={16} className="text-ink-subtle" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business name" required>
            {editing ? <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} /> : ro(committed.name)}
          </Field>
          <Field label="Legal business name">
            {editing ? <TextInput value={form.legalName} onChange={(e) => set('legalName', e.target.value)} /> : ro(committed.legalName)}
          </Field>
          <Field label="Business category">
            {editing ? (
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            ) : ro(committed.category)}
          </Field>
          <Field label="Website">
            {editing ? <TextInput value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" /> : ro(committed.website)}
          </Field>
        </div>
      </SettingsCard>

      {/* Contact */}
      <SettingsCard title="Contact" desc="Where customers and the platform reach your business." actions={<Globe2 size={16} className="text-ink-subtle" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business email" required>
            {editing ? <TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /> : ro(committed.email)}
          </Field>
          <Field label="Business phone">
            {editing ? <TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} /> : ro(committed.phone)}
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-subtle">
          <MapPin size={14} /> Business address
        </div>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Street" className="sm:col-span-2">
            {editing ? <TextInput value={form.street} onChange={(e) => set('street', e.target.value)} /> : ro(committed.street)}
          </Field>
          <Field label="City">
            {editing ? <TextInput value={form.city} onChange={(e) => set('city', e.target.value)} /> : ro(committed.city)}
          </Field>
          <Field label="State / Region">
            {editing ? <TextInput value={form.state} onChange={(e) => set('state', e.target.value)} /> : ro(committed.state)}
          </Field>
          <Field label="Postal code">
            {editing ? <TextInput value={form.postal} onChange={(e) => set('postal', e.target.value)} /> : ro(committed.postal)}
          </Field>
          <Field label="Country">
            {editing ? (
              <Select value={form.country} onChange={(e) => set('country', e.target.value)}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            ) : ro(committed.country)}
          </Field>
        </div>
      </SettingsCard>

      {/* Locale */}
      <SettingsCard title="Locale" desc="Default timezone used for scheduling and reporting.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Timezone">
            {editing ? (
              <Select value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
            ) : ro(committed.timezone)}
          </Field>
        </div>
      </SettingsCard>

      {/* Authorized representative */}
      <SettingsCard title="Authorized representative" desc="Primary contact person for this account." actions={<User2 size={16} className="text-ink-subtle" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2">
            {editing ? <TextInput value={form.repName} onChange={(e) => set('repName', e.target.value)} /> : ro(committed.repName)}
          </Field>
          <Field label="Email">
            {editing ? <TextInput type="email" value={form.repEmail} onChange={(e) => set('repEmail', e.target.value)} /> : ro(committed.repEmail)}
          </Field>
          <Field label="Phone">
            {editing ? <TextInput value={form.repPhone} onChange={(e) => set('repPhone', e.target.value)} /> : ro(committed.repPhone)}
          </Field>
        </div>
        {editing && <SaveBar onSave={save} onCancel={cancel} saveLabel="Save changes" />}
      </SettingsCard>
    </div>
  );
}
