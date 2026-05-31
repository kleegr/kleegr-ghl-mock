/**
 * Ticket detail drawer.
 *
 * Adapts Ticketing's TicketDetailModal + TicketNotesPanel + TicketTasksPanel +
 * ThreadAwareTimeline into a right-side slide-over. Stage / priority / assignee
 * are editable inline (writing to the in-memory store); internal notes and a
 * read-only activity timeline mirror the support-desk layout. Opening a ticket
 * marks it read.
 */

import { useEffect, useState } from 'react';
import { CheckSquare, Clock, MessageSquarePlus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { relativeTime, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Ticket, Priority, TicketStage } from '../types';
import {
  CHANNEL_LABEL,
  PRIORITIES,
  TICKET_STAGES,
  TEAM,
  personName,
} from '../data';
import {
  AssigneePill,
  ChannelIcon,
  Drawer,
  DrawerHeader,
  Field,
  MetaRow,
  SectionLabel,
  SelectInput,
  TagChip,
  TicketStageBadge,
  inputCls,
} from './shared';
import { ActivityTimeline } from './ActivityTimeline';

export function TicketDetailDrawer({
  ticketId,
  onClose,
  onOpenTask,
}: {
  ticketId: string | null;
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const { tickets, tasks, moveTicket, updateTicket, addTicketNote, markTicketRead } = useProductivity();
  const ticket: Ticket | undefined = tickets.find((t) => t.id === ticketId);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (ticket && ticket.unread) markTicketRead(ticket.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (!ticket) return null;

  const linkedTasks = tasks.filter((t) => ticket.linkedTaskIds.includes(t.id));

  const submitNote = () => {
    if (!note.trim()) return;
    addTicketNote(ticket.id, note);
    setNote('');
  };

  return (
    <Drawer open={!!ticketId} onClose={onClose} width="max-w-2xl">
      <DrawerHeader
        eyebrow={
          <>
            <span className="font-mono text-ink-muted">{ticket.number}</span>
            <span className="text-ink-subtle">·</span>
            <ChannelIcon channel={ticket.channel} />
            <span>{CHANNEL_LABEL[ticket.channel]}</span>
          </>
        }
        title={ticket.subject}
        onClose={onClose}
        right={<TicketStageBadge stage={ticket.stage} size="md" />}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          {/* Main column */}
          <div className="min-w-0 space-y-5 p-5">
            <div>
              <SectionLabel>Request</SectionLabel>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {ticket.body || 'No description provided.'}
              </p>
              {ticket.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ticket.tags.map((t) => (
                    <TagChip key={t}>
                      <Tag size={11} /> {t}
                    </TagChip>
                  ))}
                </div>
              )}
            </div>

            {linkedTasks.length > 0 && (
              <div>
                <SectionLabel>Linked tasks</SectionLabel>
                <div className="space-y-1.5">
                  {linkedTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onOpenTask?.(t.id)}
                      className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-brand/40 hover:bg-surface-sunken"
                    >
                      <CheckSquare size={14} className="shrink-0 text-ink-subtle" />
                      <span className="flex-1 truncate text-ink">{t.title}</span>
                      <span className="shrink-0 text-[11px] capitalize text-ink-subtle">{t.status.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <SectionLabel>Internal notes</SectionLabel>
              <div className="space-y-2">
                {ticket.notes.length === 0 && (
                  <p className="text-[13px] text-ink-subtle">No internal notes yet. Notes are visible to the team only.</p>
                )}
                {ticket.notes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-line bg-surface-sunken px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink-muted">{personName(n.authorId)}</span>
                      <span>· {relativeTime(n.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] text-ink-muted">{n.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-start gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitNote();
                  }}
                  placeholder="Add an internal note… (⌘/Ctrl + Enter)"
                  className={`${inputCls} h-16 resize-none py-2`}
                />
                <Button size="sm" variant="secondary" onClick={submitNote} disabled={!note.trim()} className="mt-0.5 shrink-0">
                  <MessageSquarePlus size={14} /> Add
                </Button>
              </div>
            </div>

            {/* Activity */}
            <div>
              <SectionLabel>Activity</SectionLabel>
              <ActivityTimeline items={ticket.activity} />
            </div>
          </div>

          {/* Side meta */}
          <div className="space-y-4 border-t border-line p-5 md:border-l md:border-t-0 bg-surface-sunken/40">
            <Field label="Stage">
              <SelectInput value={ticket.stage} onChange={(v) => moveTicket(ticket.id, v as TicketStage)}>
                {TICKET_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Priority">
              <SelectInput value={ticket.priority} onChange={(v) => updateTicket(ticket.id, { priority: v as Priority })}>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Assignee">
              <SelectInput
                value={ticket.assigneeId ?? ''}
                onChange={(v) => updateTicket(ticket.id, { assigneeId: v || undefined })}
              >
                <option value="">— Unassigned —</option>
                {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectInput>
            </Field>

            <div className="space-y-1 border-t border-line pt-3 text-[12px]">
              <MetaRow label="Requester">
                <span className="text-ink">{ticket.requester}</span>
              </MetaRow>
              {ticket.requesterEmail && (
                <MetaRow label="Email"><span className="text-ink-muted">{ticket.requesterEmail}</span></MetaRow>
              )}
              {ticket.company && (
                <MetaRow label="Company"><span className="text-ink-muted">{ticket.company}</span></MetaRow>
              )}
              <MetaRow label="Owner"><AssigneePill id={ticket.assigneeId} /></MetaRow>
              {ticket.dueAt && (
                <MetaRow label="Due">
                  <span className="inline-flex items-center gap-1 text-ink-muted"><Clock size={12} /> {dateLabel(ticket.dueAt)}</span>
                </MetaRow>
              )}
              <MetaRow label="Created"><span className="text-ink-muted">{relativeTime(ticket.createdAt)}</span></MetaRow>
              <MetaRow label="Updated"><span className="text-ink-muted">{relativeTime(ticket.updatedAt)}</span></MetaRow>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
