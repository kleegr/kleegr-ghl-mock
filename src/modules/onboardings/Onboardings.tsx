import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Columns3,
  Filter,
  LayoutList,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

type OnboardingStatus = 'New Client' | 'Setup In Progress' | 'Waiting on Client' | 'Ready to Launch' | 'Live';

interface OnboardingRecord {
  id: string;
  company: string;
  contact: string;
  plan: string;
  owner: string;
  due: string;
  progress: number;
  tasksDone: number;
  tasksTotal: number;
  status: OnboardingStatus;
  overdue?: boolean;
  note?: string;
}

const TABS: ModuleHeaderTab[] = [
  { id: 'board', label: 'Onboarding Board' },
  { id: 'list', label: 'All Onboardings', count: 13 },
  { id: 'templates', label: 'Templates' },
];

const STAGES: OnboardingStatus[] = ['New Client', 'Setup In Progress', 'Waiting on Client', 'Ready to Launch', 'Live'];

const STAGE_TONES: Record<OnboardingStatus, string> = {
  'New Client': '#5b8def',
  'Setup In Progress': '#8f62df',
  'Waiting on Client': '#e9a23b',
  'Ready to Launch': '#1aa7b8',
  Live: '#22a06b',
};

const ONBOARDINGS: OnboardingRecord[] = [
  { id: 'ob-1001', company: 'Juniper Wellness', contact: 'Jordan Lee', plan: 'Growth', owner: 'Maya Chen', due: 'Sep 8', progress: 18, tasksDone: 2, tasksTotal: 11, status: 'New Client', note: 'Kickoff booked' },
  { id: 'ob-1002', company: 'Northstar Electric', contact: 'Eli Turner', plan: 'Scale', owner: 'Alex Morgan', due: 'Sep 10', progress: 9, tasksDone: 1, tasksTotal: 11, status: 'New Client' },
  { id: 'ob-1003', company: 'Hearth & Harbor', contact: 'Sasha Patel', plan: 'Growth', owner: 'Maya Chen', due: 'Sep 12', progress: 27, tasksDone: 3, tasksTotal: 11, status: 'New Client' },
  { id: 'ob-1004', company: 'Elm Street Dental', contact: 'Taylor Brooks', plan: 'Scale', owner: 'Drew Carter', due: 'Sep 7', progress: 64, tasksDone: 7, tasksTotal: 11, status: 'Setup In Progress', overdue: true, note: 'Domain connection pending' },
  { id: 'ob-1005', company: 'Oakline Advisors', contact: 'Cameron Wells', plan: 'Launch', owner: 'Alex Morgan', due: 'Sep 11', progress: 55, tasksDone: 6, tasksTotal: 11, status: 'Setup In Progress' },
  { id: 'ob-1006', company: 'Mosaic Home Group', contact: 'Riley Cooper', plan: 'Growth', owner: 'Maya Chen', due: 'Sep 14', progress: 45, tasksDone: 5, tasksTotal: 11, status: 'Setup In Progress' },
  { id: 'ob-1007', company: 'Cedar Lane Fitness', contact: 'Morgan Reed', plan: 'Scale', owner: 'Drew Carter', due: 'Sep 6', progress: 73, tasksDone: 8, tasksTotal: 11, status: 'Waiting on Client', overdue: true, note: 'Waiting for calendar access' },
  { id: 'ob-1008', company: 'Aster Creative Co.', contact: 'Avery Stone', plan: 'Launch', owner: 'Alex Morgan', due: 'Sep 9', progress: 82, tasksDone: 9, tasksTotal: 11, status: 'Waiting on Client' },
  { id: 'ob-1009', company: 'Summit Property Care', contact: 'Casey Ford', plan: 'Growth', owner: 'Maya Chen', due: 'Sep 8', progress: 91, tasksDone: 10, tasksTotal: 11, status: 'Ready to Launch', note: 'Final review scheduled' },
  { id: 'ob-1010', company: 'Wilder & Pine', contact: 'Jamie Park', plan: 'Scale', owner: 'Drew Carter', due: 'Sep 10', progress: 91, tasksDone: 10, tasksTotal: 11, status: 'Ready to Launch' },
  { id: 'ob-1011', company: 'Brightview Pediatrics', contact: 'Quinn James', plan: 'Growth', owner: 'Maya Chen', due: 'Aug 30', progress: 100, tasksDone: 11, tasksTotal: 11, status: 'Live' },
  { id: 'ob-1012', company: 'Atlas Auto Studio', contact: 'Rowan Scott', plan: 'Launch', owner: 'Alex Morgan', due: 'Aug 28', progress: 100, tasksDone: 11, tasksTotal: 11, status: 'Live' },
  { id: 'ob-1013', company: 'Sage Legal Partners', contact: 'Reese Evans', plan: 'Scale', owner: 'Drew Carter', due: 'Aug 26', progress: 100, tasksDone: 11, tasksTotal: 11, status: 'Live' },
];

