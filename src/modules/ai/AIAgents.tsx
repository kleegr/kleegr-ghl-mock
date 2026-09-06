import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Headphones,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

type AgentStatus = 'Active' | 'Draft' | 'Training';

interface DemoAgent {
  id: string;
  name: string;
  role: string;
  type: string;
  channels: string[];
  handled: number;
  status: AgentStatus;
  updated: string;
  color: string;
}

const MODULE_TABS: ModuleHeaderTab[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'agents', label: 'Agents', count: 4 },
  { id: 'knowledge', label: 'Knowledge Bases', count: 3 },
];

const AGENTS: DemoAgent[] = [
  {
    id: 'ava',
    name: 'Ava',
    role: 'Lead qualification agent',
    type: 'Voice AI',
    channels: ['Phone'],
    handled: 184,
    status: 'Active',
    updated: 'Sep 5, 2026',
    color: 'from-[#305bea] to-[#7047eb]',
  },
  {
    id: 'harper',
    name: 'Harper',
    role: 'Client support assistant',
    type: 'Conversation AI',
    channels: ['Web chat', 'SMS'],
    handled: 312,
    status: 'Active',
    updated: 'Sep 4, 2026',
    color: 'from-[#008dc5] to-[#00b9d9]',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Appointment concierge',
    type: 'Voice AI',
    channels: ['Phone', 'Web chat'],
    handled: 76,
    status: 'Training',
    updated: 'Sep 2, 2026',
    color: 'from-[#df7e2c] to-[#efb34a]',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Review response specialist',
    type: 'Reviews AI',
    channels: ['Reviews'],
    handled: 0,
    status: 'Draft',
    updated: 'Aug 29, 2026',
    color: 'from-[#7e4bdc] to-[#c04fd8]',
  },
];

const KNOWLEDGE_SOURCES = [
  { name: 'Kleegr services & pricing', files: 18, words: '42.8K', status: 'Ready', updated: '2 hours ago' },
  { name: 'Client support handbook', files: 11, words: '26.4K', status: 'Ready', updated: 'Yesterday' },
  { name: 'Appointment policies', files: 6, words: '9.2K', status: 'Syncing', updated: 'Just now' },
];

const SETUP_STEPS = [
  { label: 'Choose an agent type', body: 'Start with Voice AI or Conversation AI.', done: true },
  { label: 'Give your agent a purpose', body: 'Set its goals, tone, and escalation rules.', done: true },
  { label: 'Connect business knowledge', body: 'Add FAQs, pages, and approved documents.', done: false },
  { label: 'Test and publish', body: 'Run a sample conversation before going live.', done: false },
];

function StatusBadge({ status }: { status: AgentStatus }) {
  const tone = status === 'Active' ? 'good' : status === 'Training' ? 'warn' : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}

function AgentMark({ agent, size = 'md' }: { agent: DemoAgent; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
        agent.color,
        size === 'lg' ? 'h-12 w-12' : 'h-9 w-9',
      )}
    >
      <Bot size={size === 'lg' ? 22 : 17} />
    </span>
  );
}

