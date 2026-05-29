import { create } from 'zustand';
import { generateDemoData } from '@/data/seed';
import type {
  Appointment,
  Channel,
  Contact,
  Conversation,
  DemoData,
  ID,
  Message,
  Opportunity,
  Pipeline,
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
  addOpportunity: (
    input: Pick<Opportunity, 'name' | 'contactId' | 'pipelineId' | 'stageId' | 'status' | 'monetaryValue' | 'ownerId'> & { source?: string },
  ) => Opportunity;
  updateOpportunity: (
    id: ID,
    patch: Partial<Pick<Opportunity, 'name' | 'pipelineId' | 'stageId' | 'status' | 'monetaryValue' | 'ownerId' | 'source'>>,
  ) => void;
  removeOpportunity: (id: ID) => void;
  removeOpportunities: (ids: ID[]) => void;
  bulkUpdateOpportunities: (ids: ID[], patch: Partial<Pick<Opportunity, 'stageId' | 'status' | 'ownerId'>>) => void;
  addPipeline: (input: { name: string; stageNames: string[] }) => Pipeline;
  startConversation: (input: { contactId: ID; channel: Channel; body: string; subject?: string }) => Conversation;
  bookAppointment: (input: Pick<Appointment, 'calendarId' | 'contactId' | 'title' | 'startTime' | 'endTime' | 'location'>) => void;
  cancelAppointment: (id: ID) => void;
  removeContacts: (ids: ID[]) => void;
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

  // ── Tutorial Mode (Arcade-style guided walkthroughs) ──────────────────────
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
        o.id === opportunityId ? { ...o, stageId: toStageId, updatedAt: new Date().toISOString() } : o,
      ),
    })),

  addOpportunity: (input) => {
    const now = new Date().toISOString();
    const opp: Opportunity = {
      id: `opp_new_${Date.now()}`,
      name: input.name.trim() || 'Untitled opportunity',
      contactId: input.contactId,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      monetaryValue: Number.isFinite(input.monetaryValue) ? input.monetaryValue : 0,
      status: input.status,
      ownerId: input.ownerId,
      source: input.source?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ opportunities: [opp, ...s.opportunities] }));
    get().pushToast({ title: 'Opportunity created', description: `“${opp.name}” was added to the pipeline.`, variant: 'success' });
    return opp;
  },

  updateOpportunity: (id, patch) => {
    const clean: typeof patch = { ...patch };
    if (typeof clean.source === 'string') clean.source = clean.source.trim() || undefined;
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, ...clean, updatedAt: new Date().toISOString() } : o,
      ),
    }));
    get().pushToast({ title: 'Opportunity updated', description: 'Your changes were saved.', variant: 'success' });
  },

  removeOpportunity: (id) => {
    set((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== id) }));
    get().pushToast({ title: 'Opportunity deleted', description: 'The opportunity was removed.', variant: 'success' });
  },

  removeOpportunities: (ids) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((s) => ({ opportunities: s.opportunities.filter((o) => !idSet.has(o.id)) }));
    get().pushToast({
      title: `${ids.length} opportunit${ids.length === 1 ? 'y' : 'ies'} deleted`,
      description: 'The selected opportunities were removed.',
      variant: 'success',
    });
  },

  bulkUpdateOpportunities: (ids, patch) => {
    if (ids.length === 0 || Object.keys(patch).length === 0) return;
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    set((s) => ({
      opportunities: s.opportunities.map((o) => (idSet.has(o.id) ? { ...o, ...patch, updatedAt: now } : o)),
    }));
    get().pushToast({
      title: `${ids.length} opportunit${ids.length === 1 ? 'y' : 'ies'} updated`,
      description: 'Bulk changes were applied.',
      variant: 'success',
    });
  },

  addPipeline: (input) => {
    const names = input.stageNames.map((n) => n.trim()).filter(Boolean);
    const safeNames = names.length ? names : ['New Stage'];
    const base = Date.now();
    const pipeline: Pipeline = {
      id: `pipe_new_${base}`,
      name: input.name.trim() || 'Untitled pipeline',
      stages: safeNames.map((name, i) => ({ id: `stage_new_${base}_${i}`, name, order: i })),
    };
    set((s) => ({ pipelines: [...s.pipelines, pipeline] }));
    get().pushToast({
      title: 'Pipeline created',
      description: `“${pipeline.name}” was added with ${pipeline.stages.length} stage${pipeline.stages.length === 1 ? '' : 's'}.`,
      variant: 'success',
    });
    return pipeline;
  },

  startConversation: (input) => {
    const now = new Date().toISOString();
    const convId = `conv_new_${Date.now()}`;
    const msg: Message = {
      id: `msg_${convId}`,
      conversationId: convId,
      direction: 'outbound',
      channel: input.channel,
      body: input.body.trim(),
      createdAt: now,
      status: 'sent',
    };
    const me = get().users.find((u) => u.isCurrentUser);
    const conv: Conversation = {
      id: convId,
      contactId: input.contactId,
      channel: input.channel,
      unread: false,
      lastMessageAt: now,
      assignedTo: me?.id,
      messageIds: [msg.id],
    };
    set((s) => ({
      conversations: [conv, ...s.conversations],
      messages: [...s.messages, msg],
    }));
    get().pushToast({ title: 'Message sent', description: 'A new conversation was started (demo only).', variant: 'success' });
    return conv;
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

  cancelAppointment: (id) => {
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
    }));
    get().pushToast({ title: 'Appointment cancelled', description: 'The appointment was marked cancelled (demo only).', variant: 'success' });
  },

  removeContacts: (ids) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((s) => ({ contacts: s.contacts.filter((c) => !idSet.has(c.id)) }));
    get().pushToast({
      title: `${ids.length} contact${ids.length === 1 ? '' : 's'} deleted`,
      description: 'The selected contacts were removed.',
      variant: 'success',
    });
  },

  toggleTask: (taskId) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === 'open' ? 'completed' : 'open' } : t)),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));
