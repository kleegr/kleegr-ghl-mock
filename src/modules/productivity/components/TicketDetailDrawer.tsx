/**
 * Ticket detail drawer.
 *
 * Adapts Ticketing's TicketDetailModal + ThreadTabs (conversation/reply) +
 * TicketNotesPanel + TicketTasksPanel + ThreadAwareTimeline into a right-side
 * slide-over. A conversation thread shows the inbound request and agent
 * replies; quick actions (reply, assign to me, resolve/reopen) and the
 * editable stage/priority/assignee write to the in-memory store. Internal
 * notes and a read-only activity timeline mirror the support-desk layout.
 * Opening a ticket marks it read.
 */

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CheckSquare, Clock, MessageSquarePlus, RotateCcw, Send, Tag, UserPlus } from 'lucide-react';
import { Avatar, Button } from '@/components/ui/primitives';
import { relativeTime, dateLabel } from '@/utils';
import { cx } from '@/utils';
import { useProductivity } from '../state';
import type { Ticket, Priority, TicketStage } from '../types';
import {
  CHANNEL_LABEL,
  CURRENT_USER_ID,
  PRIORITIES,
  TICKET_STAGES,
  TEAM,
  personName,
} from '../data';
import { ticketCategory } from '../ticketMeta';
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
  const { tickets, tasks, moveTicket, updateTicket, addTicketNote, addTicketReply, markTicketRead } = useProductivity();
  const ticket: Ticket | undefined = tickets.find((t) => t.id === ticketId);
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ticket && ticket.unread) markTicketRead(ticket.id);
    setNote('');
    setReply('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (!ticket) return null;

  const linkedTasks = tasks.filter((t) => ticket.linkedTaskIds.includes(t.id));
  const replies = ticket.replies ?? [];
  const resolved = ticket.stage === 'resolved' || ticket.stage === 'closed';
  const isMine = ticket.assigneeId === CURRENT_USER_ID;

  const submitNote = () => {
    if (!note.trim()) return;
    addTicketNote(ticket.id, note);
    setNote('');
  };
  const submitReply = () => {
    if (!reply.trim()) return;
    addTicketReply(ticket.id, reply);
    setReply('');
  };
  const focusReply = () => {
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <span className="text-ink-subtle">·</span>
            <span>{ticketCategory(ticket)}</span>
          </>
        }
        title={ticket.subject}
        onClose={onClose}
        right={<TicketStageBadge stage={ticket.stage} size="md" />}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-sunken/40 px-5 py-2.5">
          <Button size="xs" variant="secondary" onClick={focusReply}><Send size={13} /> Reply</Button>
          <Button size="xs" variant="secondary" onClick={() => updateTicket(ticket.id, { assigneeId: CURRENT_USER_ID })} disabled={isMine}>
            <UserPlus size={13} /> {isMine ? 'Assigned to you' : 'Assign to me'}
          </Button>
          {resolved ? (
            <Button size="xs" variant="secondary" onClick={() => moveTicket(ticket.id, 'open')}>
              <RotateCcw size={13} /> Reopen
            </Button>
          ) : (
            <Button size="xs" variant="primary" onClick={() => moveTicket(ticket.id, 'resolved')}>
              <CheckCircle2 size={13} /> Mark resolved
            </Button>
          )}
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          {/* Main column */}
          <div className="min-w-0 space-y-5 p-5">
            {ticket.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((t) => (
                  <TagChip key={t}>
                    <Tag size={11} /> {t}
                  </TagChip>
                ))}
              </div>
            )}

            {/* Conversation */}
            <div>
              <SectionLabel>Conversation</SectionLabel>
              <div className="space-y-3">
                {/* Inbound request */}
                <div className="flex gap-2.5">
                  <Avatar name={ticket.requester} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink-muted">{ticket.requester}</span>
                      {ticket.requesterEmail && <span className="truncate">· {ticket.requesterEmail}</span>}
                      <span>· {relativeTime(ticket.createdAt)}</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-line bg-surface-sunken px-3 py-2">
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                        {ticket.body || 'No message body provided.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.map((r) =>
                  r.outbound ? (
                    <div key={r.id} className="flex flex-row-reverse gap-2.5">
                      <Avatar name={personName(r.authorId)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-end gap-2 text-[11px] text-ink-subtle">
                          <span>{relativeTime(r.at)} ·</span>
                          <span className="font-semibold text-ink-muted">{personName(r.authorId)}</span>
                        </div>
                        <div className="rounded-2xl rounded-tr-sm border border-brand/20 bg-brand-soft px-3 py-2">
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{r.body}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="flex gap-2.5">
                      <Avatar name={r.authorName ?? ticket.requester} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2 text-[11px] text-ink-subtle">
                          <span className="font-semibold text-ink-muted">{r.authorName ?? ticket.requester}</span>
                          <span>· {relativeTime(r.at)}</span>
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-line bg-surface-sunken px-3 py-2">
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">{r.body}</p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Reply composer */}
              <div className="mt-3 rounded-xl border border-line p-2.5">
                <textarea
                  ref={replyRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitReply(); }}
                  placeholder={`Reply to ${ticket.requester}… (⌘/Ctrl + Enter to send)`}
                  className={`${inputCls} h-20 resize-none py-2`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-subtle">Demo reply — added to the thread, not actually emailed.</span>
                  <Button size="sm" onClick={submitReply} disabled={!reply.trim()}>
                    <Send size={14} /> Send reply
                  </Button>
                </div>
              </div>
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
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitNote(); }}
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
          <div className={cx('space-y-4 border-t border-line p-5 md:border-l md:border-t-0', 'bg-surface-sunken/40')}>
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
              <MetaRow label="Requester"><span className="text-ink">{ticket.requester}</span></MetaRow>
              {ticket.requesterEmail && (
                <MetaRow label="Email"><span className="text-ink-muted">{ticket.requesterEmail}</span></MetaRow>
              )}
              {ticket.company && (
                <MetaRow label="Company"><span className="text-ink-muted">{ticket.company}</span></MetaRow>
              )}
              <MetaRow label="Category"><span className="text-ink-muted">{ticketCategory(ticket)}</span></MetaRow>
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
