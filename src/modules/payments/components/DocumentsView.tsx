/**
 * DocumentsView — the "Documents & Contracts" product surface under Payments.
 * Three internal tabs: Documents (the contract list with status filters),
 * Templates (reusable document templates), and Public Documents (shareable
 * public links / content library). Hosts the full-screen DocumentEditor.
 *
 * All data is the module-local DEMO_DOCUMENTS / DOCUMENT_TEMPLATES /
 * PUBLIC_DOCUMENTS fixtures — demo-safe, fictional, nothing networked.
 */

import { useMemo, useState } from 'react';
import { Plus, FileText, Upload, LayoutTemplate, Library, Link2, ExternalLink, Pencil, Copy } from 'lucide-react';
import { Button, Tabs, Badge } from '@/components/ui/primitives';
import { SimpleTable, type Column } from '@/components/tables/SimpleTable';
import { useStore } from '@/store/useStore';
import { money, dateLabel } from '@/utils';
import {
  SummaryCard,
  SearchInput,
  Dropdown,
  ActionMenu,
  DocStatusBadge,
  ChevronDown,
} from './ui';
import { DocumentEditor } from './DocumentEditor';
import {
  DEMO_DOCUMENTS, type DemoDocument,
  DOCUMENT_TEMPLATES, type DocumentTemplate,
  PUBLIC_DOCUMENTS, type PublicDocument,
} from '../data';

type Inner = 'documents' | 'templates' | 'public';

