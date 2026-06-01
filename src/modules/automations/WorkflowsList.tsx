import { useState } from 'react';
import {
  Folder, FolderPlus, Sparkles, Plus, ChevronDown, ChevronRight, Filter, Search,
  History, Clock, List, MoreVertical, ExternalLink, SlidersHorizontal,
} from 'lucide-react';
import type { Workflow } from '@/types';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';
import {
  FOLDERS, CREATE_OPTIONS, TEMPLATES, demoTimestamps, demoActiveEnrolled,
} from './automationData';
import { isShowcaseWorkflow, workflowNodeCounts } from './workflowTemplates';

type ListTab = 'all' | 'review' | 'deleted';

/* -- status pill (outline green / flat gray) -- */
function StatusPill({ status }: { status: Workflow['status'] }) {
  if (status === 'published') {
    return <span className="inline-flex items-center rounded-full border border-good/40 bg-good/5 px-2.5 py-0.5 text-xs font-semibold text-good">Published</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted">Draft</span>;
}

/* -- showcase badge (flagship demo workflow) -- */
function ShowcaseBadge() {
  return (
    <span
      title="Flagship showcase workflow - multi-trigger with nested branches"
      className="inline-flex items-center gap-1 rounded-full border border-ai/30 bg-ai-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ai"
    >
      <Sparkles size={10} /> Showcase
    </span>
  );
}

/* -- per-workflow node-count chips (triggers / actions / branches / waits) -- */
function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span title={`${value} ${label}`} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium">
      <span className="font-semibold text-ink">{value}</span>
      <span className="text-ink-subtle">{label}</span>
    </span>
  );
}

function WorkflowStats({ id, trigger }: { id: string; trigger: string }) {
  const c = workflowNodeCounts(id, trigger);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatChip value={c.triggers} label={c.triggers === 1 ? 'trigger' : 'triggers'} />
      <StatChip value={c.actions} label={c.actions === 1 ? 'action' : 'actions'} />
      {c.branches > 0 && <StatChip value={c.branches} label="branches" />}
      {c.waits > 0 && <StatChip value={c.waits} label={c.waits === 1 ? 'wait' : 'waits'} />}
    </div>
  );
}

