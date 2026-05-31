/**
 * Task detail drawer.
 *
 * Adapts Meridian's SubtaskDetail / task drawer: subtasks with progress,
 * threaded comments, activity history, and inline editable status / priority /
 * assignee / points / project. All writes hit the in-memory store.
 */

import { useState } from 'react';
import { Clock, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { cx, dateLabel, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { Priority, Task, TaskStatus } from '../types';
import { PRIORITIES, TASK_STATUSES, TASK_TYPE_LABEL, TEAM, personName } from '../data';
import {
  AssigneePill,
  Drawer,
  DrawerHeader,
  Field,
  MetaRow,
  PriorityBadge,
  SectionLabel,
  SelectInput,
  TagChip,
  TaskStatusBadge,
  TaskTypeIcon,
  inputCls,
} from './shared';
import { ActivityTimeline } from './ActivityTimeline';

export function TaskDetailDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const { tasks, projects, updateTask, moveTask, toggleSubtask, addSubtask, addComment } = useProductivity();
  const task: Task | undefined = tasks.find((t) => t.id === taskId);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [comment, setComment] = useState('');

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const subPct = task.subtasks.length ? Math.round((doneSubs / task.subtasks.length) * 100) : 0;

  const submitSubtask = () => {
    if (!subtaskTitle.trim()) return;
    addSubtask(task.id, subtaskTitle);
    setSubtaskTitle('');
  };
  const submitComment = () => {
    if (!comment.trim()) return;
    addComment(task.id, comment);
    setComment('');
  };

  return (
    <Drawer open={!!taskId} onClose={onClose} width="max-w-2xl">
      <DrawerHeader
        eyebrow={
          <>
            <TaskTypeIcon type={task.type} />
            <span>{TASK_TYPE_LABEL[task.type]}</span>
            {project && (
              <>
                <span className="text-ink-subtle">·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.name}
                </span>
              </>
            )}
          </>
        }
        title={task.title}
        onClose={onClose}
        right={<TaskStatusBadge status={task.status} size="md" />}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-0 md:grid-cols-[1fr_240px]">
          <div className="min-w-0 space-y-5 p-5">
            {task.description && (
              <div>
                <SectionLabel>Description</SectionLabel>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{task.description}</p>
              </div>
            )}

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((t) => <TagChip key={t}>{t}</TagChip>)}
              </div>
            )}

            {/* Subtasks */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <SectionLabel>Subtasks {task.subtasks.length > 0 && <span className="ml-1 font-normal text-ink-subtle">{doneSubs}/{task.subtasks.length}</span>}</SectionLabel>
              </div>
              {task.subtasks.length > 0 && (
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-good transition-all" style={{ width: `${subPct}%` }} />
                </div>
              )}
              <div className="space-y-1">
                {task.subtasks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubtask(task.id, s.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-sunken"
                  >
                    <span className={cx('grid h-4 w-4 shrink-0 place-items-center rounded border', s.done ? 'border-good bg-good text-white' : 'border-ink-subtle/50')}>
                      {s.done && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    <span className={cx('flex-1', s.done && 'text-ink-subtle line-through')}>{s.title}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitSubtask()}
                  placeholder="Add a subtask…"
                  className={inputCls}
                />
                <Button size="sm" variant="secondary" onClick={submitSubtask} disabled={!subtaskTitle.trim()} className="shrink-0">
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <SectionLabel>Comments</SectionLabel>
              <div className="space-y-2">
                {task.comments.length === 0 && <p className="text-[13px] text-ink-subtle">No comments yet.</p>}
                {task.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-line bg-surface-sunken px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink-muted">{personName(c.authorId)}</span>
                      <span>· {relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] text-ink-muted">{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-start gap-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitComment(); }}
                  placeholder="Write a comment… (⌘/Ctrl + Enter)"
                  className={`${inputCls} h-16 resize-none py-2`}
                />
                <Button size="sm" variant="secondary" onClick={submitComment} disabled={!comment.trim()} className="mt-0.5 shrink-0">
                  <Send size={14} />
                </Button>
              </div>
            </div>

            {/* Activity */}
            <div>
              <SectionLabel>Activity</SectionLabel>
              <ActivityTimeline items={task.activity} />
            </div>
          </div>

          {/* Side meta */}
          <div className="space-y-4 border-t border-line p-5 md:border-l md:border-t-0 bg-surface-sunken/40">
            <Field label="Status">
              <SelectInput value={task.status} onChange={(v) => moveTask(task.id, v as TaskStatus)}>
                {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Priority">
              <SelectInput value={task.priority} onChange={(v) => updateTask(task.id, { priority: v as Priority })}>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Assignee">
              <SelectInput value={task.assigneeId ?? ''} onChange={(v) => updateTask(task.id, { assigneeId: v || undefined })}>
                <option value="">— Unassigned —</option>
                {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Project">
              <SelectInput value={task.projectId ?? ''} onChange={(v) => updateTask(task.id, { projectId: v || undefined })}>
                <option value="">— No project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectInput>
            </Field>

            <div className="space-y-1 border-t border-line pt-3 text-[12px]">
              <MetaRow label="Priority"><PriorityBadge priority={task.priority} /></MetaRow>
              <MetaRow label="Points"><span className="text-ink">{task.points ?? '—'}</span></MetaRow>
              <MetaRow label="Owner"><AssigneePill id={task.assigneeId} /></MetaRow>
              {task.startAt && <MetaRow label="Start"><span className="text-ink-muted">{dateLabel(task.startAt)}</span></MetaRow>}
              {task.dueAt && (
                <MetaRow label="Due">
                  <span className="inline-flex items-center gap-1 text-ink-muted"><Clock size={12} /> {dateLabel(task.dueAt)}</span>
                </MetaRow>
              )}
              <MetaRow label="Created"><span className="text-ink-muted">{relativeTime(task.createdAt)}</span></MetaRow>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
