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
import { Mail, MessageSquare, Plus, Send, Copy, CalendarDays, Filter, Search, Settings2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge, Tabs } from '@/components/ui/primitives';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { SimpleTable, MiniStat } from '@/components/tables/SimpleTable';
import type { Column } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { dateLabel, pct } from '@/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Campaign } from '@/types';

const MARKETING_TABS: ModuleHeaderTab[] = [
  { id: 'social', label: 'Social Planner' },
  { id: 'emails', label: 'Emails' },
  { id: 'snippets', label: 'Snippets' },
  { id: 'timers', label: 'Countdown Timers' },
  { id: 'trigger-links', label: 'Trigger Links' },
  { id: 'sales-tracker', label: 'Sales Tracker' },
  { id: 'brands', label: 'Brand Boards' },
  { id: 'ads', label: 'Ad Manager' },
  { id: 'prospecting', label: 'Prospecting' },
];

const EMAIL_TABS = [
  { id: 'statistics', label: 'Statistics' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'templates', label: 'Templates' },
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
  const pushToast      = useStore(s => s.pushToast);
  const allCampaigns   = useStore(s => s.campaigns);
  const [primary, setPrimary] = useState('emails');
  const [emailView, setEmailView] = useState('statistics');
  const [statusFilter, setStatusFilter] = useState('all');
  const [preview, setPreview] = useState<Campaign|null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const emailCampaigns = allCampaigns.filter(c => c.type==='email');
  const smsCampaigns   = allCampaigns.filter(c => c.type==='sms');
  const campaigns      = type==='email' ? emailCampaigns : smsCampaigns;
  const filtered       = statusFilter==='all' ? campaigns : campaigns.filter(c => c.status===statusFilter);
  const sent           = campaigns.filter(c => c.status==='sent');
  const scheduled      = campaigns.filter(c => c.status==='scheduled');
  const avgOpen        = sent.length ? sent.reduce((s,c) => s+(type==='email'?(c.metrics.openRate??0):(c.metrics.replyRate??0)),0)/sent.length : 0;
  const avgClick       = sent.length ? sent.reduce((s,c) => s+(c.metrics.clickRate??0),0)/sent.length : 0;

  const chartData = sent.map((campaign) => ({
    name: campaign.name.length > 18 ? `${campaign.name.slice(0, 18)}…` : campaign.name,
    engagement: Math.round((type === 'email' ? campaign.metrics.openRate ?? 0 : campaign.metrics.replyRate ?? 0) * 100),
    clicks: Math.round((campaign.metrics.clickRate ?? 0) * 100),
  }));

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
      <ModuleHeader
        title="Marketing"
        tabs={MARKETING_TABS}
        activeTab={primary}
        onTabChange={setPrimary}
        data-tour="marketing.tabs"
      />
      {primary === 'emails' ? (
        <div className="min-h-[calc(100vh-90px)] bg-[#f4f5f7]">
          <div className="flex min-h-[58px] items-center justify-between border-b border-line bg-surface px-5">
            <div className="flex items-center gap-7">
              <h2 className="text-[15px] font-semibold text-ink">Email Marketing</h2>
              <Tabs tabs={EMAIL_TABS} active={emailView} onChange={setEmailView} />
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Email settings" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted"><Settings2 size={15}/></button>
              <Button data-tour="marketing.newCampaign" onClick={() => setWizardOpen(true)}><Plus size={16}/> Create campaign</Button>
            </div>
          </div>
          <div className="space-y-4 px-5 pb-8 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#6e9fff] bg-[#f4f8ff] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Explore email marketing with sample data</p>
                <p className="text-xs text-ink-muted">These fictional campaigns show how a populated Kleegr account looks.</p>
              </div>
              <div className="flex gap-2"><Button variant="secondary" size="sm">Clear sample data</Button><Button size="sm" onClick={() => setWizardOpen(true)}><Plus size={14}/> Create campaign</Button></div>
            </div>

            {emailView === 'templates' ? <TemplatesTab/> : emailView === 'statistics' ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink-muted">All Campaigns</button>
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink-muted"><CalendarDays size={14}/> Aug 8, 2026 → Sep 6, 2026</button>
                </div>
                <div data-tour="marketing.summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <MiniStat label="Total campaigns" value={allCampaigns.length}/>
                  <MiniStat label="Sent" value={sent.length}/>
                  <MiniStat label="Scheduled" value={scheduled.length}/>
                  <MiniStat label={type==='email'?'Avg open rate':'Avg reply rate'} value={pct(avgOpen)}/>
                  <MiniStat label="Avg click rate" value={pct(avgClick)}/>
                </div>
                <div className="rounded-lg border border-line bg-surface p-5">
                  <div className="mb-4"><h3 className="text-base font-semibold text-ink">Engagement summary</h3><p className="text-xs text-ink-muted">Campaign engagement over the selected period</p></div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ left: -15, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e9edf2" vertical={false}/>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7b8494' }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize: 10, fill: '#7b8494' }} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe3e8', fontSize: 12 }}/>
                        <Bar dataKey="engagement" name="Engagement %" fill="#54bfe5" radius={[3,3,0,0]}/>
                        <Bar dataKey="clicks" name="Clicks %" fill="#173b78" radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">{STATUS_FILTERS.map(f => <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${statusFilter===f.id?'bg-brand text-white':'border border-line bg-surface text-ink-muted'}`}>{f.label}</button>)}</div>
                  <div className="flex gap-2"><button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs text-ink-muted"><Filter size={14}/> Filters</button><button className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs text-ink-muted"><Search size={14}/> Search campaigns</button></div>
                </div>
                <div data-tour="marketing.campaignList" className="overflow-hidden rounded-lg border border-line bg-surface"><SimpleTable columns={columns} rows={filtered} onRowClick={setPreview} empty={`No ${type} campaigns match the filter.`}/></div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-[calc(100vh-90px)] bg-[#f4f5f7]">
          <div className="flex min-h-[58px] items-center justify-between border-b border-line bg-surface px-5">
            <div className="flex items-center gap-6"><h2 className="text-[15px] font-semibold text-ink">{MARKETING_TABS.find((tab) => tab.id === primary)?.label}</h2><span className="border-b-2 border-brand py-5 text-xs font-semibold text-brand">Overview</span><span className="py-5 text-xs text-ink-muted">Content</span><span className="py-5 text-xs text-ink-muted">Statistics</span></div>
            <Button><Plus size={15}/> {primary === 'social' ? 'New Post' : 'Create'}</Button>
          </div>
          <div className="p-5">
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><div className="flex gap-2"><button className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted">All</button><button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted"><Filter size={14}/> Filters</button><button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted"><CalendarDays size={14}/> This month</button></div><button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-ink-muted"><Search size={14}/> Search</button></div>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-line bg-[#fafbfc] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle"><span>Name</span><span>Status</span><span>Updated</span><span>Owner</span></div>
              {['Kleegr Growth Campaign', 'Customer Welcome Series', 'Monthly Promotion'].map((name, index) => <div key={name} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center border-b border-line/70 px-4 py-3 text-sm last:border-0"><span className="font-medium text-ink">{name}</span><span className="w-fit rounded-full bg-good/10 px-2 py-1 text-[11px] font-semibold text-good">Active</span><span className="text-xs text-ink-muted">{index + 1}d ago</span><span className="text-xs text-ink-muted">Demo Team</span></div>)}
            </div>
          </div>
        </div>
      )}
      <CampaignDetail campaign={preview} onClose={() => setPreview(null)}/>
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} pushToast={pushToast}/>
    </div>
  );
}
