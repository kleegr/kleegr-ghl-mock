import { ContactsModuleProvider, useContactsModule } from './context';
import { SecondaryNav } from './components/SecondaryNav';
import { ContactsView } from './components/ContactsView';
import { SmartListsView } from './components/SmartListsView';
import { CompaniesView } from './components/CompaniesView';
import { BulkActionsView } from './components/BulkActionsView';
import { ImportsView } from './components/ImportsView';
import { ContactWorkspace } from './components/ContactWorkspace';

/**
 * Contacts / CRM module.
 *
 * A self-contained workspace under the single /contacts route: a secondary nav
 * switches between Contacts, Smart Lists, Companies, Bulk Actions and Imports
 * (Custom Fields lives in Settings and is deep-linked). The full contact record
 * opens as a full-screen workspace overlay. No new top-level routes are added,
 * so the smoke + tutorial checks stay green; the "add a contact" tutorial flow
 * still drives contacts.page / addButton / addModal / addSubmit.
 */
function ContactsBody() {
  const { view } = useContactsModule();
  return (
    <div data-tour="contacts.page" className="flex h-full min-h-[640px] flex-col bg-[#f3f5f8]">
      <div className="h-[90px] shrink-0 bg-[#102a43] px-5 pt-4 text-white">
        <h1 className="font-display text-[21px] font-semibold leading-7 tracking-[-0.01em]">Contacts</h1>
        <SecondaryNav />
      </div>
      <div className="min-h-0 flex-1">
        {view === 'contacts' && <ContactsView />}
        {view === 'smart-lists' && <SmartListsView />}
        {view === 'companies' && <CompaniesView />}
        {view === 'bulk-actions' && <BulkActionsView />}
        {view === 'imports' && <ImportsView />}
      </div>
      <ContactWorkspace />
    </div>
  );
}

export function Contacts() {
  return (
    <ContactsModuleProvider>
      <ContactsBody />
    </ContactsModuleProvider>
  );
}
