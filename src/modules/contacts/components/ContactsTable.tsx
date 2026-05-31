import { Building2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, dateLabel, relativeTime, userById, cx } from '@/utils';
import { Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import type { Contact } from '@/types';
import { RowMenu, type MenuItem } from './RowMenu';

/**
 * Toggleable columns for the contacts table. `Name` and the row checkbox/menu
 * are always rendered; everything here can be turned on/off from the
 * "Columns" (Manage Fields) menu in the toolbar.
 */
export const CONTACT_COLUMNS: { id: string; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'company', label: 'Company' },
  { id: 'tags', label: 'Tags' },
  { id: 'source', label: 'Source' },
  { id: 'status', label: 'Status' },
  { id: 'owner', label: 'Owner' },
  { id: 'lastActivity', label: 'Last Activity' },
  { id: 'created', label: 'Created' },
];

function sourceTone(source: string): 'brand' | 'good' | 'warn' | 'neutral' {
  const s = source.toLowerCase();
  if (s.includes('google')) return 'brand';
  if (s.includes('facebook') || s.includes('instagram')) return 'warn';
  if (s.includes('referral')) return 'good';
  return 'neutral';
}

/** Derive a lightweight CRM status from a contact's tags (demo heuristic). */
function statusOf(contact: Contact): { label: string; tone: 'good' | 'brand' | 'warn' | 'neutral' } {
  if (contact.tags.some((t) => t === 'vip' || t === 'past-client')) return { label: 'Customer', tone: 'good' };
  if (contact.tags.includes('hot') || contact.tags.includes('consult-booked')) return { label: 'Hot Lead', tone: 'warn' };
  if (contact.tags.includes('lead')) return { label: 'Lead', tone: 'brand' };
  return { label: 'Contact', tone: 'neutral' };
}

export function ContactsTable({
  contacts,
  selected,
  onToggle,
  onToggleAll,
  onRowClick,
  visibleColumns,
  rowMenu,
}: {
  contacts: Contact[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRowClick: (contact: Contact) => void;
  visibleColumns: Set<string>;
  rowMenu: (contact: Contact) => MenuItem[];
}) {
  const users = useStore((s) => s.users);
  const companies = useStore((s) => s.companies);

  if (contacts.length === 0) {
    return <EmptyState title="No contacts found" body="Try adjusting your search, saved view, or filters." />;
  }

  const visibleIds = contacts.map((c) => c.id);
  const allSelected = selected.size > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const show = (id: string) => visibleColumns.has(id);

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 z-[1]">
        <tr className="border-b border-line text-left">
          <th className="w-10 bg-surface px-4 py-2.5">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={onToggleAll}
              aria-label="Select all contacts"
              className="h-3.5 w-3.5 cursor-pointer rounded border-line accent-brand"
            />
          </th>
          <th className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Name</th>
          {CONTACT_COLUMNS.filter((c) => show(c.id)).map((c) => (
            <th key={c.id} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {c.label}
            </th>
          ))}
          <th className="w-10 bg-surface px-4 py-2.5" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => {
          const owner = userById(users, contact.ownerId);
          const company = companies.find((co) => co.id === contact.companyId);
          const isSel = selected.has(contact.id);
          const status = statusOf(contact);
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
              <td className="w-10 px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => onToggle(contact.id)}
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
              {show('email') && (
                <td className="px-4 py-3 align-middle">
                  <span className="block max-w-[200px] truncate text-xs text-ink-muted">{contact.email}</span>
                </td>
              )}
              {show('phone') && (
                <td className="px-4 py-3 align-middle">
                  <span className="whitespace-nowrap text-xs text-ink-muted">{contact.phone}</span>
                </td>
              )}
              {show('company') && (
                <td className="px-4 py-3 align-middle">
                  {company ? (
                    <div className="flex max-w-[150px] items-center gap-1 text-xs text-ink-muted">
                      <Building2 size={11} className="shrink-0 text-ink-subtle" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-subtle">—</span>
                  )}
                </td>
              )}
              {show('tags') && (
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} tone="brand" size="sm">{tag}</Badge>
                    ))}
                    {contact.tags.length > 2 && <Badge tone="neutral" size="sm">+{contact.tags.length - 2}</Badge>}
                    {contact.tags.length === 0 && <span className="text-xs text-ink-subtle">—</span>}
                  </div>
                </td>
              )}
              {show('source') && (
                <td className="px-4 py-3 align-middle">
                  <Badge tone={sourceTone(contact.source)} size="sm">{contact.source}</Badge>
                </td>
              )}
              {show('status') && (
                <td className="px-4 py-3 align-middle">
                  <Badge tone={status.tone} size="sm">{status.label}</Badge>
                </td>
              )}
              {show('owner') && (
                <td className="px-4 py-3 align-middle">
                  {owner ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={owner.name} size="xs" />
                      <span className="whitespace-nowrap text-xs text-ink-muted">{owner.name.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-subtle">—</span>
                  )}
                </td>
              )}
              {show('lastActivity') && (
                <td className="px-4 py-3 align-middle">
                  <span className="whitespace-nowrap text-xs text-ink-subtle">{relativeTime(contact.lastActivityAt)}</span>
                </td>
              )}
              {show('created') && (
                <td className="px-4 py-3 align-middle">
                  <span className="whitespace-nowrap text-xs text-ink-subtle">{dateLabel(contact.createdAt)}</span>
                </td>
              )}
              <td className="w-10 px-2 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                <RowMenu items={rowMenu(contact)} label={`Actions for ${fullName(contact)}`} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