export function DocumentsView() {
  const pushToast = useStore((s) => s.pushToast);
  const [inner, setInner] = useState<Inner>('documents');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState('Untitled Document');

  function openEditor(title: string) {
    setEditorTitle(title);
    setEditorOpen(true);
  }

  const docCount = (s: string) => DEMO_DOCUMENTS.filter((d) => d.status === s).length;
  const waitingValue = DEMO_DOCUMENTS.filter((d) => d.status === 'waiting').reduce((a, d) => a + d.value, 0);
  const completedValue = DEMO_DOCUMENTS.filter((d) => d.status === 'completed').reduce((a, d) => a + d.value, 0);

  const filteredDocs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DEMO_DOCUMENTS.filter((d) => {
      if (status !== 'all' && d.status !== status) return false;
      if (!needle) return true;
      return d.title.toLowerCase().includes(needle) || d.customer.toLowerCase().includes(needle);
    });
  }, [q, status]);

  const statusTabs = [
    { id: 'all', label: 'All', count: DEMO_DOCUMENTS.length },
    { id: 'draft', label: 'Draft', count: docCount('draft') },
    { id: 'waiting', label: 'Waiting', count: docCount('waiting') },
    { id: 'completed', label: 'Completed', count: docCount('completed') },
    { id: 'payments', label: 'Payments', count: docCount('payments') },
    { id: 'archived', label: 'Archived', count: docCount('archived') },
  ];

  const docCols: Column<DemoDocument>[] = [
    { key: 'title', header: 'Document', render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><FileText size={15} /></span>
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{r.title}</div>
          <div className="text-[11px] text-ink-muted">{r.kind}</div>
        </div>
      </div>
    ) },
    { key: 'customer', header: 'Customer', render: (r) => r.customer },
    { key: 'status', header: 'Status', render: (r) => <DocStatusBadge status={r.status} /> },
    { key: 'created', header: 'Created', render: (r) => <span className="text-ink-muted">{dateLabel(r.createdAt)}</span> },
    { key: 'expires', header: 'Expires', render: (r) => <span className="text-ink-muted">{r.expiresAt ? dateLabel(r.expiresAt) : '—'}</span> },
    { key: 'value', header: 'Value', className: 'text-right', render: (r) => <span className="font-semibold">{r.value ? money(r.value) : '—'}</span> },
    { key: 'recipients', header: 'Recipients', render: (r) => <RecipientProgress done={r.completedRecipients} total={r.recipients} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'open', label: 'Open in editor', icon: <Pencil size={15} />, onClick: () => openEditor(r.title) },
            { id: 'send', label: 'Send for signature', onClick: () => pushToast({ title: 'Sent for signature', description: `${r.title} sent to ${r.customer} (demo).`, variant: 'success' }) },
            { id: 'dup', label: 'Duplicate', icon: <Copy size={15} />, onClick: () => pushToast({ title: 'Duplicated', description: `Copy of “${r.title}” created (demo).`, variant: 'success' }) },
            { id: 'd', label: '', divider: true },
            { id: 'arch', label: 'Archive', danger: true, onClick: () => pushToast({ title: 'Archived', description: `${r.title} archived (demo).`, variant: 'info' }) },
          ]}
        />
      ),
    },
  ];

  const tplCols: Column<DocumentTemplate>[] = [
    { key: 'name', header: 'Template', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'kind', header: 'Type', render: (r) => <Badge tone="neutral">{r.kind}</Badge> },
    { key: 'pages', header: 'Pages', render: (r) => <span className="text-ink-muted">{r.pages}</span> },
    { key: 'fields', header: 'Fields', render: (r) => <span className="text-ink-muted">{r.fields}</span> },
    { key: 'uses', header: 'Times used', render: (r) => <span className="text-ink-muted">{r.uses}</span> },
    { key: 'updated', header: 'Updated', render: (r) => <span className="text-ink-muted">{dateLabel(r.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'use', label: 'Use template', onClick: () => openEditor(r.name) },
            { id: 'edit', label: 'Edit template', icon: <Pencil size={15} />, onClick: () => openEditor(r.name) },
            { id: 'dup', label: 'Duplicate', icon: <Copy size={15} />, onClick: () => pushToast({ title: 'Duplicated', description: `Copy of “${r.name}” created (demo).`, variant: 'success' }) },
          ]}
        />
      ),
    },
  ];

  const pubCols: Column<PublicDocument>[] = [
    { key: 'name', header: 'Public document', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: 'kind', header: 'Type', render: (r) => <Badge tone="neutral">{r.kind}</Badge> },
    { key: 'url', header: 'Link', render: (r) => <span className="inline-flex items-center gap-1.5 text-ink-muted"><Link2 size={13} /> {r.url}</span> },
    { key: 'responses', header: 'Responses', render: (r) => <span className="text-ink-muted">{r.responses}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'live' ? 'good' : 'neutral'}>{r.status === 'live' ? 'Live' : 'Paused'}</Badge> },
    { key: 'updated', header: 'Updated', render: (r) => <span className="text-ink-muted">{dateLabel(r.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <ActionMenu
          items={[
            { id: 'copy', label: 'Copy link', icon: <Copy size={15} />, onClick: () => pushToast({ title: 'Link copied', description: r.url, variant: 'success' }) },
            { id: 'open', label: 'Open public page', icon: <ExternalLink size={15} />, onClick: () => pushToast({ title: 'Opening preview', description: `${r.name} (demo).`, variant: 'info' }) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* header + New */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Documents &amp; Contracts</h2>
          <p className="text-sm text-ink-muted">Proposals, agreements, and e-signature documents.</p>
        </div>
        <div className="inline-flex">
          <Button className="rounded-r-none" onClick={() => openEditor('Untitled Document')}>
            <Plus size={15} /> New Document
          </Button>
          <Dropdown
            align="right"
            items={[
              { id: 'new', label: 'New Document', icon: <FileText size={15} />, onClick: () => openEditor('Untitled Document') },
              { id: 'pdf', label: 'Upload PDF', icon: <Upload size={15} />, onClick: () => pushToast({ title: 'Upload a PDF', description: 'Drag a PDF to turn it into a signable document (demo).', variant: 'info' }) },
              { id: 'tpl', label: 'Use Template', icon: <LayoutTemplate size={15} />, onClick: () => setInner('templates') },
              { id: 'lib', label: 'Import from Library', icon: <Library size={15} />, onClick: () => pushToast({ title: 'Content library', description: 'Pick a document from the shared library (demo).', variant: 'info' }) },
            ]}
            trigger={({ toggle }) => (
              <Button variant="primary" className="rounded-l-none border-l border-brand-fg/25 px-2" onClick={toggle} aria-label="More create options">
                <ChevronDown size={15} />
              </Button>
            )}
          />
        </div>
      </div>

      {/* inner tabs */}
      <Tabs
        tabs={[
          { id: 'documents', label: 'Documents', count: DEMO_DOCUMENTS.length },
          { id: 'templates', label: 'Templates', count: DOCUMENT_TEMPLATES.length },
          { id: 'public', label: 'Public Documents', count: PUBLIC_DOCUMENTS.length },
        ]}
        active={inner}
        onChange={(id) => setInner(id as Inner)}
      />

      {inner === 'documents' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Out for signature" value={docCount('waiting')} sub={money(waitingValue)} accent="warn" active={status === 'waiting'} onClick={() => setStatus('waiting')} />
            <SummaryCard label="Completed" value={docCount('completed')} sub={money(completedValue)} accent="good" active={status === 'completed'} onClick={() => setStatus('completed')} />
            <SummaryCard label="Drafts" value={docCount('draft')} sub="in progress" accent="neutral" active={status === 'draft'} onClick={() => setStatus('draft')} />
            <SummaryCard label="All documents" value={DEMO_DOCUMENTS.length} sub="this workspace" accent="brand" active={status === 'all'} onClick={() => setStatus('all')} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs variant="pill" tabs={statusTabs} active={status} onChange={setStatus} />
            <SearchInput value={q} onChange={setQ} placeholder="Search documents…" className="w-56" />
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card" data-tour="payments.documentList">
            <SimpleTable<DemoDocument> columns={docCols} rows={filteredDocs} onRowClick={(r) => openEditor(r.title)} empty="No documents match your filters." />
          </div>
          <p className="text-xs text-ink-subtle">
            Showing {filteredDocs.length} document{filteredDocs.length === 1 ? '' : 's'}
            {status !== 'all' && ` · ${status}`}
          </p>
        </>
      )}

      {inner === 'templates' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <SimpleTable<DocumentTemplate> columns={tplCols} rows={DOCUMENT_TEMPLATES} onRowClick={(r) => openEditor(r.name)} />
        </div>
      )}

      {inner === 'public' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <SimpleTable<PublicDocument> columns={pubCols} rows={PUBLIC_DOCUMENTS} />
        </div>
      )}

      <DocumentEditor open={editorOpen} onClose={() => setEditorOpen(false)} initialTitle={editorTitle} />
    </div>
  );
}

function RecipientProgress({ done, total }: { done: number; total: number }) {
  const pctDone = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
        <div className={done >= total ? 'h-full bg-good' : 'h-full bg-brand'} style={{ width: `${pctDone}%` }} />
      </div>
      <span className="text-[11px] text-ink-muted">{done}/{total}</span>
    </div>
  );
}
