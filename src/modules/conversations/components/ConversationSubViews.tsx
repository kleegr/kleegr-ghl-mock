import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  Inbox,
  Link2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import type { SubNavTab } from '../utils';
import {
  useConversationWorkspaceStore,
  type ConversationSnippet,
  type ConversationSnippetFolder,
  type ConversationTriggerLink,
  type ManualAction,
  type SlaChannelName,
  type SlaUnit,
} from '../conversationWorkspaceState';

const inputClass =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10';
const textAreaClass = `${inputClass} h-28 resize-y py-2`;
const tableHeadClass = 'px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-subtle';
const tableCellClass = 'border-t border-line px-4 py-3 text-[13px] text-ink';

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>}
    </label>
  );
}

function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-surface px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-ink-muted">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-ink-subtle focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
      <Search size={15} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={13} /></button>}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
    >
      <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}

function ConfirmDelete({
  open,
  title,
  description,
  onClose,
  onDelete,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onDelete}>Delete</Button></>}>
      <p className="text-sm leading-6 text-ink-muted">{description}</p>
    </Modal>
  );
}

export function ConversationSubView({ tab, onNavigate }: { tab: Exclude<SubNavTab, 'Conversations'>; onNavigate: (tab: SubNavTab) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken">
      {tab === 'Manual Actions' && <ManualActionsView />}
      {tab === 'Snippets' && <SnippetsView />}
      {tab === 'Trigger Links' && <TriggerLinksView />}
      {tab === 'Analytics' && <AnalyticsView onNavigate={onNavigate} />}
      {tab === 'Settings' && <SlaSettingsView />}
    </div>
  );
}

/* ───────────────────────────── Manual Actions ─────────────────────────── */