const TEMPLATES = [
  { name: 'Launch plan', steps: 9, duration: '7 days', usage: 18, color: 'bg-brand' },
  { name: 'Growth implementation', steps: 11, duration: '14 days', usage: 27, color: 'bg-ai' },
  { name: 'Scale migration', steps: 14, duration: '21 days', usage: 9, color: 'bg-[#008fa6]' },
];

function SummaryStrip() {
  const summaries = [
    { label: 'Active onboardings', value: '10', note: 'Across 4 stages', color: 'text-brand' },
    { label: 'Waiting on client', value: '2', note: 'Needs follow-up', color: 'text-warn' },
    { label: 'Launching this week', value: '4', note: 'On track', color: 'text-good' },
    { label: 'Average launch time', value: '12d', note: '2 days faster', color: 'text-ink' },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border-b border-line bg-line lg:grid-cols-4">
      {summaries.map((summary) => (
        <div key={summary.label} className="bg-surface px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{summary.label}</p>
          <div className="mt-1 flex items-end gap-2"><span className={cx('text-xl font-bold', summary.color)}>{summary.value}</span><span className="pb-0.5 text-[10px] text-ink-muted">{summary.note}</span></div>
        </div>
      ))}
    </div>
  );
}

function OnboardingCard({ record, onOpen }: { record: OnboardingRecord; onOpen: (record: OnboardingRecord) => void }) {
  const color = STAGE_TONES[record.status];
  return (
    <article className="w-full rounded-lg border border-line bg-surface p-3 text-left shadow-card transition hover:border-brand/45 hover:shadow-pop">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button type="button" onClick={() => onOpen(record)} className="block max-w-full truncate text-left text-xs font-bold text-ink hover:text-brand">{record.company}</button>
          <p className="mt-0.5 truncate text-[10px] text-ink-muted">{record.contact} · {record.plan}</p>
        </div>
        <button type="button" aria-label={`More options for ${record.company}`} className="-mr-1 -mt-1 rounded p-1 text-ink-subtle hover:bg-surface-sunken"><MoreHorizontal size={14} /></button>
      </div>
      {record.note ? <p className="mt-2 rounded bg-surface-sunken px-2 py-1.5 text-[10px] text-ink-muted">{record.note}</p> : null}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-ink-muted">{record.tasksDone}/{record.tasksTotal} tasks</span><span className="font-semibold text-ink">{record.progress}%</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line/75"><div className="h-full rounded-full" style={{ width: `${record.progress}%`, backgroundColor: color }} /></div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5"><Avatar name={record.owner} size="xs" /><span className="max-w-20 truncate text-[10px] text-ink-muted">{record.owner}</span></div>
        <span className={cx('flex items-center gap-1 text-[10px]', record.overdue ? 'font-semibold text-bad' : 'text-ink-subtle')}><Clock3 size={11} />{record.due}</span>
      </div>
    </article>
  );
}

