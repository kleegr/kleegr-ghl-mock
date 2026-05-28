import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Calendar, Phone, Sliders, Tag,
  GitBranch, Code2, Bell, Plug, Plus, Check, ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card, Avatar } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';

/* ─── local fake data (phone, custom fields, etc.) ────────────── */

const FAKE_PHONES = [
  { id: 'ph_1', number: '+1 (555) 400-1100', label: 'Main Line', type: 'local', status: 'active' },
  { id: 'ph_2', number: '+1 (555) 400-1101', label: 'Toll Free', type: 'toll_free', status: 'active' },
  { id: 'ph_3', number: '+1 (555) 400-1102', label: 'Sales', type: 'local', status: 'active' },
];

const FAKE_CUSTOM_FIELDS = [
  { id: 'cf_1', name: 'Lead Score', type: 'number', scope: 'contact' },
  { id: 'cf_2', name: 'Preferred Channel', type: 'dropdown', scope: 'contact' },
  { id: 'cf_3', name: 'Service Interest', type: 'text', scope: 'contact' },
  { id: 'cf_4', name: 'Budget Range', type: 'dropdown', scope: 'opportunity' },
  { id: 'cf_5', name: 'Referral Source', type: 'text', scope: 'contact' },
];

const FAKE_CUSTOM_VALUES = [
  { id: 'cv_1', key: 'business.name', value: 'Kleegr Demo Co.' },
  { id: 'cv_2', key: 'business.phone', value: '+1 (555) 010-0100' },
  { id: 'cv_3', key: 'offer.promo_code', value: 'WELCOME20' },
  { id: 'cv_4', key: 'booking.url', value: 'https://book.kleegr-demo.example.com' },
];

const ALL_TAGS = [
  'lead', 'hot', 'vip', 'nurture', 'newsletter', 'past-client',
  'no-show', 'consult-booked', 'follow-up', 'new-client',
];

/* ─── Reusable toggle ─────────────────────────────────────────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span className={cx('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-1')} />
    </button>
  );
}

/* ─── Section: Business Profile ───────────────────────────────── */

