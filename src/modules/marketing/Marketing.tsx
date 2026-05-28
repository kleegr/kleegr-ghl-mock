/**
 * Marketing — Email & SMS campaign management.
 * Demo Mode: reads campaigns from store; wizard is local-state only (no store mutation).
 *
 * data-tour targets:
 *   marketing.page, marketing.newCampaign, marketing.summary, marketing.tabs,
 *   marketing.campaignList, marketing.campaignRow, marketing.campaignDetail,
 *   marketing.campaignWizard, marketing.campaignSubmit
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Plus, Send, Copy } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Tabs } from '@/components/ui/primitives';
import { SimpleTable, MiniStat } from '@/components/tables/SimpleTable';
import type { Column } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { dateLabel, pct } from '@/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Campaign } from '@/types';

const CAMPAIGN_TABS = [
  { id: 'email',     label: 'Email Campaigns' },
  { id: 'sms',       label: 'SMS Campaigns'   },
  { id: 'templates', label: 'Templates'       },
];

// --- Wizard ---
type WizardState = { step: 1|2|3; campaignType: 'email'|'sms'; name: string; subject: string; body: string; audience: string; schedule: string };
const DEFAULTS: WizardState = { step: 1, campaignType: 'email', name: '', subject: '', body: '', audience: 'all', schedule: 'now' };

function CampaignWizard({ open, onClose, pushToast }: { open: boolean; onClose: () => void; pushToast: (t: { title: string; description?: string; variant: 'success'|'default'|'info' }) => void }) {
  const [w, setW] = useState<WizardState>(DEFAULTS);
  const upd = (p: Partial<WizardState>) => setW(s => ({ ...s, ...p }));
  const close = () => { onClose(); setW(DEFAULTS); };
  const submit = () => { pushToast({ title: 'Demo: campaign queued', description: `"${w.name||'Untitled'}" added (demo only — nothing sent).`, variant: 'success' }); close(); };
  return (
    <Modal open={open} onClose={close} size="lg" title="New Campaign"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-ink-subtle">Step {w.step} of 3</span>
          <div className="flex gap-2">
            {w.step > 1 && <Button variant="secondary" size="sm" onClick={() => upd({ step: (w.step-1) as 1|2|3 })}>Back</Button>}
            {w.step < 3
              ? <Button size="sm" onClick={() => upd({ step: (w.step+1) as 1|2|3 })}>Next</Button>
              : <Button size="sm" data-tour="marketing.campaignSubmit" onClick={submit}><Send size={14}/> Send / Schedule</Button>}
          </div>
        </div>
      }
    >
      <div data-tour="marketing.campaignWizard">
        {w.step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">Choose campaign type</p>
            <div className="grid grid-cols-2 gap-3">
              {(['email','sms'] as const).map(t => (
                <button key={t} onClick={() => upd({ campaignType: t })} className={`rounded-xl border-2 p-4 text-left transition-colors ${w.campaignType===t?'border-brand bg-brand-soft':'border-line bg-surface hover:border-brand/40'}`}>
                  <div className="mb-2 flex items-center gap-2">{t==='email'?<Mail size={18} className="text-brand"/>:<MessageSquare size={18} className="text-brand"/>}<span className="text-sm font-bold text-ink capitalize">{t}</span></div>
                  <p className="text-xs text-ink-muted">{t==='email'?'Rich HTML email to a contact list':'Text message blast with reply tracking'}</p>
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">Campaign name</label>
              <input className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="e.g. May Newsletter" value={w.name} onChange={e => upd({ name: e.target.value })} />
            </div>
          </div>
        )}
        {w.step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">Audience</label>
              <select className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand" value={w.audience} onChange={e => upd({ audience: e.target.value })}>
                <option value="all">All contacts (84)</option>
                <option value="leads">Leads only (32)</option>
                <option value="nurture">Nurture list (18)</option>
                <option value="past_clients">Past clients (14)</option>
              </select>
            </div>
            {w.campaignType==='email' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-muted">Subject line</label>
                <input className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="e.g. Something special inside" value={w.subject} onChange={e => upd({ subject: e.target.value })} />
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">{w.campaignType==='email'?'Email body':'Message text'}</label>
              <textarea rows={5} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder={w.campaignType==='email'?'Hi {{first_name}}, …':'Hi {{first_name}}, we have something for you…'} value={w.body} onChange={e => upd({ body: e.target.value })} />
            </div>
          </div>
        )}
        {w.step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">When to send</label>
              <div className="grid grid-cols-2 gap-3">
                {[{id:'now',label:'Send now',desc:'Deliver immediately'},{id:'schedule',label:'Schedule',desc:'Pick a date & time'}].map(s => (
                  <button key={s.id} onClick={() => upd({ schedule: s.id })} className={`rounded-xl border-2 p-3 text-left transition-colors ${w.schedule===s.id?'border-brand bg-brand-soft':'border-line bg-surface hover:border-brand/40'}`}>
                    <p className="text-sm font-bold text-ink">{s.label}</p>
                    <p className="text-xs text-ink-muted">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-sunken p-4 text-sm">
              <p className="mb-2 font-semibold text-ink">Review</p>
              <div className="space-y-1 text-ink-muted">
                <p><span className="font-medium">Type:</span> {w.campaignType}</p>
                <p><span className="font-medium">Name:</span> {w.name||'Untitled'}</p>
                <p><span className="font-medium">Audience:</span> {w.audience}</p>
                {w.subject && <p><span className="font-medium">Subject:</span> {w.subject}</p>}
                <p><span className="font-medium">Schedule:</span> {w.schedule==='now'?'Send immediately':'Scheduled'}</p>
              </div>
            </div>
            <p className="rounded-lg bg-warn/10 px-3 py-2 text-xs font-medium text-warn">Demo mode — no real emails or texts will be sent.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// --- Campaign Detail ---
function CampaignDetail({ campaign, onClose }: { campaign: Campaign|null; onClose: () => void }) {
  const pushToast = useStore(s => s.pushToast);
  if (!campaign) return null;
  const delivered = campaign.metrics.delivered ?? campaign.audienceSize;
  const barData = campaign.type==='email'
    ? [{label:'Delivered',value:delivered},{label:'Opened',value:Math.round((campaign.metrics.openRate??0)*delivered)},{label:'Clicked',value:Math.round((campaign.metrics.clickRate??0)*delivered)}]
    : [{label:'Delivered',value:delivered},{label:'Replied',value:Math.round((campaign.metrics.replyRate??0)*delivered)},{label:'Opted out',value:Math.round((campaign.metrics.optOutRate??0)*delivered)}];
  return (
    <Modal open onClose={onClose} size="lg" title={campaign.name}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title:'Demo: duplicated', variant:'info' })}><Copy size={14}/> Duplicate</Button>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title:'Demo: test sent', description:'Test sent to your address (demo only).', variant:'info' })}><Send size={14}/> Send Test</Button>
        </>
      }
    >
      <div data-tour="marketing.campaignDetail" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={campaign.status==='sent'?'good':campaign.status==='scheduled'?'warn':'neutral'}>{campaign.status}</Badge>
          <Badge tone="neutral">{campaign.type}</Badge>
          <span className="text-xs text-ink-muted">Audience: {campaign.audienceSize.toLocaleString()}</span>
          {campaign.sentAt && <span className="text-xs text-ink-subtle">Sent {dateLabel(campaign.sentAt)}</span>}
        </div>
        {Object.keys(campaign.metrics).length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ left:-10, right:6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize:11, fill:'#98a2b3' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#98a2b3' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:10, border:'1px solid #e4e7ec', fontSize:12 }}/>
                <Bar dataKey="value" fill="#1f6feb" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {campaign.content.subject && <p className="text-sm"><span className="font-semibold text-ink">Subject:</span> <span className="text-ink-muted">{campaign.content.subject}</span></p>}
        <div className="rounded-lg border border-line bg-surface-sunken p-3 text-sm text-ink-muted">{campaign.content.body}</div>
      </div>
    </Modal>
  );
}

// --- Templates placeholder ---
const TEMPLATE_LIST = [
  { name:'Welcome Email', type:'email', uses:14 }, { name:'Follow-up SMS', type:'sms', uses:28 },
  { name:'Promo Blast', type:'email', uses:7 }, { name:'Appointment Reminder', type:'sms', uses:42 },
  { name:'Re-engagement', type:'email', uses:5 }, { name:'Review Request', type:'sms', uses:33 },
];
function TemplatesTab() {
  const pushToast = useStore(s => s.pushToast);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATE_LIST.map(t => (
        <div key={t.name} className="rounded-xl border border-line bg-surface shadow-card cursor-pointer p-4 transition-colors hover:border-brand/40"
          onClick={() => pushToast({ title: t.name, description: 'Template editing opens here in the live product (demo only).', variant: 'info' })}>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">{t.type==='email'?<Mail size={16}/>:<MessageSquare size={16}/>}</span>
            <div><p className="text-sm font-semibold text-ink">{t.name}</p><p className="text-xs text-ink-subtle">{t.uses} uses</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main ---
const STATUS_FILTERS = [{id:'all',label:'All'},{id:'sent',label:'Sent'},{id:'scheduled',label:'Scheduled'},{id:'draft',label:'Draft'}];

export function Marketing({ type }: { type: 'email'|'sms' }) {
  const navigate       = useNavigate();
  const pushToast      = useStore(s => s.pushToast);
  const allCampaigns   = useStore(s => s.campaigns);
  const [tabOverride, setTabOverride] = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [preview, setPreview] = useState<Campaign|null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const activeTab      = tabOverride ?? type;
  const emailCampaigns = allCampaigns.filter(c => c.type==='email');
  const smsCampaigns   = allCampaigns.filter(c => c.type==='sms');
  const campaigns      = type==='email' ? emailCampaigns : smsCampaigns;
  const filtered       = statusFilter==='all' ? campaigns : campaigns.filter(c => c.status===statusFilter);
  const sent           = campaigns.filter(c => c.status==='sent');
  const scheduled      = campaigns.filter(c => c.status==='scheduled');
  const avgOpen        = sent.length ? sent.reduce((s,c) => s+(type==='email'?(c.metrics.openRate??0):(c.metrics.replyRate??0)),0)/sent.length : 0;
  const avgClick       = sent.length ? sent.reduce((s,c) => s+(c.metrics.clickRate??0),0)/sent.length : 0;

  const handleTab = (id: string) => {
    if (id==='templates') { setTabOverride('templates'); return; }
    setTabOverride(null);
    navigate(`/marketing/${id}`);
  };

  const columns: Column<Campaign>[] = [
    { key:'name', header:'Campaign', render:(c) => (
      <div className="flex items-center gap-2.5" data-tour="marketing.campaignRow">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{c.type==='email'?<Mail size={14}/>:<MessageSquare size={14}/>}</span>
        <span className="font-semibold text-ink">{c.name}</span>
      </div>
    )},
    { key:'status', header:'Status', render:(c) => <Badge tone={c.status==='sent'?'good':c.status==='scheduled'?'warn':'neutral'}>{c.status}</Badge> },
    { key:'audience', header:'Audience', render:(c) => <span className="text-ink-muted">{c.audienceSize.toLocaleString()}</span> },
    { key:'openRate', header:type==='email'?'Open rate':'Reply rate', render:(c) => <span className="text-ink-muted">{type==='email'?(c.metrics.openRate?pct(c.metrics.openRate):'—'):(c.metrics.replyRate?pct(c.metrics.replyRate):'—')}</span> },
    { key:'clickRate', header:'Click rate', render:(c) => <span className="text-ink-muted">{c.metrics.clickRate?pct(c.metrics.clickRate):'—'}</span> },
    { key:'sentAt', header:'Sent', render:(c) => <span className="text-ink-subtle">{c.sentAt?dateLabel(c.sentAt):'—'}</span> },
  ];

  return (
    <div data-tour="marketing.page">
      <PageHeader
        title="Marketing"
        subtitle="Email and SMS campaigns, performance, and audience management"
        actions={<Button data-tour="marketing.newCampaign" onClick={() => setWizardOpen(true)}><Plus size={16}/> New Campaign</Button>}
      />
      <div className="space-y-4 px-5 pb-8 pt-4">
        <div data-tour="marketing.summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MiniStat label="Total campaigns" value={allCampaigns.length}/>
          <MiniStat label="Sent" value={sent.length}/>
          <MiniStat label="Scheduled" value={scheduled.length}/>
          <MiniStat label={type==='email'?'Avg open rate':'Avg reply rate'} value={pct(avgOpen)}/>
          {type==='email' && <MiniStat label="Avg click rate" value={pct(avgClick)}/>}
        </div>
        <div data-tour="marketing.tabs">
          <Tabs
            tabs={CAMPAIGN_TABS.map(t => ({ ...t, count: t.id==='email'?emailCampaigns.length:t.id==='sms'?smsCampaigns.length:undefined }))}
            active={activeTab}
            onChange={handleTab}
          />
        </div>
        {activeTab==='templates' ? (
          <TemplatesTab/>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter===f.id?'bg-brand text-brand-fg':'border border-line bg-surface-sunken text-ink-muted hover:text-ink'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div data-tour="marketing.campaignList" className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              <SimpleTable columns={columns} rows={filtered} onRowClick={setPreview} empty={`No ${type} campaigns match the filter.`}/>
            </div>
          </>
        )}
      </div>
      <CampaignDetail campaign={preview} onClose={() => setPreview(null)}/>
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} pushToast={pushToast}/>
    </div>
  );
}
