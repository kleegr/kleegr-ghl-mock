import { Building2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, dateLabel, userById } from '@/utils';
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

  if (contacts.length === 0) {
    return <EmptyState title="No contacts found" body="Try adjusting your search or filters." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
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
            return (
              <tr
                key={contact.id}
                data-tour="contacts.row"
                onClick={() => onRowClick(contact)}
                className="cursor-pointer border-b border-line/70 transition-colors hover:bg-surface-sunken"
              >
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
