/**
 * Productivity module — in-memory state provider.
 *
 * Mirrors Meridian's "useReducer + Context" approach with a lightweight
 * useState-based store. ALL state is local to the Productivity workspace and
 * lives only for the session — nothing is persisted, networked, or written to
 * the global app store. We DO read the global `pushToast` action to surface
 * demo-safe feedback (consuming the shared toaster, not mutating shared data).
 *
 * Navigating away and back re-seeds the workspace, which is the intended
 * reset-friendly demo behavior.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import type {
  ActivityItem,
  Comment,
  Doc,
  DocCategory,
  ID,
  Priority,
  Project,
  Subtask,
  Task,
  TaskStatus,
  TaskType,
  Ticket,
  TicketChannel,
  TicketReply,
  TicketStage,
} from './types';
import {
  CURRENT_USER_ID,
  seedDocs,
  seedProjects,
  seedTasks,
  seedTickets,
  taskStatusMeta,
  ticketStageMeta,
  uid,
} from './data';

const nowIso = () => new Date().toISOString();
const mkActivity = (kind: ActivityItem['kind'], text: string): ActivityItem => ({
  id: uid('act'),
  kind,
  text,
  at: nowIso(),
  actorId: CURRENT_USER_ID,
});

/* Session-stable counter for new ticket numbers. */
let ticketNumberSeq = 1100;

export interface CreateTicketInput {
  subject: string;
  body: string;
  priority: Priority;
  channel: TicketChannel;
  category?: string;
  stage?: TicketStage;
  assigneeId?: ID;
  requester: string;
  requesterEmail?: string;
  company?: string;
  tags?: string[];
  dueAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: Priority;
  type: TaskType;
  assigneeId?: ID;
  projectId?: ID;
  dueAt?: string;
  tags?: string[];
  points?: number;
}

interface ProductivityContextValue {
  tickets: Ticket[];
  tasks: Task[];
  projects: Project[];
  docs: Doc[];

  // tickets
  createTicket: (input: CreateTicketInput) => Ticket;
  updateTicket: (id: ID, patch: Partial<Ticket>) => void;
  moveTicket: (id: ID, stage: TicketStage) => void;
  bulkUpdateTickets: (ids: ID[], patch: Partial<Ticket>, label?: string) => void;
  addTicketNote: (id: ID, body: string) => void;
  addTicketReply: (id: ID, body: string) => void;
  markTicketRead: (id: ID) => void;

  // tasks
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  moveTask: (id: ID, status: TaskStatus) => void;
  toggleSubtask: (taskId: ID, subId: ID) => void;
  addSubtask: (taskId: ID, title: string) => void;
  addComment: (taskId: ID, body: string) => void;

  // projects
  updateProject: (id: ID, patch: Partial<Project>) => void;
  toggleMilestone: (projectId: ID, msId: ID) => void;

  // docs
  createDoc: (input: { title: string; category: DocCategory }) => Doc;
  updateDoc: (id: ID, patch: Partial<Doc>) => void;
}

const Ctx = createContext<ProductivityContextValue | null>(null);

