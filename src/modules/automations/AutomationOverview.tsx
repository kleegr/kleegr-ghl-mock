import { Workflow as WorkflowIcon, CheckCircle2, UserCheck, ExternalLink, ChevronRight, SlidersHorizontal, Activity, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/primitives';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { ENROLLMENT_TREND, TRIGGER_ANALYSIS, OVERVIEW_ERRORS } from './automationData';

const TT = { borderRadius: 10, border: '1px solid #e4e7ec', fontSize: 12 };
const TICK = { fontSize: 11, fill: '#98a2b3' };

function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

function StatCard({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tint}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-muted">{label}</p>
        <p className="font-display text-3xl font-extrabold text-ink">{value}</p>
      </div>
    </Card>
  );
}

export function AutomationOverview({ onNeedsReview }: { onNeedsReview: () => void }) {
  const workflows = useStore((s) => s.workflows);
  const published = workflows.filter((w) => w.status === 'published');
  const totalEnrolled = workflows.reduce((s, w) => s + w.enrolled, 0);

  return (
    <div className="space-y-4 px-6 py-5">
      {/* top row: 3 stat cards + error summary */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-2">
          <StatCard icon={<WorkflowIcon size={22} className="text-brand" />} tint="bg-brand-soft" label="Total Workflows" value={`${workflows.length}`} />
          <StatCard icon={<CheckCircle2 size={22} className="text-good" />} tint="bg-good/10" label="Published Workflows" value={`${published.length}`} />
          <StatCard icon={<UserCheck size={22} className="text-ai" />} tint="bg-ai-soft" label="Total Enrollments" value={fmtK(totalEnrolled)} />
        </div>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-ink">Error Review Summary</p>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">{OVERVIEW_ERRORS.length}</span>
            </div>
            <button onClick={onNeedsReview} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken">
              <ExternalLink size={13} /> Needs Review
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Workflows currently have errors that need attention</p>
          <div className="mt-3 space-y-1.5">
            {OVERVIEW_ERRORS.map((e) => (
              <button key={e.id} onClick={onNeedsReview} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left hover:bg-surface-sunken">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-warn/10 text-warn"><AlertTriangle size={15} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{e.name}</span>
                    <span className="block text-xs text-ink-subtle">{e.lastError}</span>
                  </span>
                </span>
                <ChevronRight size={16} className="text-ink-subtle" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* enrollment trend chart */}
      <Card className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <Activity size={18} className="text-brand" />
          <p className="text-sm font-bold text-ink">Workflow Enrollments - Last 7 Weeks</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ENROLLMENT_TREND} margin={{ left: -8, right: 12, top: 8, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="week" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={0} dy={8} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Line type="monotone" dataKey="value" stroke="#1f6feb" strokeWidth={2.5} dot={{ r: 3, fill: '#1f6feb' }} activeDot={{ r: 5 }} name="Enrollments" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* trigger analysis */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-ink-muted" />
          <div>
            <p className="text-sm font-bold text-ink">Trigger Analysis Filter</p>
            <p className="text-xs text-ink-muted">Filter trigger performance by various criteria to get detailed insights</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <select disabled className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink-subtle">
            <option>Filter Type</option>
          </select>
          <span className="text-sm text-ink-muted">is</span>
          <select disabled className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink-subtle">
            <option>Filter Value</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="flex h-10 items-center rounded-lg border border-line px-3 text-sm text-ink">2026-04-28</span>
            <span className="text-ink-subtle">&rarr;</span>
            <span className="flex h-10 items-center rounded-lg border border-line px-3 text-sm text-ink">2026-05-28</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Attempted Enrollments', value: TRIGGER_ANALYSIS.attempted, sub: 'Total contacts evaluated per workflow' },
            { label: 'Matched Enrollments', value: TRIGGER_ANALYSIS.matched, sub: 'Contacts matching workflow triggers' },
            { label: 'Unmatched Enrollments', value: TRIGGER_ANALYSIS.unmatched, sub: 'Contacts failing to match triggers' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-muted">{m.label}</p>
                <UserCheck size={16} className="text-ink-subtle" />
              </div>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink">{m.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{m.sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-subtle">
          <span className="grid h-4 w-4 place-items-center rounded-full border border-ink-subtle text-[9px]">i</span>
          Trigger Analysis data is available upto last 30 days
        </p>
      </Card>
    </div>
  );
}