function ManualActionsView() {
  const actions = useConversationWorkspaceStore((state) => state.manualActions);
  const addAction = useConversationWorkspaceStore((state) => state.addManualAction);
  const updateAction = useConversationWorkspaceStore((state) => state.updateManualAction);
  const deleteAction = useConversationWorkspaceStore((state) => state.deleteManualAction);
  const completeActions = useConversationWorkspaceStore((state) => state.completeManualActions);
  const contacts = useStore((state) => state.contacts);
  const users = useStore((state) => state.users);
  const pushToast = useStore((state) => state.pushToast);
  const [query, setQuery] = useState('');
  const [workflow, setWorkflow] = useState('All workflows');
  const [assignee, setAssignee] = useState('All assignees');
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'All'>('Pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ManualAction | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ManualAction | null>(null);
  const [startOpen, setStartOpen] = useState(false);

  const contactName = (id: string) => {
    const contact = contacts.find((item) => item.id === id);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Demo Contact';
  };
  const workflows = useMemo(() => Array.from(new Set(actions.map((item) => item.workflow))).sort(), [actions]);
  const assignees = useMemo(() => Array.from(new Set(actions.map((item) => item.assignedTo))).sort(), [actions]);
  const userNames = useMemo(() => users.map((item) => item.name), [users]);
  const filtered = actions.filter((item) => {
    const needle = query.toLowerCase();
    return (status === 'All' || item.status === status)
      && (workflow === 'All workflows' || item.workflow === workflow)
      && (assignee === 'All assignees' || item.assignedTo === assignee)
      && (!needle || [contactName(item.contactId), item.workflow, item.type, item.instructions].some((value) => value.toLowerCase().includes(needle)));
  });
  const selectedPending = Array.from(selected).filter((id) => actions.some((item) => item.id === id && item.status === 'Pending'));
  const allChecked = filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  const saveAction = (value: Omit<ManualAction, 'id' | 'dateAdded' | 'status'> & { status?: ManualAction['status'] }) => {
    if (editing && editing !== 'new') updateAction(editing.id, value);
    else addAction(value);
    pushToast({ title: editing === 'new' ? 'Manual action added' : 'Manual action updated', description: 'Saved for this demo session.', variant: 'success' });
    setEditing(null);
  };

  const runSelected = () => {
    completeActions(selectedPending);
    setSelected(new Set());
    setStartOpen(false);
    pushToast({ title: `${selectedPending.length} manual action${selectedPending.length === 1 ? '' : 's'} completed`, description: 'The workflow queue was updated for this demo session.', variant: 'success' });
  };

  return (
    <>
      <PageIntro
        title="Manual Actions"
        description="Complete tasks that require you to manually place calls or send SMS messages before a workflow can continue."
        actions={<><Button variant="secondary" onClick={() => setEditing('new')}><Plus size={14} /> Add action</Button><Button disabled={selectedPending.length === 0} onClick={() => setStartOpen(true)}><Zap size={14} /> Let’s Start {selectedPending.length > 0 && `(${selectedPending.length})`}</Button></>}
      />
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <Card className="overflow-hidden">
          <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[minmax(180px,1fr)_190px_190px_140px]">
            <SearchBox value={query} onChange={setQuery} placeholder="Search contacts or workflows" />
            <select className={inputClass} value={workflow} onChange={(event) => setWorkflow(event.target.value)} aria-label="Select workflow"><option>All workflows</option>{workflows.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={inputClass} value={assignee} onChange={(event) => setAssignee(event.target.value)} aria-label="Select assignee"><option>All assignees</option>{assignees.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Select status"><option>Pending</option><option>Completed</option><option>All</option></select>
          </div>
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="bg-surface-sunken"><tr><th className="w-12 px-4 py-2.5"><input type="checkbox" checked={allChecked} onChange={(event) => setSelected((current) => { const next = new Set(current); filtered.forEach((item) => event.target.checked ? next.add(item.id) : next.delete(item.id)); return next; })} aria-label="Select all visible manual actions" /></th><th className={tableHeadClass}>Contacts</th><th className={tableHeadClass}>Workflow</th><th className={tableHeadClass}>Assigned To</th><th className={tableHeadClass}>Type</th><th className={tableHeadClass}>Status</th><th className={tableHeadClass}>Date Added</th><th className="w-24" /></tr></thead>
                <tbody>{filtered.map((item) => <tr key={item.id} className="hover:bg-surface-sunken/70"><td className={tableCellClass}><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(item.id) : next.delete(item.id); return next; })} aria-label={`Select ${contactName(item.contactId)}`} /></td><td className={tableCellClass}><div className="font-semibold">{contactName(item.contactId)}</div><div className="mt-0.5 max-w-xs truncate text-[11px] text-ink-muted">{item.instructions}</div></td><td className={tableCellClass}>{item.workflow}</td><td className={tableCellClass}>{item.assignedTo}</td><td className={tableCellClass}>{item.type === 'Call' ? <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-brand" /> Call</span> : <span className="inline-flex items-center gap-1.5"><MessageSquare size={13} className="text-good" /> SMS</span>}</td><td className={tableCellClass}><Badge tone={item.status === 'Completed' ? 'good' : 'warn'}>{item.status}</Badge></td><td className={tableCellClass}>{dateTime(item.dateAdded)}</td><td className={tableCellClass}><div className="flex justify-end"><button type="button" onClick={() => setEditing(item)} className="rounded-md p-1.5 text-ink-subtle hover:bg-brand-soft hover:text-brand" aria-label={`Edit ${contactName(item.contactId)} action`}><Pencil size={14} /></button><button type="button" onClick={() => setDeleting(item)} className="rounded-md p-1.5 text-ink-subtle hover:bg-bad/10 hover:text-bad" aria-label={`Delete ${contactName(item.contactId)} action`}><Trash2 size={14} /></button></div></td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 size={30} className="text-good" />} title="Good Work! You have no pending tasks" body="Change the filters or add a demo action to keep exploring this workflow." action={<Button size="sm" onClick={() => setEditing('new')}>Add manual action</Button>} />
          )}
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-ink-muted"><span>{filtered.length} action{filtered.length === 1 ? '' : 's'}</span><div className="flex items-center gap-2"><Button size="xs" variant="secondary" disabled><ChevronLeft size={13} /> Previous</Button><Button size="xs" variant="secondary" disabled>Next <ChevronRight size={13} /></Button></div></div>
        </Card>
      </div>
      <ManualActionModal open={Boolean(editing)} item={editing === 'new' ? undefined : editing ?? undefined} contacts={contacts} users={userNames} workflows={workflows} onClose={() => setEditing(null)} onSave={saveAction} />
      <Modal open={startOpen} onClose={() => setStartOpen(false)} title="Start manual actions" footer={<><Button variant="secondary" onClick={() => setStartOpen(false)}>Cancel</Button><Button onClick={runSelected}><Check size={14} /> Complete selected</Button></>}>
        <div className="space-y-3"><div className="rounded-xl bg-brand-soft p-3 text-[13px] text-ink"><strong>{selectedPending.length} action{selectedPending.length === 1 ? '' : 's'}</strong> will be completed. Calls and SMS messages stay inside this fictional demo.</div>{actions.filter((item) => selectedPending.includes(item.id)).map((item) => <div key={item.id} className="flex items-start gap-3 rounded-lg border border-line p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-brand">{item.type === 'Call' ? <Phone size={15} /> : <MessageSquare size={15} />}</span><div><p className="text-[13px] font-bold text-ink">{contactName(item.contactId)} · {item.type}</p><p className="mt-0.5 text-[12px] text-ink-muted">{item.instructions}</p></div></div>)}</div>
      </Modal>
      <ConfirmDelete open={Boolean(deleting)} title="Delete manual action?" description="This removes the fictional task from the queue for the current demo session." onClose={() => setDeleting(null)} onDelete={() => { if (deleting) deleteAction(deleting.id); setDeleting(null); pushToast({ title: 'Manual action deleted', variant: 'success' }); }} />
    </>
  );
}

function ManualActionModal({ open, item, contacts, users, workflows, onClose, onSave }: { open: boolean; item?: ManualAction; contacts: ReturnType<typeof useStore.getState>['contacts']; users: string[]; workflows: string[]; onClose: () => void; onSave: (value: Omit<ManualAction, 'id' | 'dateAdded' | 'status'> & { status?: ManualAction['status'] }) => void }) {
  const [contactId, setContactId] = useState(item?.contactId ?? contacts[0]?.id ?? '');
  const [workflow, setWorkflow] = useState(item?.workflow ?? workflows[0] ?? 'New Lead Speed-to-Contact');
  const [assignedTo, setAssignedTo] = useState(item?.assignedTo ?? users[0] ?? 'Demo User');
  const [type, setType] = useState<ManualAction['type']>(item?.type ?? 'Call');
  const [status, setStatus] = useState<ManualAction['status']>(item?.status ?? 'Pending');
  const [instructions, setInstructions] = useState(item?.instructions ?? 'Reach out personally and record the outcome.');
  useEffect(() => { if (!open) return; setContactId(item?.contactId ?? contacts[0]?.id ?? ''); setWorkflow(item?.workflow ?? workflows[0] ?? 'New Lead Speed-to-Contact'); setAssignedTo(item?.assignedTo ?? users[0] ?? 'Demo User'); setType(item?.type ?? 'Call'); setStatus(item?.status ?? 'Pending'); setInstructions(item?.instructions ?? 'Reach out personally and record the outcome.'); }, [open, item?.id]);
  return <Modal open={open} onClose={onClose} title={item ? 'Edit manual action' : 'Add manual action'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="manual-action-form" disabled={!contactId || !workflow.trim() || !instructions.trim()}>Save</Button></>}><form id="manual-action-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ contactId, workflow: workflow.trim(), assignedTo, type, status, instructions: instructions.trim() }); }}><Field label="Contact"><select className={inputClass} value={contactId} onChange={(event) => setContactId(event.target.value)}>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select></Field><Field label="Workflow"><input className={inputClass} list="manual-workflows" value={workflow} onChange={(event) => setWorkflow(event.target.value)} /><datalist id="manual-workflows">{workflows.map((value) => <option key={value} value={value} />)}</datalist></Field><div className="grid grid-cols-2 gap-3"><Field label="Assigned To"><select className={inputClass} value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>{users.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Type"><select className={inputClass} value={type} onChange={(event) => setType(event.target.value as ManualAction['type'])}><option>Call</option><option>SMS</option></select></Field></div>{item && <Field label="Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as ManualAction['status'])}><option>Pending</option><option>Completed</option></select></Field>}<Field label="Instructions"><textarea className={textAreaClass} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></Field></form></Modal>;
}

/* ─────────────────────────────── Snippets ────────────────────────────── */

function SnippetsView() {
  const snippets = useConversationWorkspaceStore((state) => state.snippets);
  const folders = useConversationWorkspaceStore((state) => state.folders);
  const addSnippet = useConversationWorkspaceStore((state) => state.addSnippet);
  const updateSnippet = useConversationWorkspaceStore((state) => state.updateSnippet);
  const deleteSnippet = useConversationWorkspaceStore((state) => state.deleteSnippet);
  const addFolder = useConversationWorkspaceStore((state) => state.addFolder);
  const updateFolder = useConversationWorkspaceStore((state) => state.updateFolder);
  const deleteFolder = useConversationWorkspaceStore((state) => state.deleteFolder);
  const pushToast = useStore((state) => state.pushToast);
  const [tab, setTab] = useState<'snippets' | 'folders'>('snippets');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [snippetEditor, setSnippetEditor] = useState<ConversationSnippet | 'new' | null>(null);
  const [folderEditor, setFolderEditor] = useState<ConversationSnippetFolder | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'snippet' | 'folder'; id: string } | null>(null);
  const folderName = (id?: string) => folders.find((item) => item.id === id)?.name ?? '—';
  const filteredSnippets = snippets.filter((item) => !query || [item.name, item.body, folderName(item.folderId), item.type].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  const filteredFolders = folders.filter((item) => !query || item.name.toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil((tab === 'snippets' ? filteredSnippets.length : filteredFolders.length) / pageSize));
  const pageRows = (tab === 'snippets' ? filteredSnippets : filteredFolders).slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, query, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const saveSnippet = (value: Omit<ConversationSnippet, 'id' | 'updatedAt'>) => {
    if (snippetEditor && snippetEditor !== 'new') updateSnippet(snippetEditor.id, value);
    else addSnippet(value);
    setSnippetEditor(null);
    pushToast({ title: snippetEditor === 'new' ? 'Snippet created' : 'Snippet updated', description: 'It is available in the conversation composer for this demo session.', variant: 'success' });
  };
  const saveFolder = (name: string) => {
    if (folderEditor && folderEditor !== 'new') updateFolder(folderEditor.id, name);
    else addFolder({ name });
    setFolderEditor(null);
    pushToast({ title: folderEditor === 'new' ? 'Folder created' : 'Folder updated', variant: 'success' });
  };
  const bulkDelete = () => {
    selected.forEach((id) => deleteSnippet(id));
    pushToast({ title: `${selected.size} snippet${selected.size === 1 ? '' : 's'} deleted`, variant: 'success' });
    setSelected(new Set());
  };

  return <>
    <PageIntro title="Snippets" description="Create reusable text and email responses for faster, consistent conversations." actions={<><Button variant="secondary" onClick={() => setFolderEditor('new')}><Folder size={14} /> New Folder</Button><Button onClick={() => setSnippetEditor('new')}><Plus size={14} /> New Snippet</Button></>} />
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6"><Card className="overflow-hidden"><div className="flex items-center gap-6 border-b border-line px-4"><button type="button" onClick={() => setTab('snippets')} className={cx('relative py-3 text-[13px] font-bold', tab === 'snippets' ? 'text-brand' : 'text-ink-muted')}>All Snippets{tab === 'snippets' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}</button><button type="button" onClick={() => setTab('folders')} className={cx('relative py-3 text-[13px] font-bold', tab === 'folders' ? 'text-brand' : 'text-ink-muted')}>Folders{tab === 'folders' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}</button></div><div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="w-full max-w-md"><SearchBox value={query} onChange={setQuery} placeholder={tab === 'snippets' ? 'Search snippets' : 'Search folders'} /></div>{selected.size > 0 && tab === 'snippets' && <Button size="sm" variant="danger" onClick={bulkDelete}><Trash2 size={13} /> Delete {selected.size}</Button>}</div>
      {tab === 'snippets' ? <SnippetTable rows={pageRows as ConversationSnippet[]} selected={selected} setSelected={setSelected} folderName={folderName} onEdit={setSnippetEditor} onDelete={(id) => setDeleteTarget({ type: 'snippet', id })} onDuplicate={(item) => { addSnippet({ name: `${item.name} copy`, body: item.body, subject: item.subject, attachments: item.attachments ? [...item.attachments] : undefined, folderId: item.folderId, type: item.type }); pushToast({ title: 'Snippet duplicated', variant: 'success' }); }} /> : <FolderTable rows={pageRows as ConversationSnippetFolder[]} snippets={snippets} onEdit={setFolderEditor} onDelete={(id) => setDeleteTarget({ type: 'folder', id })} />}
      <Pagination page={page} totalPages={totalPages} pageSize={pageSize} count={tab === 'snippets' ? filteredSnippets.length : filteredFolders.length} onPage={setPage} onPageSize={setPageSize} />
    </Card></div>
    <SnippetModal open={Boolean(snippetEditor)} item={snippetEditor === 'new' ? undefined : snippetEditor ?? undefined} folders={folders} onClose={() => setSnippetEditor(null)} onSave={saveSnippet} />
    <FolderModal open={Boolean(folderEditor)} item={folderEditor === 'new' ? undefined : folderEditor ?? undefined} onClose={() => setFolderEditor(null)} onSave={saveFolder} />
    <ConfirmDelete open={Boolean(deleteTarget)} title={`Delete ${deleteTarget?.type ?? ''}?`} description={deleteTarget?.type === 'folder' ? 'The folder will be removed and its snippets will move to no folder. The snippets themselves will stay available.' : 'This snippet will be removed from the demo composer for the current session.'} onClose={() => setDeleteTarget(null)} onDelete={() => { if (!deleteTarget) return; deleteTarget.type === 'folder' ? deleteFolder(deleteTarget.id) : deleteSnippet(deleteTarget.id); setDeleteTarget(null); pushToast({ title: 'Deleted', description: 'Removed for this demo session.', variant: 'success' }); }} />
  </>;
}

function SnippetTable({ rows, selected, setSelected, folderName, onEdit, onDelete, onDuplicate }: { rows: ConversationSnippet[]; selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>>; folderName: (id?: string) => string; onEdit: (item: ConversationSnippet) => void; onDelete: (id: string) => void; onDuplicate: (item: ConversationSnippet) => void }) {
  const allChecked = rows.length > 0 && rows.every((item) => selected.has(item.id));
  if (!rows.length) return <EmptyState icon={<FileText size={30} />} title="No snippets found" body="Try another search or create a reusable response." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse"><thead className="bg-surface-sunken"><tr><th className="w-12 px-4 py-2.5"><input type="checkbox" checked={allChecked} onChange={(event) => setSelected((current) => { const next = new Set(current); rows.forEach((item) => event.target.checked ? next.add(item.id) : next.delete(item.id)); return next; })} aria-label="Select all visible snippets" /></th><th className={tableHeadClass}>Name</th><th className={tableHeadClass}>Body</th><th className={tableHeadClass}>Folder</th><th className={tableHeadClass}>Type</th><th className={tableHeadClass}>Date Updated</th><th className="w-28" /></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="hover:bg-surface-sunken/70"><td className={tableCellClass}><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(item.id) : next.delete(item.id); return next; })} aria-label={`Select ${item.name}`} /></td><td className={`${tableCellClass} font-semibold`}>{item.name}</td><td className={tableCellClass}><p className="max-w-lg truncate text-ink-muted">{item.body}</p></td><td className={tableCellClass}>{folderName(item.folderId)}</td><td className={tableCellClass}><Badge tone={item.type === 'Email' ? 'brand' : 'neutral'}>{item.type}</Badge></td><td className={tableCellClass}>{shortDate(item.updatedAt)}</td><td className={tableCellClass}><div className="flex justify-end"><button type="button" onClick={() => onDuplicate(item)} className="rounded p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-brand" aria-label={`Duplicate ${item.name}`} title="Duplicate"><Copy size={14} /></button><button type="button" onClick={() => onEdit(item)} className="rounded p-1.5 text-ink-subtle hover:bg-brand-soft hover:text-brand" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button><button type="button" onClick={() => onDelete(item.id)} className="rounded p-1.5 text-ink-subtle hover:bg-bad/10 hover:text-bad" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>;
}

function FolderTable({ rows, snippets, onEdit, onDelete }: { rows: ConversationSnippetFolder[]; snippets: ConversationSnippet[]; onEdit: (item: ConversationSnippetFolder) => void; onDelete: (id: string) => void }) {
  if (!rows.length) return <EmptyState icon={<Folder size={30} />} title="No folders found" body="Create a folder to organize related snippets." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse"><thead className="bg-surface-sunken"><tr><th className={tableHeadClass}>Folder Name</th><th className={tableHeadClass}>Snippets</th><th className={tableHeadClass}>Date Updated</th><th className="w-24" /></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="hover:bg-surface-sunken/70"><td className={`${tableCellClass} font-semibold`}><span className="inline-flex items-center gap-2"><Folder size={15} className="text-brand" />{item.name}</span></td><td className={tableCellClass}>{snippets.filter((snippet) => snippet.folderId === item.id).length}</td><td className={tableCellClass}>{shortDate(item.updatedAt)}</td><td className={tableCellClass}><div className="flex justify-end"><button type="button" onClick={() => onEdit(item)} className="rounded p-1.5 text-ink-subtle hover:text-brand" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button><button type="button" onClick={() => onDelete(item.id)} className="rounded p-1.5 text-ink-subtle hover:text-bad" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>;
}

function SnippetModal({ open, item, folders, onClose, onSave }: { open: boolean; item?: ConversationSnippet; folders: ConversationSnippetFolder[]; onClose: () => void; onSave: (value: Omit<ConversationSnippet, 'id' | 'updatedAt'>) => void }) {
  const pushToast = useStore((state) => state.pushToast);
  const [choosingType, setChoosingType] = useState(!item);
  const [name, setName] = useState(item?.name ?? '');
  const [body, setBody] = useState(item?.body ?? '');
  const [subject, setSubject] = useState(item?.subject ?? '');
  const [folderId, setFolderId] = useState(item?.folderId ?? '');
  const [type, setType] = useState<ConversationSnippet['type']>(item?.type ?? 'Text');
  const [attachments, setAttachments] = useState<string[]>(item?.attachments ?? []);
  const [attachmentDraft, setAttachmentDraft] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (!open) return;
    setChoosingType(!item);
    setName(item?.name ?? '');
    setBody(item?.body ?? '');
    setSubject(item?.subject ?? '');
    setFolderId(item?.folderId ?? '');
    setType(item?.type ?? 'Text');
    setAttachments(item?.attachments ?? []);
    setAttachmentDraft('');
    setTestRecipient('');
    setPreview(false);
  }, [open, item]);
  const appendBody = (value: string) => setBody((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${value}`);
  const chars = body.length;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const segments = Math.max(1, Math.ceil(chars / 160));
  const canSave = name.trim() && body.trim() && (type === 'Text' || subject.trim());
  const sendTest = () => {
    if (!testRecipient.trim()) return;
    pushToast({
      title: `${type} test simulated`,
      description: `Preview sent only inside the demo to ${testRecipient.trim()}.`,
      variant: 'success',
    });
  };
  const addAttachment = () => {
    if (!attachmentDraft.trim()) return;
    setAttachments((current) => Array.from(new Set([...current, attachmentDraft.trim()])).slice(0, 5));
    setAttachmentDraft('');
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit Snippet' : choosingType ? 'New Snippet' : `New ${type} Snippet`}
      size="lg"
      footer={choosingType ? <Button variant="secondary" onClick={onClose}>Cancel</Button> : <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="snippet-form" disabled={!canSave}>Save</Button></>}
    >
      {choosingType ? (
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <button type="button" onClick={() => { setType('Text'); setChoosingType(false); }} className="group rounded-2xl border border-line p-5 text-left transition hover:border-brand hover:bg-brand-soft">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><MessageSquare size={22} /></span>
            <span className="mt-4 block text-sm font-bold text-ink">Text</span>
            <span className="mt-1 block text-xs leading-5 text-ink-muted">Reusable SMS, WhatsApp, Telegram, Instagram, or Facebook response.</span>
          </button>
          <button type="button" onClick={() => { setType('Email'); setChoosingType(false); }} className="group rounded-2xl border border-line p-5 text-left transition hover:border-brand hover:bg-brand-soft">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Mail size={22} /></span>
            <span className="mt-4 block text-sm font-bold text-ink">Email</span>
            <span className="mt-1 block text-xs leading-5 text-ink-muted">Reusable subject, formatted body, attachments, test recipient, and preview.</span>
          </button>
        </div>
      ) : (
        <form
          id="snippet-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({
              name: name.trim(),
              body: body.trim(),
              subject: type === 'Email' ? subject.trim() : undefined,
              attachments: attachments.length ? attachments : undefined,
              folderId: folderId || undefined,
              type,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
            <Field label="Folder"><select className={inputClass} value={folderId} onChange={(event) => setFolderId(event.target.value)}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></Field>
          </div>
          {type === 'Email' && <Field label="Subject *"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Email subject" /></Field>}
          <Field label="Body *" hint="Merge fields and trigger links remain visible as demo tokens.">
            <div className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
              <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-sunken px-2 py-1.5">
                {type === 'Email' && <><button type="button" onClick={() => appendBody('**bold text**')} className="grid h-7 w-7 place-items-center rounded font-serif text-sm font-bold hover:bg-surface" aria-label="Insert bold text">B</button><button type="button" onClick={() => appendBody('_italic text_')} className="grid h-7 w-7 place-items-center rounded font-serif text-sm italic hover:bg-surface" aria-label="Insert italic text">I</button><button type="button" onClick={() => appendBody('__underlined text__')} className="grid h-7 w-7 place-items-center rounded font-serif text-sm underline hover:bg-surface" aria-label="Insert underlined text">U</button><span className="mx-1 h-5 w-px bg-line" /></>}
                <button type="button" onClick={() => appendBody('{{contact.first_name}}')} className="rounded px-2 py-1 text-[11px] font-semibold text-ink-muted hover:bg-surface">Merge field</button>
                <button type="button" onClick={() => appendBody('{{trigger_link.consultation_calendar}}')} className="rounded px-2 py-1 text-[11px] font-semibold text-ink-muted hover:bg-surface">Trigger link</button>
                <button type="button" onClick={() => appendBody('😊')} className="rounded px-2 py-1 text-sm hover:bg-surface" aria-label="Insert emoji">😊</button>
                {type === 'Email' && <button type="button" onClick={() => appendBody('[link text](https://demo.example.com)')} className="ml-auto rounded px-2 py-1 text-[11px] font-semibold text-brand hover:bg-brand-soft">Insert link</button>}
              </div>
              <textarea aria-label="Body *" className="h-44 w-full resize-y bg-transparent px-3 py-2 text-[13px] leading-6 text-ink outline-none" value={body} onChange={(event) => setBody(event.target.value)} />
              <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[10px] text-ink-subtle"><span>{chars} chars · {words} words · {segments} segment{segments === 1 ? '' : 's'}</span>{type === 'Text' && <span>Approx. cost ${(segments * 0.0079).toFixed(4)}</span>}</div>
            </div>
          </Field>
          <Field label="Attachment or file URL" hint="Files are represented by name only and are never uploaded."><div className="flex gap-2"><input aria-label="Attachment or file URL" className={inputClass} value={attachmentDraft} onChange={(event) => setAttachmentDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addAttachment(); } }} placeholder="proposal.pdf or https://…" /><Button variant="secondary" onClick={addAttachment}><Plus size={13} /> Add</Button></div>{attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{attachments.map((attachment) => <span key={attachment} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-1 text-[11px] text-ink-muted"><FileText size={11} />{attachment}<button type="button" onClick={() => setAttachments((current) => current.filter((value) => value !== attachment))} aria-label={`Remove ${attachment}`}><X size={11} /></button></span>)}</div>}</Field>
          <div className="grid gap-3 rounded-xl bg-surface-sunken p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <Field label={type === 'Email' ? 'Send test to email' : 'Send test to phone'}><input aria-label={type === 'Email' ? 'Send test to email' : 'Send test to phone'} className={inputClass} type={type === 'Email' ? 'email' : 'tel'} value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} placeholder={type === 'Email' ? 'demo@example.com' : '+1 (555) 010-0199'} /></Field>
            <Button variant="secondary" disabled={!testRecipient.trim()} onClick={sendTest}>Send Test</Button>
            <Button variant="secondary" onClick={() => setPreview((current) => !current)}>{preview ? 'Hide preview' : 'Preview'}</Button>
          </div>
          {preview && <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm"><div className="mx-auto max-w-sm overflow-hidden rounded-[24px] border-[6px] border-ink/80 bg-white"><div className="border-b border-line px-4 py-2 text-center text-[11px] font-bold text-ink">Demo Business</div><div className="p-4">{type === 'Email' && <p className="mb-3 border-b border-line pb-2 text-[13px] font-bold text-ink">{subject || 'Email subject'}</p>}<div className={cx('whitespace-pre-wrap text-[12px] leading-5 text-ink', type === 'Text' && 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-white')}>{body || 'Your snippet preview will appear here.'}</div>{attachments.length > 0 && <p className="mt-3 text-[10px] text-ink-muted">Attachments: {attachments.join(', ')}</p>}</div></div></div>}
        </form>
      )}
    </Modal>
  );
}

function FolderModal({ open, item, onClose, onSave }: { open: boolean; item?: ConversationSnippetFolder; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(item?.name ?? ''); useEffect(() => { if (open) setName(item?.name ?? ''); }, [open, item]);
  return <Modal open={open} onClose={onClose} title={item ? 'Edit Folder' : 'New Folder'} size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="folder-form" disabled={!name.trim()}>Save</Button></>}><form id="folder-form" onSubmit={(event) => { event.preventDefault(); onSave(name.trim()); }}><Field label="Folder name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field></form></Modal>;
}

function Pagination({ page, totalPages, pageSize, count, onPage, onPageSize }: { page: number; totalPages: number; pageSize: number; count: number; onPage: (page: number) => void; onPageSize: (size: number) => void }) {
  return <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-[12px] text-ink-muted sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span>Rows per page</span><select className="h-8 rounded-md border border-line bg-surface px-2" value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select><span>{count ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, count)} of ${count}` : '0 results'}</span></div><div className="flex items-center gap-2"><Button size="xs" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={13} /></Button><span className="font-semibold text-ink">Page {page} of {totalPages}</span><Button size="xs" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><ChevronRight size={13} /></Button></div></div>;
}

/* ───────────────────────────── Trigger Links ─────────────────────────── */

function TriggerLinksView() {
  const links = useConversationWorkspaceStore((state) => state.triggerLinks);
  const addLink = useConversationWorkspaceStore((state) => state.addTriggerLink);
  const updateLink = useConversationWorkspaceStore((state) => state.updateTriggerLink);
  const deleteLink = useConversationWorkspaceStore((state) => state.deleteTriggerLink);
  const simulateClick = useConversationWorkspaceStore((state) => state.simulateTriggerClick);
  const pushToast = useStore((state) => state.pushToast);
  const [tab, setTab] = useState<'links' | 'analyze'>('links');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editor, setEditor] = useState<ConversationTriggerLink | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ConversationTriggerLink | null>(null);
  const [startDate, setStartDate] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 30); return date.toISOString().slice(0, 10); });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const rangeStart = new Date(`${startDate}T00:00:00`).getTime();
  const rangeEnd = new Date(`${endDate}T23:59:59`).getTime();
  const rangeDays = Math.max(1, Math.round((rangeEnd - rangeStart) / 86_400_000) + 1);
  const analysisFactor = Math.max(0.03, Math.min(1, rangeDays / 30));
  const filtered = links.filter((item) => {
    const matchesQuery = !query || [item.name, item.destinationUrl, item.slug].some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const changedAt = new Date(item.updatedAt).getTime();
    return matchesQuery && (tab === 'links' || (changedAt >= rangeStart && changedAt <= rangeEnd));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [query, tab, pageSize]);
  const copyKey = async (item: ConversationTriggerLink) => {
    const token = `{{trigger_link.${item.slug}}}`;
    try {
      await navigator.clipboard.writeText(token);
      pushToast({ title: 'Link key copied', description: token, variant: 'success' });
    } catch {
      pushToast({ title: 'Copy unavailable', description: `Select and copy this key: ${token}`, variant: 'info' });
    }
  };
  const save = (value: Pick<ConversationTriggerLink, 'name' | 'destinationUrl' | 'slug'>) => {
    if (editor && editor !== 'new') updateLink(editor.id, value);
    else addLink(value);
    setEditor(null);
    pushToast({ title: editor === 'new' ? 'Trigger link created' : 'Trigger link updated', description: 'Saved for this demo session.', variant: 'success' });
  };
  return <>
    <PageIntro title="Trigger Links" description="Track clicks from reusable links inserted into messages, workflows, and snippets." actions={<Button onClick={() => setEditor('new')}><Plus size={14} /> Add Link</Button>} />
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6"><Card className="overflow-hidden"><div className="flex items-center gap-6 border-b border-line px-4"><button type="button" onClick={() => setTab('links')} className={cx('relative py-3 text-[13px] font-bold', tab === 'links' ? 'text-brand' : 'text-ink-muted')}>Link{tab === 'links' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}</button><button type="button" onClick={() => setTab('analyze')} className={cx('relative py-3 text-[13px] font-bold', tab === 'analyze' ? 'text-brand' : 'text-ink-muted')}>Analyze{tab === 'analyze' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}</button></div>
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div className="w-full max-w-md"><SearchBox value={query} onChange={setQuery} placeholder="Search trigger links" /></div>{tab === 'analyze' && <div className="flex flex-wrap items-center gap-2"><input type="date" className={inputClass} value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Start date" /><span className="text-xs text-ink-muted">to</span><input type="date" className={inputClass} value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="End date" /><Button size="sm" variant="secondary" onClick={() => pushToast({ title: 'Analytics refreshed', description: `Showing ${startDate} through ${endDate}.`, variant: 'success' })}><RefreshCw size={13} /> Refresh</Button></div>}</div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse"><thead className="bg-surface-sunken"><tr>{tab === 'analyze' && <th className={`${tableHeadClass} w-16`}>Index</th>}<th className={tableHeadClass}>Name</th>{tab === 'links' ? <><th className={tableHeadClass}>Link URL</th><th className={tableHeadClass}>Link Key</th><th className={tableHeadClass}>Date Added</th><th className="w-32" /></> : <><th className={tableHeadClass}>Clicks</th><th className={tableHeadClass}>Unique Clicks</th><th className={tableHeadClass}>Conversion</th><th className="w-28" /></>}</tr></thead><tbody>{rows.map((item, index) => { const rangeClicks = Math.round(item.clicks * analysisFactor); const rangeUnique = Math.min(rangeClicks, Math.round(item.uniqueClicks * analysisFactor)); return <tr key={item.id} className="hover:bg-surface-sunken/70">{tab === 'analyze' && <td className={tableCellClass}>{(page - 1) * pageSize + index + 1}</td>}<td className={`${tableCellClass} font-semibold`}>{item.name}</td>{tab === 'links' ? <><td className={tableCellClass}><a href={item.destinationUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-sm items-center gap-1 truncate text-brand hover:underline">{item.destinationUrl}<ExternalLink size={12} /></a></td><td className={tableCellClass}><button type="button" onClick={() => copyKey(item)} className="inline-flex items-center gap-1.5 rounded-md bg-surface-sunken px-2 py-1 font-mono text-[11px] text-ink-muted hover:text-brand"><span>{`{{trigger_link.${item.slug}}}`}</span><Copy size={12} /></button></td><td className={tableCellClass}>{shortDate(item.updatedAt)}</td><td className={tableCellClass}><div className="flex justify-end"><button type="button" onClick={() => { simulateClick(item.id); pushToast({ title: 'Demo click recorded', description: `${item.name} analytics increased by one.`, variant: 'success' }); }} className="rounded p-1.5 text-ink-subtle hover:text-brand" title="Simulate click" aria-label={`Simulate click for ${item.name}`}><ExternalLink size={14} /></button><button type="button" onClick={() => setEditor(item)} className="rounded p-1.5 text-ink-subtle hover:text-brand" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button><button type="button" onClick={() => setDeleting(item)} className="rounded p-1.5 text-ink-subtle hover:text-bad" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div></td></> : <><td className={`${tableCellClass} font-bold`}>{rangeClicks.toLocaleString()}</td><td className={tableCellClass}>{rangeUnique.toLocaleString()}</td><td className={tableCellClass}>{rangeClicks ? `${Math.round(rangeUnique / rangeClicks * 100)}%` : '—'}</td><td className={tableCellClass}><Button size="xs" variant="secondary" onClick={() => { simulateClick(item.id); pushToast({ title: 'Demo click recorded', variant: 'success' }); }}><Plus size={12} /> Fake click</Button></td></>}</tr>; })}</tbody></table></div> : <EmptyState icon={<Link2 size={30} />} title="No trigger links found" body="Try another search or add a fictional trackable link." action={<Button size="sm" onClick={() => setEditor('new')}>Add Link</Button>} />}
      <Pagination page={page} totalPages={totalPages} pageSize={pageSize} count={filtered.length} onPage={setPage} onPageSize={setPageSize} />
    </Card></div>
    <TriggerLinkModal open={Boolean(editor)} item={editor === 'new' ? undefined : editor ?? undefined} onClose={() => setEditor(null)} onSave={save} />
    <ConfirmDelete open={Boolean(deleting)} title="Delete trigger link?" description="The fictional link and its click history will be removed for this demo session." onClose={() => setDeleting(null)} onDelete={() => { if (deleting) deleteLink(deleting.id); setDeleting(null); pushToast({ title: 'Trigger link deleted', variant: 'success' }); }} />
  </>;
}

function TriggerLinkModal({ open, item, onClose, onSave }: { open: boolean; item?: ConversationTriggerLink; onClose: () => void; onSave: (value: Pick<ConversationTriggerLink, 'name' | 'destinationUrl' | 'slug'>) => void }) {
  const [name, setName] = useState(item?.name ?? ''); const [url, setUrl] = useState(item?.destinationUrl ?? 'https://demo.example.com/'); const [slug, setSlug] = useState(item?.slug ?? '');
  useEffect(() => { if (!open) return; setName(item?.name ?? ''); setUrl(item?.destinationUrl ?? 'https://demo.example.com/'); setSlug(item?.slug ?? ''); }, [open, item]);
  const normalizedSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return <Modal open={open} onClose={onClose} title={item ? 'Edit Link' : 'Add Link'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="trigger-link-form" disabled={!name.trim() || !/^https?:\/\//i.test(url) || !normalizedSlug(slug || name)}>Save</Button></>}><form id="trigger-link-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim(), destinationUrl: url.trim(), slug: normalizedSlug(slug || name) }); }}><Field label="Name"><input className={inputClass} value={name} onChange={(event) => { setName(event.target.value); if (!item && !slug) setSlug(normalizedSlug(event.target.value)); }} autoFocus required /></Field><Field label="Link URL"><input className={inputClass} type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></Field><Field label="Link Key" hint={`Use in messages as {{trigger_link.${normalizedSlug(slug || name) || 'link_key'}}}`}><input className={inputClass} value={slug} onChange={(event) => setSlug(normalizedSlug(event.target.value))} placeholder="automatically_generated" /></Field></form></Modal>;
}

/* ─────────────────────────────── Analytics ───────────────────────────── */

function AnalyticsView({ onNavigate }: { onNavigate: (tab: SubNavTab) => void }) {
  const settings = useConversationWorkspaceStore((state) => state.settings);
  const conversations = useStore((state) => state.conversations);
  const messages = useStore((state) => state.messages);
  const channels = useMemo(() => {
    const counts = new Map<string, { conversations: number; replies: number }>();
    conversations.forEach((conversation) => counts.set(conversation.channel, { conversations: (counts.get(conversation.channel)?.conversations ?? 0) + 1, replies: counts.get(conversation.channel)?.replies ?? 0 }));
    messages.filter((message) => message.direction === 'outbound').forEach((message) => { const current = counts.get(message.channel) ?? { conversations: 0, replies: 0 }; counts.set(message.channel, { ...current, replies: current.replies + 1 }); });
    return Array.from(counts.entries()).sort((a, b) => b[1].conversations - a[1].conversations);
  }, [conversations, messages]);
  return <>
    <PageIntro title="Analytics" description="Measure how quickly the team responds and where conversations approach or exceed their service-level targets." />
    <div className="border-b border-line bg-surface px-6"><button type="button" className="relative py-3 text-[13px] font-bold text-brand">SLA performance<span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" /></button></div>
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-5"><h3 className="text-base font-bold text-ink">SLA overview</h3><p className="mt-1 text-[13px] text-ink-muted">Track due-soon and overdue conversations based on the rules in SLA Settings.</p></div>
      {!settings.enabled ? <Card><EmptyState icon={<Clock3 size={34} className="text-brand" />} title="Turn on SLA settings to see performance" body="Once SLA tracking is enabled, this page will show response targets, due-soon conversations, and overdue trends." action={<Button onClick={() => onNavigate('Settings')}><Settings2 size={14} /> Turn on SLA settings</Button>} /></Card> : <SlaDashboard channels={channels} overdueMinutes={settings.overdueUnit === 'hours' ? settings.overdueValue * 60 : settings.overdueUnit === 'days' ? settings.overdueValue * 1440 : settings.overdueValue} />}
    </div>
  </>;
}

function SlaDashboard({ channels, overdueMinutes }: { channels: Array<[string, { conversations: number; replies: number }]>; overdueMinutes: number }) {
  const total = channels.reduce((sum, [, value]) => sum + value.conversations, 0);
  const overdue = Math.max(1, Math.round(total * 0.08));
  const dueSoon = Math.max(1, Math.round(total * 0.13));
  const met = Math.max(0, total - overdue);
  const channelLabels: Record<string, string> = { sms: 'SMS', email: 'Email', whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', facebook: 'Facebook', webchat: 'Live Chat', call: 'Call' };
  const label = (name: string) => channelLabels[name] ?? name.replace(/(^|_)(\w)/g, (_, space, char: string) => `${space ? ' ' : ''}${char.toUpperCase()}`);
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="SLA met" value={`${total ? Math.round(met / total * 100) : 100}%`} detail={`${met} of ${total} conversations`} icon={<ShieldCheck size={18} />} tone="good" /><MetricCard label="Average first response" value="3m 42s" detail={`Target: ${overdueMinutes} minutes`} icon={<Clock3 size={18} />} tone="brand" /><MetricCard label="Due soon" value={String(dueSoon)} detail="Needs a reply shortly" icon={<Inbox size={18} />} tone="warn" /><MetricCard label="Overdue" value={String(overdue)} detail="Outside response target" icon={<BarChart3 size={18} />} tone="bad" /></div><Card className="overflow-hidden"><div className="border-b border-line px-4 py-3"><h4 className="text-sm font-bold text-ink">Performance by channel</h4><p className="mt-0.5 text-xs text-ink-muted">Fictional session metrics generated from the populated inbox.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px]"><thead className="bg-surface-sunken"><tr><th className={tableHeadClass}>Channel</th><th className={tableHeadClass}>Conversations</th><th className={tableHeadClass}>Team replies</th><th className={tableHeadClass}>Within SLA</th><th className={tableHeadClass}>Performance</th></tr></thead><tbody>{channels.map(([name, value], index) => { const score = Math.max(78, 97 - index * 3); return <tr key={name}><td className={`${tableCellClass} font-semibold`}>{label(name)}</td><td className={tableCellClass}>{value.conversations}</td><td className={tableCellClass}>{value.replies}</td><td className={tableCellClass}>{score}%</td><td className={tableCellClass}><div className="h-2 w-40 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-good" style={{ width: `${score}%` }} /></div></td></tr>; })}</tbody></table></div></Card></div>;
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: ReactNode; tone: 'good' | 'brand' | 'warn' | 'bad' }) {
  const colors = { good: 'bg-good/10 text-good', brand: 'bg-brand-soft text-brand', warn: 'bg-warn/10 text-warn', bad: 'bg-bad/10 text-bad' };
  return <Card className="p-4"><div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-ink-muted">{label}</p><p className="mt-1 text-2xl font-bold text-ink">{value}</p><p className="mt-1 text-[11px] text-ink-subtle">{detail}</p></div><span className={cx('grid h-9 w-9 place-items-center rounded-lg', colors[tone])}>{icon}</span></div></Card>;
}

/* ───────────────────────────── SLA Settings ──────────────────────────── */

function SlaSettingsView() {
  const saved = useConversationWorkspaceStore((state) => state.settings);
  const updateSettings = useConversationWorkspaceStore((state) => state.updateSettings);
  const pushToast = useStore((state) => state.pushToast);
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(saved.enabled);
  useEffect(() => setDraft(saved), [saved]);
  const change = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const save = () => { updateSettings(draft); setEditing(draft.enabled); pushToast({ title: 'SLA settings saved', description: 'Rules are active for this demo session.', variant: 'success' }); };
  const toggleEnabled = (enabled: boolean) => { const next = { ...draft, enabled }; setDraft(next); updateSettings({ enabled }); setEditing(enabled); pushToast({ title: enabled ? 'SLA tracking enabled' : 'SLA tracking disabled', variant: 'success' }); };
  return <>
    <PageIntro title="Settings" description="Configure how response service levels are calculated across the Conversations inbox." />
    <div className="border-b border-line bg-surface px-6"><button type="button" className="relative py-3 text-[13px] font-bold text-brand">SLA Settings<span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" /></button></div>
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line p-4"><div><h3 className="text-sm font-bold text-ink">Service-level agreement tracking</h3><p className="mt-0.5 text-xs text-ink-muted">Flag conversations that are due soon or overdue for a human response.</p></div><Switch checked={draft.enabled} onChange={toggleEnabled} label="Enable SLA settings" /></div>
      {!draft.enabled && !editing ? <EmptyState icon={<ClipboardCheck size={34} className="text-brand" />} title="No SLA are set" body="Set response-time targets to help the team prioritize conversations before they become overdue." action={<Button onClick={() => { setEditing(true); setDraft((current) => ({ ...current, enabled: true })); }}><Plus size={14} /> Set SLA</Button>} /> : <div className="space-y-6 p-4 sm:p-6">
        <SettingSection title="SLA type" description="Use one response target everywhere or tailor targets to each connected channel."><div className="grid gap-3 sm:grid-cols-2">{(['Common SLA', 'Channel Specific SLA'] as const).map((mode) => <button key={mode} type="button" onClick={() => change('mode', mode)} className={cx('rounded-xl border p-4 text-left transition', draft.mode === mode ? 'border-brand bg-brand-soft ring-1 ring-brand/20' : 'border-line bg-surface hover:border-brand/40')}><span className="flex items-center gap-2 text-[13px] font-bold text-ink"><span className={cx('grid h-4 w-4 place-items-center rounded-full border', draft.mode === mode ? 'border-brand bg-brand text-white' : 'border-line')}>{draft.mode === mode && <Check size={10} />}</span>{mode}</span><span className="mt-1.5 block pl-6 text-[11px] text-ink-muted">{mode === 'Common SLA' ? 'Apply one due-soon and overdue threshold to all channels.' : 'Enable channels and set separate response targets for each.'}</span></button>)}</div></SettingSection>
        {draft.mode === 'Common SLA' ? <SettingSection title="Response thresholds" description="Due soon should occur before the overdue target."><div className="grid max-w-2xl gap-4 sm:grid-cols-2"><Threshold label="Due soon after" value={draft.dueSoonValue} unit={draft.dueSoonUnit} onValue={(value) => change('dueSoonValue', value)} onUnit={(value) => change('dueSoonUnit', value)} /><Threshold label="Overdue after" value={draft.overdueValue} unit={draft.overdueUnit} onValue={(value) => change('overdueValue', value)} onUnit={(value) => change('overdueUnit', value)} /></div></SettingSection> : <ChannelRules draft={draft} setDraft={setDraft} />}
        <SettingSection title="Automation response handling" description="Choose whether workflow messages satisfy a response SLA."><RadioGroup value={draft.automationHandling} options={['Count all responses', 'Do not count responses', 'Selected workflows only']} onChange={(value) => change('automationHandling', value as typeof draft.automationHandling)} />{draft.automationHandling === 'Selected workflows only' && <div className="mt-3 grid gap-2 sm:grid-cols-2">{['New Lead Speed-to-Contact', 'Proposal Follow-up', 'Appointment Reminder', 'Onboarding Check-in'].map((workflow) => <label key={workflow} className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-[12px] font-medium text-ink"><input type="checkbox" checked={draft.selectedWorkflows.includes(workflow)} onChange={(event) => change('selectedWorkflows', event.target.checked ? [...draft.selectedWorkflows, workflow] : draft.selectedWorkflows.filter((item) => item !== workflow))} />{workflow}</label>)}</div>}</SettingSection>
        <SettingSection title="AI-agent responses" description="Decide whether a response sent by an AI agent counts as the first response."><RadioGroup value={draft.aiAgentResponsesCount ? 'Count AI-agent responses' : 'Do not count AI-agent responses'} options={['Count AI-agent responses', 'Do not count AI-agent responses']} onChange={(value) => change('aiAgentResponsesCount', value === 'Count AI-agent responses')} /></SettingSection>
        <SettingSection title="Manual dismiss permission" description="Control who can dismiss a due-soon or overdue SLA flag."><RadioGroup value={draft.manualDismissPermission} options={['All users', 'Admins only']} onChange={(value) => change('manualDismissPermission', value as typeof draft.manualDismissPermission)} /></SettingSection>
        <div className="flex justify-end gap-2 border-t border-line pt-5"><Button variant="secondary" onClick={() => { setDraft(saved); setEditing(saved.enabled); }}>Cancel</Button><Button onClick={save}><Check size={14} /> Save</Button></div>
      </div>}
    </Card></div>
  </>;
}

function SettingSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="grid gap-4 border-b border-line pb-6 last:border-0 md:grid-cols-[250px_minmax(0,1fr)]"><div><h4 className="text-[13px] font-bold text-ink">{title}</h4><p className="mt-1 text-[11px] leading-5 text-ink-muted">{description}</p></div><div>{children}</div></section>;
}

function RadioGroup({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const groupName = useId();
  return <div role="radiogroup" aria-label={options.join(' or ')} className="space-y-2">{options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink"><input type="radio" name={groupName} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>;
}

function Threshold({ label, accessibleLabel = label, value, unit, onValue, onUnit, compact = false, disabled = false }: { label: string; accessibleLabel?: string; value: number; unit: SlaUnit; onValue: (value: number) => void; onUnit: (value: SlaUnit) => void; compact?: boolean; disabled?: boolean }) {
  return <div>{label && <p className="mb-1.5 text-[12px] font-bold text-ink-muted">{label}</p>}<div className="flex gap-2"><input aria-label={`${accessibleLabel} value`} disabled={disabled} type="number" min={1} max={999} className={cx(inputClass, compact ? 'w-20' : 'w-28')} value={value} onChange={(event) => onValue(Math.max(1, Number(event.target.value) || 1))} /><select aria-label={`${accessibleLabel} unit`} disabled={disabled} className={inputClass} value={unit} onChange={(event) => onUnit(event.target.value as SlaUnit)}><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></select></div></div>;
}

function ChannelRules({ draft, setDraft }: { draft: ReturnType<typeof useConversationWorkspaceStore.getState>['settings']; setDraft: React.Dispatch<React.SetStateAction<ReturnType<typeof useConversationWorkspaceStore.getState>['settings']>> }) {
  const channelIcons: Partial<Record<SlaChannelName, ReactNode>> = { Call: <Phone size={14} />, SMS: <MessageSquare size={14} />, Email: <Mail size={14} />, WhatsApp: <MessageSquare size={14} />, 'Facebook Messenger': <Users size={14} />, 'Instagram Messenger': <Sparkles size={14} /> };
  const updateRule = (channel: SlaChannelName, patch: Partial<(typeof draft.channels)[SlaChannelName]>) => setDraft((current) => ({ ...current, channels: { ...current.channels, [channel]: { ...current.channels[channel], ...patch } } }));
  return <SettingSection title="Channel-specific thresholds" description="Enable only the channels that should be measured and set each response target."><div className="overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[740px]"><thead className="bg-surface-sunken"><tr><th className={tableHeadClass}>Channel</th><th className={tableHeadClass}>Enabled</th><th className={tableHeadClass}>Due soon</th><th className={tableHeadClass}>Overdue</th></tr></thead><tbody>{(Object.keys(draft.channels) as SlaChannelName[]).map((channel) => { const rule = draft.channels[channel]; return <tr key={channel}><td className={`${tableCellClass} font-semibold`}><span className="inline-flex items-center gap-2 text-ink">{channelIcons[channel] ?? <MessageSquare size={14} />}{channel}</span></td><td className={tableCellClass}><Switch checked={rule.enabled} onChange={(enabled) => updateRule(channel, { enabled })} label={`Enable ${channel} SLA`} /></td><td className={tableCellClass}><div className={cx(!rule.enabled && 'opacity-40')}><Threshold compact label="" accessibleLabel={`${channel} due soon`} disabled={!rule.enabled} value={rule.dueSoonValue} unit={rule.dueSoonUnit} onValue={(value) => updateRule(channel, { dueSoonValue: value })} onUnit={(value) => updateRule(channel, { dueSoonUnit: value })} /></div></td><td className={tableCellClass}><div className={cx(!rule.enabled && 'opacity-40')}><Threshold compact label="" accessibleLabel={`${channel} overdue`} disabled={!rule.enabled} value={rule.overdueValue} unit={rule.overdueUnit} onValue={(value) => updateRule(channel, { overdueValue: value })} onUnit={(value) => updateRule(channel, { overdueUnit: value })} /></div></td></tr>; })}</tbody></table></div></SettingSection>;
}
