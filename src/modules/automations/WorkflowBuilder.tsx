import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Pencil, Undo2, Redo2, ChevronDown, Plus, Minus, Hand, Maximize,
  Sparkles, Mic, ArrowUp, MessageSquare, SquareCheck, PieChart, FileText, Share2,
  History, Keyboard, X, Settings2, Clock, Mail, Tag, CheckSquare, Split, Cake,
  CalendarClock, Phone, Zap, Bell, Search, Check, GitBranch, Briefcase,
  UserPlus, UserCheck, UserSearch, MessagesSquare, CircleDollarSign, Star,
  StickyNote, ArrowRightLeft,
} from 'lucide-react';
import type { Workflow } from '@/types';
import { useStore } from '@/store/useStore';
import { Button, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { getNodesForWorkflow, type WorkflowDisplayNode, type WorkflowNodeKind } from './workflowNodes';
import { BuilderPicker } from './BuilderPickers';
import { CatalogModal } from './CatalogModal';
import { AI_CHIPS, AI_PROMPTS, type CatalogItem } from './automationData';

/* ── node visual maps ── */

const KIND_CHIP: Record<WorkflowNodeKind, string> = {
  trigger: 'bg-brand text-white',
  action: 'bg-brand-soft text-brand',
  condition: 'bg-ai-soft text-ai',
  wait: 'bg-surface-sunken text-ink-muted',
};
const KIND_LABEL: Record<WorkflowNodeKind, string> = {
  trigger: 'Trigger',
  action: 'Action',
  condition: 'Condition',
  wait: 'Wait',
};

/* Maps a node subtype → icon. Covers every catalog trigger/action id (so nodes
   added from the picker render with the right glyph) plus the seed subtypes. */
const SUBTYPE_ICON: Record<string, LucideIcon> = {
  // triggers
  form_submitted: FileText,
  missed_call: Phone,
  appointment_status: CalendarClock,
  appointment_booked: CalendarClock,
  booking_started: CalendarClock,
  opportunity_stage: GitBranch,
  opportunity_created: Briefcase,
  contact_created: UserPlus,
  tag_added: Tag,
  customer_replied: MessagesSquare,
  birthday: Cake,
  birthday_reminder: Cake,
  invoice_paid: CircleDollarSign,
  generic_trigger: Zap,
  // actions
  send_sms: MessageSquare,
  send_email: Mail,
  request_review: Star,
  add_tag: Tag,
  remove_tag: Tag,
  add_note: StickyNote,
  create_contact: UserPlus,
  create_opportunity: Briefcase,
  move_opportunity: ArrowRightLeft,
  assign_user: UserCheck,
  find_contact: UserSearch,
  send_notification: Bell,
  create_task: CheckSquare,
  // flow control
  wait: Clock,
  wait_until: Clock,
  wait_duration: Clock,
  if_else: Split,
  check_appointment: Split,
};
function iconFor(subtype: string): LucideIcon {
  return SUBTYPE_ICON[subtype] ?? Zap;
}

/* Build a display node from a picked catalog item (demo only — never stored). */
let nodeSeq = 0;
const WAIT_SUBTYPES = new Set(['wait', 'wait_until', 'wait_duration']);
function buildNode(item: CatalogItem, kind: 'trigger' | 'action'): WorkflowDisplayNode {
  const type: WorkflowNodeKind =
    kind === 'trigger' ? 'trigger'
      : item.id === 'if_else' ? 'condition'
        : WAIT_SUBTYPES.has(item.id) ? 'wait'
          : 'action';
  return {
    id: `n_new_${Date.now().toString(36)}_${(nodeSeq++).toString(36)}`,
    type,
    subtype: item.id,
    label: item.label,
    config: item.category ?? (kind === 'trigger' ? 'Trigger' : 'Action'),
    note: item.desc,
    example: item.example,
    ...(type === 'condition'
      ? { branch: { yesLabel: 'Yes', noLabel: 'No', noTerminal: 'End — contact exits the workflow' } }
      : {}),
  };
}

/* ── connector with inline add button ── */

function Connector({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <span className="h-5 w-px bg-line" />
      <button
        data-tour="automations.addNodeButton"
        onClick={onAdd}
        className="grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-subtle shadow-card transition-colors hover:border-brand hover:text-brand"
        aria-label="Add step"
      >
        <Plus size={14} />
      </button>
      <span className="h-5 w-px bg-line" />
    </div>
  );
}

/* ── End terminal pill ── */

function Terminal({ label = 'End' }: { label?: string }) {
  return (
    <span className="rounded-full bg-surface-sunken px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-subtle">
      {label}
    </span>
  );
}

/* ── dashed "add new action" affordance ── */

function AddActionButton({ onAdd, width = 'w-[300px]' }: { onAdd: () => void; width?: string }) {
  return (
    <button
      onClick={onAdd}
      className={cx(
        'flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-muted transition-colors hover:border-brand/50 hover:text-brand',
        width,
      )}
    >
      <Plus size={16} /> Add New Action
    </button>
  );
}

/* ── node card ── */

function NodeCard({
  node,
  step,
  selected,
  onClick,
}: {
  node: WorkflowDisplayNode;
  step: number | null;
  selected?: boolean;
  onClick: () => void;
}) {
  const Icon = iconFor(node.subtype);
  const isTrigger = node.type === 'trigger';
  return (
    <button
      onClick={onClick}
      data-tour={isTrigger ? 'automations.triggerNode' : 'automations.actionNode'}
      className={cx(
        'group flex w-[300px] items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left shadow-card transition-all hover:-translate-y-px hover:border-brand/50 hover:shadow-pop',
        selected ? 'border-brand ring-2 ring-brand/40' : isTrigger ? 'border-brand/40' : 'border-line',
      )}
    >
      <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', KIND_CHIP[node.type])}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">
          {step !== null ? `${step}. ` : ''}{KIND_LABEL[node.type]}
        </p>
        <p className="truncate text-sm font-bold text-ink">{node.label}</p>
        {node.config && <p className="mt-0.5 truncate text-xs text-ink-muted">{node.config}</p>}
      </div>
      <Settings2 size={14} className="shrink-0 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ── linear chain (no branching) ── */

function LinearChain({
  nodes, selId, onSelect, onAdd,
}: {
  nodes: WorkflowDisplayNode[];
  selId: string | null;
  onSelect: (n: WorkflowDisplayNode) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center pt-2">
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          {i > 0 && <Connector onAdd={onAdd} />}
          <NodeCard node={node} step={node.type === 'trigger' ? null : i} selected={selId === node.id} onClick={() => onSelect(node)} />
        </React.Fragment>
      ))}
      <Connector onAdd={onAdd} />
      <AddActionButton onAdd={onAdd} />
      <span className="h-5 w-px bg-line" />
      <Terminal />
    </div>
  );
}

