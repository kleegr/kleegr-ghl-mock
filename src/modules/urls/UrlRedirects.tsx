import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

type RedirectStatus = 'Active' | 'Draft';

interface RedirectRow {
  id: string;
  name: string;
  slug: string;
  destination: string;
  type: '301 Permanent' | '302 Temporary' | 'Tracked Link';
  status: RedirectStatus;
  clicks: number;
  modified: string;
}

const TABS: ModuleHeaderTab[] = [
  { id: 'redirects', label: 'URL Redirects' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'domains', label: 'Domains' },
];

const INITIAL_ROWS: RedirectRow[] = [
  { id: 'url-001', name: 'Book a strategy call', slug: '/book', destination: 'https://demo.kleegr.com/calendar/strategy', type: '301 Permanent', status: 'Active', clicks: 1248, modified: 'Sep 5, 2026' },
  { id: 'url-002', name: 'September offer', slug: '/september', destination: 'https://demo.kleegr.com/offers/growth', type: 'Tracked Link', status: 'Active', clicks: 862, modified: 'Sep 4, 2026' },
  { id: 'url-003', name: 'Client portal', slug: '/portal', destination: 'https://portal.demo-kleegr.com/login', type: '301 Permanent', status: 'Active', clicks: 596, modified: 'Sep 2, 2026' },
  { id: 'url-004', name: 'Referral program', slug: '/refer', destination: 'https://demo.kleegr.com/referrals', type: 'Tracked Link', status: 'Active', clicks: 384, modified: 'Aug 30, 2026' },
  { id: 'url-005', name: 'Old services page', slug: '/services-old', destination: 'https://demo.kleegr.com/services', type: '301 Permanent', status: 'Active', clicks: 271, modified: 'Aug 27, 2026' },
  { id: 'url-006', name: 'Webinar replay', slug: '/replay', destination: 'https://demo.kleegr.com/webinar/replay', type: '302 Temporary', status: 'Draft', clicks: 0, modified: 'Aug 25, 2026' },
  { id: 'url-007', name: 'Guide download', slug: '/guide', destination: 'https://demo.kleegr.com/resources/guide', type: 'Tracked Link', status: 'Active', clicks: 219, modified: 'Aug 22, 2026' },
  { id: 'url-008', name: 'Support center', slug: '/help', destination: 'https://support.demo-kleegr.com', type: '301 Permanent', status: 'Active', clicks: 147, modified: 'Aug 19, 2026' },
];

