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

interface StoreState extends DemoData {
  mode: Mode;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: Toast[];

  // ui
  setMode: (m: Mode) => void;
  toggleSidebar: () => void;
  setSearchOpen: (v: boolean) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;

  // mutations (all in-memory, session only)
  resetDemo: () => void;
  addContact: (input: Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone' | 'source'> & { tags?: string[] }) => Contact;
  sendMessage: (conversationId: ID, body: string) => void;
  markConversationRead: (conversationId: ID) => void;
  moveOpportunity: (opportunityId: ID, toStageId: ID) => void;
  addOpportunity: (
    input: Pick<Opportunity, 'name' | 'contactId' | 'pipelineId' | 'stageId'> &
      Partial<Pick<Opportunity, 'monetaryValue' | 'status' | 'ownerId' | 'source' | 'businessName' | 'followerIds'>>,
  ) => Opportunity;
  updateOpportunity: (opportunityId: ID, patch: Partial<Opportunity>) => void;
  removeOpportunity: (opportunityId: ID) => void;
  removeOpportunities: (opportunityIds: ID[]) => void;
  bulkUpdateOpportunities: (
    opportunityIds: ID[],
    patch: Partial<Pick<Opportunity, 'stageId' | 'status' | 'ownerId' | 'pipelineId'>>,
  ) => void;
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

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  pushToast: (t) => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  resetDemo: () => {
    set({ ...fresh() });
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
        o.id === opportunityId ? { ...o, stageId: toStageId, updatedAt: new Date().toISOString() } : o,
      ),
    })),

  addOpportunity: (input) => {
    const nowIso = new Date().toISOString();
    const opp: Opportunity = {
      id: `opp_new_${Date.now()}`,
      name: input.name,
      contactId: input.contactId,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      monetaryValue: input.monetaryValue ?? 0,
      status: input.status ?? 'open',
      ownerId: input.ownerId ?? 'u_me',
      source: input.source,
      businessName: input.businessName,
      followerIds: input.followerIds ?? [],
      activity: { calls: 0, sms: 0, tags: 0, notes: 0, tasks: 0, appointments: 0 },
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    set((s) => ({ opportunities: [opp, ...s.opportunities] }));
    get().pushToast({ title: 'Opportunity created', description: `${opp.name} was added.`, variant: 'success' });
    return opp;
  },

  updateOpportunity: (opportunityId, patch) =>
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === opportunityId ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o,
      ),
    })),

  removeOpportunity: (opportunityId) =>
    set((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== opportunityId) })),

  removeOpportunities: (opportunityIds) => {
    const ids = new Set(opportunityIds);
    set((s) => ({ opportunities: s.opportunities.filter((o) => !ids.has(o.id)) }));
  },

  bulkUpdateOpportunities: (opportunityIds, patch) => {
    const ids = new Set(opportunityIds);
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        ids.has(o.id) ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o,
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
