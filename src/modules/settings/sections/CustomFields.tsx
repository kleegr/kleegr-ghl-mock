import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Plus, Search, Copy, Check, Sliders, FolderOpen, MoreHorizontal, Trash2, Pencil, FolderPlus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import type { CustomFieldDefinition } from '@/types';
import { CUSTOM_FIELDS } from './data';

/**
 * Settings → Custom Fields.
 *
 * A GoHighLevel-style custom-field manager: pick an object (Contact /
 * Opportunity / Company), switch between a Fields table and a Folders table,
 * search, add fields and folders, and copy each field's generated key. All
 * state is module-local and session-only, seeded from the foundation
 * CUSTOM_FIELDS list.
 */

type ObjectScope = CustomFieldDefinition['scope'];
type FieldType = CustomFieldDefinition['type'];

interface FieldRow extends CustomFieldDefinition {
  key: string;
  createdAt: string;
}

interface FolderRow {
  id: string;
  name: string;
  scope: ObjectScope;
}

const OBJECTS: { id: ObjectScope; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'company', label: 'Company' },
];

const FIELD_TYPES: FieldType[] = ['text', 'number', 'dropdown', 'date', 'checkbox'];

const TYPE_TONE: Record<FieldType, 'brand' | 'good' | 'warn' | 'neutral'> = {
  text: 'neutral',
  number: 'brand',
  dropdown: 'good',
  date: 'warn',
  checkbox: 'neutral',
};

