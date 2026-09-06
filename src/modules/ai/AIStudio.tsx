import { useState } from 'react';
import {
  ArrowUp,
  Bot,
  Boxes,
  ChevronDown,
  Clock3,
  Code2,
  Eye,
  FileText,
  LayoutGrid,
  MessageSquareText,
  MoreHorizontal,
  MousePointer2,
  Plus,
  Search,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

const TABS: ModuleHeaderTab[] = [
  { id: 'vibe', label: 'Vibe' },
  { id: 'projects', label: 'My Creations', count: 5 },
  { id: 'templates', label: 'Templates' },
];

const TEMPLATES = [
  { title: 'Lead qualification agent', body: 'Ask the right questions, score intent, and route leads.', icon: Bot, tone: 'from-[#6839d6] to-[#9b66f0]' },
  { title: 'Client intake experience', body: 'Collect details and prepare a personalized next step.', icon: FileText, tone: 'from-[#176eb4] to-[#00a9d3]' },
  { title: 'Website conversion assistant', body: 'Guide visitors toward the right service and calendar.', icon: MousePointer2, tone: 'from-[#00896e] to-[#35b58d]' },
  { title: 'Campaign content kit', body: 'Create coordinated email, SMS, and social copy.', icon: MessageSquareText, tone: 'from-[#ce7327] to-[#efa13d]' },
];

const PROJECTS = [
  { name: 'New client intake concierge', kind: 'Assistant', status: 'Ready', updated: 'Today, 4:18 PM' },
  { name: 'Referral campaign copy kit', kind: 'Content kit', status: 'Ready', updated: 'Yesterday' },
  { name: 'Dental leads qualification flow', kind: 'Agent flow', status: 'Draft', updated: 'Sep 3, 2026' },
  { name: 'September nurture sequence', kind: 'Campaign', status: 'Ready', updated: 'Aug 31, 2026' },
  { name: 'After-hours support assistant', kind: 'Assistant', status: 'Draft', updated: 'Aug 27, 2026' },
];

function PromptComposer({ onGenerate }: { onGenerate: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState('');
  const suggestions = [
    'Build a lead intake assistant',
    'Create a reactivation campaign',
    'Draft an appointment follow-up flow',
  ];

  const submit = () => {
    const value = prompt.trim();
    if (value) onGenerate(value);
  };

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-ai/15 bg-ai-soft px-2.5 py-1 text-[11px] font-semibold text-ai">
        <Sparkles size={12} /> Kleegr Vibe
      </div>
      <h2 className="text-[32px] font-bold tracking-[-0.045em] text-ink">What do you want to build?</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">Describe the business outcome. Vibe turns your idea into a polished, editable starting point.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#cfd6e1] bg-surface text-left shadow-[0_12px_32px_-18px_rgba(25,42,82,.35)] focus-within:border-ai/50 focus-within:ring-4 focus-within:ring-ai/5">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
          }}
          placeholder="Example: Build an intake assistant that qualifies new leads, answers common questions, and books the best calendar..."
          aria-label="Describe what you want to build"
          className="h-28 w-full resize-none bg-transparent px-4 pt-4 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-subtle"
        />
        <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
          <button type="button" className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-ink-muted hover:bg-surface-sunken">
            <Boxes size={14} /> Kleegr business context <ChevronDown size={13} />
          </button>
          <button
            type="button"
            disabled={!prompt.trim()}
            onClick={submit}
            aria-label="Generate with Vibe"
            className="grid h-8 w-8 place-items-center rounded-lg bg-ai text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setPrompt(suggestion)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:border-ai/40 hover:text-ai"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function VibeView() {
  const pushToast = useStore((state) => state.pushToast);
  const [generated, setGenerated] = useState<string | null>(null);

  const generate = (prompt: string) => {
    setGenerated(prompt);
    pushToast({ title: 'Vibe draft created', description: 'A fictional preview is ready below.', variant: 'success' });
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.08),transparent_36%),rgb(var(--surface-sunken))] px-6 pb-10 pt-10">
      <PromptComposer onGenerate={generate} />

      {generated ? (
        <Card className="mx-auto mt-7 max-w-4xl overflow-hidden animate-in">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ai-soft text-ai"><WandSparkles size={16} /></span>
              <div><p className="text-sm font-semibold text-ink">New Vibe draft</p><p className="max-w-lg truncate text-[11px] text-ink-muted">{generated}</p></div>
            </div>
            <div className="flex gap-2"><Button size="xs" variant="secondary"><Eye size={13} /> Preview</Button><Button size="xs">Open editor</Button></div>
          </div>
          <div className="grid gap-3 bg-[#f9fafc] p-4 md:grid-cols-3">
            {['Audience & objective', 'Conversation structure', 'Channels & actions'].map((label, index) => (
              <div key={label} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Step {index + 1}</p>
                <p className="mt-1 text-xs font-semibold text-ink">{label}</p>
                <div className="mt-3 space-y-1.5"><span className="block h-1.5 w-full rounded bg-line/70" /><span className="block h-1.5 w-4/5 rounded bg-line/50" /></div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="text-sm font-bold text-ink">Start from a popular idea</p><p className="text-xs text-ink-muted">Editable templates grounded in common Kleegr workflows.</p></div>
            <button type="button" className="text-xs font-semibold text-brand">Browse all templates</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {TEMPLATES.map(({ title, body, icon: Icon, tone }) => (
              <button key={title} type="button" onClick={() => generate(title)} className="overflow-hidden rounded-xl border border-line bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:border-ai/35 hover:shadow-pop">
                <div className={cx('h-1 bg-gradient-to-r', tone)} />
                <div className="p-4">
                  <span className={cx('grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br text-white', tone)}><Icon size={17} /></span>
                  <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{body}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsView() {
  const [query, setQuery] = useState('');
  const filtered = PROJECTS.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-5 py-3">
        <div><h2 className="text-xl font-bold text-ink">My Creations</h2><p className="text-xs text-ink-muted">Everything you have created with Vibe.</p></div>
        <Button size="sm"><Plus size={15} /> New creation</Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <Button variant="secondary" size="sm"><LayoutGrid size={14} /> All creations</Button>
            <label className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line px-2.5 text-xs text-ink-muted focus-within:border-brand">
              <Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Search creations" aria-label="Search creations" />
            </label>
          </div>
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-line bg-[#fbfcfd]">{['Name', 'Type', 'Status', 'Last updated', ''].map((heading) => <th key={heading} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {filtered.map((project, index) => (
                <tr key={project.name} className="hover:bg-surface-sunken/65">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><span className={cx('grid h-8 w-8 place-items-center rounded-lg', index % 2 ? 'bg-brand-soft text-brand' : 'bg-ai-soft text-ai')}>{index % 2 ? <Code2 size={15} /> : <Sparkles size={15} />}</span><span className="text-sm font-semibold text-ink">{project.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{project.kind}</td>
                  <td className="px-4 py-3"><Badge tone={project.status === 'Ready' ? 'good' : 'neutral'}>{project.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-ink-muted"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{project.updated}</span></td>
                  <td className="px-4 py-3 text-right"><button type="button" className="rounded p-1.5 text-ink-subtle hover:bg-line/60" aria-label={`More options for ${project.name}`}><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TemplatesView() {
  const [query, setQuery] = useState('');
  const filtered = TEMPLATES.filter((template) => template.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="min-h-full p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-ink">Template gallery</h2><p className="text-xs text-ink-muted">A polished head start for repeatable work.</p></div>
        <label className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-muted focus-within:border-brand"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 outline-none" placeholder="Search templates" aria-label="Search templates" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map(({ title, body, icon: Icon, tone }) => (
          <Card key={title} className="overflow-hidden">
            <div className={cx('flex h-28 items-center justify-center bg-gradient-to-br', tone)}><Icon size={34} className="text-white/95" /></div>
            <div className="p-4"><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1 min-h-10 text-[11px] leading-relaxed text-ink-muted">{body}</p><Button className="mt-4 w-full" variant="secondary" size="sm">Use template</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AIStudio() {
  const [activeTab, setActiveTab] = useState('vibe');

  return (
    <div data-tour="aiStudio.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <ModuleHeader
        title="AI Studio"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={<span className="rounded-full bg-[#f7c948] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#633d00]">Beta</span>}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === 'vibe' ? <VibeView /> : null}
        {activeTab === 'projects' ? <ProjectsView /> : null}
        {activeTab === 'templates' ? <TemplatesView /> : null}
      </div>
    </div>
  );
}
