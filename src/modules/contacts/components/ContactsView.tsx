import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UserPlus, Search, X, ArrowUpDown, MoreVertical, Plus,
  Columns3, Upload, Filter, FolderOpen, UserCheck, BellOff, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, cx } from '@/utils';
import type { Contact } from '@/types';
import { useContactsModule } from '../context';
import { smartListById, applyAdvancedFilters, type FilterCondition, type FilterMatch } from '../data';
import { ContactsTable, CONTACT_COLUMNS } from './ContactsTable';
import { BulkBar } from './BulkBar';
import { AddContactDrawer } from './AddContactDrawer';
import { AdvancedFiltersDrawer } from './AdvancedFiltersDrawer';
import type { MenuItem } from './RowMenu';

const DEFAULT_COLUMNS = new Set(['phone', 'email', 'company', 'created', 'lastActivity', 'tags']);

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
  const [topMenu, setTopMenu] = useState(false);
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
  const displayedCount =
    smartList === 'all' && !search.trim() && activeFilterCount === 0
      ? '2,004'
      : filtered.length.toLocaleString('en-US');

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Live GHL-style smart-list strip */}
      <div className="flex h-16 shrink-0 items-stretch justify-between border-b border-[#e4e8ee] bg-white px-5">
        <div className="flex min-w-0 items-stretch gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSmartList('all')}
            className={cx(
              'flex h-full shrink-0 items-center border-b-2 px-1 text-[13px] font-semibold transition-colors',
              smartList === 'all' ? 'border-[#1689f4] text-[#1266c9]' : 'border-transparent text-[#667085] hover:text-[#344054]',
            )}
          >
            All
          </button>
          {smartList !== 'all' && (
            <button className="flex h-full shrink-0 items-center border-b-2 border-[#1689f4] px-1 text-[13px] font-semibold text-[#1266c9]">
              {def.label}
            </button>
          )}
          <button
            onClick={() => setView('smart-lists')}
            className="flex h-full shrink-0 items-center gap-1 border-b-2 border-transparent px-1 text-[13px] font-medium text-[#667085] hover:text-[#344054]"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="relative flex shrink-0 items-center gap-2 pl-3">
          <button
            onClick={() => setShowAdd(true)}
            data-tour="contacts.addButton"
            className="grid h-9 w-9 place-items-center rounded-md border border-[#d7dde6] bg-white text-[#475467] transition-colors hover:bg-[#f7f9fb]"
            aria-label="Add contact"
            title="Add contact"
          >
            <UserPlus size={16} />
          </button>
          <button
            onClick={() => setView('imports')}
            className="flex h-9 items-center gap-1.5 rounded-md bg-[#1689f4] px-3.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0878df]"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={() => setTopMenu((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-[#d7dde6] bg-white text-[#667085] hover:bg-[#f7f9fb]"
            aria-label="More contact actions"
          >
            <MoreVertical size={16} />
          </button>
          {topMenu && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" onClick={() => setTopMenu(false)} aria-label="Close menu" />
              <div className="absolute right-0 top-[52px] z-20 w-44 overflow-hidden rounded-lg border border-[#e0e5ec] bg-white py-1 text-[13px] shadow-pop">
                {['Export contacts', 'Restore contacts', 'Audit logs'].map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      setTopMenu(false);
                      pushToast({ title: label, description: 'This action is simulated in the demo.', variant: 'info' });
                    }}
                    className="block w-full px-3 py-2 text-left text-[#344054] hover:bg-[#f5f7fa]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inset contact grid */}
      <div className="min-h-0 flex-1 bg-[#f3f5f8] p-4">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#e1e6ed] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex min-h-[55px] shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e5e9ef] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                data-tour="contacts.advancedFiltersButton"
                className={cx(
                  'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-semibold',
                  activeFilterCount
                    ? 'border-[#1689f4] bg-[#eef6ff] text-[#1266c9]'
                    : 'border-[#d7dde6] bg-white text-[#475467] hover:bg-[#f8fafc]',
                )}
              >
                <Filter size={13} /> Filters
                {activeFilterCount > 0 && <span className="rounded-full bg-[#1689f4] px-1.5 py-px text-[9px] font-bold text-white">{activeFilterCount}</span>}
              </button>

              <label className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#d7dde6] bg-white px-2.5 text-[12px] font-semibold text-[#475467] hover:bg-[#f8fafc]">
                <ArrowUpDown size={13} /> Sort
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#eef1f5] px-1 text-[9px] text-[#667085]">1</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Sort contacts"
                >
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>

              <span className="whitespace-nowrap rounded-full bg-[#e9f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#1670d2]">
                {displayedCount} Contacts
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <div ref={colRef} className="relative">
                <button
                  onClick={() => setColMenu((v) => !v)}
                  className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-medium text-[#667085] hover:bg-[#f3f5f8]"
                >
                  <Columns3 size={13} /> {visibleColumns.size + 1}/73 columns
                </button>
                {colMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-[10px] border border-[#dfe4eb] bg-white p-2 shadow-pop">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#98a2b3]">Manage fields</p>
                    {CONTACT_COLUMNS.map((c) => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[#344054] hover:bg-[#f4f6f8]">
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
                          className="h-3.5 w-3.5 rounded border-[#cbd3df] accent-[#1689f4]"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-[230px] max-w-[38vw] min-w-[150px]">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts"
                  className="h-8 w-full rounded-md border border-[#d7dde6] bg-white pl-8 pr-7 text-[12px] text-[#344054] outline-none placeholder:text-[#98a2b3] focus:border-[#1689f4] focus:ring-2 focus:ring-[#1689f4]/10"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#98a2b3] hover:text-[#475467]">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedIds.length > 0 && <BulkBar selectedIds={selectedIds} onClear={() => setSelected(new Set())} />}

          <div className="min-h-0 flex-1 overflow-auto" data-tour="contacts.table">
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

          <div className="flex h-11 shrink-0 items-center justify-between border-t border-[#e5e9ef] bg-white px-3.5 text-[11px] text-[#667085]">
            <span>{filtered.length ? 1 : 0}–{Math.min(filtered.length, 20)} of {displayedCount}</span>
            <div className="flex items-center gap-1.5">
              <button className="grid h-7 w-7 place-items-center rounded-md border border-[#d7dde6] text-[#98a2b3]" aria-label="Previous page">
                <ChevronLeft size={13} />
              </button>
              <span className="grid h-7 min-w-7 place-items-center rounded-md bg-[#1689f4] px-2 font-semibold text-white">1</span>
              <button className="grid h-7 w-7 place-items-center rounded-md border border-[#d7dde6] text-[#667085] hover:bg-[#f5f7fa]" aria-label="Next page">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </section>
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
