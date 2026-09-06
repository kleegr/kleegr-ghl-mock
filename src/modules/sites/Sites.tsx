/**
 * Sites — a visual replica of Kleegr's list-first sites workspace.
 * All names and performance data are fictional and remain local to the demo.
 */
import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  Clock3,
  FileText,
  Folder,
  FolderPlus,
  Globe,
  Home,
  LayoutGrid,
  List,
  MessageSquare,
  MoreVertical,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Store,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Badge, Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';

type SiteRecord = {
  id: string;
  name: string;
  updated: string;
  units: string;
  status: 'Published' | 'Draft';
  visits: number;
  conversions: number;
};

const FUNNELS: SiteRecord[] = [
  { id: 'f1', name: 'New Patient Welcome', updated: 'Sep 5, 2026 11:14 AM', units: '3 Steps', status: 'Published', visits: 1840, conversions: 228 },
  { id: 'f2', name: 'Growth Audit Booking', updated: 'Sep 3, 2026 10:42 AM', units: '4 Steps', status: 'Published', visits: 920, conversions: 258 },
  { id: 'f3', name: 'Summer Service Offer', updated: 'Aug 29, 2026 3:33 PM', units: '2 Steps', status: 'Published', visits: 2310, conversions: 201 },
  { id: 'f4', name: 'Client Onboarding', updated: 'Aug 21, 2026 12:38 PM', units: '5 Steps', status: 'Draft', visits: 410, conversions: 168 },
  { id: 'f5', name: 'Referral Campaign', updated: 'Aug 17, 2026 1:18 PM', units: '3 Steps', status: 'Published', visits: 680, conversions: 82 },
  { id: 'f6', name: 'Workshop Registration', updated: 'Aug 12, 2026 9:35 AM', units: '4 Steps', status: 'Published', visits: 1260, conversions: 314 },
  { id: 'f7', name: 'Premium Consultation', updated: 'Aug 8, 2026 2:32 PM', units: '3 Steps', status: 'Published', visits: 804, conversions: 176 },
  { id: 'f8', name: 'Local Business Starter', updated: 'Jul 28, 2026 4:08 PM', units: '6 Steps', status: 'Draft', visits: 522, conversions: 91 },
];

const WEBSITES: SiteRecord[] = [
  { id: 'w1', name: 'Harbor Dental Group', updated: 'Sep 4, 2026 8:45 AM', units: '8 Pages', status: 'Published', visits: 4200, conversions: 310 },
  { id: 'w2', name: 'Northstar Home Services', updated: 'Aug 30, 2026 2:11 PM', units: '6 Pages', status: 'Published', visits: 3150, conversions: 244 },
  { id: 'w3', name: 'Momentum Wellness', updated: 'Aug 18, 2026 11:28 AM', units: '4 Pages', status: 'Draft', visits: 1100, conversions: 88 },
  { id: 'w4', name: 'Summit Advisory', updated: 'Aug 9, 2026 9:02 AM', units: '7 Pages', status: 'Published', visits: 2860, conversions: 191 },
];

const SITE_TABS: ModuleHeaderTab[] = [
  { id: 'funnels', label: 'Funnels' },
  { id: 'websites', label: 'Websites' },
  { id: 'stores', label: 'Stores' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'blogs', label: 'Blogs' },
  { id: 'wordpress', label: 'WordPress' },
  { id: 'client-portal', label: 'Client Portal' },
  { id: 'forms', label: 'Forms' },
  { id: 'surveys', label: 'Surveys' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'chat-widget', label: 'Chat Widget' },
  { id: 'qr-codes', label: 'QR Codes' },
];