/* ── If / Else branch fork (YES / NO lanes with connectors) ── */

function BranchFork({
  cond, yesNodes, baseStep, selId, onSelect, onAdd,
}: {
  cond: WorkflowDisplayNode;
  yesNodes: WorkflowDisplayNode[];
  baseStep: number;
  selId: string | null;
  onSelect: (n: WorkflowDisplayNode) => void;
  onAdd: () => void;
}) {
  const b = cond.branch ?? { yesLabel: 'Yes', noLabel: 'No', noTerminal: 'End — contact exits' };
  return (
    <div className="flex w-full flex-col items-center">
      <span className="h-5 w-px bg-line" />
      {/* horizontal bridge splitting into two lanes */}
      <div className="relative h-5 w-full">
        <span className="absolute left-1/4 right-1/4 top-0 h-px bg-line" />
        <span className="absolute left-1/4 top-0 h-5 w-px bg-line" />
        <span className="absolute right-1/4 top-0 h-5 w-px bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-10">
        {/* YES lane */}
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-good/10 px-3 py-1 text-xs font-bold text-good">
            <Check size={12} /> {b.yesLabel}
          </span>
          <span className="h-4 w-px bg-line" />
          {yesNodes.map((node, j) => (
            <React.Fragment key={node.id}>
              {j > 0 && <Connector onAdd={onAdd} />}
              <NodeCard node={node} step={baseStep + 1 + j} selected={selId === node.id} onClick={() => onSelect(node)} />
            </React.Fragment>
          ))}
          {yesNodes.length > 0 && <Connector onAdd={onAdd} />}
          <AddActionButton onAdd={onAdd} width="w-[280px]" />
          <span className="h-5 w-px bg-line" />
          <Terminal />
        </div>
        {/* NO lane */}
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-ink-muted">
            <X size={12} /> {b.noLabel}
          </span>
          <span className="h-4 w-px bg-line" />
          <div className="w-[280px] rounded-xl border-2 border-dashed border-line bg-surface-sunken/40 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-ink">{b.noTerminal}</p>
            <p className="mt-1 text-[11px] text-ink-subtle">No further steps on this path.</p>
          </div>
          <span className="h-5 w-px bg-line" />
          <Terminal />
        </div>
      </div>
    </div>
  );
}

