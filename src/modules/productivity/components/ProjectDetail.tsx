/**
 * Project detail drawer — milestones (toggle complete), linked tasks with live
 * progress, owner/status/dates, and activity. Adapts Meridian's project view.
 */

import { CheckSquare, Flag } from 'lucide-react';
import { cx, dateLabel, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { Project, ProjectStatus } from '../types';
import { PROJECT_STATUS_META, personName } from '../data';
import {
  AssigneePill,
  Drawer,
  DrawerHeader,
  Field,
  MetaRow,
  ProjectStatusBadge,
  SectionLabel,
  SelectInput,
  TaskStatusBadge,
} from './shared';
import { ActivityTimeline } from './ActivityTimeline';

export function ProjectDetail({
  projectId,
  onClose,
  onOpenTask,
}: {
  projectId: string | null;
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const { projects, tasks, updateProject, toggleMilestone } = useProductivity();
  const project: Project | undefined = projects.find((p) => p.id === projectId);

  if (!project) return null;

  const linkedTasks = tasks.filter((t) => t.projectId === project.id);
  const doneTasks = linkedTasks.filter((t) => t.status === 'done').length;
  const taskPct = linkedTasks.length ? Math.round((doneTasks / linkedTasks.length) * 100) : 0;
  const doneMs = project.milestones.filter((m) => m.done).length;

  return (
    <Drawer open={!!projectId} onClose={onClose} width="max-w-2xl">
      <DrawerHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
            Project
          </span>
        }
        title={project.name}
        onClose={onClose}
        right={<ProjectStatusBadge status={project.status} size="md" />}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-0 md:grid-cols-[1fr_240px]">
          <div className="min-w-0 space-y-5 p-5">
            <p className="text-sm leading-relaxed text-ink-muted">{project.description}</p>

            {/* Progress */}
            <div className="rounded-xl border border-line bg-surface-sunken/50 p-3">
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-ink">Task progress</span>
                <span className="text-ink-muted">{doneTasks}/{linkedTasks.length} done · {taskPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full transition-all" style={{ width: `${taskPct}%`, backgroundColor: project.color }} />
              </div>
            </div>

            {/* Milestones */}
            <div>
              <SectionLabel>Milestones <span className="ml-1 font-normal text-ink-subtle">{doneMs}/{project.milestones.length}</span></SectionLabel>
              <div className="space-y-1">
                {project.milestones.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMilestone(project.id, m.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-sunken"
                  >
                    <span className={cx('grid h-4 w-4 shrink-0 place-items-center rounded border', m.done ? 'border-good bg-good text-white' : 'border-ink-subtle/50')}>
                      {m.done && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    <Flag size={13} className={cx('shrink-0', m.done ? 'text-good' : 'text-ink-subtle')} />
                    <span className={cx('flex-1', m.done && 'text-ink-subtle line-through')}>{m.title}</span>
                    <span className="shrink-0 text-[11px] text-ink-subtle">{dateLabel(m.dueAt)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Linked tasks */}
            <div>
              <SectionLabel>Tasks in this project</SectionLabel>
              {linkedTasks.length === 0 ? (
                <p className="text-[13px] text-ink-subtle">No tasks linked yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {linkedTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onOpenTask?.(t.id)}
                      className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-brand/40 hover:bg-surface-sunken"
                    >
                      <CheckSquare size={14} className="shrink-0 text-ink-subtle" />
                      <span className="flex-1 truncate text-ink">{t.title}</span>
                      <TaskStatusBadge status={t.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Activity */}
            <div>
              <SectionLabel>Activity</SectionLabel>
              <ActivityTimeline items={project.activity} />
            </div>
          </div>

          {/* Side meta */}
          <div className="space-y-4 border-t border-line p-5 md:border-l md:border-t-0 bg-surface-sunken/40">
            <Field label="Status">
              <SelectInput value={project.status} onChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}>
                {Object.entries(PROJECT_STATUS_META).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
              </SelectInput>
            </Field>

            <div className="space-y-1 border-t border-line pt-3 text-[12px]">
              <MetaRow label="Owner"><AssigneePill id={project.ownerId} /></MetaRow>
              <MetaRow label="Owner name"><span className="text-ink-muted">{personName(project.ownerId)}</span></MetaRow>
              <MetaRow label="Start"><span className="text-ink-muted">{dateLabel(project.startAt)}</span></MetaRow>
              <MetaRow label="Due"><span className="text-ink-muted">{dateLabel(project.dueAt)}</span></MetaRow>
              <MetaRow label="Tasks"><span className="text-ink">{linkedTasks.length}</span></MetaRow>
              <MetaRow label="Updated">
                <span className="text-ink-muted">{project.activity[0] ? relativeTime(project.activity[0].at) : '—'}</span>
              </MetaRow>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
