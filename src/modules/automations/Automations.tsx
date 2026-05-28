import React, { useState } from 'react';
import {
  Zap, Plus, Play, Pause, Settings2, Users2,
  FileText, GitBranch, Clock, Mail, MessageSquare, CheckSquare,
  Tag, X, AlertCircle, ChevronRight, Search,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Workflow } from '@/types';
import { PageHeader, Button, Badge, Card, Tabs } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { cx } from '@/utils';
import { getNodesForWorkflow, type WorkflowDisplayNode } from './workflowNodes';

/* ─── helpers ─────────────────────────────────────────────────── */

function statusTone(s: Workflow['status']): 'good' | 'neutral' {
  return s === 'published' ? 'good' : 'neutral';
}

const NODE_COLOR: Record<string, string> = {
  trigger:   'border-brand   bg-brand-soft   text-brand',
  action:    'border-[#12986a]/40 bg-[#12986a]/10 text-[#12986a]',
  condition: 'border-warn/40 bg-warn/10 text-warn',
  wait:      'border-line    bg-surface-sunken text-ink-muted',
};

const NODE_ICON: Record<string, React.ReactNode> = {
  form_submitted:    <Zap size={13} />,
  missed_call:       <AlertCircle size={13} />,
  appointment_booked:<FileText size={13} />,
  opportunity_won:   <CheckSquare size={13} />,
  tag_added:         <Tag size={13} />,
  birthday:          <Zap size={13} />,
  booking_started:   <FileText size={13} />,
  generic_trigger:   <Zap size={13} />,
  send_sms:          <MessageSquare size={13} />,
  send_email:        <Mail size={13} />,
  create_task:       <CheckSquare size={13} />,
  add_tag:           <Tag size={13} />,
  wait_until:        <Clock size={13} />,
  wait_duration:     <Clock size={13} />,
  check_appointment: <GitBranch size={13} />,
};

const FAKE_LOG_TIMES = ['2 min ago','14 min ago','38 min ago','1h ago','3h ago','6h ago','12h ago','1d ago'];

const TEMPLATES = [
  { id: 't1', name: 'New Lead Follow-up', desc: 'Instant text + email on form submit, task for owner.' },
  { id: 't2', name: 'Missed Call Text-Back', desc: 'Instant SMS reply when a call is missed.' },
  { id: 't3', name: 'Appointment Reminder', desc: '24 h + 1 h SMS/email reminders.' },
  { id: 't4', name: 'Review Request', desc: 'Ask for a Google review after a deal closes.' },
  { id: 't5', name: 'Blank Workflow', desc: 'Start from scratch with no nodes.' },
];

/* Cosmetic picker catalogs — used by the Add Trigger / Add Action panels.
   Selecting an item is demo-only (no node is actually added). */
const TRIGGER_CATALOG: { subtype: string; label: string; group: string }[] = [
  { subtype: 'form_submitted',     label: 'Form Submitted',      group: 'Contact' },
  { subtype: 'tag_added',          label: 'Contact Tag',         group: 'Contact' },
  { subtype: 'birthday',           label: 'Birthday',            group: 'Contact' },
  { subtype: 'appointment_booked', label: 'Appointment Booked',  group: 'Calendar' },
  { subtype: 'booking_started',    label: 'Booking Abandoned',   group: 'Calendar' },
  { subtype: 'missed_call',        label: 'Missed Call',         group: 'Phone' },
  { subtype: 'opportunity_won',    label: 'Pipeline Stage Changed', group: 'Opportunities' },
];

const ACTION_CATALOG: { subtype: string; label: string; group: string }[] = [
  { subtype: 'send_sms',          label: 'Send SMS',          group: 'Communication' },
  { subtype: 'send_email',        label: 'Send Email',        group: 'Communication' },
  { subtype: 'create_task',       label: 'Create Task',       group: 'Internal' },
  { subtype: 'add_tag',           label: 'Add Tag',           group: 'Internal' },
  { subtype: 'wait_duration',     label: 'Wait / Delay',      group: 'Timing' },
  { subtype: 'wait_until',        label: 'Wait Until Event',  group: 'Timing' },
  { subtype: 'check_appointment', label: 'If / Else Branch',  group: 'Logic' },
];

/* ─── Node Settings Modal ─────────────────────────────────────── */