function BusinessProfile() {
  const pushToast = useStore((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const fields = [
    { label: 'Business Name', value: 'Kleegr Demo Co.' },
    { label: 'Website', value: 'https://kleegr-demo.example.com' },
    { label: 'Phone', value: '+1 (555) 010-0100' },
    { label: 'Email', value: 'info@kleegr-demo.example.com' },
    { label: 'Address', value: '1234 Commerce Blvd, Austin, TX 78701' },
    { label: 'Timezone', value: 'America/Chicago (CDT, UTC–5)' },
    { label: 'Industry', value: 'Marketing & Automation' },
  ];
  return (
    <div data-tour="settings.businessProfile">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Business Profile</p>
        {!editing
          ? <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          : <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={() => { pushToast({ title: 'Profile saved (demo only)', variant: 'success' }); setEditing(false); }}>Save Changes</Button>
            </div>
        }
      </div>
      <Card>
        <div className="divide-y divide-line">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <p className="w-40 shrink-0 text-xs font-semibold text-ink-subtle">{f.label}</p>
              {editing ? (
                <input
                  defaultValue={f.value}
                  className="flex-1 rounded-lg border border-line bg-surface-sunken px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              ) : (
                <p className="flex-1 text-sm text-ink">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── Section: Staff ──────────────────────────────────────────── */

function StaffSection() {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.staff">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">My Staff</p>
        <Button
          size="sm"
          data-tour="settings.addConfig"
          onClick={() => pushToast({ title: 'Add User — demo only', description: 'Staff additions are not persisted in demo mode.', variant: 'info' })}
        >
          <Plus size={13} /> Add User
        </Button>
      </div>
      <Card>
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{u.name}</p>
                  {u.isCurrentUser && <Badge tone="brand">You</Badge>}
                  <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role}</Badge>
                </div>
                <p className="text-xs text-ink-muted">{u.email}</p>
                {u.phone && <p className="text-xs text-ink-subtle">{u.phone}</p>}
              </div>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Calendars ──────────────────────────────────────── */

function CalendarsSection() {
  const calendars = useStore((s) => s.calendars);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Calendars</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Calendar — demo only', variant: 'info' })}>
          <Plus size={13} /> Add Calendar
        </Button>
      </div>
      <Card>
        {calendars.map((cal) => (
          <div key={cal.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
              <p className="text-sm font-medium text-ink">{cal.name}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Phone Numbers ──────────────────────────────────── */

function PhoneSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Phone Numbers</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Buy Number — demo only', variant: 'info' })}>
          <Plus size={13} /> Buy Number
        </Button>
      </div>
      <Card>
        {FAKE_PHONES.map((ph) => (
          <div key={ph.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{ph.number}</p>
              <p className="text-xs text-ink-muted">{ph.label} · {ph.type.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="good">{ph.status}</Badge>
              <Button variant="ghost" size="xs">Edit</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Tags ───────────────────────────────────────────── */

function TagsSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Tags</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Tag — demo only', variant: 'info' })}>
          <Plus size={13} /> Add Tag
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">
            {tag}
            <button className="text-ink-subtle hover:text-bad">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Section: Pipelines ──────────────────────────────────────── */

function PipelinesSection() {
  const pipelines = useStore((s) => s.pipelines);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Pipelines</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Pipeline — demo only', variant: 'info' })}>
          <Plus size={13} /> Add Pipeline
        </Button>
      </div>
      <div className="space-y-3">
        {pipelines.map((pipe) => (
          <Card key={pipe.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{pipe.name}</p>
              <Button variant="ghost" size="xs">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pipe.stages.map((st) => (
                <span key={st.id} className="rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink">
                  {st.order + 1}. {st.name}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Section: Custom Fields ──────────────────────────────────── */

function CustomFieldsSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Custom Fields</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Field — demo only', variant: 'info' })}>
          <Plus size={13} /> Add Field
        </Button>
      </div>
      <Card>
        {FAKE_CUSTOM_FIELDS.map((cf) => (
          <div key={cf.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{cf.name}</p>
              <p className="text-xs text-ink-muted">{cf.type} · {cf.scope}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Custom Values ──────────────────────────────────── */

function CustomValuesSection() {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <div data-tour="settings.configSection">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Custom Values</p>
        <Button size="sm" data-tour="settings.addConfig" onClick={() => pushToast({ title: 'Add Value — demo only', variant: 'info' })}>
          <Plus size={13} /> Add Value
        </Button>
      </div>
      <Card>
        {FAKE_CUSTOM_VALUES.map((cv) => (
          <div key={cv.id} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-3.5 last:border-0">
            <div>
              <p className="font-mono text-xs text-brand">{`{{${cv.key}}}`}</p>
              <p className="text-sm text-ink">{cv.value}</p>
            </div>
            <Button variant="ghost" size="xs">Edit</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Notifications ──────────────────────────────────── */

function NotificationsSection() {
  const pushToast = useStore((s) => s.pushToast);
  const [toggles, setToggles] = useState({
    new_lead_email: true,
    new_lead_sms: true,
    missed_call_sms: true,
    appointment_reminder: true,
    review_received: false,
    payment_received: true,
    weekly_report: false,
    marketing_updates: false,
  });
  function flip(k: keyof typeof toggles) {
    setToggles((p) => ({ ...p, [k]: !p[k] }));
    pushToast({ title: 'Setting saved (session only)', variant: 'success' });
  }
  const rows: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: 'new_lead_email', label: 'New lead — email', desc: 'Email me when a new lead comes in.' },
    { key: 'new_lead_sms', label: 'New lead — SMS', desc: 'Text me when a new lead comes in.' },
    { key: 'missed_call_sms', label: 'Missed call — SMS', desc: 'Text me on every missed call.' },
    { key: 'appointment_reminder', label: 'Appointment reminders', desc: 'Daily digest of upcoming appointments.' },
    { key: 'review_received', label: 'New review', desc: 'Notify me when a new review comes in.' },
    { key: 'payment_received', label: 'Payment received', desc: 'Notify me when an invoice is paid.' },
    { key: 'weekly_report', label: 'Weekly performance report', desc: 'Receive a summary every Monday.' },
    { key: 'marketing_updates', label: 'Marketing tips', desc: 'Occasional tips from the Kleegr team.' },
  ];
  return (
    <div data-tour="settings.toggles">
      <p className="mb-4 text-sm font-bold text-ink">Notifications</p>
      <Card>
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div>
              <p className="text-sm font-semibold text-ink">{row.label}</p>
              <p className="text-xs text-ink-muted">{row.desc}</p>
            </div>
            <Toggle checked={toggles[row.key]} onChange={() => flip(row.key)} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Section: Integrations ───────────────────────────────────── */

function IntegrationsSection() {
  const pushToast = useStore((s) => s.pushToast);
  const integs = [
    { name: 'Outlook / Email', connected: false },
    { name: 'Google Calendar', connected: false },
    { name: 'Stripe', connected: false },
    { name: 'Facebook', connected: false },
  ];
  return (
    <div>
      <p className="mb-4 text-sm font-bold text-ink">Integrations</p>
      <Card>
        {integs.map((i) => (
          <div key={i.name} className="flex items-center justify-between gap-4 border-b border-line/60 px-5 py-4 last:border-0">
            <div className="flex items-center gap-3">
              <Plug size={15} className="text-ink-muted" />
              <p className="text-sm font-semibold text-ink">{i.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={i.connected ? 'good' : 'neutral'}>{i.connected ? 'Connected' : 'Not connected'}</Badge>
              <Button variant="secondary" size="xs" onClick={() => pushToast({ title: `${i.name} — demo only`, variant: 'info' })}>
                {i.connected ? 'Manage' : 'Connect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="px-5 py-3">
          <p className="text-xs text-ink-muted">Manage integrations in detail from the <a href="/integrations" className="text-brand underline">Integrations</a> page.</p>
        </div>
      </Card>
    </div>
  );
}

/* ─── Nav items ───────────────────────────────────────────────── */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'business', label: 'Business Profile', icon: <Building2 size={15} /> },
  { id: 'staff', label: 'Staff', icon: <Users size={15} /> },
  { id: 'calendars', label: 'Calendars', icon: <Calendar size={15} /> },
  { id: 'phones', label: 'Phone Numbers', icon: <Phone size={15} /> },
  { id: 'custom-fields', label: 'Custom Fields', icon: <Sliders size={15} /> },
  { id: 'tags', label: 'Tags', icon: <Tag size={15} /> },
  { id: 'pipelines', label: 'Pipelines', icon: <GitBranch size={15} /> },
  { id: 'custom-values', label: 'Custom Values', icon: <Code2 size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={15} /> },
];

function SectionContent({ section }: { section: string }) {
  switch (section) {
    case 'business':     return <BusinessProfile />;
    case 'staff':        return <StaffSection />;
    case 'calendars':    return <CalendarsSection />;
    case 'phones':       return <PhoneSection />;
    case 'custom-fields':return <CustomFieldsSection />;
    case 'tags':         return <TagsSection />;
    case 'pipelines':    return <PipelinesSection />;
    case 'custom-values':return <CustomValuesSection />;
    case 'notifications':return <NotificationsSection />;
    case 'integrations': return <IntegrationsSection />;
    default:             return <BusinessProfile />;
  }
}

/* ─── Main Settings Page ──────────────────────────────────────── */

export function Settings() {
  const params = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const activeSection = params.section ?? 'business';

  return (
    <div data-tour="settings.page">
      <PageHeader
        title="Settings"
        subtitle="Account configuration — profile, staff, fields, pipelines, and more"
      />

      <div className="flex min-h-0 flex-col gap-0 lg:flex-row">
        {/* Settings nav */}
        <nav
          className="shrink-0 border-b border-line bg-surface-sunken lg:w-52 lg:border-b-0 lg:border-r"
          data-tour="settings.nav"
        >
          <div className="flex flex-wrap gap-0 lg:flex-col lg:py-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/settings/${item.id}`)}
                className={cx(
                  'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                  activeSection === item.id
                    ? 'bg-brand-soft font-semibold text-brand'
                    : 'text-ink-muted hover:bg-surface hover:text-ink',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content area */}
        <div className="min-w-0 flex-1 px-5 py-5 pb-10">
          <SectionContent section={activeSection} />
        </div>
      </div>
    </div>
  );
}