/* ── the flow: linear, or forked when a condition node is present ── */

function Flow({
  nodes, selId, onSelect, onAdd,
}: {
  nodes: WorkflowDisplayNode[];
  selId: string | null;
  onSelect: (n: WorkflowDisplayNode) => void;
  onAdd: () => void;
}) {
  const condIdx = nodes.findIndex((n) => n.type === 'condition');
  if (condIdx === -1) {
    return <LinearChain nodes={nodes} selId={selId} onSelect={onSelect} onAdd={onAdd} />;
  }
  const pre = nodes.slice(0, condIdx);
  const cond = nodes[condIdx];
  const post = nodes.slice(condIdx + 1);
  return (
    <div className="flex flex-col items-center pt-2">
      {pre.map((node, i) => (
        <React.Fragment key={node.id}>
          {i > 0 && <Connector onAdd={onAdd} />}
          <NodeCard node={node} step={node.type === 'trigger' ? null : i} selected={selId === node.id} onClick={() => onSelect(node)} />
        </React.Fragment>
      ))}
      {pre.length > 0 && <Connector onAdd={onAdd} />}
      <NodeCard node={cond} step={condIdx} selected={selId === cond.id} onClick={() => onSelect(cond)} />
      <BranchFork cond={cond} yesNodes={post} baseStep={condIdx} selId={selId} onSelect={onSelect} onAdd={onAdd} />
    </div>
  );
}

/* ── node settings side panel (demo-safe) ── */

function NodeSettings({ node, onClose }: { node: WorkflowDisplayNode | null; onClose: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  if (!node) return null;
  const Icon = iconFor(node.subtype);
  return (
    <aside className="relative z-20 flex w-[360px] shrink-0 flex-col border-l border-line bg-surface shadow-[-8px_0_20px_rgba(16,24,40,.06)]">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <div>
          <p className="text-[11px] font-medium text-ink-subtle">Workflow step</p>
          <h2 className="text-[13px] font-semibold text-ink">{node.type === 'trigger' ? 'Trigger Settings' : 'Action Settings'}</h2>
        </div>
        <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Close settings">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-[#fafbfc] p-3">
          <span className={cx('grid h-8 w-8 place-items-center rounded-[5px]', KIND_CHIP[node.type])}>
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{KIND_LABEL[node.type]}</p>
            <p className="truncate text-[13px] font-semibold text-ink">{node.label}</p>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold text-ink-muted">Step name</span>
          <input defaultValue={node.label} className="h-9 w-full rounded-[5px] border border-line bg-surface px-3 text-[12px] text-ink outline-none focus:border-brand" />
        </label>
        {node.config && (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-ink-muted">Configuration</span>
            <div className="rounded-[5px] border border-line bg-surface px-3 py-2.5 text-[12px] leading-5 text-ink">{node.config}</div>
          </label>
        )}
        {node.note && (
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">What this step does</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">{node.note}</p>
          </div>
        )}
        {node.example && (
          <div className="rounded-[5px] border border-line bg-brand-soft/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Example</p>
            <p className="mt-1 text-[11px] italic leading-5 text-ink-muted">{node.example}</p>
          </div>
        )}
        <p className="rounded-[5px] border border-warn/30 bg-warn/5 px-3 py-2 text-[11px] text-warn">Demo view — edits are cosmetic only.</p>
      </div>
      <div className="flex h-14 items-center justify-end gap-2 border-t border-line px-4">
        <Button variant="secondary" size="sm" className="rounded-[5px]" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="rounded-[5px]" onClick={() => { pushToast({ title: 'Saved (demo only)', description: 'Step config is not persisted.', variant: 'success' }); onClose(); }}>Save</Button>
      </div>
    </aside>
  );
}

/* ── left vertical canvas toolbar (cosmetic) ── */

const LEFT_TOOLS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: 'notes', icon: MessageSquare, label: 'Notes' },
  { id: 'checklist', icon: SquareCheck, label: 'Checklist' },
  { id: 'stats', icon: PieChart, label: 'Stats' },
  { id: 'docs', icon: FileText, label: 'Docs' },
  { id: 'share', icon: Share2, label: 'Share' },
  { id: 'search', icon: Search, label: 'Find' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
];

