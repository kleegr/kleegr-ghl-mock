import { create } from 'zustand';

export type ManualActionKind = 'Call' | 'SMS';
export type ManualActionStatus = 'Pending' | 'Completed';

export interface ManualAction {
  id: string;
  contactId: string;
  workflow: string;
  assignedTo: string;
  type: ManualActionKind;
  status: ManualActionStatus;
  dateAdded: string;
  instructions: string;
}

export interface ConversationSnippetFolder {
  id: string;
  name: string;
  updatedAt: string;
}

export interface ConversationSnippet {
  id: string;
  name: string;
  body: string;
  subject?: string;
  attachments?: string[];
  folderId?: string;
  type: 'Text' | 'Email';
  updatedAt: string;
}

export interface ConversationTriggerLink {
  id: string;
  name: string;
  destinationUrl: string;
  slug: string;
  clicks: number;
  uniqueClicks: number;
  updatedAt: string;
}

export type SlaUnit = 'minutes' | 'hours' | 'days';
export type SlaChannelName =
  | 'Call'
  | 'SMS'
  | 'Email'
  | 'WhatsApp'
  | 'Live Chat'
  | 'Web Chat'
  | 'Facebook Messenger'
  | 'Instagram Messenger'
  | 'TikTok'
  | 'GREEN-API'
  | 'Whatsapp Send Only'
  | 'Kleegr Whatsapp';

export interface ChannelSlaRule {
  enabled: boolean;
  dueSoonValue: number;
  dueSoonUnit: SlaUnit;
  overdueValue: number;
  overdueUnit: SlaUnit;
}

export interface ConversationSlaSettings {
  enabled: boolean;
  mode: 'Common SLA' | 'Channel Specific SLA';
  dueSoonValue: number;
  dueSoonUnit: SlaUnit;
  overdueValue: number;
  overdueUnit: SlaUnit;
  automationHandling: 'Count all responses' | 'Do not count responses' | 'Selected workflows only';
  selectedWorkflows: string[];
  aiAgentResponsesCount: boolean;
  manualDismissPermission: 'All users' | 'Admins only';
  channels: Record<SlaChannelName, ChannelSlaRule>;
}

type AddManualActionInput = Omit<ManualAction, 'id' | 'dateAdded' | 'status'> & {
  status?: ManualActionStatus;
};
type AddSnippetInput = Omit<ConversationSnippet, 'id' | 'updatedAt'>;
type AddFolderInput = Pick<ConversationSnippetFolder, 'name'>;
type AddTriggerLinkInput = Omit<ConversationTriggerLink, 'id' | 'clicks' | 'uniqueClicks' | 'updatedAt'>;

interface ConversationWorkspaceState {
  revision: number;
  manualActions: ManualAction[];
  snippets: ConversationSnippet[];
  folders: ConversationSnippetFolder[];
  triggerLinks: ConversationTriggerLink[];
  settings: ConversationSlaSettings;
  resetForRevision: (revision: number) => void;
  addManualAction: (input: AddManualActionInput) => ManualAction;
  updateManualAction: (id: string, patch: Partial<Omit<ManualAction, 'id'>>) => void;
  deleteManualAction: (id: string) => void;
  completeManualActions: (ids: string[]) => void;
  addSnippet: (input: AddSnippetInput) => ConversationSnippet;
  updateSnippet: (id: string, patch: Partial<Omit<ConversationSnippet, 'id'>>) => void;
  deleteSnippet: (id: string) => void;
  addFolder: (input: AddFolderInput) => ConversationSnippetFolder;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  addTriggerLink: (input: AddTriggerLinkInput) => ConversationTriggerLink;
  updateTriggerLink: (id: string, patch: Partial<Omit<ConversationTriggerLink, 'id'>>) => void;
  deleteTriggerLink: (id: string) => void;
  simulateTriggerClick: (id: string) => void;
  updateSettings: (patch: Partial<ConversationSlaSettings>) => void;
}

