import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Contact } from '@/types';

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';

export interface ConversationNote {
  id: string;
  contactId: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export type TicketStage =
  | 'new'
  | 'triage'
  | 'working'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ConversationTicketMessage {
  id: string;
  kind: 'customer' | 'agent' | 'internal';
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTicket {
  id: string;
  contactId: string;
  number: string;
  subject: string;
  description: string;
  stage: TicketStage;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  tags: string[];
  source: 'email' | 'chat' | 'internal';
  messages: ConversationTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ConversationDocumentKind = 'proposal' | 'contract' | 'estimate' | 'form' | 'other';
export type ConversationDocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'void';

export interface ConversationDocument {
  id: string;
  contactId: string;
  name: string;
  kind: ConversationDocumentKind;
  status: ConversationDocumentStatus;
  sizeLabel: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationPaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export interface ConversationPayment {
  id: string;
  contactId: string;
  description: string;
  amount: number;
  currency: string;
  kind: 'charge' | 'refund';
  status: ConversationPaymentStatus;
  method: string;
  refundedAmount: number;
  parentPaymentId?: string;
  /** Display date alias retained alongside the audit timestamps for simple panels. */
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectTaskStatus = 'backlog' | 'to_do' | 'in_progress' | 'in_review' | 'done';
export type ProjectTaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type ProjectTaskType =
  | 'task'
  | 'bug'
  | 'feature'
  | 'story'
  | 'epic'
  | 'milestone'
  | 'improvement'
  | 'chore';

export interface ConversationProjectTask {
  id: string;
  contactId: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  owner: string;
  project: string;
  dueDate: string;
  type: ProjectTaskType;
  createdAt: string;
  updatedAt: string;
}

export type ConversationActivityKind =
  | 'note'
  | 'ticket'
  | 'document'
  | 'payment'
  | 'project_task'
  | 'conversation'
  | 'contact';

export interface ConversationActivity {
  id: string;
  contactId: string;
  kind: ConversationActivityKind;
  title: string;
  detail?: string;
  actor: string;
  linkedRecordId?: string;
  createdAt: string;
}

export interface ContactConversationRecords {
  notes: ConversationNote[];
  tickets: ConversationTicket[];
  documents: ConversationDocument[];
  payments: ConversationPayment[];
  projectTasks: ConversationProjectTask[];
  activities: ConversationActivity[];
}

export interface CreateNoteInput {
  title: string;
  body: string;
  color?: NoteColor;
  pinned?: boolean;
  author?: string;
}

export type UpdateNoteInput = Partial<
  Pick<ConversationNote, 'title' | 'body' | 'color' | 'pinned' | 'author'>
>;

export interface CreateTicketInput {
  subject: string;
  description: string;
  stage?: TicketStage;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  tags?: string[];
  source?: ConversationTicket['source'];
}

export type UpdateTicketInput = Partial<
  Pick<
    ConversationTicket,
    'subject' | 'description' | 'stage' | 'status' | 'priority' | 'assignee' | 'tags' | 'source'
  >
>;

export interface CreateTicketMessageInput {
  body: string;
  kind?: ConversationTicketMessage['kind'];
  author?: string;
}

export type UpdateTicketMessageInput = Partial<Pick<ConversationTicketMessage, 'body' | 'kind' | 'author'>>;

export interface CreateDocumentInput {
  name: string;
  kind?: ConversationDocumentKind;
  status?: ConversationDocumentStatus;
  sizeLabel?: string;
  owner?: string;
}

export type UpdateDocumentInput = Partial<
  Pick<ConversationDocument, 'name' | 'kind' | 'status' | 'sizeLabel' | 'owner'>
>;

export interface CreatePaymentInput {
  description: string;
  amount: number;
  currency?: string;
  status?: ConversationPaymentStatus;
  method?: string;
}

export type UpdatePaymentInput = Partial<
  Pick<ConversationPayment, 'description' | 'amount' | 'currency' | 'status' | 'method'>
>;

export interface CreateProjectTaskInput {
  title: string;
  description: string;
  status?: ProjectTaskStatus;
  priority?: ProjectTaskPriority;
  owner?: string;
  project?: string;
  dueDate?: string;
  type?: ProjectTaskType;
}

export type UpdateProjectTaskInput = Partial<
  Pick<
    ConversationProjectTask,
    'title' | 'description' | 'status' | 'priority' | 'owner' | 'project' | 'dueDate' | 'type'
  >
>;

export interface AddActivityInput {
  kind: ConversationActivityKind;
  title: string;
  detail?: string;
  actor?: string;
  linkedRecordId?: string;
}

export interface ConversationRecordsValue {
  notes: ConversationNote[];
  tickets: ConversationTicket[];
  documents: ConversationDocument[];
  payments: ConversationPayment[];
  projectTasks: ConversationProjectTask[];
  activities: ConversationActivity[];
  recordsFor: (contactId: string) => ContactConversationRecords;
  notesFor: (contactId: string) => ConversationNote[];
  ticketsFor: (contactId: string) => ConversationTicket[];
  documentsFor: (contactId: string) => ConversationDocument[];
  paymentsFor: (contactId: string) => ConversationPayment[];
  projectTasksFor: (contactId: string) => ConversationProjectTask[];
  activitiesFor: (contactId: string) => ConversationActivity[];
  createNote: (contactId: string, input: CreateNoteInput) => string;
  addNote: (contactId: string, input: CreateNoteInput) => string;
  updateNote: (contactId: string, noteId: string, input: UpdateNoteInput) => void;
  deleteNote: (contactId: string, noteId: string) => void;
  removeNote: (contactId: string, noteId: string) => void;
  createTicket: (contactId: string, input: CreateTicketInput) => string;
  addTicket: (contactId: string, input: CreateTicketInput) => string;
  updateTicket: (contactId: string, ticketId: string, input: UpdateTicketInput) => void;
  deleteTicket: (contactId: string, ticketId: string) => void;
  removeTicket: (contactId: string, ticketId: string) => void;
  createTicketMessage: (contactId: string, ticketId: string, input: CreateTicketMessageInput) => string;
  updateTicketMessage: (contactId: string, ticketId: string, messageId: string, input: UpdateTicketMessageInput) => void;
  deleteTicketMessage: (contactId: string, ticketId: string, messageId: string) => void;
  createDocument: (contactId: string, input: CreateDocumentInput) => string;
  addDocument: (contactId: string, input: CreateDocumentInput) => string;
  updateDocument: (contactId: string, documentId: string, input: UpdateDocumentInput) => void;
  deleteDocument: (contactId: string, documentId: string) => void;
  removeDocument: (contactId: string, documentId: string) => void;
  createPayment: (contactId: string, input: CreatePaymentInput) => string;
  addPayment: (contactId: string, input: CreatePaymentInput) => string;
  updatePayment: (contactId: string, paymentId: string, input: UpdatePaymentInput) => void;
  deletePayment: (contactId: string, paymentId: string) => void;
  removePayment: (contactId: string, paymentId: string) => void;
  refundPayment: (contactId: string, paymentId: string, amount?: number) => void;
  createProjectTask: (contactId: string, input: CreateProjectTaskInput) => string;
  addProjectTask: (contactId: string, input: CreateProjectTaskInput) => string;
  updateProjectTask: (
    contactId: string,
    projectTaskId: string,
    input: UpdateProjectTaskInput,
  ) => void;
  deleteProjectTask: (contactId: string, projectTaskId: string) => void;
  removeProjectTask: (contactId: string, projectTaskId: string) => void;
  addActivity: (contactId: string, input: AddActivityInput) => string;
  deleteActivity: (contactId: string, activityId: string) => void;
  resetContactRecords: (contactId: string) => void;
  resetAllRecords: () => void;
}

export interface ConversationRecordsProviderProps {
  children: ReactNode;
  contacts?: readonly Contact[];
  currentUserName?: string;
}

type RecordsState = Record<string, ContactConversationRecords>;

const EMPTY_CONTACTS: readonly Contact[] = [];
const DAY = 86_400_000;
const MAX_ACTIVITIES_PER_CONTACT = 60;
const RecordsContext = createContext<ConversationRecordsValue | null>(null);

// Keeps seeded dates stable for the day while still making a future demo feel current.
const SEED_ANCHOR = (() => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
})();

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seededRandom(key: string) {
  let value = hash(key);
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function atDaysAgo(days: number, hourOffset = 0) {
  return new Date(SEED_ANCHOR - days * DAY + hourOffset * 3_600_000).toISOString();
}

function displayName(contact: Contact) {
  return `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
}

function cloneRecords(records: ContactConversationRecords): ContactConversationRecords {
  return {
    notes: [...records.notes],
    tickets: records.tickets.map((ticket) => ({
      ...ticket,
      tags: [...ticket.tags],
      messages: ticket.messages.map((message) => ({ ...message })),
    })),
    documents: [...records.documents],
    payments: [...records.payments],
    projectTasks: [...records.projectTasks],
    activities: [...records.activities],
  };
}

function seedConversationRecords(
  contactId: string,
  contactName = 'Contact',
  ownerName = 'Morgan Lee',
): ContactConversationRecords {
  const random = seededRandom(`conversation-records:${contactId}`);
  const shortName = contactName.split(' ')[0] || 'Contact';
  const noteColors: NoteColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];
  const priorities: TicketPriority[] = ['normal', 'high', 'urgent', 'low'];
  const methods = ['Visa •••• 4242', 'Mastercard •••• 4444', 'ACH •••• 1840'];
  const noteCount = random() > 0.55 ? 3 : 2;
  const ticketCount = random() > 0.6 ? 2 : 1;
  const documentCount = random() > 0.45 ? 2 : 1;
  const paymentCount = random() > 0.5 ? 2 : 1;
  const projectTaskCount = random() > 0.42 ? 3 : 2;

  const noteTemplates = [
    {
      title: 'Follow-up preferences',
      body: `${shortName} prefers an afternoon follow-up and is happy to receive details by text or email.`,
    },
    {
      title: 'Discovery call recap',
      body: 'Interested in the premium option. Pricing and implementation timing are the two main decision points.',
    },
    {
      title: 'Next step',
      body: 'Send the updated proposal, then check in after the team has had two business days to review it.',
    },
  ];

  const notes: ConversationNote[] = Array.from({ length: noteCount }, (_, index) => {
    const createdAt = atDaysAgo(2 + index * 5, -index);
    return {
      id: `note_seed_${contactId}_${index + 1}`,
      contactId,
      ...noteTemplates[index],
      color: noteColors[Math.floor(random() * noteColors.length)],
      pinned: index === 0,
      author: index === 1 ? 'Avery Chen' : ownerName,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const ticketTemplates = [
    {
      subject: 'Question about onboarding timeline',
      description: `${shortName} would like confirmation of the onboarding milestones and expected go-live date.`,
      stage: 'working' as const,
      status: 'open' as const,
      tags: ['onboarding', 'customer-question'],
      source: 'email' as const,
    },
    {
      subject: 'Update billing contact',
      description: 'Confirm the new billing contact before the next invoice is issued.',
      stage: 'waiting_on_customer' as const,
      status: 'pending' as const,
      tags: ['billing'],
      source: 'chat' as const,
    },
  ];

  const tickets: ConversationTicket[] = Array.from({ length: ticketCount }, (_, index) => {
    const template = ticketTemplates[index];
    const createdAt = atDaysAgo(1 + index * 8, -2);
    const ticketId = `ticket_seed_${contactId}_${index + 1}`;
    const followUpAt = new Date(+new Date(createdAt) + 90 * 60_000).toISOString();
    const responseAt = new Date(+new Date(createdAt) + 4 * 60 * 60_000).toISOString();
    return {
      id: ticketId,
      contactId,
      number: `TK-${String(3100 + (hash(contactId) % 700) + index)}`,
      ...template,
      priority: priorities[Math.floor(random() * priorities.length)],
      assignee: index === 0 ? ownerName : 'Support Team',
      messages: [
        {
          id: `${ticketId}_message_1`,
          kind: 'customer',
          author: contactName,
          body: template.description,
          createdAt,
          updatedAt: createdAt,
        },
        {
          id: `${ticketId}_message_2`,
          kind: 'agent',
          author: index === 0 ? ownerName : 'Support Team',
          body: index === 0
            ? `Thanks, ${shortName}. I’m checking the timeline with our onboarding team and will confirm each milestone here.`
            : 'Happy to help. Please share the updated billing contact and we will update the account before invoicing.',
          createdAt: followUpAt,
          updatedAt: followUpAt,
        },
        {
          id: `${ticketId}_message_3`,
          kind: 'customer',
          author: contactName,
          body: index === 0
            ? 'Perfect, thank you. A target go-live date will help me coordinate the rest of the team.'
            : 'I’ll send those details today. Thanks for confirming.',
          createdAt: responseAt,
          updatedAt: responseAt,
        },
      ],
      createdAt,
      updatedAt: atDaysAgo(index === 0 ? 0 : 3, -1),
    };
  });

  const documentTemplates: Array<
    Pick<ConversationDocument, 'name' | 'kind' | 'status' | 'sizeLabel'>
  > = [
    {
      name: `Service proposal — ${contactName}`,
      kind: 'proposal',
      status: 'viewed',
      sizeLabel: '286 KB',
    },
    {
      name: `Implementation agreement — ${contactName}`,
      kind: 'contract',
      status: 'sent',
      sizeLabel: '412 KB',
    },
  ];

  const documents: ConversationDocument[] = Array.from({ length: documentCount }, (_, index) => {
    const createdAt = atDaysAgo(4 + index * 9, -3);
    return {
      id: `document_seed_${contactId}_${index + 1}`,
      contactId,
      ...documentTemplates[index],
      owner: ownerName,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const payments: ConversationPayment[] = Array.from({ length: paymentCount }, (_, index) => {
    const createdAt = atDaysAgo(6 + index * 21, -4);
    return {
      id: `payment_seed_${contactId}_${index + 1}`,
      contactId,
      description: index === 0 ? 'Implementation deposit' : 'Monthly platform subscription',
      amount: index === 0 ? 750 : 249,
      currency: 'USD',
      kind: 'charge',
      status: 'succeeded',
      method: methods[Math.floor(random() * methods.length)],
      refundedAmount: 0,
      date: createdAt,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const projectTaskTemplates: Array<
    Pick<
      ConversationProjectTask,
      'title' | 'description' | 'status' | 'priority' | 'project' | 'type'
    >
  > = [
    {
      title: `Prepare onboarding plan for ${shortName}`,
      description:
        'Turn the discovery notes into a clear onboarding checklist and confirm the launch owner.',
      status: 'in_progress',
      priority: 'high',
      project: 'Customer Onboarding',
      type: 'task',
    },
    {
      title: 'Review requested workflow changes',
      description:
        'Validate the requested automation changes with the implementation team before the next call.',
      status: 'to_do',
      priority: 'medium',
      project: 'Workflow Improvements',
      type: 'improvement',
    },
    {
      title: 'Confirm launch readiness',
      description:
        'Check channel connections, team access, and reporting before moving the account to live.',
      status: 'in_review',
      priority: 'urgent',
      project: 'Customer Onboarding',
      type: 'milestone',
    },
  ];

  const projectTasks: ConversationProjectTask[] = Array.from(
    { length: projectTaskCount },
    (_, index) => {
      const template = projectTaskTemplates[index];
      const createdAt = atDaysAgo(3 + index * 4, -2);
      return {
        id: `project_task_seed_${contactId}_${index + 1}`,
        contactId,
        ...template,
        owner: index === 1 ? 'Avery Chen' : ownerName,
        dueDate: atDaysAgo(-(2 + index * 3)),
        createdAt,
        updatedAt: atDaysAgo(Math.max(0, 1 + index), -1),
      };
    },
  );

  const activities: ConversationActivity[] = [
    {
      id: `activity_seed_${contactId}_1`,
      contactId,
      kind: 'conversation',
      title: 'Conversation reopened',
      detail: 'A new reply moved this conversation back to the team inbox.',
      actor: 'Automation',
      createdAt: atDaysAgo(0, -2),
    },
    {
      id: `activity_seed_${contactId}_2`,
      contactId,
      kind: 'ticket',
      title: `Ticket ${tickets[0].number} assigned`,
      detail: `Assigned to ${tickets[0].assignee}.`,
      actor: ownerName,
      linkedRecordId: tickets[0].id,
      createdAt: atDaysAgo(1, -1),
    },
    {
      id: `activity_seed_${contactId}_3`,
      contactId,
      kind: 'document',
      title: 'Proposal viewed',
      detail: documentTemplates[0].name,
      actor: contactName,
      linkedRecordId: documents[0].id,
      createdAt: atDaysAgo(3, 1),
    },
    {
      id: `activity_seed_${contactId}_4`,
      contactId,
      kind: 'contact',
      title: 'Contact details updated',
      detail: 'Phone number and communication preferences were confirmed.',
      actor: ownerName,
      createdAt: atDaysAgo(10),
    },
    {
      id: `activity_seed_${contactId}_5`,
      contactId,
      kind: 'project_task',
      title: 'Project task moved to In Progress',
      detail: projectTasks[0].title,
      actor: projectTasks[0].owner,
      linkedRecordId: projectTasks[0].id,
      createdAt: atDaysAgo(2, -1),
    },
  ];

  return { notes, tickets, documents, payments, projectTasks, activities };
}

function seedAll(contacts: readonly Contact[], ownerName: string): RecordsState {
  return Object.fromEntries(
    contacts.map((contact) => [
      contact.id,
      seedConversationRecords(contact.id, displayName(contact), ownerName),
    ]),
  );
}

export function ConversationRecordsProvider({
  children,
  contacts = EMPTY_CONTACTS,
  currentUserName = 'Morgan Lee',
}: ConversationRecordsProviderProps) {
  const contactNames = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, displayName(contact)])),
    [contacts],
  );
  const [records, setRecords] = useState<RecordsState>(() => seedAll(contacts, currentUserName));
  const sequence = useRef(1);

  useEffect(() => {
    setRecords((current) => {
      let changed = false;
      const next = { ...current };
      contacts.forEach((contact) => {
        if (!next[contact.id]) {
          next[contact.id] = seedConversationRecords(
            contact.id,
            displayName(contact),
            currentUserName,
          );
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [contacts, currentUserName]);

  const makeId = useCallback((kind: string, contactId: string) => {
    const id = `${kind}_local_${contactId}_${sequence.current}`;
    sequence.current += 1;
    return id;
  }, []);

  const fallbackFor = useCallback(
    (contactId: string) =>
      seedConversationRecords(contactId, contactNames.get(contactId) ?? 'Contact', currentUserName),
    [contactNames, currentUserName],
  );

  const recordsFor = useCallback(
    (contactId: string) => records[contactId] ?? fallbackFor(contactId),
    [fallbackFor, records],
  );

  const updateContact = useCallback(
    (contactId: string, updater: (current: ContactConversationRecords) => ContactConversationRecords) => {
      setRecords((current) => {
        const existing = current[contactId] ?? fallbackFor(contactId);
        const updated = updater(existing);
        return updated === existing ? current : { ...current, [contactId]: updated };
      });
    },
    [fallbackFor],
  );

  const activity = useCallback(
    (
      contactId: string,
      activityId: string,
      input: AddActivityInput,
      createdAt = new Date().toISOString(),
    ): ConversationActivity => ({
      id: activityId,
      contactId,
      kind: input.kind,
      title: input.title,
      detail: input.detail,
      actor: input.actor ?? currentUserName,
      linkedRecordId: input.linkedRecordId,
      createdAt,
    }),
    [currentUserName],
  );

  const createNote = useCallback(
    (contactId: string, input: CreateNoteInput) => {
      const id = makeId('note', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      const note: ConversationNote = {
        id,
        contactId,
        title: input.title,
        body: input.body,
        color: input.color ?? 'yellow',
        pinned: input.pinned ?? false,
        author: input.author ?? currentUserName,
        createdAt: now,
        updatedAt: now,
      };
      updateContact(contactId, (current) => ({
        ...current,
        notes: [note, ...current.notes],
        activities: [
          activity(contactId, activityId, {
            kind: 'note',
            title: 'Note added',
            detail: note.title,
            linkedRecordId: id,
          }),
          ...current.activities,
        ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
      }));
      return id;
    },
    [activity, currentUserName, makeId, updateContact],
  );

  const updateNote = useCallback(
    (contactId: string, noteId: string, input: UpdateNoteInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const note = current.notes.find((item) => item.id === noteId);
        if (!note) return current;
        return {
          ...current,
          notes: current.notes.map((item) =>
            item.id === noteId ? { ...item, ...input, updatedAt: now } : item,
          ),
          activities: [
            activity(contactId, activityId, {
              kind: 'note',
              title: 'Note updated',
              detail: input.title ?? note.title,
              linkedRecordId: noteId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deleteNote = useCallback(
    (contactId: string, noteId: string) => {
      const activityId = makeId('activity', contactId);
      updateContact(contactId, (current) => {
        const note = current.notes.find((item) => item.id === noteId);
        if (!note) return current;
        return {
          ...current,
          notes: current.notes.filter((item) => item.id !== noteId),
          activities: [
            activity(contactId, activityId, {
              kind: 'note',
              title: 'Note deleted',
              detail: note.title,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const createTicket = useCallback(
    (contactId: string, input: CreateTicketInput) => {
      const id = makeId('ticket', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      const ticket: ConversationTicket = {
        id,
        contactId,
        number: `TK-${String(4000 + sequence.current)}`,
        subject: input.subject,
        description: input.description,
        stage: input.stage ?? 'new',
        status: input.status ?? 'open',
        priority: input.priority ?? 'normal',
        assignee: input.assignee ?? currentUserName,
        tags: input.tags ? [...input.tags] : [],
        source: input.source ?? 'internal',
        messages: [{
          id: `${id}_message_1`,
          kind: input.source === 'internal' || !input.source ? 'internal' : 'customer',
          author: input.source === 'internal' || !input.source ? currentUserName : 'Customer',
          body: input.description,
          createdAt: now,
          updatedAt: now,
        }],
        createdAt: now,
        updatedAt: now,
      };
      updateContact(contactId, (current) => ({
        ...current,
        tickets: [ticket, ...current.tickets],
        activities: [
          activity(contactId, activityId, {
            kind: 'ticket',
            title: `Ticket ${ticket.number} created`,
            detail: ticket.subject,
            linkedRecordId: id,
          }),
          ...current.activities,
        ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
      }));
      return id;
    },
    [activity, currentUserName, makeId, updateContact],
  );

  const updateTicket = useCallback(
    (contactId: string, ticketId: string, input: UpdateTicketInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const ticket = current.tickets.find((item) => item.id === ticketId);
        if (!ticket) return current;
        return {
          ...current,
          tickets: current.tickets.map((item) =>
            item.id === ticketId
              ? { ...item, ...input, tags: input.tags ? [...input.tags] : item.tags, updatedAt: now }
              : item,
          ),
          activities: [
            activity(contactId, activityId, {
              kind: 'ticket',
              title: `Ticket ${ticket.number} updated`,
              detail: input.subject ?? ticket.subject,
              linkedRecordId: ticketId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deleteTicket = useCallback(
    (contactId: string, ticketId: string) => {
      const activityId = makeId('activity', contactId);
      updateContact(contactId, (current) => {
        const ticket = current.tickets.find((item) => item.id === ticketId);
        if (!ticket) return current;
        return {
          ...current,
          tickets: current.tickets.filter((item) => item.id !== ticketId),
          activities: [
            activity(contactId, activityId, {
              kind: 'ticket',
              title: `Ticket ${ticket.number} deleted`,
              detail: ticket.subject,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const createTicketMessage = useCallback(
    (contactId: string, ticketId: string, input: CreateTicketMessageInput) => {
      const id = makeId('ticket_message', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const ticket = current.tickets.find((item) => item.id === ticketId);
        if (!ticket) return current;
        const message: ConversationTicketMessage = {
          id,
          kind: input.kind ?? 'agent',
          author: input.author ?? currentUserName,
          body: input.body,
          createdAt: now,
          updatedAt: now,
        };
        return {
          ...current,
          tickets: current.tickets.map((item) => item.id === ticketId
            ? { ...item, messages: [...item.messages, message], updatedAt: now }
            : item),
          activities: [
            activity(contactId, activityId, {
              kind: 'ticket',
              title: `${message.kind === 'internal' ? 'Internal note added to' : 'Reply added to'} ticket ${ticket.number}`,
              detail: message.body,
              linkedRecordId: ticketId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
      return id;
    },
    [activity, currentUserName, makeId, updateContact],
  );

  const updateTicketMessage = useCallback(
    (contactId: string, ticketId: string, messageId: string, input: UpdateTicketMessageInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const ticket = current.tickets.find((item) => item.id === ticketId);
        const message = ticket?.messages.find((item) => item.id === messageId);
        if (!ticket || !message) return current;
        return {
          ...current,
          tickets: current.tickets.map((item) => item.id === ticketId
            ? { ...item, messages: item.messages.map((value) => value.id === messageId ? { ...value, ...input, updatedAt: now } : value), updatedAt: now }
            : item),
          activities: [
            activity(contactId, activityId, {
              kind: 'ticket',
              title: `Ticket ${ticket.number} reply updated`,
              detail: input.body ?? message.body,
              linkedRecordId: ticketId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deleteTicketMessage = useCallback(
    (contactId: string, ticketId: string, messageId: string) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const ticket = current.tickets.find((item) => item.id === ticketId);
        const message = ticket?.messages.find((item) => item.id === messageId);
        if (!ticket || !message) return current;
        return {
          ...current,
          tickets: current.tickets.map((item) => item.id === ticketId
            ? { ...item, messages: item.messages.filter((value) => value.id !== messageId), updatedAt: now }
            : item),
          activities: [
            activity(contactId, activityId, {
              kind: 'ticket',
              title: `Ticket ${ticket.number} reply deleted`,
              detail: message.body,
              linkedRecordId: ticketId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const createDocument = useCallback(
    (contactId: string, input: CreateDocumentInput) => {
      const id = makeId('document', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      const document: ConversationDocument = {
        id,
        contactId,
        name: input.name,
        kind: input.kind ?? 'other',
        status: input.status ?? 'draft',
        sizeLabel: input.sizeLabel ?? '—',
        owner: input.owner ?? currentUserName,
        createdAt: now,
        updatedAt: now,
      };
      updateContact(contactId, (current) => ({
        ...current,
        documents: [document, ...current.documents],
        activities: [
          activity(contactId, activityId, {
            kind: 'document',
            title: 'Document added',
            detail: document.name,
            linkedRecordId: id,
          }),
          ...current.activities,
        ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
      }));
      return id;
    },
    [activity, currentUserName, makeId, updateContact],
  );

  const updateDocument = useCallback(
    (contactId: string, documentId: string, input: UpdateDocumentInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const document = current.documents.find((item) => item.id === documentId);
        if (!document) return current;
        return {
          ...current,
          documents: current.documents.map((item) =>
            item.id === documentId ? { ...item, ...input, updatedAt: now } : item,
          ),
          activities: [
            activity(contactId, activityId, {
              kind: 'document',
              title: 'Document updated',
              detail: input.name ?? document.name,
              linkedRecordId: documentId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deleteDocument = useCallback(
    (contactId: string, documentId: string) => {
      const activityId = makeId('activity', contactId);
      updateContact(contactId, (current) => {
        const document = current.documents.find((item) => item.id === documentId);
        if (!document) return current;
        return {
          ...current,
          documents: current.documents.filter((item) => item.id !== documentId),
          activities: [
            activity(contactId, activityId, {
              kind: 'document',
              title: 'Document deleted',
              detail: document.name,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const createPayment = useCallback(
    (contactId: string, input: CreatePaymentInput) => {
      const id = makeId('payment', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      const payment: ConversationPayment = {
        id,
        contactId,
        description: input.description,
        amount: Math.max(0, input.amount),
        currency: input.currency ?? 'USD',
        kind: 'charge',
        status: input.status ?? 'succeeded',
        method: input.method ?? 'Demo card •••• 4242',
        refundedAmount: 0,
        date: now,
        createdAt: now,
        updatedAt: now,
      };
      updateContact(contactId, (current) => ({
        ...current,
        payments: [payment, ...current.payments],
        activities: [
          activity(contactId, activityId, {
            kind: 'payment',
            title: 'Payment recorded',
            detail: `${payment.currency} ${payment.amount.toFixed(2)} — ${payment.description}`,
            linkedRecordId: id,
          }),
          ...current.activities,
        ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
      }));
      return id;
    },
    [activity, makeId, updateContact],
  );

  const updatePayment = useCallback(
    (contactId: string, paymentId: string, input: UpdatePaymentInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const payment = current.payments.find((item) => item.id === paymentId);
        if (!payment || payment.kind === 'refund') return current;
        const amount = input.amount === undefined ? payment.amount : Math.max(0, input.amount);
        return {
          ...current,
          payments: current.payments.map((item) =>
            item.id === paymentId ? { ...item, ...input, amount, updatedAt: now } : item,
          ),
          activities: [
            activity(contactId, activityId, {
              kind: 'payment',
              title: 'Payment updated',
              detail: input.description ?? payment.description,
              linkedRecordId: paymentId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deletePayment = useCallback(
    (contactId: string, paymentId: string) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const payment = current.payments.find((item) => item.id === paymentId);
        if (!payment) return current;
        const linkedRefundIds = current.payments
          .filter((item) => item.parentPaymentId === paymentId)
          .map((item) => item.id);
        const remainingPayments = current.payments.filter(
          (item) => item.id !== paymentId && !linkedRefundIds.includes(item.id),
        );

        if (payment.kind === 'refund' && payment.parentPaymentId) {
          const parentPayment = remainingPayments.find(
            (item) => item.id === payment.parentPaymentId && item.kind === 'charge',
          );
          if (parentPayment) {
            const refundedAmount = Math.min(
              parentPayment.amount,
              remainingPayments
                .filter(
                  (item) =>
                    item.kind === 'refund' && item.parentPaymentId === parentPayment.id,
                )
                .reduce((total, item) => total + Math.abs(item.amount), 0),
            );
            const status: ConversationPaymentStatus =
              refundedAmount === 0
                ? 'succeeded'
                : refundedAmount >= parentPayment.amount
                  ? 'refunded'
                  : 'partially_refunded';
            const parentIndex = remainingPayments.findIndex((item) => item.id === parentPayment.id);
            remainingPayments[parentIndex] = {
              ...parentPayment,
              refundedAmount,
              status,
              updatedAt: now,
            };
          }
        }

        return {
          ...current,
          payments: remainingPayments,
          activities: [
            activity(contactId, activityId, {
              kind: 'payment',
              title: payment.kind === 'refund' ? 'Refund deleted' : 'Payment deleted',
              detail: payment.description,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const refundPayment = useCallback(
    (contactId: string, paymentId: string, requestedAmount?: number) => {
      const refundId = makeId('refund', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const payment = current.payments.find((item) => item.id === paymentId);
        if (!payment || payment.kind !== 'charge' || payment.status === 'failed') return current;
        const remaining = Math.max(0, payment.amount - payment.refundedAmount);
        const amount = Math.min(remaining, Math.max(0, requestedAmount ?? remaining));
        if (amount === 0) return current;
        const totalRefunded = payment.refundedAmount + amount;
        const nextStatus: ConversationPaymentStatus =
          totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';
        const refund: ConversationPayment = {
          id: refundId,
          contactId,
          description: `Refund — ${payment.description}`,
          amount: -amount,
          currency: payment.currency,
          kind: 'refund',
          status: 'succeeded',
          method: payment.method,
          refundedAmount: 0,
          parentPaymentId: paymentId,
          date: now,
          createdAt: now,
          updatedAt: now,
        };
        return {
          ...current,
          payments: [
            refund,
            ...current.payments.map((item) =>
              item.id === paymentId
                ? { ...item, refundedAmount: totalRefunded, status: nextStatus, updatedAt: now }
                : item,
            ),
          ],
          activities: [
            activity(contactId, activityId, {
              kind: 'payment',
              title: amount === remaining ? 'Payment refunded' : 'Partial refund issued',
              detail: `${payment.currency} ${amount.toFixed(2)} — ${payment.description}`,
              linkedRecordId: paymentId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const createProjectTask = useCallback(
    (contactId: string, input: CreateProjectTaskInput) => {
      const id = makeId('project_task', contactId);
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      const projectTask: ConversationProjectTask = {
        id,
        contactId,
        title: input.title,
        description: input.description,
        status: input.status ?? 'to_do',
        priority: input.priority ?? 'none',
        owner: input.owner ?? currentUserName,
        project: input.project ?? 'General',
        dueDate: input.dueDate ?? new Date(Date.now() + 7 * DAY).toISOString(),
        type: input.type ?? 'task',
        createdAt: now,
        updatedAt: now,
      };
      updateContact(contactId, (current) => ({
        ...current,
        projectTasks: [projectTask, ...current.projectTasks],
        activities: [
          activity(contactId, activityId, {
            kind: 'project_task',
            title: 'Project task created',
            detail: `${projectTask.title} · ${projectTask.project}`,
            linkedRecordId: id,
          }),
          ...current.activities,
        ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
      }));
      return id;
    },
    [activity, currentUserName, makeId, updateContact],
  );

  const updateProjectTask = useCallback(
    (contactId: string, projectTaskId: string, input: UpdateProjectTaskInput) => {
      const activityId = makeId('activity', contactId);
      const now = new Date().toISOString();
      updateContact(contactId, (current) => {
        const projectTask = current.projectTasks.find((item) => item.id === projectTaskId);
        if (!projectTask) return current;
        const statusChanged = input.status !== undefined && input.status !== projectTask.status;
        const nextTitle = input.title ?? projectTask.title;
        return {
          ...current,
          projectTasks: current.projectTasks.map((item) =>
            item.id === projectTaskId ? { ...item, ...input, updatedAt: now } : item,
          ),
          activities: [
            activity(contactId, activityId, {
              kind: 'project_task',
              title: statusChanged ? 'Project task status updated' : 'Project task updated',
              detail: statusChanged
                ? `${nextTitle} · ${projectTask.status.replace(/_/g, ' ')} → ${input.status!.replace(/_/g, ' ')}`
                : nextTitle,
              linkedRecordId: projectTaskId,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const deleteProjectTask = useCallback(
    (contactId: string, projectTaskId: string) => {
      const activityId = makeId('activity', contactId);
      updateContact(contactId, (current) => {
        const projectTask = current.projectTasks.find((item) => item.id === projectTaskId);
        if (!projectTask) return current;
        return {
          ...current,
          projectTasks: current.projectTasks.filter((item) => item.id !== projectTaskId),
          activities: [
            activity(contactId, activityId, {
              kind: 'project_task',
              title: 'Project task deleted',
              detail: projectTask.title,
            }),
            ...current.activities,
          ].slice(0, MAX_ACTIVITIES_PER_CONTACT),
        };
      });
    },
    [activity, makeId, updateContact],
  );

  const addActivity = useCallback(
    (contactId: string, input: AddActivityInput) => {
      const id = makeId('activity', contactId);
      updateContact(contactId, (current) => ({
        ...current,
        activities: [activity(contactId, id, input), ...current.activities].slice(
          0,
          MAX_ACTIVITIES_PER_CONTACT,
        ),
      }));
      return id;
    },
    [activity, makeId, updateContact],
  );

  const deleteActivity = useCallback(
    (contactId: string, activityId: string) => {
      updateContact(contactId, (current) => ({
        ...current,
        activities: current.activities.filter((item) => item.id !== activityId),
      }));
    },
    [updateContact],
  );

  const resetContactRecords = useCallback(
    (contactId: string) => {
      setRecords((current) => ({
        ...current,
        [contactId]: seedConversationRecords(
          contactId,
          contactNames.get(contactId) ?? 'Contact',
          currentUserName,
        ),
      }));
    },
    [contactNames, currentUserName],
  );

  const resetAllRecords = useCallback(() => {
    setRecords(seedAll(contacts, currentUserName));
    sequence.current = 1;
  }, [contacts, currentUserName]);

  const value = useMemo<ConversationRecordsValue>(
    () => ({
      notes: Object.values(records).flatMap((item) => item.notes),
      tickets: Object.values(records).flatMap((item) => item.tickets),
      documents: Object.values(records).flatMap((item) => item.documents),
      payments: Object.values(records).flatMap((item) => item.payments),
      projectTasks: Object.values(records).flatMap((item) => item.projectTasks),
      activities: Object.values(records).flatMap((item) => item.activities),
      recordsFor,
      notesFor: (contactId) => recordsFor(contactId).notes,
      ticketsFor: (contactId) => recordsFor(contactId).tickets,
      documentsFor: (contactId) => recordsFor(contactId).documents,
      paymentsFor: (contactId) => recordsFor(contactId).payments,
      projectTasksFor: (contactId) => recordsFor(contactId).projectTasks,
      activitiesFor: (contactId) => recordsFor(contactId).activities,
      createNote,
      addNote: createNote,
      updateNote,
      deleteNote,
      removeNote: deleteNote,
      createTicket,
      addTicket: createTicket,
      updateTicket,
      deleteTicket,
      removeTicket: deleteTicket,
      createTicketMessage,
      updateTicketMessage,
      deleteTicketMessage,
      createDocument,
      addDocument: createDocument,
      updateDocument,
      deleteDocument,
      removeDocument: deleteDocument,
      createPayment,
      addPayment: createPayment,
      updatePayment,
      deletePayment,
      removePayment: deletePayment,
      refundPayment,
      createProjectTask,
      addProjectTask: createProjectTask,
      updateProjectTask,
      deleteProjectTask,
      removeProjectTask: deleteProjectTask,
      addActivity,
      deleteActivity,
      resetContactRecords,
      resetAllRecords,
    }),
    [
      addActivity,
      createDocument,
      createNote,
      createPayment,
      createProjectTask,
      createTicket,
      createTicketMessage,
      deleteActivity,
      deleteDocument,
      deleteNote,
      deletePayment,
      deleteProjectTask,
      deleteTicket,
      deleteTicketMessage,
      recordsFor,
      records,
      refundPayment,
      resetAllRecords,
      resetContactRecords,
      updateDocument,
      updateNote,
      updatePayment,
      updateProjectTask,
      updateTicket,
      updateTicketMessage,
    ],
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useConversationRecords() {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useConversationRecords must be used inside ConversationRecordsProvider');
  }
  return context;
}
