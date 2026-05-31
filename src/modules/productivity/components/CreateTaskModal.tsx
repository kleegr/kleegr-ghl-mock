/**
 * Create Task modal — adapts Meridian's new-task composer. Writes a task to the
 * in-memory store; no backend. Mirrors the CreateTicketModal layout/idiom.
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { Field, SelectInput, inputCls } from './shared';
import { useProductivity } from '../state';
import type { Priority, TaskStatus, TaskType } from '../types';
import { PRIORITIES, TASK_STATUSES, TASK_TYPE_LABEL, TEAM } from '../data';

export function CreateTaskModal({
  open,
  onClose,
  defaultProjectId,
  defaultStatus,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}) {
  const { createTask, projects } = useProductivity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus ?? 'todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [dueAt, setDueAt] = useState('');
  const [points, setPoints] = useState('');
  const [tags, setTags] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setStatus(defaultStatus ?? 'todo'); setPriority('medium');
    setType('task'); setAssigneeId(''); setProjectId(defaultProjectId ?? ''); setDueAt(''); setPoints(''); setTags('');
  };
  const handleClose = () => { reset(); onClose(); };

  const submit = () => {
    if (!title.trim()) return;
    createTask({
      title,
      description,
      status,
      priority,
      type,
      assigneeId: assigneeId || undefined,
      projectId: projectId || undefined,
      dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : undefined,
      points: points ? Number(points) : undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Task"
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button data-tour="productivity.create-task-submit" size="sm" disabled={!title.trim()} onClick={submit}>
            Create Task
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Title" required>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputCls} h-20 resize-none py-2`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add detail, acceptance criteria, links…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Status">
            <SelectInput value={status} onChange={(v) => setStatus(v as TaskStatus)}>
              {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput value={priority} onChange={(v) => setPriority(v as Priority)}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Type">
            <SelectInput value={type} onChange={(v) => setType(v as TaskType)}>
              {(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((t) => (
                <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Points">
            <input type="number" min="0" max="21" className={inputCls} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="—" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <SelectInput value={assigneeId} onChange={setAssigneeId}>
              <option value="">— Unassigned —</option>
              {TEAM.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Project">
            <SelectInput value={projectId} onChange={setProjectId}>
              <option value="">— No project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectInput>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <input type="date" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          <Field label="Tags">
            <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" />
          </Field>
        </div>

        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">
          Demo mode: tasks are stored in memory for this session only — no backend, no real data.
        </p>
      </div>
    </Modal>
  );
}