const SECONDARY_CONTENT: Record<string, { title: string; description: string; action: string; icon: ReactNode; rows: SiteRecord[] }> = {
  stores: {
    title: 'Stores', description: 'Create and manage online stores, products, and checkout experiences.', action: 'New store', icon: <Store size={17} />,
    rows: [
      { id: 'st1', name: 'Wellness Essentials', updated: 'Sep 4, 2026 12:18 PM', units: '18 Products', status: 'Published', visits: 1840, conversions: 126 },
      { id: 'st2', name: 'Client Resource Shop', updated: 'Aug 19, 2026 9:32 AM', units: '9 Products', status: 'Draft', visits: 612, conversions: 41 },
    ],
  },
  webinars: {
    title: 'Webinars', description: 'Build registration experiences and manage upcoming online events.', action: 'New webinar', icon: <LayoutGrid size={17} />,
    rows: [
      { id: 'wb1', name: 'Growth Systems Masterclass', updated: 'Sep 1, 2026 10:00 AM', units: '3 Sessions', status: 'Published', visits: 976, conversions: 284 },
      { id: 'wb2', name: 'Local Marketing Live', updated: 'Aug 22, 2026 1:20 PM', units: '1 Session', status: 'Draft', visits: 382, conversions: 96 },
    ],
  },
  blogs: {
    title: 'Blogs', description: 'Create helpful content and publish it across your branded sites.', action: 'New blog', icon: <BookOpen size={17} />,
    rows: [
      { id: 'b1', name: 'The Growth Library', updated: 'Sep 5, 2026 7:54 AM', units: '24 Posts', status: 'Published', visits: 5240, conversions: 188 },
      { id: 'b2', name: 'Customer Success Notes', updated: 'Aug 24, 2026 4:12 PM', units: '11 Posts', status: 'Draft', visits: 1430, conversions: 52 },
    ],
  },
  wordpress: {
    title: 'WordPress', description: 'Manage connected WordPress sites from one workspace.', action: 'Connect site', icon: <Globe size={17} />,
    rows: [{ id: 'wp1', name: 'Harbor Dental Blog', updated: 'Sep 5, 2026 9:07 AM', units: 'Connected', status: 'Published', visits: 2240, conversions: 139 }],
  },
  'client-portal': {
    title: 'Client Portal', description: 'Give clients a polished home for courses, files, and account updates.', action: 'Manage portal', icon: <Globe size={17} />,
    rows: [{ id: 'cp1', name: 'Demo Client Hub', updated: 'Sep 2, 2026 3:18 PM', units: '6 Sections', status: 'Published', visits: 1180, conversions: 426 }],
  },
  quizzes: {
    title: 'Quizzes', description: 'Collect answers and qualify leads with interactive quizzes.', action: 'New quiz', icon: <FileText size={17} />,
    rows: [
      { id: 'q1', name: 'Growth Readiness Score', updated: 'Aug 31, 2026 1:24 PM', units: '12 Questions', status: 'Published', visits: 804, conversions: 302 },
      { id: 'q2', name: 'Service Match Finder', updated: 'Aug 15, 2026 11:05 AM', units: '8 Questions', status: 'Draft', visits: 298, conversions: 87 },
    ],
  },
  'chat-widget': {
    title: 'Chat Widget', description: 'Create website widgets that turn visitors into conversations.', action: 'New widget', icon: <MessageSquare size={17} />,
    rows: [
      { id: 'cw1', name: 'Main Website Chat', updated: 'Sep 5, 2026 4:40 PM', units: '3 Channels', status: 'Published', visits: 6610, conversions: 442 },
      { id: 'cw2', name: 'Booking Page Helper', updated: 'Aug 27, 2026 2:05 PM', units: '1 Channel', status: 'Draft', visits: 890, conversions: 75 },
    ],
  },
  'qr-codes': {
    title: 'QR Codes', description: 'Create trackable QR codes for campaigns, locations, and printed materials.', action: 'New QR code', icon: <QrCode size={17} />,
    rows: [
      { id: 'qr1', name: 'Front Desk Review Card', updated: 'Sep 3, 2026 12:44 PM', units: '492 Scans', status: 'Published', visits: 492, conversions: 138 },
      { id: 'qr2', name: 'Fall Event Registration', updated: 'Aug 29, 2026 10:14 AM', units: '281 Scans', status: 'Published', visits: 281, conversions: 94 },
    ],
  },
};

