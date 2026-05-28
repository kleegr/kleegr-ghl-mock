/**
 * Sites — funnels, websites, forms, surveys, and submissions.
 * Demo Mode: local static data; submissions derived from store contacts.
 *
 * data-tour targets:
 *   sites.page, sites.newSite, sites.tabs, sites.grid, sites.card,
 *   sites.builderPreview, sites.formsSurveys, sites.submissions
 */
import { useState } from 'react';
import { LayoutTemplate, Globe, FileText, ClipboardList, Plus, MousePointerClick, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card, Tabs } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';

const FUNNELS = [
  { id:'f1', name:'Free Consult Funnel',  steps:3, visits:1840, conversions:228, status:'Published', lastUpdated:'2026-05-14', type:'Funnel'  },
  { id:'f2', name:'Webinar Registration', steps:4, visits: 920, conversions:258, status:'Published', lastUpdated:'2026-05-01', type:'Funnel'  },
  { id:'f3', name:'Spring Promo Landing', steps:2, visits:2310, conversions:201, status:'Published', lastUpdated:'2026-04-18', type:'Funnel'  },
  { id:'f4', name:'New Patient Intake',   steps:5, visits: 410, conversions:168, status:'Draft',     lastUpdated:'2026-05-20', type:'Funnel'  },
  { id:'f5', name:'Membership Signup',    steps:3, visits: 680, conversions: 82, status:'Published', lastUpdated:'2026-03-30', type:'Funnel'  },
];
const WEBSITES = [
  { id:'s1', name:'Brightline Dental — Main', pages:8, visits:4200, conversions:310, status:'Published', lastUpdated:'2026-05-10', type:'Website' },
  { id:'s2', name:'Membership Portal',        pages:4, visits:1100, conversions: 88, status:'Draft',     lastUpdated:'2026-05-18', type:'Website' },
  { id:'s3', name:'Promo Mini-site',           pages:2, visits: 860, conversions:124, status:'Published', lastUpdated:'2026-04-22', type:'Website' },
];
const FORMS = [
  { id:'frm1', name:'Contact Us',              type:'Form',   submissions:142, convRate:'18%', lastSub:'05-28', status:'Active' },
  { id:'frm2', name:'Booking Intake',           type:'Form',   submissions: 89, convRate:'24%', lastSub:'05-27', status:'Active' },
  { id:'frm3', name:'New Client Onboarding',    type:'Form',   submissions: 34, convRate:'41%', lastSub:'05-25', status:'Active' },
  { id:'frm4', name:'Referral Form',            type:'Form',   submissions: 22, convRate:'12%', lastSub:'05-20', status:'Draft'  },
  { id:'srv1', name:'NPS Survey',               type:'Survey', submissions: 68, convRate:'32%', lastSub:'05-26', status:'Active' },
  { id:'srv2', name:'Post-Appt Feedback',        type:'Survey', submissions: 51, convRate:'27%', lastSub:'05-24', status:'Active' },
  { id:'srv3', name:'Service Interest Poll',    type:'Survey', submissions: 29, convRate:'19%', lastSub:'05-15', status:'Draft'  },
];
const FUNNEL_STEPS: Record<string,{name:string;visits:number;convPct:number}[]> = {
  f1:[{name:'Opt-in page',visits:1840,convPct:52},{name:'Booking page',visits:960,convPct:74},{name:'Confirmation',visits:708,convPct:100}],
  f2:[{name:'Registration',visits:920,convPct:65},{name:'Profile',visits:598,convPct:80},{name:'Webinar room',visits:478,convPct:92},{name:'Replay',visits:440,convPct:100}],
  f3:[{name:'Landing page',visits:2310,convPct:38},{name:'Checkout',visits:878,convPct:100}],
  f4:[{name:'Welcome',visits:410,convPct:78},{name:'Insurance',visits:320,convPct:71},{name:'Medical history',visits:227,convPct:90},{name:'Consent',visits:204,convPct:97},{name:'Confirm',visits:198,convPct:100}],
  f5:[{name:'Plan selector',visits:680,convPct:55},{name:'Sign up',visits:374,convPct:80},{name:'Thank you',visits:299,convPct:100}],
};

