import { useNavigate } from 'react-router-dom';
import { Users, Building2, Filter, ListChecks, Upload, Sliders, ExternalLink } from 'lucide-react';
import { cx } from '@/utils';
import { useContactsModule, type ContactsView } from '../context';

const TABS: { id: ContactsView; label: string; icon: typeof Users }[] = [
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'smart-lists', label: 'Smart Lists', icon: Filter },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'bulk-actions', label: 'Bulk Actions', icon: ListChecks },
  { id: 'imports', label: 'Imports', icon: Upload },
];

/** Secondary navigation for the Contacts area (GHL renders a sub-nav under the
 *  page title). Custom Fields lives in Settings, so it deep-links there. */
export function SecondaryNav() {
  const { view, setView } = useContactsModule();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-line bg-surface px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = view === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={cx(
              'relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
              active ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            <Icon size={15} /> {t.label}
          </button>
        );
      })}
      <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
      <button
        onClick={() => navigate('/settings/custom-fields')}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
      >
        <Sliders size={15} /> Custom Fields <ExternalLink size={12} className="opacity-60" />
      </button>
    </div>
  );
}