/* -- row action menu -- */
function RowMenu({ open, onOpen, onClose, onAction }: { open: boolean; onOpen: () => void; onClose: () => void; onAction: (a: string) => void }) {
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); open ? onClose() : onOpen(); }}
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink"
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-20 cursor-default" aria-hidden onClick={(e) => { e.stopPropagation(); onClose(); }} />
          <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-pop">
            {['Edit', 'Duplicate', 'Move to folder', 'Delete'].map((a) => (
              <button
                key={a}
                onClick={(e) => { e.stopPropagation(); onClose(); onAction(a); }}
                className={cx('block w-full px-3 py-2 text-left text-sm hover:bg-surface-sunken', a === 'Delete' ? 'text-bad' : 'text-ink')}
              >
                {a}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -- New Workflow modal (template chooser, demo-safe) -- */
function NewWorkflowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Workflow"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!selected} onClick={() => { pushToast({ title: 'Workflow created (demo)', description: 'New workflows are not persisted in demo mode.', variant: 'success' }); setSelected(null); onClose(); }}>
            Create Workflow
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="mb-3 text-sm text-ink-muted">Choose a template or start from scratch.</p>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={cx('flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors', selected === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/40 hover:bg-surface-sunken')}
          >
            <Sparkles size={15} className={cx('mt-0.5 shrink-0', selected === t.id ? 'text-brand' : 'text-ink-muted')} />
            <div>
              <p className={cx('text-sm font-semibold', selected === t.id ? 'text-brand' : 'text-ink')}>{t.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* -- main list -- */
export function WorkflowsList({
  tab,
  onTabChange,
  onOpenWorkflow,
  onCreateBlank,
}: {
  tab: ListTab;
  onTabChange: (t: ListTab) => void;
  onOpenWorkflow: (wf: Workflow) => void;
  onCreateBlank: () => void;
}) {
  const workflows = useStore((s) => s.workflows);
  const pushToast = useStore((s) => s.pushToast);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  const cosmetic = (title: string, description: string) => pushToast({ title, description, variant: 'info' });

  const q = query.trim().toLowerCase();
  const matched = q ? workflows.filter((w) => w.name.toLowerCase().includes(q)) : workflows;
  const reviewIds = new Set(workflows.filter((w) => w.needsReview).map((w) => w.id));
  const rows = tab === 'review' ? matched.filter((w) => reviewIds.has(w.id)) : tab === 'deleted' ? [] : matched;
  const showFolders = tab === 'all' && !q;

  const onCreateOption = (id: string) => {
    setCreateOpen(false);
    if (id === 'scratch' || id === 'ai') onCreateBlank();
    else if (id === 'template') setShowNew(true);
    else cosmetic('Create Workflow', 'This creation path is cosmetic in demo mode.');
  };

  return (
    <div className="px-6 py-5">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">Workflows list</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => cosmetic('Create Folder', 'Folder creation is cosmetic in demo mode.')} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken">
            <FolderPlus size={15} className="text-ink-muted" /> Create Folder
          </button>
          <button onClick={onCreateBlank} className="flex items-center gap-1.5 rounded-lg border border-ai/30 bg-ai-soft px-3 py-2 text-sm font-semibold text-ai hover:bg-ai-soft/70">
            <Sparkles size={15} /> Build using AI
          </button>
          <div className="relative">
            <Button size="md" data-tour="automations.addButton" onClick={() => setCreateOpen((v) => !v)}>
              <Plus size={15} /> Create Workflow
            </Button>
            {createOpen && (
              <>
                <button className="fixed inset-0 z-20 cursor-default" aria-hidden onClick={() => setCreateOpen(false)} />
                <div className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
                  {CREATE_OPTIONS.map((o) => {
                    const Icon = o.icon;
                    return (
                      <button key={o.id} onClick={() => onCreateOption(o.id)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-sunken">
                        <Icon size={16} className="shrink-0 text-ink-muted" /> {o.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* tabs row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-line">
        <nav className="flex items-end gap-1">
          {([
            { id: 'all', label: 'All Workflows' },
            { id: 'review', label: `Needs Review (${reviewIds.size})` },
            { id: 'deleted', label: 'Deleted' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={cx('relative -mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors', tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
          <button onClick={() => cosmetic('New Smart List', 'Smart lists are cosmetic in demo mode.')} className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-ink-muted hover:text-ink">
            <Plus size={14} /> New Smart List
          </button>
        </nav>
        <button onClick={() => cosmetic('Customize List', 'Column customization is cosmetic in demo mode.')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink">
          <SlidersHorizontal size={15} /> Customize List
        </button>
      </div>

      {/* toolbar row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => cosmetic('Advanced Filters', 'Filtering is cosmetic in demo mode.')} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken">
          <Filter size={15} className="text-ink-muted" /> Advanced Filters
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => cosmetic('Recently viewed', 'Demo only.')} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="Recently viewed"><History size={16} /></button>
          <button onClick={() => cosmetic('History', 'Demo only.')} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="History"><Clock size={16} /></button>
          <button onClick={() => cosmetic('List view', 'Demo only.')} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-sunken" aria-label="List view"><List size={16} /></button>
          <div className="flex h-9 w-56 items-center gap-2 rounded-lg border border-line px-3">
            <Search size={15} className="shrink-0 text-ink-subtle" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle" aria-label="Search workflows" />
          </div>
        </div>
      </div>

      {/* breadcrumb */}
      <p className="mt-3 text-sm font-medium text-ink-muted">Home</p>

      {/* table */}
      <div data-tour="automations.list" className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="w-10 px-4 py-3">
                <span className="flex items-center gap-1">
                  <input type="checkbox" className="h-4 w-4 rounded border-line" aria-label="Select all" onChange={() => cosmetic('Select all', 'Demo only.')} />
                  <ChevronDown size={14} className="text-ink-subtle" />
                </span>
              </th>
              {['Name', 'Status', 'Total Enrolled', 'Active Enrolled', 'Last Updated', 'Created On'].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{h}</th>
              ))}
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <span className="inline-flex items-center gap-1">Stats <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-ink-subtle text-[8px]">i</span></span>
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {/* folders */}
            {showFolders && FOLDERS.map((f) => (
              <tr key={f.id} className="border-b border-line/70 hover:bg-surface-sunken">
                <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 rounded border-line" aria-label={`Select ${f.name}`} onChange={() => cosmetic('Selected', 'Demo only.')} /></td>
                <td className="px-4 py-4">
                  <button onClick={() => cosmetic(f.name, 'Folder browsing is cosmetic in demo mode.')} className="flex items-center gap-2.5 text-left">
                    <Folder size={18} className="shrink-0 text-ink-muted" />
                    <span className="font-medium text-ink">{f.name}</span>
                  </button>
                </td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
                <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{f.updated}</td>
                <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{f.created}</td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4 text-right">
                  <RowMenu open={menuId === f.id} onOpen={() => setMenuId(f.id)} onClose={() => setMenuId(null)} onAction={(a) => cosmetic(`${a} folder`, 'Demo only.')} />
                </td>
              </tr>
            ))}

            {/* workflows */}
            {rows.map((wf) => {
              const ts = demoTimestamps(wf.id);
              const active = wf.activeEnrolled ?? demoActiveEnrolled(wf.id, wf.enrolled);
              const updated = wf.lastUpdatedAt ?? ts.updated;
              const created = wf.createdAt ?? ts.created;
              return (
                <tr key={wf.id} data-tour="automations.row" className="group border-b border-line/70 hover:bg-surface-sunken">
                  <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 rounded border-line" aria-label={`Select ${wf.name}`} onChange={() => cosmetic('Selected', 'Demo only.')} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => onOpenWorkflow(wf)} className="flex items-center gap-1.5 text-left">
                        <span className="font-medium text-ink group-hover:text-brand">{wf.name}</span>
                        <ExternalLink size={13} className="shrink-0 text-ink-subtle" />
                        {isShowcaseWorkflow(wf.id) && <ShowcaseBadge />}
                      </button>
                      {wf.category && <span className="text-xs text-ink-subtle">{wf.category}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusPill status={wf.status} /></td>
                  <td className="px-4 py-4">
                    <button onClick={() => cosmetic('Enrollment History', 'Opening enrollment is cosmetic here.')} className="font-semibold text-brand hover:underline">{wf.enrolled.toLocaleString()}</button>
                  </td>
                  <td className="px-4 py-4 text-ink-muted">{active}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{updated}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{created}</td>
                  <td className="px-4 py-4"><WorkflowStats id={wf.id} trigger={wf.trigger} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onOpenWorkflow(wf)} className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface hover:text-brand" aria-label={`Open ${wf.name}`}>
                        <ChevronRight size={16} />
                      </button>
                      <RowMenu open={menuId === wf.id} onOpen={() => setMenuId(wf.id)} onClose={() => setMenuId(null)} onAction={(a) => { if (a === 'Edit') onOpenWorkflow(wf); else cosmetic(`${a} workflow`, 'Demo only.'); }} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && !showFolders && (
              <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-ink-subtle">{tab === 'deleted' ? 'No deleted workflows.' : 'No workflows in this view.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <NewWorkflowModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}
