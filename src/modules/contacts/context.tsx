/**
 * Lightweight module-local context for the Contacts workspace.
 *
 * Holds the small amount of state that several sibling views share within a
 * session: which secondary view is active, the bulk-action job history (so a
 * job started on the Contacts tab shows up on the Bulk Actions tab), and the
 * currently-open contact record (so a company drawer can deep-link into a
 * contact). All session-only; nothing is persisted.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_BULK_JOBS, type BulkJob } from './data';

export type ContactsView = 'contacts' | 'smart-lists' | 'companies' | 'bulk-actions' | 'imports';

interface ContactsModuleValue {
  view: ContactsView;
  setView: (v: ContactsView) => void;

  /** Active smart list / saved view id (shared by the rail + management view). */
  smartList: string;
  setSmartList: (id: string) => void;
  /** Switch to the Contacts table already filtered to a saved view. */
  openSmartList: (id: string) => void;

  jobs: BulkJob[];
  addJob: (job: Omit<BulkJob, 'id' | 'createdAt'> & { createdAt?: string }) => void;

  openContactId: string | null;
  openContact: (id: string) => void;
  closeContact: () => void;
}

const Ctx = createContext<ContactsModuleValue | null>(null);

let jobSeq = 0;

export function ContactsModuleProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ContactsView>('contacts');
  const [smartList, setSmartList] = useState('all');
  const [jobs, setJobs] = useState<BulkJob[]>(INITIAL_BULK_JOBS);
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  const value = useMemo<ContactsModuleValue>(
    () => ({
      view,
      setView,
      smartList,
      setSmartList,
      openSmartList: (id) => {
        setSmartList(id);
        setView('contacts');
      },
      jobs,
      addJob: (job) =>
        setJobs((prev) => [
          { ...job, id: `job_live_${++jobSeq}_${Date.now()}`, createdAt: job.createdAt ?? new Date().toISOString() },
          ...prev,
        ]),
      openContactId,
      openContact: setOpenContactId,
      closeContact: () => setOpenContactId(null),
    }),
    [view, smartList, jobs, openContactId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContactsModule(): ContactsModuleValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useContactsModule must be used within ContactsModuleProvider');
  return ctx;
}