function RedirectsTable({ rows, onCopy }: { rows: RedirectRow[]; onCopy: (row: RedirectRow) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[1030px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-[#fbfcfd]">
            <th className="w-11 border-r border-line px-3 py-2.5"><input type="checkbox" aria-label="Select all URLs" className="h-3.5 w-3.5 rounded border-line" /></th>
            {['Name', 'Short URL', 'Destination', 'Redirect type', 'Status', 'Clicks', 'Last modified', ''].map((heading) => (
              <th key={heading} className="border-r border-line px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-subtle last:border-r-0">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.id} className="group hover:bg-surface-sunken/65">
              <td className="border-r border-line px-3 py-3"><input type="checkbox" aria-label={`Select ${row.name}`} className="h-3.5 w-3.5 rounded border-line" /></td>
              <td className="border-r border-line px-3 py-3"><button type="button" className="text-left"><span className="block text-xs font-semibold text-ink group-hover:text-brand">{row.name}</span><span className="block text-[10px] text-ink-subtle">{row.id}</span></button></td>
              <td className="border-r border-line px-3 py-3"><button type="button" onClick={() => onCopy(row)} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline">go.demo-kleegr.com{row.slug}<Copy size={11} /></button></td>
              <td className="max-w-[300px] border-r border-line px-3 py-3"><div className="flex items-center gap-1.5"><span className="truncate text-xs text-ink-muted">{row.destination}</span><ExternalLink size={11} className="shrink-0 text-ink-subtle" /></div></td>
              <td className="border-r border-line px-3 py-3 text-[11px] text-ink-muted">{row.type}</td>
              <td className="border-r border-line px-3 py-3"><Badge tone={row.status === 'Active' ? 'good' : 'neutral'}>{row.status}</Badge></td>
              <td className="border-r border-line px-3 py-3 text-xs font-semibold tabular-nums text-ink">{row.clicks.toLocaleString()}</td>
              <td className="border-r border-line px-3 py-3 text-[11px] text-ink-muted">{row.modified}</td>
              <td className="px-3 py-3 text-right"><button type="button" aria-label={`More options for ${row.name}`} className="rounded p-1.5 text-ink-subtle hover:bg-line/60 hover:text-ink"><MoreHorizontal size={15} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <div className="py-16 text-center"><Search size={24} className="mx-auto text-ink-subtle" /><p className="mt-2 text-sm font-semibold text-ink">No URLs found</p><p className="text-xs text-ink-muted">Try a different search.</p></div> : null}
      <div className="flex items-center justify-between border-t border-line px-3 py-2.5 text-[11px] text-ink-muted"><span>Showing {rows.length} of 8 URLs</span><div className="flex items-center gap-2"><span>Rows per page: 25</span><span className="rounded border border-line px-2 py-1">1–{rows.length} of 8</span></div></div>
    </div>
  );
}

function AnalyticsView({ rows }: { rows: RedirectRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.clicks, 0);
  const max = Math.max(...rows.map((row) => row.clicks), 1);
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total clicks', value: total.toLocaleString(), note: '+12.6% vs last period' },
          { label: 'Unique visitors', value: '2,884', note: '74% of all clicks' },
          { label: 'Top performing URL', value: '/book', note: '1,248 clicks' },
          { label: 'Active redirects', value: String(rows.filter((row) => row.status === 'Active').length), note: 'Across 3 domains' },
        ].map((item) => <Card key={item.label} className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{item.label}</p><p className="mt-2 text-xl font-bold text-ink">{item.value}</p><p className="mt-1 text-[10px] text-ink-muted">{item.note}</p></Card>)}
      </div>
      <Card className="p-4">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-sm font-bold text-ink">Clicks by URL</p><p className="text-xs text-ink-muted">Last 30 days</p></div><Button size="xs" variant="secondary">Sep 1 – Sep 30 <ChevronDown size={12} /></Button></div>
        <div className="space-y-3">
          {rows.slice(0, 6).map((row) => <div key={row.id} className="grid grid-cols-[150px_minmax(120px,1fr)_54px] items-center gap-3"><span className="truncate text-xs font-medium text-ink">{row.slug}</span><div className="h-2 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-gradient-to-r from-brand to-banner-accent" style={{ width: `${Math.max(3, row.clicks / max * 100)}%` }} /></div><span className="text-right text-[11px] font-semibold text-ink">{row.clicks.toLocaleString()}</span></div>)}
        </div>
      </Card>
    </div>
  );
}

