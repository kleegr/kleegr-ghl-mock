import { useMemo, useState } from 'react';
import {
  LayoutGrid, List, Plus, Upload, MoreVertical, SlidersHorizontal,
  ArrowUpDown, Search, Settings, Pencil, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { SimpleTable } from '@/components/tables/SimpleTable';
import type { Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { OpportunityBoard } from './components/OpportunityBoard';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { PipelineSelect } from './components/PipelineSelect';
import { PipelinesTable } from './components/PipelinesTable';
import { CreatePipelineModal } from './components/CreatePipelineModal';
import { AddOpportunityModal } from './components/AddOpportunityModal';
import { money, moneyCents, dateLabel, fullName, cx } from '@/utils';
import type { Opportunity } from '@/types';

type StatusTone = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';
type Tab = 'opportunities' | 'forecast' | 'pipelines' | 'bulk';

function statusTone(status: Opportunity['status']): StatusTone {
  const map: Record<Opportunity['status'], StatusTone> = {
    open: 'brand', won: 'good', lost: 'bad', abandoned: 'warn',
  };
  return map[status];
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'bulk', label: 'Bulk Actions' },
];

export function Opportunities() {
  const pipelines = useStore((s) => s.pipelines);
  const opportunities = useStore((s) => s.opportunities);
  const contacts = useStore((s) => s.contacts);
  const companies = useStore((s) => s.companies);
  const users = useStore((s) => s.users);
  const moveOpportunity = useStore((s) => s.moveOpportunity);
  const removeOpportunities = useStore((s) => s.removeOpportunities);
  const bulkUpdateOpportunities = useStore((s) => s.bulkUpdateOpportunities);
  const pushToast = useStore((s) => s.pushToast);

  const [tab, setTab] = useState<Tab>('opportunities');
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id ?? '');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [detailOppId, setDetailOppId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createPipelineOpen, setCreatePipelineOpen] = useState(false);
  const [addOppOpen, setAddOppOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) ?? pipelines[0],
    [pipelines, selectedPipelineId],
  );
  const pipelineOpps = useMemo(
    () => opportunities.filter((o) => o.pipelineId === selectedPipelineId),
    [opportunities, selectedPipelineId],
  );
  const contactById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );
  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies],
  );
  const visibleOpps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pipelineOpps;
    return pipelineOpps.filter((o) => {
      const c = contactById.get(o.contactId);
      const company = c?.companyId ? companyById.get(c.companyId) : undefined;
      const hay = [
        o.name,
        o.source ?? '',
        c ? fullName(c) : '',
        c?.email ?? '',
        c?.phone ?? '',
        company?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [pipelineOpps, search, contactById, companyById]);
  const detailOpp = detailOppId
    ? (opportunities.find((o) => o.id === detailOppId) ?? null)
    : null;

  const selectable = tab === 'bulk';

  const cosmetic = (label: string) =>
    pushToast({ title: `Demo: ${label}`, description: 'This action is simulated in the demo.', variant: 'info' });

  const handleMove = (oppId: string, stageId: string) => {
    moveOpportunity(oppId, stageId);
    pushToast({ title: 'Opportunity moved', description: 'Stage updated.', variant: 'success' });
  };
  const bulkDelete = () => {
    if (!selectedIds.size) return;
    const n = selectedIds.size;
    removeOpportunities([...selectedIds]);
    pushToast({ title: 'Opportunities deleted', description: `${n} opportunit${n === 1 ? 'y' : 'ies'} removed (demo session).`, variant: 'success' });
    clearSelection();
  };
  const bulkSetStatus = (status: Opportunity['status'], label: string) => {
    if (!selectedIds.size) return;
    const n = selectedIds.size;
    bulkUpdateOpportunities([...selectedIds], { status });
    pushToast({ title: `Marked ${label}`, description: `${n} opportunit${n === 1 ? 'y' : 'ies'} updated (demo session).`, variant: 'success' });
    setBulkMenuOpen(false);
    clearSelection();
  };
  const toggleCard = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = (ids: string[], on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t !== 'bulk') {
      clearSelection();
      setBulkMenuOpen(false);
    }
  };

  const listColumns: Column<Opportunity>[] = [
    { key: 'name', header: 'Opportunity', render: (o) => <span className="font-medium text-ink">{o.name}</span> },
    {
      key: 'contact', header: 'Contact',
      render: (o) => {
        const c = contacts.find((c) => c.id === o.contactId);
        return c ? <span className="text-ink-muted">{fullName(c)}</span> : <span className="text-ink-subtle">—</span>;
      },
    },
    {
      key: 'business', header: 'Business',
      render: (o) => {
        const c = contacts.find((c) => c.id === o.contactId);
        const co = c?.companyId ? companies.find((x) => x.id === c.companyId) : undefined;
        return co ? <span className="text-ink-muted">{co.name}</span> : <span className="text-ink-subtle">—</span>;
      },
    },
    {
      key: 'stage', header: 'Stage',
      render: (o) => {
        const stage = selectedPipeline?.stages.find((s) => s.id === o.stageId);
        return <span className="text-ink-muted">{stage?.name ?? '—'}</span>;
      },
    },
    { key: 'value', header: 'Value', className: 'text-right', render: (o) => <span className="font-semibold text-ink">{money(o.monetaryValue)}</span> },
    {
      key: 'owner', header: 'Owner',
      render: (o) => {
        const u = users.find((u) => u.id === o.ownerId);
        return <span className="text-ink-muted">{u?.name ?? '—'}</span>;
      },
    },
    { key: 'status', header: 'Status', render: (o) => <Badge tone={statusTone(o.status)}>{o.status}</Badge> },
    { key: 'created', header: 'Created', render: (o) => <span className="text-xs text-ink-muted">{dateLabel(o.createdAt)}</span> },
  ];

  if (!selectedPipeline) return null;
  const totalValue = pipelineOpps.reduce((s, o) => s + o.monetaryValue, 0);

  return (
    <div className="flex h-full min-h-[640px] flex-col bg-[#f3f5f8]" data-tour="opportunities.page">
      {/* Banner header + tabs */}
      <div className="h-[90px] shrink-0 bg-[#102a43] px-5 pt-4 text-white">
        <h1 className="font-display text-[21px] font-semibold leading-7 tracking-[-0.01em]">Opportunities</h1>
        <div className="mt-2.5 flex h-[39px] items-end gap-7" role="tablist" aria-label="Opportunities sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={cx(
                'flex h-full items-center border-b-2 pt-0.5 text-[13px] font-medium transition-colors',
                tab === t.id ? 'border-[#20c5e8] text-white' : 'border-transparent text-white/65 hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'forecast' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f3f5f8] p-4">
          <div className="rounded-[12px] border border-[#e1e6ed] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e9ef] px-4 py-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#344054]">Opportunity forecast</h2>
                <p className="mt-0.5 text-[11px] text-[#667085]">Expected pipeline value by stage</p>
              </div>
              <PipelineSelect
                pipelines={pipelines}
                value={selectedPipelineId}
                onChange={setSelectedPipelineId}
                onNewPipeline={() => setCreatePipelineOpen(true)}
              />
            </div>
            <div className="grid gap-3 border-b border-[#e5e9ef] p-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e1e6ed] px-4 py-3">
                <p className="text-[11px] font-medium text-[#667085]">Pipeline value</p>
                <p className="mt-1 text-xl font-semibold text-[#101828]">{moneyCents(totalValue)}</p>
              </div>
              <div className="rounded-lg border border-[#e1e6ed] px-4 py-3">
                <p className="text-[11px] font-medium text-[#667085]">Open opportunities</p>
                <p className="mt-1 text-xl font-semibold text-[#101828]">{pipelineOpps.filter((item) => item.status === 'open').length}</p>
              </div>
              <div className="rounded-lg border border-[#e1e6ed] px-4 py-3">
                <p className="text-[11px] font-medium text-[#667085]">Average opportunity</p>
                <p className="mt-1 text-xl font-semibold text-[#101828]">{moneyCents(pipelineOpps.length ? totalValue / pipelineOpps.length : 0)}</p>
              </div>
            </div>
            <div className="divide-y divide-[#e5e9ef]">
              {selectedPipeline.stages.slice().sort((a, b) => a.order - b.order).map((stage) => {
                const stageItems = pipelineOpps.filter((item) => item.stageId === stage.id);
                const stageValue = stageItems.reduce((sum, item) => sum + item.monetaryValue, 0);
                const width = totalValue && stageValue ? Math.max(4, (stageValue / totalValue) * 100) : 0;
                return (
                  <div key={stage.id} className="grid items-center gap-4 px-4 py-3 md:grid-cols-[180px_1fr_90px_130px]">
                    <span className="text-[12px] font-medium text-[#344054]">{stage.name}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[#eef1f5]">
                      <span className="block h-full rounded-full bg-[#1689f4]" style={{ width: `${width}%` }} />
                    </span>
                    <span className="text-right text-[11px] text-[#667085]">{stageItems.length} deals</span>
                    <span className="text-right text-[12px] font-semibold text-[#344054]">{moneyCents(stageValue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : tab === 'pipelines' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken">
          <PipelinesTable pipelines={pipelines} opportunities={opportunities} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          {/* Toolbar */}
          <div className="flex min-h-[64px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e5e9ef] bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <PipelineSelect
                pipelines={pipelines}
                value={selectedPipelineId}
                onChange={setSelectedPipelineId}
                onNewPipeline={() => setCreatePipelineOpen(true)}
              />
              <span className="rounded-full bg-[#e9f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#1670d2]">
                {pipelineOpps.length} opportunities
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-9 items-center rounded-md border border-[#d7dde6] bg-white p-0.5" data-tour="opportunities.viewToggle">
                <button
                  onClick={() => setView('board')}
                  className={cx('grid h-7 w-7 place-items-center rounded-[4px] transition-colors', view === 'board' ? 'bg-[#e9f3ff] text-[#1689f4]' : 'text-[#98a2b3] hover:text-[#475467]')}
                  aria-pressed={view === 'board'} title="Board view"
                ><LayoutGrid size={14} /></button>
                <button
                  onClick={() => setView('list')}
                  className={cx('grid h-7 w-7 place-items-center rounded-[4px] transition-colors', view === 'list' ? 'bg-[#e9f3ff] text-[#1689f4]' : 'text-[#98a2b3] hover:text-[#475467]')}
                  aria-pressed={view === 'list'} title="List view"
                ><List size={14} /></button>
              </div>

              <button onClick={() => cosmetic('Import')} className="flex h-9 items-center gap-1.5 rounded-md border border-[#d7dde6] bg-white px-3 text-[12px] font-semibold text-[#475467] hover:bg-[#f7f9fb]">
                <Upload size={14} /> Import
              </button>
              <button onClick={() => setAddOppOpen(true)} className="flex h-9 items-center gap-1.5 rounded-md bg-[#1689f4] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#0878df]" data-tour="opportunities.add">
                <Plus size={15} /> Add opportunity
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-md border border-[#d7dde6] bg-white text-[#667085] hover:bg-[#f7f9fb]" aria-label="More options">
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-[#dfe4eb] bg-white py-1 shadow-pop">
                      {['Export', 'Manage Fields', 'Pipeline settings'].map((a) => (
                        <button key={a} onClick={() => { setMenuOpen(false); cosmetic(a); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#344054] hover:bg-[#f5f7fa]">{a}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Saved-view sub-tabs */}
          <div className="flex h-[47px] shrink-0 items-end gap-5 border-b border-[#e5e9ef] bg-white px-5">
            <span className="flex h-full items-center gap-1.5 border-b-2 border-[#1689f4] px-1 pt-0.5 text-[12px] font-semibold text-[#1266c9]">
              <List size={13} /> Open opportunities
            </span>
            <button onClick={() => cosmetic('New smart list')} className="flex h-full items-center gap-1.5 border-b-2 border-transparent px-1 pt-0.5 text-[12px] font-medium text-[#667085] hover:text-[#344054]">
              New smart list <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#e9f3ff] px-1 text-[9px] font-semibold text-[#1670d2]">2</span>
            </button>
            <button onClick={() => cosmetic('New list')} className="flex h-full items-center gap-1 border-b-2 border-transparent px-1 pt-0.5 text-[12px] font-medium text-[#667085] hover:text-[#344054]">
              <Plus size={13} /> List
            </button>
          </div>

          {/* Filter / selection row */}
          <div className="flex min-h-[54px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e5e9ef] bg-white px-5 py-2.5">
            {selectable ? (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand">
                  {selectedIds.size} opportunit{selectedIds.size === 1 ? 'y' : 'ies'} selected
                </span>
                <div className="relative">
                  <button
                    onClick={() => selectedIds.size && setBulkMenuOpen((v) => !v)}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
                  ><Pencil size={14} /> Edit</button>
                  {bulkMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop">
                        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Set status</p>
                        {([['won', 'Won'], ['lost', 'Lost'], ['open', 'Open'], ['abandoned', 'Abandoned']] as const).map(([s, label]) => (
                          <button
                            key={s}
                            onClick={() => bulkSetStatus(s, label)}
                            className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunken"
                          >Mark as {label}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={bulkDelete}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 text-sm font-semibold text-bad hover:text-bad/80 disabled:opacity-40"
                ><Trash2 size={14} /> Delete</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => cosmetic('Advanced filters')} className="flex h-8 items-center gap-1.5 rounded-md border border-[#1689f4] bg-[#eef6ff] px-2.5 text-[12px] font-semibold text-[#1266c9]">
                  <SlidersHorizontal size={13} /> Advanced filters <span className="rounded-full bg-[#1689f4] px-1.5 py-px text-[9px] font-bold text-white">1</span>
                </button>
                <button onClick={() => cosmetic('Sort')} className="flex h-8 items-center gap-1.5 rounded-md border border-[#d7dde6] bg-white px-2.5 text-[12px] font-semibold text-[#475467] hover:bg-[#f8fafc]">
                  <ArrowUpDown size={13} /> Sort <span className="rounded-full bg-[#eef1f5] px-1.5 py-px text-[9px] text-[#667085]">1</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative w-[245px] max-w-[38vw] min-w-[160px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search opportunities"
                  className="h-8 w-full rounded-md border border-[#d7dde6] bg-white pl-8 pr-3 text-[12px] text-[#344054] outline-none placeholder:text-[#98a2b3] focus:border-[#1689f4] focus:ring-2 focus:ring-[#1689f4]/10"
                />
              </div>
              <button onClick={() => cosmetic('Manage Fields')} className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[#667085] hover:bg-[#f3f5f8]" data-tour="opportunities.manageFields">
                <Settings size={13} /> Manage fields
              </button>
            </div>
          </div>

          {/* Board / list */}
          <div className="min-h-0 flex-1 overflow-hidden bg-[#f3f5f8]">
            {view === 'board' ? (
              <OpportunityBoard
                pipeline={selectedPipeline}
                opportunities={visibleOpps}
                contacts={contacts}
                users={users}
                companies={companies}
                onCardClick={(id) => setDetailOppId(id)}
                onMove={handleMove}
                selectable={selectable}
                selectedIds={selectedIds}
                onToggleCard={toggleCard}
                onToggleAll={toggleAll}
              />
            ) : (
              <div className="h-full overflow-auto p-4" data-tour="opportunities.list">
                <SimpleTable
                  columns={listColumns}
                  rows={visibleOpps}
                  onRowClick={(o) => setDetailOppId(o.id)}
                  empty="No opportunities in this pipeline"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {detailOpp && (
        <OpportunityDetailModal
          opportunity={detailOpp}
          contacts={contacts}
          users={users}
          onClose={() => setDetailOppId(null)}
        />
      )}
      {createPipelineOpen && <CreatePipelineModal onClose={() => setCreatePipelineOpen(false)} />}
      {addOppOpen && (
        <AddOpportunityModal
          pipelines={pipelines}
          contacts={contacts}
          users={users}
          initialPipelineId={selectedPipelineId}
          onClose={() => setAddOppOpen(false)}
        />
      )}
    </div>
  );
}