function NodeSettingsModal({ node, onClose }: { node: WorkflowDisplayNode | null; onClose: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <Modal
      open={!!node}
      onClose={onClose}
      title="Node Settings"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { pushToast({ title: 'Saved (demo only)', description: 'Node config is not persisted.', variant: 'success' }); onClose(); }}>Save</Button>
        </>
      }
    >
      {node && (
        <div className="space-y-3" data-tour="automations.nodeSettings">
          <span className={cx('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize', NODE_COLOR[node.type])}>
            {NODE_ICON[node.subtype] ?? <Zap size={12} />} {node.type}
          </span>
          <div>
            <p className="text-xs font-semibold text-ink-subtle">Label</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{node.label}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-subtle">Subtype</p>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">{node.subtype}</p>
          </div>
          {node.config && (
            <div>
              <p className="text-xs font-semibold text-ink-subtle">Config</p>
              <p className="mt-1 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink">{node.config}</p>
            </div>
          )}
          <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">Demo view — edits are cosmetic only.</p>
        </div>
      )}
    </Modal>
  );
}

/* ─── Add Trigger / Add Action picker panel ──────────────────────
   Cosmetic GHL-style picker. Mirrors the portal's "Add Trigger" and
   "Actions" side panels. Choosing an item is demo-only. */