/* ── AI composer panel (blank-state) — typeable, with interactive chips ── */

function AiPanel({
  promptIndex, onStartBuild, onOpenTrigger,
}: {
  promptIndex: number;
  onStartBuild: (prompt: string) => void;
  onOpenTrigger: () => void;
}) {
  const [value, setValue] = useState('');
  const placeholder = AI_PROMPTS[promptIndex % AI_PROMPTS.length];
  const TONE: Record<string, string> = { brand: 'text-brand', good: 'text-good', bad: 'text-bad' };
  const CHIP_PROMPT: Record<string, string> = {
    lead_nurturing: 'When a new lead comes in, send a welcome SMS, wait one day, then follow up by email if they have not replied.',
    form_automation: 'When a contact submits a form, create the contact, notify a sales rep, and start a follow-up sequence.',
    email_campaigns: 'Send a three-email nurture sequence over one week to every new subscriber.',
  };
  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onStartBuild(text);
  };
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-ai/30 bg-surface p-5 shadow-card">
      <div className="flex items-center justify-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai-soft text-ai"><Sparkles size={16} /></span>
        <h3 className="text-xl font-bold text-ink">What do you want to automate?</h3>
        <span className="text-[10px] font-bold uppercase tracking-wide text-ai">Beta</span>
      </div>
      <p className="mt-1 text-center text-sm text-ink-muted">Build workflows for free by chatting with AI</p>
      <div className="relative mt-4 rounded-xl border border-line focus-within:border-ai/60 focus-within:ring-2 focus-within:ring-ai/20">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          rows={2}
          placeholder={placeholder}
          aria-label="Describe the workflow to build"
          className="block w-full resize-none rounded-xl bg-transparent p-3 pr-16 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
        />
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full text-ink-subtle"><Mic size={15} /></span>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Generate workflow"
            className="grid h-7 w-7 place-items-center rounded-full bg-ai text-white transition-opacity hover:bg-ai/90 disabled:opacity-40"
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {AI_CHIPS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setValue(CHIP_PROMPT[c.id] ?? c.label)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ai/50 hover:bg-ai-soft/40"
            >
              <Icon size={14} className={TONE[c.tone]} /> {c.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenTrigger}
          className="inline-flex items-center rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-brand/50 hover:text-brand"
        >
          more
        </button>
      </div>
    </div>
  );
}

/* ── main builder ── */

type BuilderTab = 'builder' | 'settings' | 'enrollment' | 'logs';