const fieldKey = (scope: string, name: string) =>
  `${scope}.${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export function CustomFieldsSection() {
  const pushToast = useStore((s) => s.pushToast);

  // Seed working state from the foundation data (keys + created dates derived here).
  const [fields, setFields] = useState<FieldRow[]>(() =>
    CUSTOM_FIELDS.map((cf, i) => ({ ...cf, key: fieldKey(cf.scope, cf.name), createdAt: daysAgo((i + 1) * 6) })),
  );
  const [folders, setFolders] = useState<FolderRow[]>(() => {
    const seen = new Set<string>();
    const out: FolderRow[] = [];
    CUSTOM_FIELDS.forEach((cf) => {
      if (cf.folder) {
        const k = `${cf.scope}:${cf.folder}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ id: `fld_${out.length + 1}`, name: cf.folder, scope: cf.scope });
        }
      }
    });
    return out;
  });

  const [object, setObject] = useState<ObjectScope>('contact');
  const [tab, setTab] = useState<'fields' | 'folders'>('fields');
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const objectFolders = useMemo(() => folders.filter((f) => f.scope === object), [folders, object]);

  const visibleFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fields.filter(
      (f) =>
        f.scope === object &&
        (!q || f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || (f.folder ?? '').toLowerCase().includes(q)),
    );
  }, [fields, object, search]);

  const visibleFolders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return objectFolders.filter((f) => !q || f.name.toLowerCase().includes(q));
  }, [objectFolders, search]);

  function copyKey(key: string) {
    navigator.clipboard?.writeText(key).catch(() => {});
    setCopiedKey(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedKey(null), 1500);
  }

  function addField(input: { name: string; type: FieldType; folder: string; options: string[] }) {
    const row: FieldRow = {
      id: `cf_new_${Date.now()}`,
      name: input.name.trim(),
      type: input.type,
      scope: object,
      folder: input.folder || undefined,
      options: input.type === 'dropdown' ? input.options : undefined,
      key: fieldKey(object, input.name),
      createdAt: new Date().toISOString(),
    };
    setFields((prev) => [row, ...prev]);
    setShowAddField(false);
    pushToast({ title: 'Field added', description: `${row.name} was created.`, variant: 'success' });
  }

  function addFolder(name: string) {
    const row: FolderRow = { id: `fld_new_${Date.now()}`, name: name.trim(), scope: object };
    setFolders((prev) => [row, ...prev]);
    setShowAddFolder(false);
    pushToast({ title: 'Folder added', description: `${row.name} was created.`, variant: 'success' });
  }

  function deleteField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    pushToast({ title: 'Field deleted', variant: 'success' });
  }
  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    pushToast({ title: 'Folder deleted', variant: 'success' });
  }

  return (
    <div data-tour="settings.configSection" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Sliders size={15} className="text-brand" /> Custom Fields
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Define custom fields and folders for each object. Field keys are used in workflows and the API.
          </p>
        </div>
        <Button
          size="sm"
          data-tour="settings.addConfig"
          onClick={() => (tab === 'fields' ? setShowAddField(true) : setShowAddFolder(true))}
        >
          {tab === 'fields' ? <Plus size={13} /> : <FolderPlus size={13} />}
          {tab === 'fields' ? 'Add Field' : 'Add Folder'}
        </Button>
      </div>

      {/* Object selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Object</span>
        {OBJECTS.map((o) => (
          <button
            key={o.id}
            onClick={() => setObject(o.id)}
            className={
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ' +
              (object === o.id
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line">
        <div className="flex gap-1">
          {(['fields', 'folders'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                '-mb-px border-b-2 px-3 py-2 text-xs font-semibold capitalize transition-colors ' +
                (tab === t ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink')
              }
            >
              {t === 'fields' ? `Fields (${visibleFields.length})` : `Folders (${objectFolders.length})`}
            </button>
          ))}
        </div>
        <div className="relative mb-1.5 min-w-[160px] max-w-xs">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'fields' ? 'Search fields…' : 'Search folders…'}
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-7 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>
      </div>

      {/* Fields table */}
      {tab === 'fields' &&
        (visibleFields.length === 0 ? (
          <Empty icon={<Sliders size={18} />} title="No fields" body="Add a custom field for this object to get started." />
        ) : (
          <div className="overflow-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {['Field Name', 'Type', 'Folder', 'Field Key', 'Created', ''].map((h, i) => (
                    <th key={h || `sp-${i}`} className="whitespace-nowrap bg-surface-sunken px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFields.map((f) => (
                  <tr key={f.id} className="border-b border-line/60 last:border-0 hover:bg-surface-sunken/50">
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm font-semibold text-ink">{f.name}</span>
                      {f.type === 'dropdown' && f.options && (
                        <p className="mt-0.5 text-[11px] text-ink-subtle">{f.options.join(' · ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge tone={TYPE_TONE[f.type]} size="sm">
                        {f.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {f.folder ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                          <FolderOpen size={12} className="text-ink-subtle" /> {f.folder}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={() => copyKey(f.key)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2 py-1 font-mono text-[11px] text-ink-muted hover:border-brand hover:text-brand"
                        title="Copy field key"
                      >
                        {copiedKey === f.key ? <Check size={11} className="text-good" /> : <Copy size={11} />}
                        {f.key}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="whitespace-nowrap text-xs text-ink-subtle">{fmtDate(f.createdAt)}</span>
                    </td>
                    <td className="w-10 px-2 py-3 align-middle text-right">
                      <ActionMenu
                        items={[
                          { label: 'Edit', icon: <Pencil size={13} />, onClick: () => pushToast({ title: 'Edit field — demo only', variant: 'info' }) },
                          { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => deleteField(f.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Folders table */}
      {tab === 'folders' &&
        (visibleFolders.length === 0 ? (
          <Empty icon={<FolderOpen size={18} />} title="No folders" body="Folders group related fields together on a record." />
        ) : (
          <div className="overflow-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {['Folder', 'Fields', ''].map((h, i) => (
                    <th key={h || `sp-${i}`} className="whitespace-nowrap bg-surface-sunken px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFolders.map((fld) => {
                  const count = fields.filter((f) => f.scope === object && f.folder === fld.name).length;
                  return (
                    <tr key={fld.id} className="border-b border-line/60 last:border-0 hover:bg-surface-sunken/50">
                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                          <FolderOpen size={14} className="text-brand" /> {fld.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-semibold text-ink-muted">{count}</span>
                      </td>
                      <td className="w-10 px-2 py-3 align-middle text-right">
                        <ActionMenu
                          items={[{ label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => deleteFolder(fld.id) }]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      <AddFieldModal
        open={showAddField}
        onClose={() => setShowAddField(false)}
        folders={objectFolders.map((f) => f.name)}
        onSave={addField}
      />
      <AddFolderModal open={showAddFolder} onClose={() => setShowAddFolder(false)} onSave={addFolder} />
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function Empty({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-sunken/40 py-12 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink-subtle">{icon}</div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="max-w-xs text-xs text-ink-muted">{body}</p>
    </div>
  );
}

interface MenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

function ActionMenu({ items }: { items: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-line bg-surface p-1 shadow-pop">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
              className={
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium hover:bg-surface-sunken ' +
                (it.danger ? 'text-bad' : 'text-ink')
              }
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MODAL_INPUT =
  'w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30';

function AddFieldModal({
  open,
  onClose,
  folders,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  folders: string[];
  onSave: (input: { name: string; type: FieldType; folder: string; options: string[] }) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [folder, setFolder] = useState('');
  const [optionsRaw, setOptionsRaw] = useState('');

  // Reset on open.
  useEffect(() => {
    if (open) {
      setName('');
      setType('text');
      setFolder('');
      setOptionsRaw('');
    }
  }, [open]);

  const options = optionsRaw.split(',').map((o) => o.trim()).filter(Boolean);
  const valid = name.trim() && (type !== 'dropdown' || options.length > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Custom Field"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave({ name, type, folder, options })} disabled={!valid}>
            Save Field
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink">Field Name</span>
          <input className={MODAL_INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Revenue" />
          {name.trim() && (
            <span className="font-mono text-[11px] text-ink-subtle">key: {fieldKey('contact', name).replace('contact', '<object>')}</span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink">Type</span>
            <select className={MODAL_INPUT} value={type} onChange={(e) => setType(e.target.value as FieldType)}>
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink">Folder</span>
            <select className={MODAL_INPUT} value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="">— None —</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
        {type === 'dropdown' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink">Options</span>
            <input
              className={MODAL_INPUT}
              value={optionsRaw}
              onChange={(e) => setOptionsRaw(e.target.value)}
              placeholder="Comma-separated, e.g. Low, Medium, High"
            />
          </label>
        )}
      </div>
    </Modal>
  );
}

function AddFolderModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (open) setName('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Folder"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(name)} disabled={!name.trim()}>
            Save Folder
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink">Folder Name</span>
        <input className={MODAL_INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deal Details" autoFocus />
      </label>
    </Modal>
  );
}
