import { useMemo, useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { PageHeader, Button, Badge, Tabs } from '@/components/ui/primitives';
import { SimpleTable } from '@/components/tables/SimpleTable';
import type { Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { OpportunityBoard } from './components/OpportunityBoard';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { money, dateLabel, fullName, cx } from '@/utils';
import type { Opportunity } from '@/types';

type StatusTone = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';

function statusTone(status: Opportunity['status']): StatusTone {
  const map: Record<Opportunity['status'], StatusTone> = {
    open: 'brand',
    won: 'good',
    lost: 'bad',
    abandoned: 'warn',
  };
  return map[status];
}

export function Opportunities() {
  const pipelines = useStore((s) => s.pipelines);
  const opportunities = useStore((s) => s.opportunities);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const moveOpportunity = useStore((s) => s.moveOpportunity);
  const pushToast = useStore((s) => s.pushToast);

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    pipelines[0]?.id ?? '',
  );
  const [view, setView] = useState<'board' | 'list'>('board');
  const [detailOppId, setDetailOppId] = useState<string | null>(null);

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) ?? pipelines[0],
    [pipelines, selectedPipelineId],
  );

  const pipelineOpps = useMemo(
    () => opportunities.filter((o) => o.pipelineId === selectedPipelineId),
    [opportunities, selectedPipelineId],
  );

  const detailOpp = useMemo(
    () => (detailOppId ? (opportunities.find((o) => o.id === detailOppId) ?? null) : null),
    [opportunities, detailOppId],
  );

  const pipelineTabs = pipelines.map((p) => ({
    id: p.id,
    label: p.name,
    count: opportunities.filter((o) => o.pipelineId === p.id && o.status === 'open').length,
  }));

  const listColumns: Column<Opportunity>[] = [
    {
      key: 'name',
      header: 'Opportunity',
      render: (o) => <span className="font-medium text-ink">{o.name}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (o) => {
        const c = contacts.find((c) => c.id === o.contactId);
        return c ? (
          <span className="text-ink-muted">{fullName(c)}</span>
        ) : (
          <span className="text-ink-subtle">—</span>
        );
      },
    },
    {
      key: 'pipeline',
      header: 'Pipeline',
      render: (o) => {
        const p = pipelines.find((p) => p.id === o.pipelineId);
        return <span className="text-ink-muted">{p?.name ?? '—'}</span>;
      },
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (o) => {
        const p = pipelines.find((p) => p.id === o.pipelineId);
        const stage = p?.stages.find((s) => s.id === o.stageId);
        return <span className="text-ink-muted">{stage?.name ?? '—'}</span>;
      },
    },
    {
      key: 'value',
      header: 'Value',
      render: (o) => (
        <span className="font-semibold text-ink">{money(o.monetaryValue)}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (o) => {
        const u = users.find((u) => u.id === o.ownerId);
        return <span className="text-ink-muted">{u?.name ?? '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (o) => (
        <span className="text-xs text-ink-muted">{dateLabel(o.createdAt)}</span>
      ),
    },
  ];

  const handleAddOpportunity = () => {
    pushToast({
      title: 'Demo: Add Opportunity',
      description: 'In production, a form would open to create a new deal.',
      variant: 'info',
    });
  };

  const handleMove = (oppId: string, stageId: string) => {
    moveOpportunity(oppId, stageId);
    pushToast({ title: 'Deal moved', description: 'Stage updated.', variant: 'success' });
  };

  if (!selectedPipeline) return null;

  return (
    <div className="flex h-full flex-col" data-tour="opportunities.page">
      <PageHeader
        title="Opportunities"
        subtitle="Track and move deals through your sales pipelines"
        actions={
          <>
            {/* Board / List toggle */}
            <div
              className="flex items-center rounded-lg border border-line bg-surface p-0.5"
              data-tour="opportunities.viewToggle"
            >
              <button
                onClick={() => setView('board')}
                className={cx(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  view === 'board'
                    ? 'bg-brand text-brand-fg shadow-card'
                    : 'text-ink-muted hover:text-ink',
                )}
                aria-pressed={view === 'board'}
                title="Board view"
              >
                <LayoutGrid size={13} />
                Board
              </button>
              <button
                onClick={() => setView('list')}
                className={cx(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  view === 'list'
                    ? 'bg-brand text-brand-fg shadow-card'
                    : 'text-ink-muted hover:text-ink',
                )}
                aria-pressed={view === 'list'}
                title="List view"
              >
                <List size={13} />
                List
              </button>
            </div>

            <Button size="sm" onClick={handleAddOpportunity}>
              <Plus size={14} />
              Add Opportunity
            </Button>
          </>
        }
      />

      {/* Pipeline selector */}
      <div
        className="border-b border-line bg-surface px-5 pt-1"
        data-tour="opportunities.pipelineSelector"
      >
        <Tabs
          tabs={pipelineTabs}
          active={selectedPipelineId}
          onChange={setSelectedPipelineId}
          variant="underline"
        />
      </div>

      {/* Board or List */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'board' ? (
          <OpportunityBoard
            pipeline={selectedPipeline}
            opportunities={pipelineOpps}
            contacts={contacts}
            users={users}
            onCardClick={(id) => setDetailOppId(id)}
            onMove={handleMove}
          />
        ) : (
          <div className="overflow-auto p-5" data-tour="opportunities.list">
            <SimpleTable
              columns={listColumns}
              rows={pipelineOpps}
              onRowClick={(o) => setDetailOppId(o.id)}
              empty="No opportunities in this pipeline"
            />
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailOpp && (
        <OpportunityDetailModal
          opportunity={detailOpp}
          contacts={contacts}
          users={users}
          onClose={() => setDetailOppId(null)}
        />
      )}
    </div>
  );
}
