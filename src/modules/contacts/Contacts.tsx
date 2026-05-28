import { useState, useMemo } from 'react';
import { UserPlus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName } from '@/utils';
import { PageHeader, Button, Tabs } from '@/components/ui/primitives';
import type { Contact } from '@/types';
import { ContactsTable } from './components/ContactsTable';
import { ContactDetailDrawer } from './components/ContactDetailDrawer';
import { AddContactModal } from './components/AddContactModal';

const SMART_LISTS = [
  { id: 'all', label: 'All' },
  { id: 'new_leads', label: 'New Leads' },
  { id: 'hot_leads', label: 'Hot Leads' },
  { id: 'customers', label: 'Customers' },
  { id: 'recently_active', label: 'Recently Active' },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function filterBySmartList(contacts: Contact[], listId: string): Contact[] {
  switch (listId) {
    case 'new_leads':
      return contacts.filter(c => c.tags.includes('lead'));
    case 'hot_leads':
      return contacts.filter(c => c.tags.includes('hot'));
    case 'customers':
      return contacts.filter(c => c.tags.some(t => t === 'vip' || t === 'past-client'));
    case 'recently_active':
      return contacts.filter(c => Date.now() - new Date(c.lastActivityAt).getTime() < SEVEN_DAYS_MS);
    default:
      return contacts;
  }
}

export function Contacts() {
  const contacts = useStore(s => s.contacts);
  const users = useStore(s => s.users);

  const [search, setSearch] = useState('');
  const [smartList, setSmartList] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const allSources = useMemo(
    () => Array.from(new Set(contacts.map(c => c.source))).sort(),
    [contacts],
  );

  const filtered = useMemo(() => {
    let result = filterBySmartList(contacts, smartList);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        fullName(c).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q),
      );
    }
    if (sourceFilter) result = result.filter(c => c.source === sourceFilter);
    if (ownerFilter) result = result.filter(c => c.ownerId === ownerFilter);
    return result;
  }, [contacts, smartList, search, sourceFilter, ownerFilter]);

  const smartListTabs = useMemo(
    () => SMART_LISTS.map(sl => ({
      id: sl.id,
      label: sl.label,
      count: filterBySmartList(contacts, sl.id).length,
    })),
    [contacts],
  );

  return (
    <div data-tour="contacts.page" className="flex h-full flex-col">
      <PageHeader
        title="Contacts"
        subtitle="CRM contact database — Smart Lists, profiles, and activity"
        actions={
          <Button
            data-tour="contacts.addButton"
            onClick={() => setShowAdd(true)}
          >
            <UserPlus size={15} />
            Add Contact
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
        <div data-tour="contacts.search" className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-7 pr-6 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div data-tour="contacts.filters" className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="shrink-0 text-ink-subtle" />
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
          >
            <option value="">All Sources</option>
            {allSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
          >
            <option value="">All Owners</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {(sourceFilter || ownerFilter) && (
            <button
              onClick={() => { setSourceFilter(''); setOwnerFilter(''); }}
              className="text-xs text-brand hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <span className="ml-auto text-xs text-ink-subtle">
          {filtered.length} of {contacts.length} contacts
        </span>
      </div>

      {/* Smart list tabs */}
      <div data-tour="contacts.smartLists" className="border-b border-line bg-surface px-5">
        <Tabs
          tabs={smartListTabs}
          active={smartList}
          onChange={setSmartList}
          variant="underline"
        />
      </div>

      {/* Contacts table */}
      <div data-tour="contacts.table" className="flex-1 overflow-auto bg-surface">
        <ContactsTable contacts={filtered} onRowClick={setSelectedContact} />
      </div>

      {selectedContact && (
        <ContactDetailDrawer
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}

      <AddContactModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