function WorkflowPicker({
  kind,
  onClose,
}: {
  kind: 'trigger' | 'action';
  onClose: () => void;
}) {
  const pushToast = useStore((s) => s.pushToast);
  const [q, setQ] = useState('');
  const catalog = kind === 'trigger' ? TRIGGER_CATALOG : ACTION_CATALOG;
  const items = catalog.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));

  // Group items by their `group` field, preserving first-seen order.
  const groups: { name: string; items: typeof catalog }[] = [];
  items.forEach((i) => {
    let g = groups.find((x) => x.name === i.group);
    if (!g) { g = { name: i.group, items: [] }; groups.push(g); }
    g.items.push(i);
  });

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border border-line bg-surface"
      data-tour={kind === 'trigger' ? 'automations.addTriggerPanel' : 'automations.addActionPanel'}
    >
      <div className="flex items-center justify-between border-b border-line bg-surface-sunken px-3 py-2.5">
        <p className="text-sm font-bold text-ink">
          {kind === 'trigger' ? 'Add Trigger' : 'Add Action / Step'}
        </p>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-ink-subtle hover:bg-line/40 hover:text-ink"
          aria-label="Close picker"
        >
          <X size={15} />
        </button>
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5">
          <Search size={13} className="shrink-0 text-ink-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={kind === 'trigger' ? 'Search triggers…' : 'Search actions…'}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-ink-subtle">No matches.</p>
        )}
        {groups.map((g) => (
          <div key={g.name} className="mb-2 last:mb-0">
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              {g.name}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {g.items.map((i) => (
                <button
                  key={i.subtype}
                  onClick={() => {
                    pushToast({
                      title: `${kind === 'trigger' ? 'Trigger' : 'Action'} selected (demo)`,
                      description: `"${i.label}" is not added in demo mode.`,
                      variant: 'info',
                    });
                    onClose();
                  }}
                  className={cx(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    kind === 'trigger'
                      ? 'border-brand/30 bg-brand-soft/40 hover:bg-brand-soft'
                      : 'border-[#12986a]/30 bg-[#12986a]/5 hover:bg-[#12986a]/10',
                  )}
                >
                  <span className={cx('shrink-0', kind === 'trigger' ? 'text-brand' : 'text-[#12986a]')}>
                    {NODE_ICON[i.subtype] ?? <Zap size={13} />}
                  </span>
                  <span className="font-medium text-ink">{i.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-3 py-2 text-[10px] text-ink-subtle">
        Builder is read-only in demo mode — selections are not saved.
      </p>
    </div>
  );
}

/* ─── Workflow Builder ────────────────────────────────────────── */

function WorkflowBuilder({ wf }: { wf: Workflow }) {
  const [tab, setTab] = useState('builder');
  const [selNode, setSelNode] = useState<WorkflowDisplayNode | null>(null);
  const [picker, setPicker] = useState<null | 'trigger' | 'action'>(null);
  const nodes = getNodesForWorkflow(wf.id, wf.trigger);

  return (
    <div data-tour="automations.builder">
      <Tabs
        tabs={[
          { id: 'builder', label: 'Builder' },
          { id: 'enrollment', label: 'Enrollment', count: wf.enrolled },
          { id: 'logs', label: 'Logs' },
          { id: 'settings', label: 'Settings' },
        ]}
        active={tab}
        onChange={setTab}
        data-tour="automations.tabs"
      />

      {tab === 'builder' && (
        <div className="p-4">
          {/* Dotted-grid canvas */}
          <div
            className="flex flex-col items-center rounded-xl border border-line bg-surface-sunken py-6"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgb(var(--line)) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
            data-tour="automations.canvas"
          >
            {/* Add Trigger affordance at the top of the chain */}
            <button
              onClick={() => setPicker('trigger')}
              data-tour="automations.addTrigger"
              className="mb-1 flex items-center gap-1.5 rounded-full border border-dashed border-brand/50 bg-surface px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
            >
              <Plus size={12} /> Add Trigger
            </button>
            <div className="h-4 w-px bg-line" />

            {nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setSelNode(node)}
                  data-tour="automations.node"
                  className={cx(
                    'group flex w-64 items-center gap-3 rounded-xl border-2 bg-surface px-4 py-3 text-left shadow-card transition-all hover:shadow-pop',
                    NODE_COLOR[node.type],
                  )}
                >
                  <span className="shrink-0">{NODE_ICON[node.subtype] ?? <Zap size={13} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{node.type}</p>
                    <p className="truncate text-sm font-bold">{node.label}</p>
                    {node.config && <p className="mt-0.5 truncate text-xs opacity-60">{node.config}</p>}
                  </div>
                  <Settings2 size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
                </button>

                {/* Connector + add-step affordance */}
                <div className="flex h-9 flex-col items-center">
                  <div className="w-px flex-1 bg-line" />
                  <button
                    onClick={() => setPicker('action')}
                    data-tour="automations.addStep"
                    aria-label="Add step"
                    title="Add step"
                    className="grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-ink-subtle transition-colors hover:border-brand hover:text-brand"
                  >
                    <Plus size={11} />
                  </button>
                  <div className="w-px flex-1 bg-line" />
                  {i < nodes.length - 1 && (
                    <ChevronRight size={11} className="rotate-90 text-ink-subtle" />
                  )}
                </div>
              </React.Fragment>
            ))}

            {/* End-of-chain add */}
            <button
              onClick={() => setPicker('action')}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Plus size={12} /> Add Action
            </button>
          </div>

          {picker && <WorkflowPicker kind={picker} onClose={() => setPicker(null)} />}

          <p className="mt-3 text-center text-xs text-ink-subtle">Builder is read-only in demo mode.</p>
        </div>
      )}

      {tab === 'enrollment' && (
        <div className="p-5">
          <p className="mb-3 text-sm font-semibold text-ink">Enrolled contacts — {wf.enrolled.toLocaleString()}</p>
          <div className="rounded-xl border border-line">
            {wf.enrolled > 0
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink">Contact #{wf.enrolled - i}</p>
                    <p className="text-xs text-ink-muted">contact{i + 1}@example.com</p>
                  </div>
                  <span className="text-xs text-ink-muted">{FAKE_LOG_TIMES[i]}</span>
                </div>
              ))
              : <p className="px-4 py-6 text-center text-sm text-ink-subtle">No contacts enrolled — workflow is a draft.</p>
            }
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="p-5">
          <p className="mb-3 text-sm font-semibold text-ink">Recent executions</p>
          <div className="rounded-xl border border-line">
            {wf.status === 'published'
              ? FAKE_LOG_TIMES.map((t, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-good" />
                    <span className="text-sm text-ink">Execution #{wf.enrolled - i}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="good">completed</Badge>
                    <span className="text-xs text-ink-muted">{t}</span>
                  </div>
                </div>
              ))
              : <p className="px-4 py-6 text-center text-sm text-ink-subtle">Draft workflows have no execution logs.</p>
            }
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Status</p>
              <div className="mt-1"><Badge tone={statusTone(wf.status)}>{wf.status}</Badge></div>
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Trigger</p>
              <p className="mt-1 text-sm font-semibold text-ink">{wf.trigger}</p>
            </div>
          </div>
          {wf.explanation && (
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Description</p>
              <p className="mt-1 text-sm text-ink">{wf.explanation}</p>
            </div>
          )}
          <p className="text-xs text-ink-subtle">Workflow settings are cosmetic only in demo mode.</p>
        </div>
      )}

      <NodeSettingsModal node={selNode} onClose={() => setSelNode(null)} />
    </div>
  );
}

/* ─── New Workflow Modal ──────────────────────────────────────── */

function NewWorkflowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const pushToast = useStore((s) => s.pushToast);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Workflow"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!selected}
            data-tour="automations.newWorkflowSubmit"
            onClick={() => { pushToast({ title: 'Workflow created (demo)', description: 'New workflows are not persisted in demo mode.', variant: 'success' }); setSelected(null); onClose(); }}
          >
            Create Workflow
          </Button>
        </>
      }
    >
      <div className="space-y-2" data-tour="automations.newWorkflowModal">
        <p className="mb-3 text-sm text-ink-muted">Choose a template or start from scratch.</p>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={cx(
              'flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
              selected === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/40 hover:bg-surface-sunken',
            )}
          >
            <Zap size={15} className={cx('mt-0.5 shrink-0', selected === t.id ? 'text-brand' : 'text-ink-muted')} />
            <div>
              <p className={cx('text-sm font-semibold', selected === t.id ? 'text-brand' : 'text-ink')}>{t.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

export function Automations() {
  const workflows = useStore((s) => s.workflows);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selWf, setSelWf] = useState<Workflow | null>(null);
  const [showNew, setShowNew] = useState(false);

  const published = workflows.filter((w) => w.status === 'published');
  const drafts    = workflows.filter((w) => w.status === 'draft');
  const totalEnrolled = workflows.reduce((s, w) => s + w.enrolled, 0);
  const filtered  = filter === 'all' ? workflows : filter === 'published' ? published : drafts;

  return (
    <div data-tour="automations.page">
      <PageHeader
        title="Automations"
        subtitle="Workflows — triggers, actions, and automated follow-up sequences"
        actions={
          <Button size="sm" data-tour="automations.newWorkflow" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Workflow
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 px-5 pt-5 lg:grid-cols-4" data-tour="automations.summary">
        <MiniStat label="Total Workflows" value={workflows.length} />
        <MiniStat label="Published" value={published.length} sub="active automations" />
        <MiniStat label="Drafts" value={drafts.length} sub="not yet live" />
        <MiniStat label="Total Enrolled" value={totalEnrolled.toLocaleString()} sub="contacts in workflows" />
      </div>

      <div className="mt-5 flex flex-col gap-5 px-5 pb-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <Card data-tour="automations.workflowList">
            <div className="border-b border-line px-4 pt-3">
              <Tabs
                tabs={[
                  { id: 'all', label: 'All', count: workflows.length },
                  { id: 'published', label: 'Published', count: published.length },
                  { id: 'draft', label: 'Drafts', count: drafts.length },
                ]}
                active={filter}
                onChange={(id) => { setFilter(id as typeof filter); setSelWf(null); }}
                variant="pill"
                className="mb-3"
              />
            </div>

            {/* Column header row — reads as a table */}
            {filtered.length > 0 && (
              <div className="flex items-center gap-3 border-b border-line bg-surface-sunken px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                <span className="w-7 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">Workflow</span>
                <span className="w-24 shrink-0">Status</span>
                <span className="hidden w-28 shrink-0 sm:block">Total Enrolled</span>
              </div>
            )}

            {filtered.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelWf(selWf?.id === wf.id ? null : wf)}
                data-tour="automations.workflowRow"
                className={cx(
                  'flex w-full items-center gap-3 border-b border-line/60 px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-surface-sunken',
                  selWf?.id === wf.id && 'bg-brand-soft/50',
                )}
              >
                <div className={cx('rounded-lg p-1.5 shrink-0', wf.status === 'published' ? 'bg-good/10 text-good' : 'bg-surface-sunken text-ink-muted')}>
                  {wf.status === 'published' ? <Play size={13} /> : <Pause size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{wf.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">Trigger: {wf.trigger}</p>
                </div>
                <span className="w-24 shrink-0">
                  <Badge tone={statusTone(wf.status)}>{wf.status}</Badge>
                </span>
                <span className="hidden w-28 shrink-0 items-center gap-1 text-xs text-ink-muted sm:flex">
                  <Users2 size={12} /> {wf.enrolled.toLocaleString()}
                </span>
                <span className="flex w-auto shrink-0 items-center gap-1 text-xs text-ink-muted sm:hidden">
                  <Users2 size={12} /> {wf.enrolled.toLocaleString()}
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-ink-subtle">No workflows in this category.</p>
            )}
          </Card>
        </div>

        {selWf && (
          <div className="w-full xl:w-[400px] xl:shrink-0">
            <Card>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{selWf.name}</p>
                  <p className="text-xs text-ink-muted">{selWf.trigger}</p>
                </div>
                <button onClick={() => setSelWf(null)} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <WorkflowBuilder wf={selWf} />
            </Card>
          </div>
        )}
      </div>

      <NewWorkflowModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}
