import { create } from 'zustand';
import { generateDemoData } from '@/data/seed';
import type {
  Appointment,
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

interface StoreState extends DemoData {
  mode: Mode;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: Toast[];

  // tutorial engine (Tutorial Mode — in-memory only)
  activeTutorialId: string | null;
  tutorialStep: number;
  completedTutorials: string[];
  completionCardId: string | null;

  // ui
  setMode: (m: Mode) => void;
  toggleSidebar: () => void;
  setSearchOpen: (v: boolean) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;

  // tutorial actions
  startTutorial: (id: string) => void;
  tutorialNext: () => void;
  tutorialBack: () => void;
  exitTutorial: () => void;
  completeTutorial: (id: string) => void;
  dismissCompletion: () => void;

  // mutations (all in-memory, session only)
  resetDemo: () => void;
  addContact: (input: Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone' | 'source'> & { tags?: string[] }) => Contact;
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
  toasts: [],
  activeTutorialId: null,
  tutorialStep: 0,
  completedTutorials: [],
  completionCardId: null,

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  pushToast: (t) => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  // ── Tutorial Mode (Arcade-style guided walkthroughs) ────────────────────────
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

  resetDemo: () => {
    set({
      ...fresh(),
      activeTutorialId: null,
      tutorialStep: 0,
      completedTutorials: [],
      completionCardId: null,
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
      tags: input.tags ?? ['lead'],
      source: input.source,
      ownerId: 'u_me',
      dnd: false,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      customFields: {},
    };
    set((s) => ({ contacts: [contact, ...s.contacts] }));
    get().pushToast({ title: 'Contact added', description: `${contact.firstName} ${contact.lastName} was added.`, variant: 'success' });
    return contact;
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
