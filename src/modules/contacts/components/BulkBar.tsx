import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Tag, TagsIcon, UserCheck, Trash2, Download, X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { useContactsModule } from '../context';

/**
 * Bulk-action toolbar shown above the contacts table when one or more rows are
 * selected. Every action is real against session state (add/remove tag, assign
 * owner, delete) and is recorded as a job on the Bulk Actions tab so the demo
 * tells a coherent story. "Export" is a demo-safe no-op that still logs a job.
 */
export function BulkBar({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const addTagToContacts = useStore((s) => s.addTagToContacts);
  const removeTagFromContacts = useStore((s) => s.removeTagFromContacts);
  const assignOwnerToContacts = useStore((s) => s.assignOwnerToContacts);
  const removeContacts = useStore((s) => s.removeContacts);
  const pushToast = useStore((s) => s.pushToast);
  const { addJob } = useContactsModule();

  const me = users.find((u) => u.isCurrentUser)?.name ?? 'Demo User';
  const count = selectedIds.length;
  const idSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Tags currently present on the selected contacts (for the "Remove Tag" menu).
  const selectedTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => { if (idSet.has(c.id)) c.tags.forEach((t) => set.add(t)); });
    return [...set].sort();
  }, [contacts, idSet]);

  const [newTag, setNewTag] = useState('');

  function logJob(action: string, status: 'completed' = 'completed') {
    addJob({ action, createdBy: me, status, total: count, completed: count });
  }

  function applyAddTag() {
    const t = newTag.trim();
    if (!t) return;
    addTagToContacts(selectedIds, t);
    logJob(`Add Tag · “${t}”`);
    pushToast({ title: 'Tag added', description: `“${t}” added to ${count} contact${count === 1 ? '' : 's'}.`, variant: 'success' });
    setNewTag('');
  }
  function applyRemoveTag(t: string) {
    removeTagFromContacts(selectedIds, t);
    logJob(`Remove Tag · “${t}”`);
    pushToast({ title: 'Tag removed', description: `“${t}” removed from selected contacts.`, variant: 'success' });
  }
  function applyAssignOwner(ownerId: string, name: string) {
    assignOwnerToContacts(selectedIds, ownerId);
    logJob(`Assign Owner · ${name}`);
    pushToast({ title: 'Owner assigned', description: `${count} contact${count === 1 ? '' : 's'} assigned to ${name}.`, variant: 'success' });
  }
  function applyDelete() {
    if (!window.confirm(`Delete ${count} contact${count === 1 ? '' : 's'}? (demo session)`)) return;
    removeContacts(selectedIds);
    logJob('Delete Contacts');
    pushToast({ title: 'Contacts deleted', description: `${count} contact${count === 1 ? '' : 's'} removed.`, variant: 'success' });
    onClear();
  }
  function applyExport() {
    logJob('Export Contacts (CSV)');
    pushToast({ title: 'Export queued', description: `${count} contact${count === 1 ? '' : 's'} — CSV export is simulated in the demo.`, variant: 'info' });
  }

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-line bg-brand-soft px-4 py-2"
      data-tour="contacts.bulkBar"
    >
      <span className="text-xs font-semibold text-brand">{count} selected</span>
      <span className="mx-1 h-4 w-px bg-brand/20" aria-hidden="true" />

      <Popover
        label="Add Tag"
        icon={<Tag size={12} />}
        onClose={() => setNewTag('')}
      >
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Add a tag</p>
        <div className="flex gap-1.5">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyAddTag()}
            placeholder="e.g. newsletter"
            autoFocus
            className="w-40 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none"
          />
          <button onClick={applyAddTag} disabled={!newTag.trim()} className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg disabled:opacity-40">
            <Check size={14} />
          </button>
        </div>
      </Popover>

      <Popover label="Remove Tag" icon={<TagsIcon size={12} />}>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Remove a tag</p>
        {selectedTags.length === 0 ? (
          <p className="px-1 py-2 text-xs text-ink-subtle">No tags on the selected contacts.</p>
        ) : (
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {selectedTags.map((t) => (
              <button key={t} onClick={() => applyRemoveTag(t)} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-ink hover:bg-surface-sunken">
                {t} <X size={12} className="text-ink-subtle" />
              </button>
            ))}
          </div>
        )}
      </Popover>

      <Popover label="Assign Owner" icon={<UserCheck size={12} />}>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Assign owner</p>
        <div className="flex flex-col gap-0.5">
          {users.map((u) => (
            <button key={u.id} onClick={() => applyAssignOwner(u.id, u.name)} className="rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-ink hover:bg-surface-sunken">
              {u.name}
            </button>
          ))}
        </div>
      </Popover>

      <button onClick={applyExport} className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken">
        <Download size={12} /> Export
      </button>
      <button onClick={applyDelete} className="flex items-center gap-1.5 rounded-lg border border-bad/30 bg-surface px-2.5 py-1 text-xs font-semibold text-bad hover:bg-bad/5">
        <Trash2 size={12} /> Delete
      </button>

      <button onClick={onClear} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink">
        <X size={12} /> Clear
      </button>
    </div>
  );
}

/** Small popover trigger + panel used by the bulk-action controls. */
function Popover({
  label,
  icon,
  children,
  onClose,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); onClose?.(); } };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex items-center gap-1.5 rounded-lg border border-brand/30 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface',
          open ? 'bg-surface' : 'bg-surface/70',
        )}
      >
        {icon} {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-line bg-surface p-2 shadow-pop">
          {children}
        </div>
      )}
    </div>
  );
}