export function WorkflowBuilder({
  wf,
  blank,
  onBack,
}: {
  wf: Workflow;
  blank: boolean;
  onBack: () => void;
}) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<BuilderTab>('builder');
  const [published, setPublished] = useState(wf.status === 'published');
  const [zoom, setZoom] = useState(100);
  const [selNode, setSelNode] = useState<WorkflowDisplayNode | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | 'trigger' | 'action'>(null);
  const [catalog, setCatalog] = useState<null | 'trigger' | 'action'>(null);
  const [builderModeOpen, setBuilderModeOpen] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * AI_PROMPTS.length));
  const [isBlank, setIsBlank] = useState(blank);
  const [nodes, setNodes] = useState<WorkflowDisplayNode[]>(() => (blank ? [] : getNodesForWorkflow(wf.id, wf.trigger)));

  const cosmetic = (title: string, description: string) => pushToast({ title, description, variant: 'info' });
  const selectNode = (n: WorkflowDisplayNode) => {
    setPicker(null);
    setCatalog(null);
    setSelNode(n);
    setSelId(n.id);
  };

  /* Add a node from the picker / catalog — real local canvas state, then select it. */
  const addNode = (item: CatalogItem, kind: 'trigger' | 'action') => {
    const node = buildNode(item, kind);
    if (kind === 'trigger') {
      setNodes((ns) => [node, ...ns.filter((n) => n.type !== 'trigger')]);
      setIsBlank(false);
    } else {
      setNodes((ns) => [...ns, node]);
    }
    setSelId(node.id);
    setPicker(null);
    setCatalog(null);
    pushToast({
      title: `${kind === 'trigger' ? 'Trigger' : 'Action'} added`,
      description: `“${item.label}” added to the canvas (demo session only).`,
      variant: 'success',
    });
  };
  const onPick = (item: CatalogItem) => { if (picker) addNode(item, picker); };
  const onCatalogPick = (item: CatalogItem) => { if (catalog) addNode(item, catalog); };
  const startBuild = (prompt: string) => {
    setPicker('trigger');
    cosmetic('Let’s build that', prompt ? 'Pick a trigger to anchor your AI-assisted workflow (demo).' : 'Pick a trigger to start (demo).');
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header bar ── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3">
        <button onClick={onBack} className="flex items-center gap-1.5 rounded-[5px] px-1.5 py-1 text-[12px] font-semibold text-ink hover:bg-surface-sunken">
          <ArrowLeft size={16} /> Workflows
        </button>
        <span className="h-5 w-px bg-line" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-ink">{wf.name}</span>
          <button onClick={() => cosmetic('Rename workflow', 'Renaming is cosmetic in demo mode.')} className="rounded p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Rename">
            <Pencil size={13} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => cosmetic('Undo', 'Demo only.')} className="grid h-7 w-7 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Undo"><Undo2 size={15} /></button>
          <button onClick={() => cosmetic('Redo', 'Demo only.')} className="grid h-7 w-7 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Redo"><Redo2 size={15} /></button>
          <Button size="sm" className="h-7 rounded-[5px] text-[11px]" onClick={() => cosmetic('Saved', 'Changes are not persisted in demo mode.')}>Save</Button>
        </div>
      </div>

      {/* ── Toolbar row ── */}
      <div className="flex h-11 shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-3">
        <div className="relative">
          <button
            onClick={() => setBuilderModeOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-[5px] border border-line px-3 text-[12px] font-semibold text-ink hover:bg-surface-sunken"
          >
            Advanced Builder <ChevronDown size={15} className="text-ink-subtle" />
          </button>
          {builderModeOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
              {['Advanced Builder', 'Simple Builder'].map((m) => (
                <button key={m} onClick={() => { setBuilderModeOpen(false); cosmetic(m, 'Builder mode is cosmetic in demo mode.'); }} className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunken">{m}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center">
          <nav className="flex items-end gap-1" aria-label="Builder tabs">
            {([
              { id: 'builder', label: 'Builder' },
              { id: 'settings', label: 'Settings' },
              { id: 'enrollment', label: 'Enrollment History' },
              { id: 'logs', label: 'Execution Logs' },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'relative border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors',
                  tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => cosmetic('Test Workflow', 'Test runs are disabled in demo mode.')} className="h-8 rounded-[5px] bg-brand-soft px-3 text-[12px] font-semibold text-brand hover:bg-brand-soft/70">
            Test Workflow
          </button>
          <div className="flex items-center gap-2" data-tour="automations.publishToggle">
            <span className={cx('text-[11px] font-semibold', published ? 'text-ink-subtle' : 'text-ink')}>Draft</span>
            <button
              role="switch"
              aria-checked={published}
              onClick={() => {
                const next = !published;
                setPublished(next);
                pushToast({ title: next ? 'Workflow published (demo)' : 'Workflow set to draft (demo)', description: 'Status change is in-memory only.', variant: next ? 'success' : 'info' });
              }}
              className={cx('relative h-5 w-9 rounded-full transition-colors', published ? 'bg-brand' : 'bg-line')}
              aria-label="Toggle publish"
            >
              <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', published ? 'left-0.5 translate-x-4' : 'left-0.5')} />
            </button>
            <span className={cx('text-[11px] font-semibold', published ? 'text-brand' : 'text-ink-subtle')}>Publish</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 overflow-auto">
          {tab === 'builder' && (
            <div
              data-tour="automations.canvas"
              className="relative h-full w-full"
              style={{
                backgroundColor: 'rgb(var(--surface-sunken))',
                backgroundImage: 'radial-gradient(rgb(var(--line)) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {/* left toolbar */}
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-card">
                <span className="grid h-8 w-8 place-items-center rounded-[5px] text-ink-subtle"><Keyboard size={16} /></span>
                {LEFT_TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => cosmetic(t.label, 'Demo only.')} className="grid h-8 w-8 place-items-center rounded-[5px] text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label={t.label}>
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>

              {/* add button top-right */}
              <button
                onClick={() => setPicker('action')}
                className="absolute right-3 top-3 z-10 flex h-8 items-center gap-1.5 rounded-[5px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink shadow-card hover:bg-surface-sunken"
              >
                <Plus size={15} /> Add
              </button>

              {/* flow */}
              <div className="flex min-h-full justify-center px-6 py-16" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                {isBlank ? (
                  <div className="flex flex-col items-center gap-6 pt-2">
                    <AiPanel
                      promptIndex={promptIndex}
                      onStartBuild={startBuild}
                      onOpenTrigger={() => setPicker('trigger')}
                    />
                    <div className="flex w-full max-w-2xl items-center gap-3 text-xs font-semibold text-ink-subtle">
                      <span className="h-px flex-1 bg-line" /> Or <span className="h-px flex-1 bg-line" />
                    </div>
                    <button
                      onClick={() => setPicker('trigger')}
                      data-tour="automations.triggerNode"
                      className="flex w-72 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/50 bg-brand-soft/40 px-4 py-5 text-sm font-bold text-brand hover:bg-brand-soft"
                    >
                      <Plus size={18} /> Add New Trigger
                    </button>
                    <Connector onAdd={() => setPicker('action')} />
                    <Terminal />
                  </div>
                ) : (
                  <Flow nodes={nodes} selId={selId} onSelect={selectNode} onAdd={() => setPicker('action')} />
                )}
              </div>

              {/* zoom controls */}
              <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-card">
                <button onClick={() => cosmetic('Pan', 'Demo only.')} className="grid h-8 w-8 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken" aria-label="Pan"><Hand size={15} /></button>
                <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken" aria-label="Zoom in"><Plus size={15} /></button>
                <span className="py-0.5 text-[11px] font-bold text-ink">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.max(40, z - 10))} className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken" aria-label="Zoom out"><Minus size={15} /></button>
                <button onClick={() => setZoom(100)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken" aria-label="Fit"><Maximize size={15} /></button>
              </div>

              {/* minimap */}
              <div aria-hidden className="absolute bottom-4 right-4 z-10 hidden h-24 w-40 rounded-lg border border-line bg-surface-sunken p-2 shadow-card sm:block">
                <div className="flex h-full flex-col justify-center gap-1.5">
                  <span className="h-2 w-10 rounded bg-line" />
                  <span className="h-2 w-16 rounded bg-line" />
                  <span className="h-2 w-12 rounded bg-line" />
                </div>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-4 p-6">
              <div className="grid max-w-2xl grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Status</p>
                  <div className="mt-1"><Badge tone={published ? 'good' : 'neutral'}>{published ? 'published' : 'draft'}</Badge></div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Trigger</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{wf.trigger}</p>
                </div>
              </div>
              {wf.explanation && (
                <div className="max-w-2xl rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Description</p>
                  <p className="mt-1 text-sm text-ink">{wf.explanation}</p>
                </div>
              )}
              <p className="text-xs text-ink-subtle">Workflow settings are cosmetic only in demo mode.</p>
            </div>
          )}

          {tab === 'enrollment' && (
            <div className="p-6">
              <p className="mb-3 text-sm font-semibold text-ink">Enrollment History — {wf.enrolled.toLocaleString()} total enrolled</p>
              <div className="max-w-2xl overflow-hidden rounded-xl border border-line">
                {wf.enrolled > 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-ink">Contact #{wf.enrolled - i}</p>
                        <p className="text-xs text-ink-muted">contact{i + 1}@example.com</p>
                      </div>
                      <Badge tone="good">completed</Badge>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-ink-subtle">No contacts enrolled — this workflow is a draft.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="p-6">
              <p className="mb-3 text-sm font-semibold text-ink">Execution Logs</p>
              <div className="max-w-2xl overflow-hidden rounded-xl border border-line">
                {published ? (
                  ['2 min ago', '14 min ago', '38 min ago', '1h ago', '3h ago', '6h ago'].map((t, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-good" />
                        <span className="text-sm text-ink">Execution #{1200 - i * 7}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone="good">success</Badge>
                        <span className="text-xs text-ink-muted">{t}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-ink-subtle">Draft workflows have no execution logs.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* picker drawer */}
        {picker && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-[420px]">
            <BuilderPicker
              kind={picker}
              onClose={() => setPicker(null)}
              onSelect={onPick}
              onExpand={() => { setCatalog(picker); setPicker(null); }}
            />
          </div>
        )}

        {!picker && tab === 'builder' && (
          <NodeSettings node={selNode} onClose={() => setSelNode(null)} />
        )}
      </div>

      <CatalogModal kind={catalog} onClose={() => setCatalog(null)} onSelect={onCatalogPick} />
    </div>
  );
}