const FORMS = [
  { id: 'fm1', name: 'Contact Us', submissions: 142, updated: 'Sep 5, 2026 9:32 AM', status: 'Published' },
  { id: 'fm2', name: 'Consultation Intake', submissions: 89, updated: 'Sep 3, 2026 4:14 PM', status: 'Published' },
  { id: 'fm3', name: 'New Client Onboarding', submissions: 34, updated: 'Aug 30, 2026 10:02 AM', status: 'Published' },
  { id: 'fm4', name: 'Referral Form', submissions: 22, updated: 'Aug 20, 2026 2:50 PM', status: 'Draft' },
];

const SURVEYS = [
  { id: 'sv1', name: 'Customer Experience Survey', submissions: 68, updated: 'Sep 2, 2026 11:09 AM', status: 'Published' },
  { id: 'sv2', name: 'Post-Appointment Feedback', submissions: 51, updated: 'Aug 28, 2026 1:16 PM', status: 'Published' },
  { id: 'sv3', name: 'Service Interest Poll', submissions: 29, updated: 'Aug 15, 2026 8:44 AM', status: 'Draft' },
];

function ListToolbar({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-line px-3">
      <div className="flex items-center gap-2 text-ink-muted"><Home size={16} /><span className="text-xs font-medium">Home</span></div>
      <div className="flex items-center gap-2">
        <div className="flex h-8 overflow-hidden rounded-md border border-line bg-surface">
          <button className="grid w-8 place-items-center border-r border-line text-ink-muted hover:bg-surface-sunken" aria-label="Recently updated"><Clock3 size={15} /></button>
          <button className="grid w-8 place-items-center bg-brand-soft text-brand" aria-label="List view"><List size={15} /></button>
        </div>
        <label className="flex h-8 w-64 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-ink-muted">
          <Search size={14} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Search sites" placeholder="Search" className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-subtle" />
        </label>
      </div>
    </div>
  );
}

function SiteTable({ rows, search, onSelect }: { rows: SiteRecord[]; search: string; onSelect: (item: SiteRecord) => void }) {
  const visibleRows = rows.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="overflow-x-auto px-3 pb-3">
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr className="border border-line bg-[#f9fafc] text-ink"><th className="w-[54%] px-3 py-2.5 font-semibold">Name</th><th className="w-[24%] border-l border-line px-3 py-2.5 font-semibold">Last updated</th><th className="w-[18%] border-l border-line px-3 py-2.5 font-semibold">Funnel steps</th><th className="w-12 border-l border-line" /></tr></thead>
        <tbody>{visibleRows.map((item, index) => (
          <tr key={item.id} className="cursor-pointer border-x border-b border-line bg-surface text-ink hover:bg-[#f8fbff]" onClick={() => onSelect(item)}>
            <td className="px-3 py-[13px]">
              <button type="button" onClick={(event) => { event.stopPropagation(); onSelect(item); }} className="flex w-full items-center gap-2.5 text-left font-medium">
                {index === 0 && item.id.startsWith('f') ? <Folder size={17} className="text-ink-muted" /> : null}{item.name}{item.status === 'Draft' ? <Badge tone="neutral">Draft</Badge> : null}
              </button>
            </td>
            <td className="px-3 py-[13px] text-ink-muted">{item.updated}</td><td className="px-3 py-[13px] text-ink-muted">{item.units}</td><td className="px-3 py-[13px] text-center"><MoreVertical size={16} className="mx-auto text-ink-muted" /></td>
          </tr>
        ))}</tbody>
      </table>
      {visibleRows.length === 0 ? <div className="border-x border-b border-line py-16 text-center text-sm text-ink-muted">No sites match that search.</div> : null}
      <div className="flex items-center justify-end gap-4 px-1 py-3 text-[11px] text-ink-muted"><span>Rows per page&nbsp;&nbsp;10</span><span>1 - {visibleRows.length} of {visibleRows.length}</span><button className="rounded border border-line px-2 py-1 disabled:opacity-40" disabled>Previous</button><button className="grid h-7 w-7 place-items-center rounded border border-brand text-brand">1</button><button className="rounded border border-line px-2 py-1 disabled:opacity-40" disabled>Next</button></div>
    </div>
  );
}

