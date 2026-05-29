import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Pencil, Undo2, Redo2, ChevronDown, Plus, Minus, Hand, Maximize,
  Sparkles, Mic, ArrowUp, MessageSquare, SquareCheck, PieChart, FileText, Share2,
  History, Keyboard, X, Settings2, Clock, Mail, Tag, CheckSquare, Split, Cake,
  CalendarClock, Phone, Zap, Bell, Search,
} from 'lucide-react';
import type { Workflow } from '@/types';
import { useStore } from '@/store/useStore';
import { Button, Badge } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';
import { getNodesForWorkflow, type WorkflowDisplayNode, type WorkflowNodeKind } from './workflowNodes';
import { BuilderPicker } from './BuilderPickers';
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

const SUBTYPE_ICON: Record<string, LucideIcon> = {
  form_submitted: FileText,
  missed_call: Phone,
  appointment_booked: CalendarClock,
  opportunity_won: SquareCheck,
  tag_added: Tag,
  birthday: Cake,
  booking_started: CalendarClock,
  generic_trigger: Zap,
  send_sms: MessageSquare,
  send_email: Mail,
  create_task: CheckSquare,
  add_tag: Tag,
  wait_until: Clock,
  wait_duration: Clock,
  check_appointment: Split,
};
function iconFor(subtype: string): LucideIcon {
  return SUBTYPE_ICON[subtype] ?? Zap;
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

/* ── node card ── */

function NodeCard({
  node,
  step,
  onClick,
}: {
  node: WorkflowDisplayNode;
  step: number | null;
  onClick: () => void;
}) {
  const Icon = iconFor(node.subtype);
  const isTrigger = node.type === 'trigger';
  return (
    <button
      onClick={onClick}
      data-tour={isTrigger ? 'automations.triggerNode' : 'automations.actionNode'}
      className={cx(
        'group flex w-[300px] items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left shadow-card transition-all hover:-translate-y-px hover:border-brand/50 hover:shadow-pop',
        isTrigger ? 'border-brand/40' : 'border-line',
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

/* ── node settings modal (demo-safe) ── */

function NodeSettings({ node, onClose }: { node: WorkflowDisplayNode | null; onClose: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const Icon = node ? iconFor(node.subtype) : Zap;
  return (
    <Modal
      open={!!node}
      onClose={onClose}
      title={node?.type === 'trigger' ? 'Trigger Settings' : 'Action Settings'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { pushToast({ title: 'Saved (demo only)', description: 'Step config is not persisted.', variant: 'success' }); onClose(); }}>Save</Button>
        </>
      }
    >
      {node && (
        <div className="space-y-3">
          <span className={cx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold', KIND_CHIP[node.type])}>
            <Icon size={13} /> {KIND_LABEL[node.type]}
          </span>
          <div>
            <p className="text-xs font-semibold text-ink-subtle">Label</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{node.label}</p>
          </div>
          {node.config && (
            <div>
              <p className="text-xs font-semibold text-ink-subtle">Configuration</p>
              <p className="mt-1 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink">{node.config}</p>
            </div>
          )}
          {node.note && (
            <div>
              <p className="text-xs font-semibold text-ink-subtle">What this step does</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{node.note}</p>
            </div>
          )}
          {node.example && (
            <div>
              <p className="text-xs font-semibold text-ink-subtle">Example</p>
              <p className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs italic leading-relaxed text-ink-subtle">{node.example}</p>
            </div>
          )}
          <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">Demo view — edits are cosmetic only.</p>
        </div>
      )}
    </Modal>
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

/* ── AI composer panel (blank-state, cosmetic) ── */

function AiPanel({ promptIndex }: { promptIndex: number }) {
  const TONE: Record<string, string> = {
    brand: 'text-brand',
    good: 'text-good',
    bad: 'text-bad',
  };
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-ai/30 bg-surface p-5 shadow-card">
      <div className="flex items-center justify-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai-soft text-ai"><Sparkles size={16} /></span>
        <h3 className="text-xl font-bold text-ink">What do you want to automate?</h3>
        <span className="text-[10px] font-bold uppercase tracking-wide text-ai">Beta</span>
      </div>
      <p className="mt-1 text-center text-sm text-ink-muted">Build workflows for free by chatting with AI</p>
      <div className="relative mt-4 rounded-xl border border-line p-3">
        <p className="min-h-[40px] pr-16 text-sm text-ink-muted">{AI_PROMPTS[promptIndex % AI_PROMPTS.length]}</p>
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full text-ink-subtle"><Mic size={15} /></span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ai text-white"><ArrowUp size={15} /></span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {AI_CHIPS.map((c) => {
          const Icon = c.icon;
          return (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink">
              <Icon size={14} className={TONE[c.tone]} /> {c.label}
            </span>
          );
        })}
        <span className="inline-flex items-center rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-muted">more</span>
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
  const [picker, setPicker] = useState<null | 'trigger' | 'action'>(null);
  const [builderModeOpen, setBuilderModeOpen] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * AI_PROMPTS.length));

  const nodes = getNodesForWorkflow(wf.id, wf.trigger);
  const cosmetic = (title: string, description: string) => pushToast({ title, description, variant: 'info' });

  const onPick = (item: CatalogItem) => {
    pushToast({ title: `${picker === 'trigger' ? 'Trigger' : 'Action'} added (demo)`, description: `"${item.label}" is cosmetic — nothing is persisted.`, variant: 'success' });
    setPicker(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header bar ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm font-semibold text-ink hover:bg-surface-sunken">
          <ArrowLeft size={18} /> Workflows list
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-base font-bold text-ink">{wf.name}</span>
          <button onClick={() => cosmetic('Rename workflow', 'Renaming is cosmetic in demo mode.')} className="rounded p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Rename">
            <Pencil size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => cosmetic('Undo', 'Demo only.')} className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken" aria-label="Undo"><Undo2 size={16} /></button>
          <button onClick={() => cosmetic('Redo', 'Demo only.')} className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken" aria-label="Redo"><Redo2 size={16} /></button>
          <Button size="sm" onClick={() => cosmetic('Saved', 'Changes are not persisted in demo mode.')}>Saved</Button>
        </div>
      </div>

      {/* ── Toolbar row ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2">
        <div className="relative">
          <button
            onClick={() => setBuilderModeOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-sunken"
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
                  'relative border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors',
                  tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => cosmetic('Test Workflow', 'Test runs are disabled in demo mode.')} className="rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft/70">
            Test Workflow
          </button>
          <div className="flex items-center gap-2" data-tour="automations.publishToggle">
            <span className={cx('text-sm font-semibold', published ? 'text-ink-subtle' : 'text-ink')}>Draft</span>
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
            <span className={cx('text-sm font-semibold', published ? 'text-brand' : 'text-ink-subtle')}>Publish</span>
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
                backgroundColor: 'rgb(var(--surface))',
                backgroundImage: 'radial-gradient(rgb(var(--line)) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            >
              {/* left toolbar */}
              <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
                <span className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle"><Keyboard size={17} /></span>
                {LEFT_TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => cosmetic(t.label, 'Demo only.')} className="grid h-9 w-9 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label={t.label}>
                      <Icon size={17} />
                    </button>
                  );
                })}
              </div>

              {/* add button top-right */}
              <button
                onClick={() => setPicker('action')}
                className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card hover:bg-surface-sunken"
              >
                <Plus size={15} /> Add
              </button>

              {/* flow */}
              <div className="flex min-h-full justify-center px-6 py-16" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                {blank ? (
                  <div className="flex flex-col items-center gap-6 pt-2">
                    <AiPanel promptIndex={promptIndex} />
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
                    <span className="rounded-full bg-surface-sunken px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-subtle">End</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pt-2">
                    {nodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        {i > 0 && <Connector onAdd={() => setPicker('action')} />}
                        <NodeCard node={node} step={node.type === 'trigger' ? null : i} onClick={() => setSelNode(node)} />
                      </React.Fragment>
                    ))}
                    <Connector onAdd={() => setPicker('action')} />
                    <button
                      onClick={() => setPicker('action')}
                      className="flex w-[300px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-muted hover:border-brand/50 hover:text-brand"
                    >
                      <Plus size={16} /> Add New Action
                    </button>
                    <span className="h-5 w-px bg-line" />
                    <span className="rounded-full bg-surface-sunken px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-subtle">End</span>
                  </div>
                )}
              </div>

              {/* zoom controls */}
              <div className="absolute bottom-4 left-4 z-10 flex flex-col items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
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
            <BuilderPicker kind={picker} onClose={() => setPicker(null)} onSelect={onPick} />
          </div>
        )}
      </div>

      <NodeSettings node={selNode} onClose={() => setSelNode(null)} />
    </div>
  );
}
