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
type Tab = 'opportunities' | 'pipelines' | 'bulk';

function statusTone(status: Opportunity['status']): StatusTone {
  const map: Record<Opportunity['status'], StatusTone> = {
    open: 'brand', won: 'good', lost: 'bad', abandoned: 'warn',
  };
  return map[status];
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'opportunities', label: 'Opportunities' },
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
    <div className="flex h-full flex-col" data-tour="opportunities.page">
      {/* Banner header + tabs */}
      <div className="shrink-0 bg-banner px-5 pt-4 text-white">
        <h1 className="font-display text-2xl font-bold leading-tight">Opportunities</h1>
        <div className="mt-3 flex items-center gap-6" role="tablist" aria-label="Opportunities sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={cx(
                '-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors',
                tab === t.id ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pipelines' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken">
          <PipelinesTable pipelines={pipelines} opportunities={opportunities} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-surface">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <div className="flex items-center gap-3">
              <PipelineSelect
                pipelines={pipelines}
                value={selectedPipelineId}
                onChange={setSelectedPipelineId}
                onNewPipeline={() => setCreatePipelineOpen(true)}
              />
              <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
                {pipelineOpps.length} opportunities
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-line p-0.5" data-tour="opportunities.viewToggle">
                <button
                  onClick={() => setView('board')}
                  className={cx('grid h-8 w-8 place-items-center rounded-md transition-colors', view === 'board' ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:text-ink')}
                  aria-pressed={view === 'board'} title="Board view"
                ><LayoutGrid size={16} /></button>
                <button
                  onClick={() => setView('list')}
                  className={cx('grid h-8 w-8 place-items-center rounded-md transition-colors', view === 'list' ? 'bg-brand-soft text-brand' : 'text-ink-subtle hover:text-ink')}
                  aria-pressed={view === 'list'} title="List view"
                ><List size={16} /></button>
              </div>

              <button onClick={() => cosmetic('Import')} className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunken">
                <Upload size={15} /> Import
              </button>
              <button onClick={() => setAddOppOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-brand-fg hover:bg-brand/90" data-tour="opportunities.add">
                <Plus size={16} /> Add opportunity
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="More options">
                  <MoreVertical size={17} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop">
                      {['Export', 'Manage Fields', 'Pipeline settings'].map((a) => (
                        <button key={a} onClick={() => { setMenuOpen(false); cosmetic(a); }} className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunken">{a}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Saved-view sub-tabs */}
          <div className="mt-3 flex items-center gap-1 border-b border-line px-5">
            <span className="flex items-center gap-1.5 border-b-2 border-brand px-3 pb-2 text-sm font-semibold text-brand">
              <List size={14} /> Open opportunities
            </span>
            <button onClick={() => cosmetic('New saved view')} className="flex items-center gap-1 px-3 pb-2 text-sm font-medium text-ink-muted hover:text-ink">
              <Plus size={14} /> List
            </button>
          </div>

          {/* Filter / selection row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
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
                <button onClick={() => cosmetic('Advanced filters')} className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft/50 px-3 py-1.5 text-sm font-semibold text-brand">
                  <SlidersHorizontal size={14} /> Advanced Filters <span className="rounded-full bg-brand px-1.5 text-[11px] text-brand-fg">1</span>
                </button>
                <button onClick={() => cosmetic('Sort')} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
                  <ArrowUpDown size={14} /> Sort <span className="rounded-full bg-surface-sunken px-1.5 text-[11px] text-ink-subtle">1</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative w-64 max-w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Opportunities"
                  className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <button onClick={() => cosmetic('Manage Fields')} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink-muted hover:bg-surface-sunken" data-tour="opportunities.manageFields">
                <Settings size={15} /> Manage Fields
              </button>
            </div>
          </div>

          {/* Board / list */}
          <div className="min-h-0 flex-1 overflow-hidden bg-surface-sunken/40">
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
              <div className="h-full overflow-auto p-5" data-tour="opportunities.list">
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