function RecordsWorkspace({ rows, search, onSearch, onSelect }: { rows: SiteRecord[]; search: string; onSearch: (value: string) => void; onSelect: (item: SiteRecord) => void }) {
  return <div className="rounded-xl border border-[#edf0f4] bg-surface shadow-card"><ListToolbar search={search} onSearch={onSearch} /><SiteTable rows={rows} search={search} onSelect={onSelect} /></div>;
}

function FormsWorkspace({ type, onOpen }: { type: 'forms' | 'surveys'; onOpen: (name: string) => void }) {
  const rows = type === 'forms' ? FORMS : SURVEYS;
  return (
    <div className="rounded-xl border border-[#edf0f4] bg-surface p-3 shadow-card">
      <div className="flex h-11 items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-muted"><Home size={15} /> Home</div>
        <label className="flex h-8 w-64 items-center gap-2 rounded-md border border-line px-2.5 text-ink-muted"><Search size={14} /><input aria-label={`Search ${type}`} className="w-full bg-transparent text-xs outline-none" placeholder={`Search ${type}`} /></label>
      </div>
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr className="border border-line bg-[#f9fafc]"><th className="px-3 py-2.5">Name</th><th className="border-l border-line px-3 py-2.5">Submissions</th><th className="border-l border-line px-3 py-2.5">Last updated</th><th className="w-12 border-l border-line" /></tr></thead>
        <tbody>{rows.map((item) => (
          <tr key={item.id} className="cursor-pointer border-x border-b border-line hover:bg-[#f8fbff]" onClick={() => onOpen(item.name)}>
            <td className="px-3 py-3.5">
              <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(item.name); }} className="flex w-full items-center gap-2.5 text-left font-medium"><FileText size={16} className="text-brand" />{item.name}<Badge tone={item.status === 'Published' ? 'good' : 'neutral'}>{item.status}</Badge></button>
            </td>
            <td className="px-3 py-3.5 text-ink-muted">{item.submissions}</td><td className="px-3 py-3.5 text-ink-muted">{item.updated}</td><td><MoreVertical size={16} className="mx-auto text-ink-muted" /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AnalyticsWorkspace() {
  const bars = [44, 66, 52, 78, 62, 88, 74, 93, 71, 82, 68, 89];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_310px]">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-card"><div className="flex items-start justify-between"><div><p className="font-semibold text-ink">Traffic overview</p><p className="mt-1 text-xs text-ink-muted">Visitors across funnels and websites</p></div><Badge tone="brand">Last 30 days</Badge></div><div className="mt-8 flex h-52 items-end gap-3 border-b border-line px-2">{bars.map((height, index) => <div key={index} className="flex-1 rounded-t bg-brand/75" style={{ height: `${height}%` }} />)}</div><div className="mt-3 flex justify-between text-[10px] text-ink-subtle"><span>Aug 8</span><span>Aug 15</span><span>Aug 22</span><span>Aug 29</span><span>Sep 5</span></div></div>
      <div className="space-y-3">{[['Total visitors', '18,492', '+12.4%'], ['Conversions', '1,287', '+8.2%'], ['Conversion rate', '7.0%', '+1.1%'], ['Sales', '$42,680', '+14.8%']].map(([label, value, change]) => <div key={label} className="rounded-xl border border-line bg-surface p-4 shadow-card"><p className="text-xs text-ink-muted">{label}</p><div className="mt-1 flex items-end justify-between"><strong className="text-2xl text-ink">{value}</strong><span className="text-xs font-semibold text-good">{change}</span></div></div>)}</div>
    </div>
  );
}

function BuilderPreview({ item, onClose }: { item: SiteRecord | null; onClose: () => void }) {
  if (!item) return null;
  const rate = item.visits ? Math.round((item.conversions / item.visits) * 100) : 0;
  return (
    <Modal open onClose={onClose} size="lg" title={item.name}><div className="space-y-4" data-tour="sites.builderPreview"><div className="flex items-center gap-2"><Badge tone={item.status === 'Published' ? 'good' : 'neutral'}>{item.status}</Badge><span className="text-xs text-ink-muted">Updated {item.updated}</span></div><div className="grid grid-cols-3 gap-3">{[['Visits', item.visits.toLocaleString()], ['Conversions', item.conversions.toLocaleString()], ['Conversion rate', `${rate}%`]].map(([label, value]) => <div key={label} className="rounded-lg bg-surface-sunken p-4 text-center"><p className="text-xl font-bold text-ink">{value}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>)}</div><div className="rounded-lg border border-line bg-[#f9fafc] p-4"><p className="text-sm font-semibold text-ink">Read-only builder preview</p><p className="mt-1 text-xs leading-5 text-ink-muted">This public demo keeps site editing local. In Kleegr, this opens the drag-and-drop builder and publishing controls.</p></div></div></Modal>
  );
}

export function Sites() {
  const pushToast = useStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState('funnels');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SiteRecord | null>(null);
  const config = activeTab === 'funnels'
    ? { title: 'Funnels', description: 'Create and manage funnels to generate leads, appointments and receive payments.', action: 'New funnel', rows: FUNNELS, icon: <FolderPlus size={16} /> }
    : activeTab === 'websites'
      ? { title: 'Websites', description: 'Create and manage branded websites for your business.', action: 'New website', rows: WEBSITES, icon: <Globe size={16} /> }
      : SECONDARY_CONTENT[activeTab];
  const notify = (title: string, description: string) => pushToast({ title, description, variant: 'info' });

  return (
    <div className="min-h-full bg-surface-sunken" data-tour="sites.page">
      <ModuleHeader
        title="Sites"
        tabs={SITE_TABS}
        activeTab={activeTab}
        onTabChange={(id) => { setActiveTab(id); setSearch(''); }}
        className="[&_[role=tab]]:px-2 [&_[role=tablist]]:gap-0 [&_[role=tablist]]:overflow-hidden"
        data-tour="sites.tabs"
      />
      <div className="flex min-h-[76px] items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
        <div><h2 className="text-lg font-semibold text-ink">{activeTab === 'forms' ? 'Forms' : activeTab === 'surveys' ? 'Surveys' : activeTab === 'analytics' ? 'Analytics' : config?.title ?? 'Sites'}</h2><p className="mt-0.5 text-xs text-ink-muted">{activeTab === 'forms' ? 'Create forms that capture and organize customer details.' : activeTab === 'surveys' ? 'Build surveys and collect useful customer feedback.' : activeTab === 'analytics' ? 'Understand traffic, conversion, and sales performance.' : config?.description}</p></div>
        {activeTab !== 'analytics' ? <div className="flex items-center gap-2"><Button variant="secondary" size="sm" className="w-9 px-0" aria-label="Create folder" onClick={() => notify('Folder ready', 'A new folder would be created here in the live workspace.')}><FolderPlus size={15} /></Button>{activeTab === 'funnels' || activeTab === 'websites' ? <Button variant="secondary" size="sm" className="border-[#b799e6] text-[#6941c6]" onClick={() => notify('AI builder', 'The guided AI site builder would open here.')}><Sparkles size={14} />Build with AI</Button> : null}<Button size="sm" data-tour="sites.newSite" onClick={() => notify(config?.action ?? `New ${activeTab.slice(0, -1)}`, 'The creation flow would open here in the live product.')}><Plus size={15} />{config?.action ?? `New ${activeTab.slice(0, -1)}`}</Button></div> : null}
      </div>
      <main className="p-4" data-tour="sites.grid">{activeTab === 'forms' || activeTab === 'surveys' ? <FormsWorkspace type={activeTab} onOpen={(name) => notify(name, 'This opens the visual builder in the live workspace.')} /> : null}{activeTab === 'analytics' ? <AnalyticsWorkspace /> : null}{activeTab !== 'forms' && activeTab !== 'surveys' && activeTab !== 'analytics' && config ? <RecordsWorkspace rows={config.rows} search={search} onSearch={setSearch} onSelect={setSelected} /> : null}</main>
      <BuilderPreview item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
