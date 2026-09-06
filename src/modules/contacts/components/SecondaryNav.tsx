import { useNavigate } from 'react-router-dom';
import { cx } from '@/utils';
import { useContactsModule, type ContactsView } from '../context';

const TABS: { id: ContactsView; label: string }[] = [
  { id: 'contacts', label: 'Smart Lists' },
  { id: 'bulk-actions', label: 'Bulk Actions' },
];

/** Secondary navigation for the Contacts area (GHL renders a sub-nav under the
 *  page title). Custom Fields lives in Settings, so it deep-links there. */
export function SecondaryNav() {
  const { view, setView } = useContactsModule();
  const navigate = useNavigate();

  return (
    <div className="mt-2.5 flex h-[39px] items-end gap-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => {
        const active = view === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={cx(
              'relative flex h-full items-center whitespace-nowrap border-b-2 px-0 pt-0.5 text-[13px] font-medium transition-colors',
              active ? 'border-[#20c5e8] text-white' : 'border-transparent text-white/65 hover:text-white',
            )}
          >
            {t.label}
          </button>
        );
      })}
      <button
        onClick={() => navigate('/settings/custom-fields')}
        className="flex h-full items-center whitespace-nowrap border-b-2 border-transparent pt-0.5 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
      >
        Custom Fields
      </button>
      <button
        onClick={() => navigate('/productivity')}
        className="flex h-full items-center whitespace-nowrap border-b-2 border-transparent pt-0.5 text-[13px] font-medium text-white/65 transition-colors hover:text-white"
      >
        Tasks
      </button>
      <button
        onClick={() => setView('companies')}
        className={cx(
          'flex h-full items-center whitespace-nowrap border-b-2 pt-0.5 text-[13px] font-medium transition-colors',
          view === 'companies' ? 'border-[#20c5e8] text-white' : 'border-transparent text-white/65 hover:text-white',
        )}
      >
        Companies
      </button>
    </div>
  );
}
