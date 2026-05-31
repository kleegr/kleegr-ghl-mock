import { useMemo, useState } from 'react';
import { Search, History } from 'lucide-react';
import { relativeTime } from '@/utils';
import { Badge, EmptyState } from '@/components/ui/primitives';
import { useContactsModule } from '../context';
import type { BulkJobStatus } from '../data';

/**
 * Bulk Actions — a job history of every bulk operation run this session
 * (seeded with a few realistic past jobs, then appended to whenever a bulk
 * action runs from the contacts table). Supports search and a status filter.
 */

const STATUS_TONE: Record<BulkJobStatus, 'good' | 'brand' | 'warn' | 'bad'> = {
  completed: 'good',
  running: 'brand',
  queued: 'warn',
  failed: 'bad',
};

const STATUS_LABEL: Record<BulkJobStatus, string> = {
  completed: 'Completed',
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
};

const FILTERS: { id: 'all' | BulkJobStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'running', label: 'Running' },
  { id: 'queued', label: 'Queued' },
  { id: 'failed', label: 'Failed' },
];

export function BulkActionsView() {
  const { jobs } = useContactsModule();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | BulkJobStatus>('all');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (status !== 'all' && j.status !== status) return false;
      if (q && !(j.action.toLowerCase().includes(q) || j.createdBy.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [jobs, search, status]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-5 py-2.5">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs…"
            className="w-full rounded-lg border border-line bg-surface-sunken py-1.5 pl-7 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>
        <div className="inline-flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={
                'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ' +
                (status === f.id
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto whitespace-nowrap rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-muted">
          {rows.length} {rows.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={<History size={20} />}
            title="No bulk jobs yet"
            body="Run a bulk action from the contacts table — add a tag, assign an owner, or export — and it will appear here."
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-line text-left">
                {['Action', 'Created By', 'Status', 'Contacts', 'Progress', 'Created'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => {
                const ratio = job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0;
                return (
                  <tr key={job.id} className="border-b border-line/70">
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm font-semibold text-ink">{job.action}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="whitespace-nowrap text-xs text-ink-muted">{job.createdBy}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge tone={STATUS_TONE[job.status]} size="sm">
                        {STATUS_LABEL[job.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-xs font-semibold text-ink">{job.total}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-sunken">
                          <div
                            className={
                              'h-full rounded-full ' + (job.status === 'failed' ? 'bg-bad' : 'bg-brand')
                            }
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-[11px] text-ink-subtle">
                          {job.completed}/{job.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="whitespace-nowrap text-xs text-ink-subtle">{relativeTime(job.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