type SiteItem = typeof FUNNELS[0] | typeof WEBSITES[0];

function BuilderPreview({ item, onClose }: { item: SiteItem|null; onClose: () => void }) {
  if (!item) return null;
  const steps    = FUNNEL_STEPS[item.id] ?? [];
  const convRate = item.visits ? `${Math.round(item.conversions/item.visits*100)}%` : '—';
  const pages    = 'pages' in item ? (item as typeof WEBSITES[0]).pages : null;
  return (
    <Modal open onClose={onClose} size="lg" title={item.name}>
      <div data-tour="sites.builderPreview" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={item.status==='Published'?'good':'neutral'}>{item.status}</Badge>
          <Badge tone="neutral">{item.type}</Badge>
          <span className="text-xs text-ink-subtle">Updated {item.lastUpdated}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{label:'Visits',val:item.visits.toLocaleString(),color:'text-ink'},{label:'Conversions',val:item.conversions.toLocaleString(),color:'text-ink'},{label:'Conv. rate',val:convRate,color:'text-good'}].map(s => (
            <div key={s.label} className="rounded-xl bg-surface-sunken p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
        {steps.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-bold text-ink">Funnel steps</p>
            <div className="space-y-2">
              {steps.map((s,i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface-sunken p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i+1}</span>
                  <div className="flex-1"><p className="text-sm font-semibold text-ink">{s.name}</p><p className="text-xs text-ink-muted">{s.visits.toLocaleString()} visits</p></div>
                  <span className="text-sm font-bold text-good">{s.convPct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {pages !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-sunken px-4 py-3">
            <Globe size={15} className="text-brand"/>
            <span className="text-sm text-ink-muted">{pages} pages published</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken p-3 text-sm text-ink-muted">
          <Eye size={14} className="shrink-0 text-brand"/>
          <span>Read-only preview. Full editing is available in the live GoHighLevel builder.</span>
        </div>
      </div>
    </Modal>
  );
}

function FormsTab() {
  return (
    <div data-tour="sites.formsSurveys" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FORMS.map(f => (
        <Card key={f.id} data-tour="sites.card" className="cursor-pointer p-4 transition-colors hover:border-brand/40">
          <div className="flex items-start justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">{f.type==='Form'?<FileText size={16}/>:<ClipboardList size={16}/>}</span>
            <Badge tone={f.status==='Active'?'good':'neutral'}>{f.status}</Badge>
          </div>
          <p className="mt-3 font-semibold text-ink">{f.name}</p>
          <p className="text-xs text-ink-muted">{f.type}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs">
            <div><p className="font-bold text-ink">{f.submissions}</p><p className="text-ink-subtle">Submissions</p></div>
            <div><p className="font-bold text-ink">{f.convRate}</p><p className="text-ink-subtle">Conv. rate</p></div>
            <div><p className="font-bold text-ink">{f.lastSub}</p><p className="text-ink-subtle">Last sub.</p></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SubmissionsTab() {
  const contacts = useStore(s => s.contacts);
  const ALL_FORM_NAMES = FORMS.map(f => f.name);
  const rows = contacts.slice(0, 20).map((c, i) => ({
    id:        `sub_${i+1}`,
    submitter: `${c.firstName} ${c.lastName}`,
    form:      ALL_FORM_NAMES[i % ALL_FORM_NAMES.length],
    date:      new Date(Date.now() - i*129600000).toLocaleDateString(),
    source:    c.source,
    status:    i%5===0 ? 'Needs review' : 'Processed',
  }));
  return (
    <div data-tour="sites.submissions" className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b border-line text-left">
          {['Submitter','Form / Survey','Date','Source','Status'].map(h => <th key={h} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id} className="cursor-pointer border-b border-line/70 hover:bg-surface-sunken">
              <td className="px-4 py-3 font-medium text-ink">{s.submitter}</td>
              <td className="px-4 py-3 text-ink-muted">{s.form}</td>
              <td className="px-4 py-3 text-xs text-ink-subtle">{s.date}</td>
              <td className="px-4 py-3 text-ink-muted">{s.source}</td>
              <td className="px-4 py-3"><Badge tone={s.status==='Processed'?'good':'warn'}>{s.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SITES_TABS = [
  {id:'funnels',    label:'Funnels'},
  {id:'websites',   label:'Websites'},
  {id:'forms',      label:'Forms & Surveys'},
  {id:'submissions',label:'Submissions'},
];

export function Sites() {
  const pushToast   = useStore(s => s.pushToast);
  const [activeTab, setActiveTab]       = useState('funnels');
  const [selectedItem, setSelectedItem] = useState<SiteItem|null>(null);

  const allItems    = [...FUNNELS, ...WEBSITES];
  const totalVisits = allItems.reduce((s,f) => s+f.visits, 0);
  const totalConv   = allItems.reduce((s,f) => s+f.conversions, 0);
  const avgConvPct  = totalVisits ? `${Math.round(totalConv/totalVisits*100)}%` : '0%';

  const renderCard = (item: SiteItem) => {
    const convRate = `${Math.round(item.conversions/item.visits*100)}%`;
    const isFunnel = item.type==='Funnel';
    const sub      = isFunnel ? `${(item as typeof FUNNELS[0]).steps} steps · Funnel` : `${(item as typeof WEBSITES[0]).pages} pages · Website`;
    return (
      <div key={item.id} data-tour="sites.card" className="rounded-xl border border-line bg-surface shadow-card cursor-pointer p-4 transition-colors hover:border-brand/40" onClick={() => setSelectedItem(item)}>
        <div className="flex items-start justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">{isFunnel?<LayoutTemplate size={18}/>:<Globe size={18}/>}</span>
          <Badge tone={item.status==='Published'?'good':'neutral'}>{item.status}</Badge>
        </div>
        <p className="mt-3 font-semibold text-ink">{item.name}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
          <span className="flex items-center gap-1 text-ink-muted"><MousePointerClick size={12}/> {item.visits.toLocaleString()} visits</span>
          <span className="font-bold text-good">{convRate}</span>
        </div>
        <p className="mt-1 text-[10px] text-ink-subtle">Updated {item.lastUpdated}</p>
      </div>
    );
  };

  return (
    <div data-tour="sites.page">
      <PageHeader
        title="Sites"
        subtitle="Funnels, websites, forms, surveys, and submission tracking"
        actions={
          <Button data-tour="sites.newSite"
            onClick={() => pushToast({ title:'Demo: builder opening', description:'The funnel/site builder would launch here (demo only).', variant:'info' })}>
            <Plus size={16}/> New Funnel / Site
          </Button>
        }
      />
      <div className="space-y-4 px-5 pb-8 pt-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Funnels"            value={FUNNELS.length}/>
          <MiniStat label="Websites"           value={WEBSITES.length}/>
          <MiniStat label="Total visits (30d)" value={totalVisits.toLocaleString()}/>
          <MiniStat label="Avg conversion"     value={avgConvPct}/>
        </div>
        <div data-tour="sites.tabs"><Tabs tabs={SITES_TABS} active={activeTab} onChange={setActiveTab}/></div>
        {activeTab==='funnels'  && <div data-tour="sites.grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{FUNNELS.map(renderCard)}</div>}
        {activeTab==='websites' && <div data-tour="sites.grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{WEBSITES.map(renderCard)}</div>}
        {activeTab==='forms'        && <FormsTab/>}
        {activeTab==='submissions'  && <SubmissionsTab/>}
      </div>
      <BuilderPreview item={selectedItem} onClose={() => setSelectedItem(null)}/>
    </div>
  );
}
