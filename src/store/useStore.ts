import { create } from 'zustand';
import { generateDemoData } from '@/data/seed';
import type {
  Appointment,
  Company,
  Contact,
  DemoData,
  ID,
  Message,
  Opportunity,
} from '@/types';

let toastSeq = 0;
export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'info';
}

type Mode = 'demo' | 'tutorial';

/** Fields a caller may supply when creating an opportunity; the rest are defaulted. */
export interface AddOpportunityInput {
  name: string;
  contactId: ID;
  pipelineId: ID;
  stageId: ID;
  status?: Opportunity['status'];
  monetaryValue?: number;
  ownerId?: ID;
  source?: string;
  tags?: string[];
  followers?: ID[];
  businessName?: string;
}

/** Any subset of an opportunity may be patched (id is fixed). */
export type OpportunityPatch = Partial<Omit<Opportunity, 'id'>>;

/**
 * Fields a caller may supply when creating a contact. The Add Contact drawer
 * sends the full set; older callers (and tutorials) still satisfy this because
 * everything beyond the four required fields is optional.
 */
export interface AddContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  tags?: string[];
  ownerId?: ID;
  companyId?: ID;
  dnd?: boolean;
  customFields?: Record<string, string | number | boolean>;
}

/** Any subset of a contact may be patched (id is fixed). */
export type ContactPatch = Partial<Omit<Contact, 'id'>>;

/** Fields a caller may supply when creating a company. */
export interface AddCompanyInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
}

interface StoreState extends DemoData {
  mode: Mode;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: Toast[];

  // global dialer (foundation — opens from the topbar phone button; demo-safe)
  dialerOpen: boolean;
  dialerPrefill: string;

  // tutorial engine (Tutorial Mode — in-memory only)
  activeTutorialId: string | null;
  tutorialStep: number;
  completedTutorials: string[];
  completionCardId: string | null;

  // contextual help ("What is this?") — additive, in-memory only.
  // helpMode toggles the question-mark/explain affordance; activeHelpKey is the
  // catalog key currently being explained (see src/help/helpContent.ts).
  helpMode: boolean;
  activeHelpKey: string | null;

  // ui
  setMode: (m: Mode) => void;
  toggleSidebar: () => void;
  setSearchOpen: (v: boolean) => void;
  openDialer: (prefill?: string) => void;
  closeDialer: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;

  // tutorial actions
  startTutorial: (id: string) => void;
  tutorialNext: () => void;
  tutorialBack: () => void;
  exitTutorial: () => void;
  completeTutorial: (id: string) => void;
  dismissCompletion: () => void;

  // contextual help actions
  toggleHelpMode: () => void;
  openHelp: (key: string) => void;
  closeHelp: () => void;

  // mutations (all in-memory, session only)
  resetDemo: () => void;
  addContact: (input: AddContactInput) => Contact;
  updateContact: (id: ID, patch: ContactPatch) => void;
  removeContacts: (ids: ID[]) => void;
  addTagToContacts: (ids: ID[], tag: string) => void;
  removeTagFromContacts: (ids: ID[], tag: string) => void;
  assignOwnerToContacts: (ids: ID[], ownerId: ID) => void;
  addCompany: (input: AddCompanyInput) => Company;
  sendMessage: (conversationId: ID, body: string) => void;
  markConversationRead: (conversationId: ID) => void;
  moveOpportunity: (opportunityId: ID, toStageId: ID) => void;

  // opportunity CRUD (in-memory, session only)
  addOpportunity: (input: AddOpportunityInput) => Opportunity;
  updateOpportunity: (id: ID, patch: OpportunityPatch) => void;
  removeOpportunity: (id: ID) => void;
  removeOpportunities: (ids: ID[]) => void;
  bulkUpdateOpportunities: (ids: ID[], patch: OpportunityPatch) => void;

  bookAppointment: (input: Pick<Appointment, 'calendarId' | 'contactId' | 'title' | 'startTime' | 'endTime' | 'location'>) => void;
  toggleTask: (taskId: ID) => void;
  markAllNotificationsRead: () => void;
}

const fresh = (): DemoData => generateDemoData();