function GettingStarted({ onCreate }: { onCreate: () => void }) {
  const pushToast = useStore((state) => state.pushToast);

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-ai">
            <Sparkles size={14} /> AI EMPLOYEES
          </div>
          <h2 className="text-[28px] font-bold tracking-[-0.035em] text-ink">Welcome to AI Agents</h2>
          <p className="mt-1 text-sm text-ink-muted">Build capable agents that answer, qualify, schedule, and support around the clock.</p>
        </div>
        <Button onClick={onCreate} size="sm"><Plus size={15} /> Create AI agent</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-gradient-to-r from-[#f4f0ff] via-white to-[#ecf8ff] px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-ink">Set up your first AI employee</h3>
                <p className="mt-1 text-xs text-ink-muted">Two more steps before Ava is ready for live calls.</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-ink">50%</p>
                <p className="text-[11px] text-ink-subtle">2 of 4 complete</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/90 ring-1 ring-line/60">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-ai to-brand" />
            </div>
          </div>

          <div className="divide-y divide-line">
            {SETUP_STEPS.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => pushToast({
                  title: step.done ? 'Step already complete' : step.label,
                  description: step.done ? 'This setup item is already configured.' : 'This guided setup opens here in the live account.',
                  variant: 'info',
                })}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-sunken/70"
              >
                <span className={cx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold',
                  step.done ? 'border-good bg-good/10 text-good' : 'border-line bg-surface text-ink-muted',
                )}>
                  {step.done ? <Check size={15} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx('block text-sm font-semibold', step.done ? 'text-ink-muted' : 'text-ink')}>{step.label}</span>
                  <span className="block text-xs text-ink-subtle">{step.body}</span>
                </span>
                <ChevronRight size={16} className="text-ink-subtle" />
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Your AI team</p>
                <p className="text-xs text-ink-muted">Two agents currently active</p>
              </div>
              <span className="rounded-full bg-good/10 px-2 py-1 text-[10px] font-bold text-good">ALL SYSTEMS READY</span>
            </div>
            <div className="space-y-2.5">
              {AGENTS.slice(0, 3).map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                  <AgentMark agent={agent} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{agent.name}</p>
                    <p className="truncate text-[11px] text-ink-muted">{agent.role}</p>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-start gap-3 bg-banner px-4 py-4 text-white">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10"><Headphones size={18} /></span>
              <div>
                <p className="text-sm font-semibold">Try a practice call</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">Hear how Ava answers a fictional sales enquiry before you publish.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => pushToast({ title: 'Practice call ready', description: 'The live product opens an interactive test call here.', variant: 'info' })}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-brand hover:bg-surface-sunken"
            >
              Start practice call <ArrowRight size={14} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AgentsTable({ onCreate }: { onCreate: () => void }) {
  const [query, setQuery] = useState('');
  const pushToast = useStore((state) => state.pushToast);
  const filtered = AGENTS.filter((agent) => `${agent.name} ${agent.role} ${agent.type}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-ink">Agents</h2>
          <p className="text-xs text-ink-muted">Create, train, and manage AI employees for your business.</p>
        </div>
        <Button size="sm" onClick={onCreate}><Plus size={15} /> Create agent</Button>
      </div>

      <div className="flex-1 overflow-auto bg-surface-sunken p-4">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm"><Settings2 size={14} /> Filters</Button>
              <span className="rounded-md bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">{filtered.length} Agents</span>
            </div>
            <label className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-muted focus-within:border-brand">
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
                placeholder="Search agents"
                aria-label="Search agents"
              />
            </label>
          </div>

          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-[#fbfcfd]">
                {['Agent', 'Status', 'Type', 'Channels', 'Conversations', 'Last updated', ''].map((heading) => (
                  <th key={heading} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-subtle">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((agent) => (
                <tr key={agent.id} className="group hover:bg-surface-sunken/70">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => pushToast({ title: `${agent.name} opened`, description: 'Agent configuration is read-only in this public demo.', variant: 'info' })}
                      className="flex items-center gap-3 text-left"
                    >
                      <AgentMark agent={agent} />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{agent.name}</span>
                        <span className="block text-[11px] text-ink-muted">{agent.role}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={agent.status} /></td>
                  <td className="px-4 py-3 text-xs font-medium text-ink-muted">{agent.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.channels.map((channel) => <span key={channel} className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-muted">{channel}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-ink">{agent.handled.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{agent.updated}</td>
                  <td className="px-4 py-3 text-right"><button type="button" aria-label={`More options for ${agent.name}`} className="rounded p-1.5 text-ink-subtle hover:bg-line/50 hover:text-ink"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBases() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-ink">Knowledge Bases</h2>
          <p className="text-xs text-ink-muted">Give your agents approved, reliable information to answer from.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Add knowledge base</Button>
      </div>
      <div className="flex-1 overflow-auto bg-surface-sunken p-4">
        <div className="grid gap-3 lg:grid-cols-3">
          {KNOWLEDGE_SOURCES.map((source, index) => (
            <Card key={source.name} className="overflow-hidden">
              <div className="flex items-start justify-between px-4 pt-4">
                <span className={cx('grid h-10 w-10 place-items-center rounded-lg', index === 0 ? 'bg-ai-soft text-ai' : 'bg-brand-soft text-brand')}>
                  {index === 0 ? <BrainCircuit size={19} /> : index === 1 ? <FileText size={19} /> : <Database size={19} />}
                </span>
                <Badge tone={source.status === 'Ready' ? 'good' : 'warn'}>{source.status}</Badge>
              </div>
              <div className="px-4 pb-4 pt-3">
                <p className="text-sm font-bold text-ink">{source.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{source.files} sources · {source.words} words</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-subtle">
                  <span>Updated {source.updated}</span>
                  <button type="button" className="font-semibold text-brand hover:underline">Manage</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add knowledge base"
        footer={<><Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setOpen(false)}>Continue</Button></>}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: UploadCloud, title: 'Upload files', body: 'PDF, DOCX, TXT, or CSV' },
            { icon: Database, title: 'Website pages', body: 'Train from a public URL' },
          ].map(({ icon: Icon, title, body }) => (
            <button key={title} type="button" className="rounded-xl border border-line p-4 text-left hover:border-brand hover:bg-brand-soft/30">
              <Icon size={20} className="text-brand" />
              <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{body}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function CreateAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pushToast = useStore((state) => state.pushToast);
  const [selectedType, setSelectedType] = useState('conversation');
  const types = [
    { id: 'conversation', icon: Sparkles, title: 'Conversation AI', body: 'Respond across web chat and SMS.' },
    { id: 'voice', icon: Phone, title: 'Voice AI', body: 'Answer, qualify, and book by phone.' },
  ];

  const create = () => {
    onClose();
    pushToast({ title: 'Agent draft created', description: 'A fictional agent was added for this demo session.', variant: 'success' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create an AI agent"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={create}>Continue <ArrowRight size={14} /></Button></>}
    >
      <p className="mb-3 text-xs text-ink-muted">Choose the kind of work this agent will handle. You can adjust its channels later.</p>
      <div className="space-y-2">
        {types.map(({ id, icon: Icon, title, body }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedType(id)}
            className={cx('flex w-full items-center gap-3 rounded-xl border p-3 text-left', selectedType === id ? 'border-brand bg-brand-soft/45' : 'border-line hover:bg-surface-sunken')}
          >
            <span className={cx('grid h-9 w-9 place-items-center rounded-lg', selectedType === id ? 'bg-brand text-white' : 'bg-surface-sunken text-ink-muted')}><Icon size={17} /></span>
            <span className="flex-1"><span className="block text-sm font-semibold text-ink">{title}</span><span className="block text-xs text-ink-muted">{body}</span></span>
            {selectedType === id ? <CheckCircle2 size={18} className="text-brand" /> : null}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function AIAgents() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div data-tour="aiAgents.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <ModuleHeader
        title="AI Agents"
        tabs={MODULE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={<span className="hidden items-center gap-1 text-[10px] font-semibold text-white/70 lg:flex"><Sparkles size={12} /> Powered by Kleegr AI</span>}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === 'getting-started' ? <GettingStarted onCreate={() => setCreateOpen(true)} /> : null}
        {activeTab === 'agents' ? <AgentsTable onCreate={() => setCreateOpen(true)} /> : null}
        {activeTab === 'knowledge' ? <KnowledgeBases /> : null}
      </div>
      <CreateAgentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