function BoardView({ records, onOpen }: { records: OnboardingRecord[]; onOpen: (record: OnboardingRecord) => void }) {
  return (
    <div className="h-full min-w-0 overflow-auto p-3">
      <div className="flex min-w-[1120px] items-start gap-3">
        {STAGES.map((stage) => {
          const stageRecords = records.filter((record) => record.status === stage);
          return (
            <section key={stage} className="w-[236px] shrink-0">
              <div className="mb-2 flex h-9 items-center justify-between rounded-md border border-line bg-surface px-2.5">
                <div className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STAGE_TONES[stage] }} /><h3 className="truncate text-[11px] font-bold text-ink">{stage}</h3><span className="text-[10px] text-ink-subtle">{stageRecords.length}</span></div>
                <MoreHorizontal size={14} className="text-ink-subtle" />
              </div>
              <div className="space-y-2">
                {stageRecords.map((record) => <OnboardingCard key={record.id} record={record} onOpen={onOpen} />)}
                <button type="button" className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line py-2 text-[10px] font-semibold text-ink-subtle hover:border-brand/45 hover:text-brand"><Plus size={12} /> Add onboarding</button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ records, onOpen }: { records: OnboardingRecord[]; onOpen: (record: OnboardingRecord) => void }) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[920px] text-left">
          <thead><tr className="border-b border-line bg-[#fbfcfd]">{['Client', 'Status', 'Owner', 'Plan', 'Progress', 'Launch date', ''].map((heading) => <th key={heading} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {records.map((record) => (
              <tr key={record.id} onClick={() => onOpen(record)} className="cursor-pointer hover:bg-surface-sunken/70">
                <td className="px-4 py-3">
                  <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(record); }} className="flex w-full items-center gap-2.5 text-left">
                    <Avatar name={record.company} size="sm" />
                    <span><span className="block text-xs font-semibold text-ink">{record.company}</span><span className="block text-[10px] text-ink-muted">{record.contact}</span></span>
                  </button>
                </td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_TONES[record.status] }} />{record.status}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Avatar name={record.owner} size="xs" /><span className="text-[11px] text-ink-muted">{record.owner}</span></div></td>
                <td className="px-4 py-3 text-[11px] text-ink-muted">{record.plan}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${record.progress}%` }} /></div><span className="text-[10px] font-semibold text-ink">{record.progress}%</span></div></td>
                <td className={cx('px-4 py-3 text-[11px]', record.overdue ? 'font-semibold text-bad' : 'text-ink-muted')}>{record.due}</td>
                <td className="px-4 py-3 text-right"><MoreHorizontal size={15} className="inline text-ink-subtle" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TemplatesView() {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {TEMPLATES.map((template, index) => (
        <Card key={template.name} className="overflow-hidden">
          <div className="flex items-start justify-between p-4">
            <span className={cx('grid h-10 w-10 place-items-center rounded-lg text-white', template.color)}>{index === 0 ? <CircleDot size={18} /> : index === 1 ? <Sparkles size={18} /> : <Settings2 size={18} />}</span>
            <Badge tone="neutral">{template.usage} uses</Badge>
          </div>
          <div className="px-4 pb-4"><p className="text-sm font-bold text-ink">{template.name}</p><p className="mt-1 text-xs text-ink-muted">{template.steps} steps · Target launch in {template.duration}</p><div className="mt-4 flex items-center justify-between border-t border-line pt-3"><span className="text-[10px] text-ink-subtle">Updated Aug 28, 2026</span><button type="button" className="text-[11px] font-semibold text-brand">View template</button></div></div>
        </Card>
      ))}
    </div>
  );
}

function DetailModal({ record, onClose }: { record: OnboardingRecord | null; onClose: () => void }) {
  if (!record) return null;
  return (
    <Modal open onClose={onClose} title={record.company} size="lg" footer={<><Button variant="secondary" size="sm" onClick={onClose}>Close</Button><Button size="sm" onClick={onClose}>Open workspace</Button></>}>
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div>
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-ink">Implementation checklist</p><span className="text-xs font-semibold text-brand">{record.tasksDone}/{record.tasksTotal} complete</span></div>
          <div className="space-y-2">
            {['Welcome call completed', 'Business profile approved', 'Calendar connected', 'Phone number configured', 'Launch review'].map((item, index) => {
              const done = index < Math.min(5, Math.ceil(record.progress / 20));
              return <div key={item} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5"><CheckCircle2 size={16} className={done ? 'text-good' : 'text-ink-subtle'} /><span className={cx('text-xs', done ? 'text-ink-muted line-through' : 'font-medium text-ink')}>{item}</span></div>;
            })}
          </div>
        </div>
        <div className="space-y-3 rounded-xl bg-surface-sunken p-3">
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Status</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_TONES[record.status] }} />{record.status}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Owner</p><div className="mt-1 flex items-center gap-2"><Avatar name={record.owner} size="xs" /><span className="text-xs text-ink">{record.owner}</span></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Target launch</p><p className="mt-1 flex items-center gap-1.5 text-xs text-ink"><CalendarDays size={13} />{record.due}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Files</p><p className="mt-1 flex items-center gap-1.5 text-xs text-ink"><Paperclip size={13} />4 attachments</p></div>
        </div>
      </div>
    </Modal>
  );
}

export function Onboardings() {
  const pushToast = useStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState('board');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OnboardingRecord | null>(null);
  const filtered = useMemo(() => ONBOARDINGS.filter((record) => `${record.company} ${record.contact} ${record.owner}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div data-tour="onboardings.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <ModuleHeader title="Onboardings" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <SummaryStrip />
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button type="button" className="flex h-8 min-w-52 items-center justify-between rounded-lg border border-line px-2.5 text-xs font-medium text-ink"><span>Customer Onboarding</span><ChevronDown size={14} className="text-ink-subtle" /></button>
          <Button variant="secondary" size="sm"><Filter size={14} /> Advanced filters</Button>
          <Button variant="ghost" size="sm"><ArrowDownUp size={14} /> Sort</Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-8 w-56 items-center gap-2 rounded-lg border border-line px-2.5 text-xs text-ink-muted focus-within:border-brand"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search onboardings" placeholder="Search onboardings" className="min-w-0 flex-1 outline-none" /></label>
          <div className="hidden rounded-lg border border-line p-0.5 sm:flex"><button type="button" onClick={() => setActiveTab('board')} aria-label="Board view" className={cx('grid h-7 w-8 place-items-center rounded-md', activeTab === 'board' ? 'bg-brand-soft text-brand' : 'text-ink-subtle')}><Columns3 size={14} /></button><button type="button" onClick={() => setActiveTab('list')} aria-label="List view" className={cx('grid h-7 w-8 place-items-center rounded-md', activeTab === 'list' ? 'bg-brand-soft text-brand' : 'text-ink-subtle')}><LayoutList size={14} /></button></div>
          <Button size="sm" onClick={() => pushToast({ title: 'New onboarding started', description: 'A fictional onboarding workspace was created for the demo.', variant: 'success' })}><Plus size={15} /> New onboarding</Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {activeTab === 'board' ? <BoardView records={filtered} onOpen={setSelected} /> : null}
        {activeTab === 'list' ? <ListView records={filtered} onOpen={setSelected} /> : null}
        {activeTab === 'templates' ? <div className="h-full overflow-auto"><TemplatesView /></div> : null}
      </div>
      <DetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
