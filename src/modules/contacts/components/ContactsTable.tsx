import { Building2, Mail, MessageSquare, Phone } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fullName, userById, cx } from '@/utils';
import { Avatar, EmptyState } from '@/components/ui/primitives';
import type { Contact } from '@/types';
import { RowMenu, type MenuItem } from './RowMenu';

/** Default columns mirror the live Kleegr Smart Lists table. */
export const CONTACT_COLUMNS: { id: string; label: string }[] = [
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'company', label: 'Business name' },
  { id: 'created', label: 'Created (EDT)' },
  { id: 'lastActivity', label: 'Last activity (EDT)' },
  { id: 'tags', label: 'Tags' },
  { id: 'source', label: 'Source' },
  { id: 'status', label: 'Status' },
  { id: 'owner', label: 'Owner' },
];

function contactStatus(contact: Contact): string {
  if (contact.tags.some((tag) => tag === 'vip' || tag === 'past-client')) return 'Customer';
  if (contact.tags.some((tag) => tag === 'hot' || tag === 'consult-booked')) return 'Hot Lead';
  if (contact.tags.includes('lead')) return 'Lead';
  return 'Contact';
}

const EASTERN_DATE_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function easternDateTime(iso: string): string {
  return EASTERN_DATE_TIME.format(new Date(iso));
}

const HEAD_CELL =
  'h-[38px] whitespace-nowrap border-r border-[#e5e9ef] bg-[#fbfcfd] px-3 text-left text-[11px] font-semibold text-[#667085]';