let sequence = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${++sequence}`;
const now = () => new Date().toISOString();
const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

const seededFolders = (): ConversationSnippetFolder[] => [
  { id: 'snippet_folder_sales', name: 'Sales follow-up', updatedAt: daysAgo(2) },
  { id: 'snippet_folder_support', name: 'Customer support', updatedAt: daysAgo(5) },
  { id: 'snippet_folder_scheduling', name: 'Scheduling', updatedAt: daysAgo(8) },
];

const seededSnippets = (): ConversationSnippet[] => [
  { id: 'snippet_1', name: 'Appointment options', body: 'Thanks for reaching out! I’m happy to help. What day works best for you?', folderId: 'snippet_folder_scheduling', type: 'Text', updatedAt: daysAgo(0, 9) },
  { id: 'snippet_2', name: 'Proposal follow-up', body: 'Hi {{contact.first_name}}, I wanted to make sure you received the proposal. What questions can I answer?', folderId: 'snippet_folder_sales', type: 'Text', updatedAt: daysAgo(1, 15) },
  { id: 'snippet_3', name: 'Book a consultation', body: 'You can choose the best time here: {{trigger_link.consultation_calendar}}', folderId: 'snippet_folder_scheduling', type: 'Text', updatedAt: daysAgo(2, 12) },
  { id: 'snippet_4', name: 'Welcome email', subject: 'Welcome to Demo Business, {{contact.first_name}}', body: 'Welcome, {{contact.first_name}}! We’re excited to work with you. Here is what to expect during onboarding.', attachments: ['Getting-started-guide.pdf'], folderId: 'snippet_folder_sales', type: 'Email', updatedAt: daysAgo(3, 11) },
  { id: 'snippet_5', name: 'Payment link', body: 'Here is your secure payment link: {{trigger_link.invoice_payment}}. Let me know if you need any help.', folderId: 'snippet_folder_support', type: 'Text', updatedAt: daysAgo(4, 16) },
  { id: 'snippet_6', name: 'Quick acknowledgement', body: 'Great question — let me confirm that for you and get right back to you.', type: 'Text', updatedAt: daysAgo(5, 13) },
  { id: 'snippet_7', name: 'Missed call', body: 'Hi {{contact.first_name}}, sorry we missed your call. Is now a good time to connect?', folderId: 'snippet_folder_support', type: 'Text', updatedAt: daysAgo(6, 10) },
  { id: 'snippet_8', name: 'Review request', body: 'Thank you for choosing us. Would you mind sharing your experience? {{trigger_link.review_request}}', type: 'Text', updatedAt: daysAgo(7, 14) },
  { id: 'snippet_9', name: 'Reschedule confirmation', body: 'Your appointment has been moved to {{appointment.start_time}}. Reply here if anything changes.', folderId: 'snippet_folder_scheduling', type: 'Text', updatedAt: daysAgo(8, 9) },
  { id: 'snippet_10', name: 'Support resolved', body: 'Everything should now be working. Please try once more and tell me if you still see the issue.', folderId: 'snippet_folder_support', type: 'Text', updatedAt: daysAgo(9, 15) },
  { id: 'snippet_11', name: 'Annual plan details', subject: 'Your annual plan options', body: 'The annual option includes a 12% discount, implementation support, and two team training sessions.', folderId: 'snippet_folder_sales', type: 'Email', updatedAt: daysAgo(11, 10) },
  { id: 'snippet_12', name: 'Documents received', body: 'Thanks — we received your documents and the team is reviewing them now.', folderId: 'snippet_folder_support', type: 'Text', updatedAt: daysAgo(13, 12) },
  { id: 'snippet_13', name: 'After-hours response', body: 'Thanks for your message. Our team is away right now and will reply the next business morning.', type: 'Text', updatedAt: daysAgo(15, 17) },
  { id: 'snippet_14', name: 'Demo invitation', body: 'I’d be glad to show you the complete workflow. Pick a time here: {{trigger_link.product_demo}}', folderId: 'snippet_folder_sales', type: 'Text', updatedAt: daysAgo(18, 11) },
];

const seededManualActions = (): ManualAction[] => [
  { id: 'manual_1', contactId: 'c_1', workflow: 'New Lead Speed-to-Contact', assignedTo: 'Demo User', type: 'Call', status: 'Pending', dateAdded: daysAgo(0, 9), instructions: 'Call within five minutes and confirm what the lead is looking for.' },
  { id: 'manual_2', contactId: 'c_2', workflow: 'Proposal Follow-up', assignedTo: 'Priya Raman', type: 'SMS', status: 'Pending', dateAdded: daysAgo(0, 8), instructions: 'Send the proposal follow-up snippet and ask whether they have questions.' },
  { id: 'manual_3', contactId: 'c_4', workflow: 'Appointment Reminder', assignedTo: 'Marcus Bell', type: 'SMS', status: 'Pending', dateAdded: daysAgo(1, 16), instructions: 'Confirm tomorrow’s appointment and share the arrival instructions.' },
  { id: 'manual_4', contactId: 'c_7', workflow: 'No-show Recovery', assignedTo: 'Demo User', type: 'Call', status: 'Pending', dateAdded: daysAgo(1, 13), instructions: 'Offer two new appointment times and record the outcome.' },
  { id: 'manual_5', contactId: 'c_9', workflow: 'Payment Follow-up', assignedTo: 'Dana Cole', type: 'SMS', status: 'Pending', dateAdded: daysAgo(2, 10), instructions: 'Share the secure payment link and offer assistance.' },
  { id: 'manual_6', contactId: 'c_11', workflow: 'Onboarding Check-in', assignedTo: 'Priya Raman', type: 'Call', status: 'Completed', dateAdded: daysAgo(3, 14), instructions: 'Check progress on the onboarding checklist.' },
  { id: 'manual_7', contactId: 'c_14', workflow: 'Review Request', assignedTo: 'Marcus Bell', type: 'SMS', status: 'Completed', dateAdded: daysAgo(5, 11), instructions: 'Thank the customer and share the review link.' },
];

const seededTriggerLinks = (): ConversationTriggerLink[] => [
  { id: 'trigger_1', name: 'Consultation calendar', destinationUrl: 'https://demo.example.com/book/consultation', slug: 'consultation_calendar', clicks: 184, uniqueClicks: 142, updatedAt: daysAgo(1, 13) },
  { id: 'trigger_2', name: 'Invoice payment', destinationUrl: 'https://demo.example.com/pay/invoice', slug: 'invoice_payment', clicks: 96, uniqueClicks: 82, updatedAt: daysAgo(2, 10) },
  { id: 'trigger_3', name: 'Product demo', destinationUrl: 'https://demo.example.com/demo', slug: 'product_demo', clicks: 231, uniqueClicks: 177, updatedAt: daysAgo(3, 15) },
  { id: 'trigger_4', name: 'Customer review', destinationUrl: 'https://demo.example.com/review', slug: 'review_request', clicks: 74, uniqueClicks: 68, updatedAt: daysAgo(6, 12) },
  { id: 'trigger_5', name: 'Onboarding checklist', destinationUrl: 'https://demo.example.com/start', slug: 'onboarding_checklist', clicks: 119, uniqueClicks: 103, updatedAt: daysAgo(8, 9) },
];

const SLA_CHANNELS: SlaChannelName[] = [
  'Call',
  'SMS',
  'Email',
  'WhatsApp',
  'Live Chat',
  'Web Chat',
  'Facebook Messenger',
  'Instagram Messenger',
  'TikTok',
  'GREEN-API',
  'Whatsapp Send Only',
  'Kleegr Whatsapp',
];

const seededSettings = (): ConversationSlaSettings => ({
  enabled: false,
  mode: 'Common SLA',
  dueSoonValue: 3,
  dueSoonUnit: 'minutes',
  overdueValue: 5,
  overdueUnit: 'minutes',
  automationHandling: 'Count all responses',
  selectedWorkflows: [],
  aiAgentResponsesCount: true,
  manualDismissPermission: 'All users',
  channels: Object.fromEntries(
    SLA_CHANNELS.map((channel) => [
      channel,
      channel === 'Email'
        ? { enabled: true, dueSoonValue: 30, dueSoonUnit: 'minutes' as const, overdueValue: 1, overdueUnit: 'hours' as const }
        : channel === 'SMS'
          ? { enabled: true, dueSoonValue: 3, dueSoonUnit: 'minutes' as const, overdueValue: 5, overdueUnit: 'minutes' as const }
          : { enabled: false, dueSoonValue: 5, dueSoonUnit: 'minutes' as const, overdueValue: 15, overdueUnit: 'minutes' as const },
    ]),
  ) as Record<SlaChannelName, ChannelSlaRule>,
});

function freshWorkspace(revision: number) {
  sequence = 0;
  return {
    revision,
    manualActions: seededManualActions(),
    snippets: seededSnippets(),
    folders: seededFolders(),
    triggerLinks: seededTriggerLinks(),
    settings: seededSettings(),
  };
}

export const useConversationWorkspaceStore = create<ConversationWorkspaceState>((set, get) => ({
  ...freshWorkspace(0),
  resetForRevision: (revision) => {
    if (get().revision === revision) return;
    set(freshWorkspace(revision));
  },
  addManualAction: (input) => {
    const item: ManualAction = { ...input, id: nextId('manual'), status: input.status ?? 'Pending', dateAdded: now() };
    set((state) => ({ manualActions: [item, ...state.manualActions] }));
    return item;
  },
  updateManualAction: (id, patch) => set((state) => ({
    manualActions: state.manualActions.map((item) => item.id === id ? { ...item, ...patch, id: item.id } : item),
  })),
  deleteManualAction: (id) => set((state) => ({ manualActions: state.manualActions.filter((item) => item.id !== id) })),
  completeManualActions: (ids) => {
    const targets = new Set(ids);
    set((state) => ({ manualActions: state.manualActions.map((item) => targets.has(item.id) ? { ...item, status: 'Completed' as const } : item) }));
  },
  addSnippet: (input) => {
    const item: ConversationSnippet = { ...input, id: nextId('snippet'), updatedAt: now() };
    set((state) => ({ snippets: [item, ...state.snippets] }));
    return item;
  },
  updateSnippet: (id, patch) => set((state) => ({
    snippets: state.snippets.map((item) => item.id === id ? { ...item, ...patch, id: item.id, updatedAt: now() } : item),
  })),
  deleteSnippet: (id) => set((state) => ({ snippets: state.snippets.filter((item) => item.id !== id) })),
  addFolder: (input) => {
    const item: ConversationSnippetFolder = { id: nextId('snippet_folder'), name: input.name.trim(), updatedAt: now() };
    set((state) => ({ folders: [item, ...state.folders] }));
    return item;
  },
  updateFolder: (id, name) => set((state) => ({
    folders: state.folders.map((item) => item.id === id ? { ...item, name: name.trim(), updatedAt: now() } : item),
  })),
  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter((item) => item.id !== id),
    snippets: state.snippets.map((item) => item.folderId === id ? { ...item, folderId: undefined, updatedAt: now() } : item),
  })),
  addTriggerLink: (input) => {
    const item: ConversationTriggerLink = { ...input, id: nextId('trigger'), clicks: 0, uniqueClicks: 0, updatedAt: now() };
    set((state) => ({ triggerLinks: [item, ...state.triggerLinks] }));
    return item;
  },
  updateTriggerLink: (id, patch) => set((state) => ({
    triggerLinks: state.triggerLinks.map((item) => item.id === id ? { ...item, ...patch, id: item.id, updatedAt: now() } : item),
  })),
  deleteTriggerLink: (id) => set((state) => ({ triggerLinks: state.triggerLinks.filter((item) => item.id !== id) })),
  simulateTriggerClick: (id) => set((state) => ({
    triggerLinks: state.triggerLinks.map((item) => item.id === id ? { ...item, clicks: item.clicks + 1, uniqueClicks: item.uniqueClicks + (item.clicks % 3 === 0 ? 1 : 0), updatedAt: now() } : item),
  })),
  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));