export const useStore = create<StoreState>((set, get) => ({
  ...fresh(),
  mode: 'demo',
  sidebarCollapsed: false,
  searchOpen: false,
  dialerOpen: false,
  dialerPrefill: '',
  toasts: [],
  activeTutorialId: null,
  tutorialStep: 0,
  completedTutorials: [],
  completionCardId: null,
  helpMode: false,
  activeHelpKey: null,

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openDialer: (prefill = '') => set({ dialerOpen: true, dialerPrefill: prefill }),
  closeDialer: () => set({ dialerOpen: false, dialerPrefill: '' }),
  pushToast: (t) => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  // ── Tutorial Mode (Arcade-style guided walkthroughs) ───────────────────────────────
  // All state is in-memory; resetDemo() clears it along with the seeded data.
  startTutorial: (id) =>
    set({ activeTutorialId: id, tutorialStep: 0, completionCardId: null, mode: 'tutorial' }),
  tutorialNext: () => set((s) => ({ tutorialStep: s.tutorialStep + 1 })),
  tutorialBack: () => set((s) => ({ tutorialStep: Math.max(0, s.tutorialStep - 1) })),
  exitTutorial: () => set({ activeTutorialId: null, tutorialStep: 0 }),
  completeTutorial: (id) =>
    set((s) => ({
      activeTutorialId: null,
      tutorialStep: 0,
      completionCardId: id,
      completedTutorials: s.completedTutorials.includes(id)
        ? s.completedTutorials
        : [...s.completedTutorials, id],
    })),
  dismissCompletion: () => set({ completionCardId: null }),

  // ── Contextual help ("What is this?") ──────────────────────────────────────
  // Additive slice for the future help popover (Developer 2). Turning help mode
  // off also clears any open explanation so the two never get out of sync.
  toggleHelpMode: () =>
    set((s) => (s.helpMode ? { helpMode: false, activeHelpKey: null } : { helpMode: true })),
  openHelp: (key) => set({ activeHelpKey: key }),
  closeHelp: () => set({ activeHelpKey: null }),

  resetDemo: () => {
    set({
      ...fresh(),
      activeTutorialId: null,
      tutorialStep: 0,
      completedTutorials: [],
      completionCardId: null,
      helpMode: false,
      activeHelpKey: null,
    });
    get().pushToast({ title: 'Demo reset', description: 'All data restored to the original seed.', variant: 'success' });
  },

  addContact: (input) => {
    const id = `c_new_${Date.now()}`;
    const contact: Contact = {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      companyId: input.companyId,
      tags: input.tags ?? ['lead'],
      source: input.source,
      ownerId: input.ownerId ?? 'u_me',
      dnd: input.dnd ?? false,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      customFields: input.customFields ?? {},
    };
    set((s) => {
      const companies = input.companyId
        ? s.companies.map((co) =>
            co.id === input.companyId ? { ...co, contactIds: [...co.contactIds, id] } : co,
          )
        : s.companies;
      return { contacts: [contact, ...s.contacts], companies };
    });
    get().pushToast({ title: 'Contact added', description: `${contact.firstName} ${contact.lastName} was added.`, variant: 'success' });
    return contact;
  },

  updateContact: (id, patch) =>
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === id ? { ...c, ...patch, id: c.id, lastActivityAt: new Date().toISOString() } : c,
      ),
    })),

  removeContacts: (ids) => {
    const target = new Set(ids);
    set((s) => ({
      contacts: s.contacts.filter((c) => !target.has(c.id)),
      companies: s.companies.map((co) => ({
        ...co,
        contactIds: co.contactIds.filter((cid) => !target.has(cid)),
      })),
    }));
  },

  addTagToContacts: (ids, tag) => {
    const clean = tag.trim();
    if (!clean) return;
    const target = new Set(ids);
    set((s) => ({
      contacts: s.contacts.map((c) =>
        target.has(c.id) && !c.tags.includes(clean) ? { ...c, tags: [...c.tags, clean] } : c,
      ),
    }));
  },

  removeTagFromContacts: (ids, tag) => {
    const target = new Set(ids);
    set((s) => ({
      contacts: s.contacts.map((c) =>
        target.has(c.id) ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c,
      ),
    }));
  },

  assignOwnerToContacts: (ids, ownerId) => {
    const target = new Set(ids);
    set((s) => ({
      contacts: s.contacts.map((c) => (target.has(c.id) ? { ...c, ownerId } : c)),
    }));
  },

  addCompany: (input) => {
    const company: Company = {
      id: `co_new_${Date.now()}`,
      name: input.name.trim(),
      industry: input.industry?.trim() || undefined,
      website: input.website?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      contactIds: [],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ companies: [company, ...s.companies] }));
    get().pushToast({ title: 'Company added', description: `${company.name} was added.`, variant: 'success' });
    return company;
  },

  sendMessage: (conversationId, body) => {
    if (!body.trim()) return;
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const msg: Message = {
      id: `msg_${conversationId}_${Date.now()}`,
      conversationId,
      direction: 'outbound',
      channel: conv.channel,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    set((s) => ({
      messages: [...s.messages, msg],
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messageIds: [...c.messageIds, msg.id], lastMessageAt: msg.createdAt, unread: false }
          : c,
      ),
    }));
  },

  markConversationRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, unread: false } : c)),
    })),

  moveOpportunity: (opportunityId, toStageId) =>
    set((s) => ({
      opportunities: s.opportunities.map((o: Opportunity) =>
        o.id === opportunityId
          ? { ...o, stageId: toStageId, updatedAt: new Date().toISOString(), lastActivityAt: new Date().toISOString() }
          : o,
      ),
    })),

  addOpportunity: (input) => {
    const nowIso = new Date().toISOString();
    const state = get();
    const contact = state.contacts.find((c) => c.id === input.contactId);
    const company = contact?.companyId ? state.companies.find((co) => co.id === contact.companyId) : undefined;
    const ownerId =
      input.ownerId ??
      state.users.find((u) => u.isCurrentUser)?.id ??
      state.users[0]?.id ??
      'u_me';
    const opp: Opportunity = {
      id: `opp_new_${Date.now()}`,
      name: input.name.trim() || (contact ? `${contact.firstName} ${contact.lastName}` : 'New Opportunity'),
      contactId: input.contactId,
      businessName: input.businessName?.trim() || company?.name,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      monetaryValue: input.monetaryValue ?? 0,
      status: input.status ?? 'open',
      ownerId,
      followers: input.followers ?? [],
      source: input.source?.trim() || undefined,
      tags: input.tags ?? [],
      activity: { calls: 0, sms: 0, emails: 0, notes: 0, tasks: 0, appointments: 0 },
      lastActivityAt: nowIso,
      createdBy: state.users.find((u) => u.id === ownerId)?.name ?? 'You',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    set((s) => ({ opportunities: [opp, ...s.opportunities] }));
    get().pushToast({ title: 'Opportunity created', description: `“${opp.name}” was added (demo session).`, variant: 'success' });
    return opp;
  },

  updateOpportunity: (id, patch) =>
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, ...patch, id: o.id, updatedAt: new Date().toISOString() } : o,
      ),
    })),

  removeOpportunity: (id) =>
    set((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== id) })),

  removeOpportunities: (ids) => {
    const target = new Set(ids);
    set((s) => ({ opportunities: s.opportunities.filter((o) => !target.has(o.id)) }));
  },

  bulkUpdateOpportunities: (ids, patch) => {
    const target = new Set(ids);
    const nowIso = new Date().toISOString();
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        target.has(o.id) ? { ...o, ...patch, id: o.id, updatedAt: nowIso } : o,
      ),
    }));
  },

  bookAppointment: (input) => {
    const appt: Appointment = {
      id: `appt_new_${Date.now()}`,
      ...input,
      status: 'confirmed',
    };
    set((s) => ({ appointments: [...s.appointments, appt].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)) }));
    get().pushToast({ title: 'Appointment booked', description: 'Added to the calendar (demo only).', variant: 'success' });
  },

  toggleTask: (taskId) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === 'open' ? 'completed' : 'open' } : t)),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));
