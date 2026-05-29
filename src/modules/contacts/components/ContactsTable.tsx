import { useState } from 'react';
import { Building2, Tag, Mail, Trash2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, dateLabel, userById, cx } from '@/utils';
import { Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import type { Contact } from '@/types';

function sourceTone(source: string): 'brand' | 'good' | 'warn' | 'neutral' {
  const s = source.toLowerCase();
  if (s.includes('google')) return 'brand';
  if (s.includes('facebook') || s.includes('instagram')) return 'warn';
  if (s.includes('referral')) return 'good';
  return 'neutral';
}

export function ContactsTable({
  contacts,
  onRowClick,
}: {
  contacts: Contact[];
  onRowClick: (contact: Contact) => void;
}) {
  const users = useStore(s => s.users);
  const companies = useStore(s => s.companies);
  const pushToast = useStore(s => s.pushToast);
  const removeContacts = useStore(s => s.removeContacts);

  // Bulk selection — Delete is wired to the store; tag/email stay demo-cosmetic.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (contacts.length === 0) {
    return <EmptyState title="No contacts found" body="Try adjusting your search or filters." />;
  }

  const visibleIds = contacts.map(c => c.id);
  const allSelected = selected.size > 0 && visibleIds.every(id => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(prev => {
      if (visibleIds.every(id => prev.has(id))) return new Set();
      return new Set(visibleIds);
    });
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkAction = (label: string) => {
    pushToast({
      title: `${label} (demo)`,
      description: `${selected.size} contact${selected.size !== 1 ? 's' : ''} — bulk actions are cosmetic in demo mode.`,
      variant: 'info',
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    removeContacts([...selected]);
    setSelected(new Set());
  };

  return (
    <div className="overflow-x-auto">
      {/* Bulk-action toolbar — appears when rows are selected */}
      {selected.size > 0 && (
        <div
          className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-line bg-brand-soft px-4 py-2"
          data-tour="contacts.bulkBar"
        >
          <span className="text-xs font-semibold text-brand">
            {selected.size} selected
          </span>
          <span className="mx-1 h-4 w-px bg-brand/20" aria-hidden="true" />
          <button
            onClick={() => bulkAction('Add tag')}
            className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken"
          >
            <Tag size={12} /> Add Tag
          </button>
          <button
            onClick={() => bulkAction('Send email')}
            className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken"
          >
            <Mail size={12} /> Send Email
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 rounded-lg border border-bad/30 bg-surface px-2.5 py-1 text-xs font-semibold text-bad hover:bg-bad/5"
          >
            <Trash2 size={12} /> Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="w-10 bg-surface px-4 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                aria-label="Select all contacts"
                className="h-3.5 w-3.5 cursor-pointer rounded border-line accent-brand"
              />
            </th>
            {['Name', 'Email', 'Phone', 'Company', 'Tags', 'Source', 'Owner', 'Created'].map(h => (
              <th key={h} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map(contact => {
            const owner = userById(users, contact.ownerId);
            const company = companies.find(co => co.id === contact.companyId);
            const isSel = selected.has(contact.id);
            return (
              <tr
                key={contact.id}
                data-tour="contacts.row"
                onClick={() => onRowClick(contact)}
                className={cx(
                  'cursor-pointer border-b border-line/70 transition-colors hover:bg-surface-sunken',
                  isSel && 'bg-brand-soft/50',
                )}
              >
                <td className="w-10 px-4 py-3 align-middle" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleOne(contact.id)}
                    aria-label={`Select ${fullName(contact)}`}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-line accent-brand"
                  />
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fullName(contact)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{fullName(contact)}</p>
                      {contact.dnd && <span className="text-[10px] font-bold text-bad">DND</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="block max-w-[180px] truncate text-xs text-ink-muted">{contact.email}</span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="whitespace-nowrap text-xs text-ink-muted">{contact.phone}</span>
                </td>
                <td className="px-4 py-3 align-middle">
                  {company ? (
                    <div className="flex max-w-[140px] items-center gap-1 text-xs text-ink-muted">
                      <Building2 size={11} className="shrink-0 text-ink-subtle" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-subtle">-</span>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} tone="brand" size="sm">{tag}</Badge>
                    ))}
                    {contact.tags.length > 2 && (
                      <Badge tone="neutral" size="sm">+{contact.tags.length - 2}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <Badge tone={sourceTone(contact.source)} size="sm">{contact.source}</Badge>
                </td>
                <td className="px-4 py-3 align-middle">
                  {owner ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={owner.name} size="xs" />
                      <span className="whitespace-nowrap text-xs text-ink-muted">{owner.name.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-subtle">-</span>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="whitespace-nowrap text-xs text-ink-subtle">{dateLabel(contact.createdAt)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