function DomainsView() {
  const domains = [
    { domain: 'go.demo-kleegr.com', type: 'Branded short domain', status: 'Connected', redirects: 8 },
    { domain: 'demo.kleegr.com', type: 'Website domain', status: 'Connected', redirects: 5 },
    { domain: 'links.demo-kleegr.com', type: 'Tracking domain', status: 'Verifying', redirects: 0 },
  ];
  return (
    <div className="p-5">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><p className="text-sm font-bold text-ink">Connected domains</p><p className="text-xs text-ink-muted">Domains available for redirects and tracked links.</p></div><Button size="sm"><Plus size={14} /> Connect domain</Button></div>
        <div className="divide-y divide-line">{domains.map((domain) => <div key={domain.domain} className="grid grid-cols-[minmax(240px,1fr)_220px_120px_100px] items-center gap-4 px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Link2 size={15} /></span><span className="text-xs font-semibold text-ink">{domain.domain}</span></div><span className="text-xs text-ink-muted">{domain.type}</span><Badge tone={domain.status === 'Connected' ? 'good' : 'warn'}>{domain.status}</Badge><span className="text-right text-xs text-ink-muted">{domain.redirects} URLs</span></div>)}</div>
      </div>
    </div>
  );
}

function NewRedirectModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (row: RedirectRow) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');

  const create = () => {
    if (!name.trim() || !slug.trim() || !destination.trim()) return;
    onCreate({
      id: `url-${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      slug: slug.startsWith('/') ? slug : `/${slug}`,
      destination: destination.trim(),
      type: '301 Permanent',
      status: 'Active',
      clicks: 0,
      modified: 'Just now',
    });
    setName('');
    setSlug('');
    setDestination('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create URL redirect" footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" disabled={!name.trim() || !slug.trim() || !destination.trim()} onClick={create}>Create redirect</Button></>}>
      <div className="space-y-4">
        <label className="block"><span className="text-xs font-semibold text-ink">Name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" placeholder="e.g. Book a consultation" /></label>
        <label className="block"><span className="text-xs font-semibold text-ink">Short URL</span><div className="mt-1.5 flex h-9 overflow-hidden rounded-lg border border-line focus-within:border-brand"><span className="flex items-center border-r border-line bg-surface-sunken px-2.5 text-xs text-ink-muted">go.demo-kleegr.com</span><input value={slug} onChange={(event) => setSlug(event.target.value)} className="min-w-0 flex-1 px-2.5 text-sm outline-none" placeholder="/short-link" /></div></label>
        <label className="block"><span className="text-xs font-semibold text-ink">Destination URL</span><input value={destination} onChange={(event) => setDestination(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" placeholder="https://demo.kleegr.com/page" /></label>
        <div className="rounded-lg border border-brand/20 bg-brand-soft/50 p-3 text-[11px] leading-relaxed text-ink-muted"><span className="font-semibold text-ink">Demo safe:</span> this redirect stays only in your browser and never publishes to a real domain.</div>
      </div>
    </Modal>
  );
}

export function UrlRedirects() {
  const pushToast = useStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState('redirects');
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.slug} ${row.destination}`.toLowerCase().includes(query.toLowerCase())), [query, rows]);

  const copy = (row: RedirectRow) => {
    pushToast({ title: 'Short URL copied', description: `go.demo-kleegr.com${row.slug}`, variant: 'success' });
  };

  const create = (row: RedirectRow) => {
    setRows((current) => [row, ...current]);
    pushToast({ title: 'URL redirect created', description: 'Saved locally for this demo session.', variant: 'success' });
  };

  return (
    <div data-tour="urls.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <ModuleHeader title="URLs" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'redirects' ? (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
            <div><h2 className="text-xl font-bold tracking-tight text-ink">URL Redirects</h2><p className="text-xs text-ink-muted">Create branded links and route visitors to the right destination.</p></div>
            <div className="flex items-center gap-2"><Button variant="secondary" size="sm"><Settings2 size={14} /> Settings</Button><Button size="sm" onClick={() => setNewOpen(true)}><Plus size={15} /> New URL</Button></div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Button variant="secondary" size="sm"><Filter size={14} /> Advanced filters</Button><Button variant="secondary" size="sm"><ArrowDownUp size={14} /> Sort</Button><span className="rounded-md bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">{rows.length} URLs</span></div>
              <div className="flex items-center gap-2"><button type="button" aria-label="Refresh URLs" className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-ink-muted hover:text-ink"><RefreshCw size={14} /></button><label className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-muted focus-within:border-brand"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search URLs" placeholder="Search URLs" className="min-w-0 flex-1 outline-none" /></label></div>
            </div>
            <RedirectsTable rows={filtered} onCopy={copy} />
          </div>
        </>
      ) : null}
      {activeTab === 'analytics' ? <div className="min-h-0 flex-1 overflow-auto"><AnalyticsView rows={rows} /></div> : null}
      {activeTab === 'domains' ? <div className="min-h-0 flex-1 overflow-auto"><DomainsView /></div> : null}
      <NewRedirectModal open={newOpen} onClose={() => setNewOpen(false)} onCreate={create} />
    </div>
  );
}