const BODY_CELL = 'h-[38px] border-r border-[#e5e9ef] px-3 align-middle';

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

  const visibleIds = contacts.map((contact) => contact.id);
  const allSelected = selected.size > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const show = (id: string) => visibleColumns.has(id);

  return (
    <table className="w-full min-w-[1180px] table-fixed border-collapse text-[12px]">
      <thead className="sticky top-0 z-[2] border-b border-[#dfe4eb]">
        <tr>
          <th className="h-[38px] w-11 border-r border-[#e5e9ef] bg-[#fbfcfd] px-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(element) => {
                if (element) element.indeterminate = someSelected;
              }}
              onChange={onToggleAll}
              aria-label="Select all contacts"
              className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd3df] accent-[#1689f4]"
            />
          </th>
          <th className={cx(HEAD_CELL, 'w-[230px]')}>Contact name</th>
          {show('phone') && <th className={cx(HEAD_CELL, 'w-[150px]')}>Phone</th>}
          {show('email') && <th className={cx(HEAD_CELL, 'w-[220px]')}>Email</th>}
          {show('company') && <th className={cx(HEAD_CELL, 'w-[170px]')}>Business name</th>}
          {show('created') && <th className={cx(HEAD_CELL, 'w-[170px]')}>Created (EDT)</th>}
          {show('lastActivity') && <th className={cx(HEAD_CELL, 'w-[170px]')}>Last activity (EDT)</th>}
          {show('tags') && <th className={cx(HEAD_CELL, 'w-[190px]')}>Tags</th>}
          {show('source') && <th className={cx(HEAD_CELL, 'w-[135px]')}>Source</th>}
          {show('status') && <th className={cx(HEAD_CELL, 'w-[110px]')}>Status</th>}
          {show('owner') && <th className={cx(HEAD_CELL, 'w-[145px]')}>Owner</th>}
          <th className="h-[38px] w-10 bg-[#fbfcfd]" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => {
          const owner = userById(users, contact.ownerId);
          const company = companies.find((item) => item.id === contact.companyId);
          const isSelected = selected.has(contact.id);

          return (
            <tr
              key={contact.id}
              data-tour="contacts.row"
              onClick={() => onRowClick(contact)}
              className={cx(
                'group h-[38px] cursor-pointer border-b border-[#e8ebf0] bg-white transition-colors hover:bg-[#f7faff]',
                isSelected && 'bg-[#eef6ff]',
              )}
            >
              <td className="h-[38px] w-11 border-r border-[#e5e9ef] px-3 align-middle" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(contact.id)}
                  aria-label={`Select ${fullName(contact)}`}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd3df] accent-[#1689f4]"
                />
              </td>
              <td className={cx(BODY_CELL, 'w-[230px]')}>
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={fullName(contact)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-4 text-[#344054]">{fullName(contact)}</p>
                    {contact.dnd && <span className="text-[9px] font-semibold leading-none text-[#d92d20]">DND</span>}
                  </div>
                  <span className="hidden shrink-0 items-center gap-0.5 text-[#98a2b3] xl:flex">
                    <span className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#e8f2ff] hover:text-[#1689f4]"><Phone size={10} /></span>
                    <span className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#e8f2ff] hover:text-[#1689f4]"><Mail size={10} /></span>
                    <span className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#e8f2ff] hover:text-[#1689f4]"><MessageSquare size={10} /></span>
                  </span>
                </div>
              </td>
              {show('phone') && (
                <td className={cx(BODY_CELL, 'w-[150px]')}>
                  <span className="block truncate text-[#475467]">{contact.phone || '—'}</span>
                </td>
              )}
              {show('email') && (
                <td className={cx(BODY_CELL, 'w-[220px]')}>
                  <span className="block truncate text-[#475467]">{contact.email || '—'}</span>
                </td>
              )}
              {show('company') && (
                <td className={cx(BODY_CELL, 'w-[170px]')}>
                  {company ? (
                    <span className="flex min-w-0 items-center gap-1.5 text-[#475467]">
                      <Building2 size={11} className="shrink-0 text-[#98a2b3]" />
                      <span className="truncate">{company.name}</span>
                    </span>
                  ) : (
                    <span className="text-[#98a2b3]">—</span>
                  )}
                </td>
              )}
              {show('created') && (
                <td className={cx(BODY_CELL, 'w-[170px] whitespace-nowrap text-[#667085]')}>{easternDateTime(contact.createdAt)}</td>
              )}
              {show('lastActivity') && (
                <td className={cx(BODY_CELL, 'w-[170px] whitespace-nowrap text-[#667085]')}>{easternDateTime(contact.lastActivityAt)}</td>
              )}
              {show('tags') && (
                <td className={cx(BODY_CELL, 'w-[190px]')}>
                  <div className="flex items-center gap-1 overflow-hidden">
                    {contact.tags.length === 0 && <span className="text-[#98a2b3]">—</span>}
                    {contact.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="max-w-[78px] truncate rounded-[4px] bg-[#eef1f4] px-1.5 py-0.5 text-[10px] font-medium text-[#475467]">
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 2 && <span className="text-[10px] text-[#667085]">+{contact.tags.length - 2}</span>}
                  </div>
                </td>
              )}
              {show('source') && <td className={cx(BODY_CELL, 'w-[135px] truncate text-[#667085]')}>{contact.source}</td>}
              {show('status') && (
                <td className={cx(BODY_CELL, 'w-[110px]')}>
                  <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[10px] font-semibold text-[#175cd3]">{contactStatus(contact)}</span>
                </td>
              )}
              {show('owner') && (
                <td className={cx(BODY_CELL, 'w-[145px]')}>
                  {owner ? (
                    <span className="flex items-center gap-1.5 text-[#475467]">
                      <Avatar name={owner.name} size="xs" />
                      <span className="truncate">{owner.name}</span>
                    </span>
                  ) : (
                    <span className="text-[#98a2b3]">—</span>
                  )}
                </td>
              )}
              <td className="h-[38px] w-10 px-1.5 text-right align-middle" onClick={(event) => event.stopPropagation()}>
                <span className="opacity-40 transition-opacity group-hover:opacity-100">
                  <RowMenu items={rowMenu(contact)} label={`Actions for ${fullName(contact)}`} />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
