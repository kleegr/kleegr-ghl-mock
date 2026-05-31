import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UserPlus, Search, SlidersHorizontal, X, ArrowUpDown,
  Columns3, Upload, Filter, FolderOpen, UserCheck, BellOff, Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, cx } from '@/utils';
import { Button } from '@/components/ui/primitives';
import type { Contact } from '@/types';
import { useContactsModule } from '../context';
import { smartListById, applyAdvancedFilters, type FilterCondition, type FilterMatch } from '../data';
import { ContactsTable, CONTACT_COLUMNS } from './ContactsTable';
import { SmartListRail } from './SmartListRail';
import { BulkBar } from './BulkBar';
import { AddContactDrawer } from './AddContactDrawer';
import { AdvancedFiltersDrawer } from './AdvancedFiltersDrawer';
import type { MenuItem } from './RowMenu';

const DEFAULT_COLUMNS = new Set(['phone', 'company', 'tags', 'source', 'status', 'owner', 'lastActivity']);

type SortKey = 'name' | 'created' | 'activity';
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'activity', label: 'Last Activity' },
  { id: 'created', label: 'Date Created' },
  { id: 'name', label: 'Name (A–Z)' },
];

export function ContactsView() {
  const contacts = useStore((s) => s.contacts);
  const updateContact = useStore((s) => s.updateContact);
  const removeContacts = useStore((s) => s.removeContacts);
  const pushToast = useStore((s) => s.pushToast);
  const { smartList, setSmartList, setView, openContact } = useContactsModule();

  const [search, setSearch] = useState('');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [match, setMatch] = useState<FilterMatch>('all');
  const [sort, setSort] = useState<SortKey>('activity');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [colMenu, setColMenu] = useState(false);
  const colRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colMenu) return;
    const onDoc = (e: MouseEvent) => { if (colRef.current && !colRef.current.contains(e.target as Node)) setColMenu(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [colMenu]);

  const def = smartListById(smartList);

  const filtered = useMemo(() => {
    let result = contacts.filter(def.predicate);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => fullName(c).toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q),
      );
    }
    result = applyAdvancedFilters(result, conditions, match);
    const sorted = [...result];
    if (sort === 'name') sorted.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    else if (sort === 'created') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else sorted.sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt));
    return sorted;
  }, [contacts, def, search, conditions, match, sort]);

  const activeFilterCount = conditions.filter((c) => c.field && c.operator).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    const ids = filtered.map((c) => c.id);
    setSelected((prev) => (ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));
  }

  // Keep selection valid if contacts are deleted/filtered out.
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(filtered.map((c) => c.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  function rowMenu(contact: Contact): MenuItem[] {
    return [
      { label: 'Open record', icon: <FolderOpen size={13} />, onClick: () => openContact(contact.id) },
      { label: 'Assign to me', icon: <UserCheck size={13} />, onClick: () => { updateContact(contact.id, { ownerId: 'u_me' }); pushToast({ title: 'Owner updated', description: `${fullName(contact)} assigned to you.`, variant: 'success' }); } },
      { label: contact.dnd ? 'Turn DND off' : 'Turn DND on', icon: <BellOff size={13} />, onClick: () => updateContact(contact.id, { dnd: !contact.dnd }) },
      { label: 'Delete', icon: <Trash2 size={13} />, danger: true, onClick: () => { if (window.confirm(`Delete ${fullName(contact)}? (demo session)`)) { removeContacts([contact.id]); pushToast({ title: 'Contact deleted', description: `${fullName(contact)} removed.`, variant: 'success' }); } } },
    ];
  }

  const selectedIds = useMemo(() => [...selected], [selected]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-5 py-2.5">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-7 pr-6 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Saved view selector (mirrors the rail; available on mobile too) */}
        <label className="hidden items-center gap-1.5 text-xs text-ink-muted sm:flex">
          <SlidersHorizontal size={13} className="text-ink-subtle" />
          <select
            value={smartList}
            onChange={(e) => setSmartList(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
            aria-label="Saved view"
          >
            {/* options injected from SMART_LISTS via rail; keep in sync */}
            {['all', 'new_leads', 'hot_leads', 'customers', 'recently_active', 'needs_follow_up'].map((id) => (
              <option key={id} value={id}>{smartListById(id).label}</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setShowFilters(true)}
          data-tour="contacts.advancedFiltersButton"
          className={cx(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
            activeFilterCount ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink hover:bg-surface-sunken',
          )}
        >
          <Filter size={13} /> Advanced Filters
          {activeFilterCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
        </button>

        <label className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink">
          <ArrowUpDown size={12} className="text-ink-subtle" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-transparent text-xs font-semibold focus:outline-none" aria-label="Sort">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>

        {/* Manage fields / columns */}
        <div ref={colRef} className="relative">
          <button onClick={() => setColMenu((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken">
            <Columns3 size={13} /> Columns
          </button>
          {colMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-line bg-surface p-2 shadow-pop">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">Manage Fields</p>
              {CONTACT_COLUMNS.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink hover:bg-surface-sunken">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(c.id)}
                    onChange={() =>
                      setVisibleColumns((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                        return next;
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-line accent-brand"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={() => setView('imports')}>
          <Upload size={14} /> Import
        </Button>
        <Button data-tour="contacts.addButton" size="sm" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> Add Contact
        </Button>

        <span className="ml-auto whitespace-nowrap rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-muted">
          {filtered.length} of {contacts.length}
        </span>
      </div>

      {/* Body: rail + table */}
      <div className="flex min-h-0 flex-1">
        <SmartListRail active={smartList} onSelect={setSmartList} />
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedIds.length > 0 && <BulkBar selectedIds={selectedIds} onClear={() => setSelected(new Set())} />}
          <div className="min-h-0 flex-1 overflow-auto bg-surface" data-tour="contacts.table">
            <ContactsTable
              contacts={filtered}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onRowClick={(c) => openContact(c.id)}
              visibleColumns={visibleColumns}
              rowMenu={rowMenu}
            />
          </div>
        </div>
      </div>

      <AddContactDrawer open={showAdd} onClose={() => setShowAdd(false)} onCreated={(c) => openContact(c.id)} />
      <AdvancedFiltersDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        initialConditions={conditions}
        initialMatch={match}
        onApply={(c, m) => { setConditions(c); setMatch(m); }}
        onClear={() => { setConditions([]); setMatch('all'); }}
      />
    </div>
  );
}
