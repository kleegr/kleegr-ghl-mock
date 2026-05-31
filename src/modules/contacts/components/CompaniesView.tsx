import { useMemo, useState, type ReactNode } from 'react';
import { Search, Building2, Plus, Globe, Phone, Users, Briefcase, ExternalLink } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { AddCompanyInput } from '@/store/useStore';
import type { Company } from '@/types';
import { fullName, relativeTime, dateLabel } from '@/utils';
import { Avatar, Badge, Button, EmptyState } from '@/components/ui/primitives';
import { Drawer, Field, INPUT_CLS } from './Drawer';
import { RowMenu } from './RowMenu';
import { useContactsModule } from '../context';

/**
 * Companies screen. Lists the organizations in the account with linked-contact
 * and linked-opportunity counts, supports search, a demo-safe Add Company drawer
 * (writes to the store), and a detail drawer that lists the company's contacts
 * and deep-links into the contact workspace.
 */

const EMPTY_FORM: AddCompanyInput = { name: '', industry: '', website: '', phone: '' };

export function CompaniesView() {
  const companies = useStore((s) => s.companies);
  const contacts = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const addCompany = useStore((s) => s.addCompany);
  const { openContact } = useContactsModule();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddCompanyInput>(EMPTY_FORM);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Opportunity counts keyed by company, resolved through each company's contacts.
  const oppCountByCompany = useMemo(() => {
    const contactToCompany = new Map(contacts.map((c) => [c.id, c.companyId]));
    const counts = new Map<string, number>();
    opportunities.forEach((o) => {
      const companyId = contactToCompany.get(o.contactId);
      if (companyId) counts.set(companyId, (counts.get(companyId) ?? 0) + 1);
    });
    return counts;
  }, [contacts, opportunities]);

  function lastActivity(company: Company): string | null {
    const times = contacts
      .filter((c) => c.companyId === company.id)
      .map((c) => new Date(c.lastActivityAt).getTime());
    if (times.length === 0) return null;
    return new Date(Math.max(...times)).toISOString();
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? companies.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.industry ?? '').toLowerCase().includes(q) ||
            (c.website ?? '').toLowerCase().includes(q),
        )
      : companies;
    return [...list].sort((a, b) => b.contactIds.length - a.contactIds.length);
  }, [companies, search]);

  function submitCompany() {
    if (!form.name.trim()) return;
    addCompany(form);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  const detail = detailId ? companies.find((c) => c.id === detailId) ?? null : null;
  const detailContacts = detail ? contacts.filter((c) => c.companyId === detail.id) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-5 py-2.5">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-7 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Company
        </Button>
        <span className="ml-auto whitespace-nowrap rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-muted">
          {rows.length} {rows.length === 1 ? 'company' : 'companies'}
        </span>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Building2 size={20} />}
            title="No companies found"
            body="Try a different search, or add a company."
            action={
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Add Company
              </Button>
            }
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-line text-left">
                {['Company', 'Industry', 'Phone', 'Contacts', 'Opportunities', 'Last Activity', ''].map((h, i) => (
                  <th
                    key={h || `sp-${i}`}
                    className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((company) => {
                const act = lastActivity(company);
                return (
                  <tr
                    key={company.id}
                    onClick={() => setDetailId(company.id)}
                    className="cursor-pointer border-b border-line/70 transition-colors hover:bg-surface-sunken"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
                          {company.website && (
                            <p className="flex items-center gap-1 truncate text-[11px] text-ink-subtle">
                              <Globe size={10} /> {company.website}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {company.industry ? (
                        <Badge tone="neutral" size="sm">
                          {company.industry}
                        </Badge>
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="whitespace-nowrap text-xs text-ink-muted">{company.phone ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
                        <Users size={12} className="text-ink-subtle" /> {company.contactIds.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
                        <Briefcase size={12} className="text-ink-subtle" /> {oppCountByCompany.get(company.id) ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="whitespace-nowrap text-xs text-ink-subtle">{act ? relativeTime(act) : '—'}</span>
                    </td>
                    <td className="w-10 px-2 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        label={`Actions for ${company.name}`}
                        items={[
                          { label: 'View company', icon: <ExternalLink size={13} />, onClick: () => setDetailId(company.id) },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Company drawer */}
      <Drawer
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Company"
        subtitle="Create a new company record"
        width="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitCompany} disabled={!form.name.trim()}>
              Save Company
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Company Name">
            <input
              className={INPUT_CLS}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Northwind Trading Co"
            />
          </Field>
          <Field label="Industry">
            <input
              className={INPUT_CLS}
              value={form.industry ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              placeholder="Retail"
            />
          </Field>
          <Field label="Website">
            <input
              className={INPUT_CLS}
              value={form.website ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="northwind.example.com"
            />
          </Field>
          <Field label="Phone">
            <input
              className={INPUT_CLS}
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 (555) 010-0190"
            />
          </Field>
        </div>
      </Drawer>

      {/* Company detail drawer */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? 'Company'}
        subtitle={detail?.industry}
        width="md"
      >
        {detail && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Globe size={13} />} label="Website" value={detail.website ?? '—'} />
              <InfoTile icon={<Phone size={13} />} label="Phone" value={detail.phone ?? '—'} />
              <InfoTile icon={<Users size={13} />} label="Contacts" value={String(detail.contactIds.length)} />
              <InfoTile
                icon={<Briefcase size={13} />}
                label="Opportunities"
                value={String(oppCountByCompany.get(detail.id) ?? 0)}
              />
            </div>
            <p className="text-[11px] text-ink-subtle">Created {dateLabel(detail.createdAt)}</p>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
                Linked Contacts ({detailContacts.length})
              </p>
              {detailContacts.length === 0 ? (
                <p className="rounded-lg border border-line bg-surface-sunken/50 px-3 py-4 text-center text-xs text-ink-subtle">
                  No contacts linked to this company yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {detailContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDetailId(null);
                        openContact(c.id);
                      }}
                      className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-left hover:bg-surface-sunken"
                    >
                      <Avatar name={fullName(c)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{fullName(c)}</p>
                        <p className="truncate text-[11px] text-ink-muted">{c.email}</p>
                      </div>
                      <ExternalLink size={13} className="shrink-0 text-ink-subtle" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-sunken/40 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {icon} {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