export function ProductivityProvider({ children }: { children: React.ReactNode }) {
  const pushToast = useStore((s) => s.pushToast);

  const [tickets, setTickets] = useState<Ticket[]>(() => seedTickets());
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks());
  const [projects, setProjects] = useState<Project[]>(() => seedProjects());
  const [docs, setDocs] = useState<Doc[]>(() => seedDocs());

  /* ── tickets ── */

  const createTicket = useCallback(
    (input: CreateTicketInput): Ticket => {
      ticketNumberSeq += 1;
      const t: Ticket = {
        id: uid('tk'),
        number: `TK-${ticketNumberSeq}`,
        subject: input.subject.trim() || 'Untitled ticket',
        body: input.body.trim(),
        stage: input.stage ?? 'open',
        priority: input.priority,
        channel: input.channel,
        category: input.category?.trim() || undefined,
        assigneeId: input.assigneeId,
        requester: input.requester.trim() || 'Unknown requester',
        requesterEmail: input.requesterEmail?.trim() || undefined,
        company: input.company?.trim() || undefined,
        tags: input.tags ?? [],
        unread: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        dueAt: input.dueAt || undefined,
        notes: [],
        activity: [mkActivity('created', 'Ticket created in demo session')],
        replies: [],
        linkedTaskIds: [],
      };
      setTickets((prev) => [t, ...prev]);
      pushToast({ title: 'Ticket created', description: `${t.number} · “${t.subject}” (demo session)`, variant: 'success' });
      return t;
    },
    [pushToast],
  );

  const updateTicket = useCallback((id: ID, patch: Partial<Ticket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, id: t.id, updatedAt: nowIso() } : t)));
  }, []);

  const moveTicket = useCallback(
    (id: ID, stage: TicketStage) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.stage === stage) return t;
          return {
            ...t,
            stage,
            updatedAt: nowIso(),
            activity: [mkActivity('status', `Moved to ${ticketStageMeta(stage).label}`), ...t.activity],
          };
        }),
      );
    },
    [],
  );

  const bulkUpdateTickets = useCallback(
    (ids: ID[], patch: Partial<Ticket>, label?: string) => {
      const set = new Set(ids);
      setTickets((prev) =>
        prev.map((t) => (set.has(t.id) ? { ...t, ...patch, id: t.id, updatedAt: nowIso() } : t)),
      );
      pushToast({
        title: label ?? 'Tickets updated',
        description: `${ids.length} ticket${ids.length === 1 ? '' : 's'} updated (demo session).`,
        variant: 'success',
      });
    },
    [pushToast],
  );

  const addTicketNote = useCallback((id: ID, body: string) => {
    const text = body.trim();
    if (!text) return;
    const c: Comment = { id: uid('note'), authorId: CURRENT_USER_ID, body: text, createdAt: nowIso() };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, notes: [...t.notes, c], updatedAt: nowIso(), activity: [mkActivity('note', 'Added an internal note'), ...t.activity] }
          : t,
      ),
    );
  }, []);

  const markTicketRead = useCallback((id: ID) => {
    setTickets((prev) => prev.map((t) => (t.id === id && t.unread ? { ...t, unread: false } : t)));
  }, []);

  const addTicketReply = useCallback(
    (id: ID, body: string) => {
      const text = body.trim();
      if (!text) return;
      const reply: TicketReply = { id: uid('rep'), body: text, at: nowIso(), outbound: true, authorId: CURRENT_USER_ID };
      setTickets((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                replies: [...(t.replies ?? []), reply],
                unread: false,
                updatedAt: nowIso(),
                activity: [mkActivity('comment', 'Replied to the requester'), ...t.activity],
              }
            : t,
        ),
      );
      pushToast({ title: 'Reply sent', description: 'Demo session — no email was actually sent.', variant: 'success' });
    },
    [pushToast],
  );

  /* ── tasks ── */

  const createTask = useCallback(
    (input: CreateTaskInput): Task => {
      const t: Task = {
        id: uid('t'),
        title: input.title.trim() || 'Untitled task',
        description: input.description?.trim() || undefined,
        status: input.status ?? 'todo',
        priority: input.priority,
        type: input.type,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        tags: input.tags ?? [],
        dueAt: input.dueAt || undefined,
        points: input.points,
        subtasks: [],
        comments: [],
        activity: [mkActivity('created', 'Task created in demo session')],
        createdAt: nowIso(),
      };
      setTasks((prev) => [t, ...prev]);
      pushToast({ title: 'Task created', description: `“${t.title}” (demo session)`, variant: 'success' });
      return t;
    },
    [pushToast],
  );

  const updateTask = useCallback((id: ID, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t)));
  }, []);

  const moveTask = useCallback((id: ID, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status === status) return t;
        return { ...t, status, activity: [mkActivity('status', `Moved to ${taskStatusMeta(status).label}`), ...t.activity] };
      }),
    );
  }, []);

  const toggleSubtask = useCallback((taskId: ID, subId: ID) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
          : t,
      ),
    );
  }, []);

  const addSubtask = useCallback((taskId: ID, title: string) => {
    const text = title.trim();
    if (!text) return;
    const s: Subtask = { id: uid('sub'), title: text, done: false };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, s] } : t)));
  }, []);

  const addComment = useCallback((taskId: ID, body: string) => {
    const text = body.trim();
    if (!text) return;
    const c: Comment = { id: uid('cm'), authorId: CURRENT_USER_ID, body: text, createdAt: nowIso() };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...t.comments, c], activity: [mkActivity('comment', 'Added a comment'), ...t.activity] }
          : t,
      ),
    );
  }, []);

  /* ── projects ── */

  const updateProject = useCallback((id: ID, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)));
  }, []);

  const toggleMilestone = useCallback((projectId: ID, msId: ID) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, milestones: p.milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m)) }
          : p,
      ),
    );
  }, []);

  /* ── docs ── */

  const createDoc = useCallback(
    (input: { title: string; category: DocCategory }): Doc => {
      const d: Doc = {
        id: uid('d'),
        title: input.title.trim() || 'Untitled document',
        category: input.category,
        authorId: CURRENT_USER_ID,
        updatedAt: nowIso(),
        body: `# ${input.title.trim() || 'Untitled document'}. Start writing here — this is a demo doc.`,
        tags: [],
      };
      setDocs((prev) => [d, ...prev]);
      pushToast({ title: 'Document created', description: `“${d.title}” (demo session)`, variant: 'success' });
      return d;
    },
    [pushToast],
  );

  const updateDoc = useCallback((id: ID, patch: Partial<Doc>) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, id: d.id, updatedAt: nowIso() } : d)));
  }, []);

  const value = useMemo<ProductivityContextValue>(
    () => ({
      tickets, tasks, projects, docs,
      createTicket, updateTicket, moveTicket, bulkUpdateTickets, addTicketNote, addTicketReply, markTicketRead,
      createTask, updateTask, moveTask, toggleSubtask, addSubtask, addComment,
      updateProject, toggleMilestone,
      createDoc, updateDoc,
    }),
    [
      tickets, tasks, projects, docs,
      createTicket, updateTicket, moveTicket, bulkUpdateTickets, addTicketNote, addTicketReply, markTicketRead,
      createTask, updateTask, moveTask, toggleSubtask, addSubtask, addComment,
      updateProject, toggleMilestone,
      createDoc, updateDoc,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProductivity(): ProductivityContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProductivity must be used within <ProductivityProvider>');
  return ctx;
}
