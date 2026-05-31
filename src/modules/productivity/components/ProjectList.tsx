/**
 * Projects tab — card grid with live task progress + milestone counts. Cards
 * open the project detail drawer. Adapts Meridian's project list/cards.
 */

import { useState } from 'react';
import { Flag, ListChecks } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { cx, dateLabel } from '@/utils';
import { useProductivity } from '../state';
import type { Project } from '../types';
import { personName } from '../data';
import { AssigneePill, ProjectStatusBadge } from './shared';
import { ProjectDetail } from './ProjectDetail';

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  const { tasks } = useProductivity();
  const linked = tasks.filter((t) => t.projectId === project.id);
  const done = linked.filter((t) => t.status === 'done').length;
  const pct = linked.length ? Math.round((done / linked.length) * 100) : 0;
  const doneMs = project.milestones.filter((m) => m.done).length;

  return (
    <button onClick={() => onOpen(project.id)} className="text-left">
      <Card className="h-full p-0 transition-all hover:-translate-y-0.5 hover:shadow-pop">
        <div className="h-1.5 w-full rounded-t-xl" style={{ backgroundColor: project.color }} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-tight text-ink">{project.name}</h3>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{project.description}</p>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-ink-subtle">
              <span>{done}/{linked.length} tasks</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: project.color }} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-ink-subtle">
              <span className="inline-flex items-center gap-1"><ListChecks size={13} /> {linked.length}</span>
              <span className="inline-flex items-center gap-1"><Flag size={13} /> {doneMs}/{project.milestones.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AssigneePill id={project.ownerId} />
              <span className="text-[11px] text-ink-subtle">{dateLabel(project.dueAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}

export function ProjectList({ onOpenTask }: { onOpenTask?: (taskId: string) => void }) {
  const { projects } = useProductivity();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto">
      <div
        data-tour="productivity.project-list"
        className={cx('grid gap-3', 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')}
      >
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={setOpenId} />
        ))}
      </div>

      <p className="mt-3 px-1 text-[11px] text-ink-subtle">
        {projects.length} projects · owners are demo team members ({personName('u_jordan')}, {personName('u_alex')}, …). Demo data only.
      </p>

      <ProjectDetail projectId={openId} onClose={() => setOpenId(null)} onOpenTask={onOpenTask} />
    </div>
  );
}
