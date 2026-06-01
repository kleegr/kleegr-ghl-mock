import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Pencil, Undo2, Redo2, ChevronDown, Plus, Minus, Hand, Maximize,
  Sparkles, Mic, ArrowUp, MessageSquare, SquareCheck, PieChart, FileText, Share2,
  History, Keyboard, X, Settings2, Clock, Mail, Tag, CheckSquare, Split, Cake,
  CalendarClock, Phone, Zap, Bell, Search, Check, GitBranch, Briefcase,
  UserPlus, UserCheck, UserSearch, MessagesSquare, CircleDollarSign, Star,
  StickyNote, ArrowRightLeft, Trash2,
} from 'lucide-react';
import type { Workflow } from '@/types';
import { useStore } from '@/store/useStore';
import { Button, Badge } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { renderKindFor, type WorkflowNode, type WorkflowNodeConfig, type WorkflowRenderKind } from './types';
import {
  type BuilderState,
  type LanePath,
  initialBuilderState,
  buildNodeFromCatalog,
  getLaneNodes,
  insertNode,
  appendNode,
  removeNodeById,
  updateNodeById,
  findNodeById,
  addTrigger,
  removeTrigger,
  countState,
  isConditionNode,
  summarizeConfig,
  insertionContextLabel,
} from './builderModel';
import { BuilderPicker } from './BuilderPickers';
import { CatalogModal } from './CatalogModal';
import { AI_CHIPS, AI_PROMPTS, type CatalogItem } from './automationData';

/* ── node visual maps (keyed by the 4 render shapes) ── */

const KIND_CHIP: Record<WorkflowRenderKind, string> = {
  trigger: 'bg-brand text-white',
  action: 'bg-brand-soft text-brand',
  condition: 'bg-ai-soft text-ai',
  wait: 'bg-surface-sunken text-ink-muted',
};
const KIND_LABEL: Record<WorkflowRenderKind, string> = {
  trigger: 'Trigger',
  action: 'Action',
  condition: 'Condition',
  wait: 'Wait',
};

/* Maps a node subtype → icon. Covers every catalog trigger/action id plus the
   seed/template subtypes so nodes added from the picker render the right glyph. */
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
  inbound_webhook: Share2,
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
  send_invoice: CircleDollarSign,
  send_documents: FileText,
  ai_prompt: Sparkles,
  ai_summarize: Sparkles,
  conversation_ai: MessagesSquare,
  webhook: Share2,
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

/* ── connector with inline add button (insert-at-position) ── */

function Connector({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <span className="h-5 w-px bg-line" />
      <button
        data-tour="automations.addNodeButton"
        onClick={onAdd}
        className="grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-subtle shadow-card transition-colors hover:border-brand hover:text-brand"
        aria-label="Add step here"
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

/* ── dashed "add new action" affordance (appends to a lane) ── */

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

/* ── node card (rich WorkflowNode) ── */

function NodeCard({
  node, step, selected, onClick,
}: {
  node: WorkflowNode;
  step: number | null;
  selected?: boolean;
  onClick: () => void;
}) {
  const rk = renderKindFor(node.kind);
  const Icon = iconFor(node.type);
  const isTrigger = rk === 'trigger';
  return (
    <button
      onClick={onClick}
      data-tour={isTrigger ? 'automations.triggerNode' : 'automations.actionNode'}
      className={cx(
        'group flex w-[300px] items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left shadow-card transition-all hover:-translate-y-px hover:border-brand/50 hover:shadow-pop',
        selected ? 'border-brand ring-2 ring-brand/40' : isTrigger ? 'border-brand/40' : 'border-line',
      )}
    >
      <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', KIND_CHIP[rk])}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">
          {step !== null ? `${step}. ` : ''}{KIND_LABEL[rk]}
        </p>
        <p className="truncate text-sm font-bold text-ink">{node.label}</p>
        {node.description && <p className="mt-0.5 truncate text-xs text-ink-muted">{node.description}</p>}
      </div>
      <Settings2 size={14} className="shrink-0 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ── trigger card + multi-trigger group ── */

function TriggerCard({
  trigger, selected, onClick, removable, onRemove,
}: {
  trigger: WorkflowNode;
  selected?: boolean;
  onClick: () => void;
  removable: boolean;
  onRemove: () => void;
}) {
  const Icon = iconFor(trigger.type);
  return (
    <div className="relative">
      <button
        onClick={onClick}
        data-tour="automations.triggerNode"
        className={cx(
          'group flex w-[300px] items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left shadow-card transition-all hover:-translate-y-px hover:border-brand/50 hover:shadow-pop',
          selected ? 'border-brand ring-2 ring-brand/40' : 'border-brand/40',
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">Trigger</p>
          <p className="truncate text-sm font-bold text-ink">{trigger.label}</p>
          {trigger.description && <p className="mt-0.5 truncate text-xs text-ink-muted">{trigger.description}</p>}
        </div>
      </button>
      {removable && (
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-ink-subtle shadow-card transition-colors hover:border-bad hover:text-bad"
          aria-label={`Remove trigger ${trigger.label}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function TriggerGroup({
  triggers, selId, onSelect, onAddTrigger, onRemoveTrigger,
}: {
  triggers: WorkflowNode[];
  selId: string | null;
  onSelect: (n: WorkflowNode) => void;
  onAddTrigger: () => void;
  onRemoveTrigger: (id: string) => void;
}) {
  const multi = triggers.length > 1;
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">
          {triggers.length === 1 ? 'Trigger' : 'Triggers'}
        </span>
        <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold text-ink-muted">{triggers.length}</span>
      </div>
      {multi && <p className="mt-0.5 text-[11px] text-ink-subtle">Any of these can start the workflow</p>}
      <div className="mt-2 flex flex-col items-center gap-2">
        {triggers.map((t, i) => (
          <React.Fragment key={t.id}>
            {i > 0 && <span className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">or</span>}
            <TriggerCard
              trigger={t}
              selected={selId === t.id}
              onClick={() => onSelect(t)}
              removable={triggers.length > 1}
              onRemove={() => onRemoveTrigger(t.id)}
            />
          </React.Fragment>
        ))}
        <button
          onClick={onAddTrigger}
          className="flex w-[300px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand-soft/30 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft/60"
        >
          <Plus size={15} /> Add trigger
        </button>
      </div>
    </div>
  );
}

/* ── branch label pill ── */

function BranchLabel({ lane, label }: { lane: string; label: string }) {
  if (lane === 'yes') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-good/10 px-3 py-1 text-xs font-bold text-good">
        <Check size={12} /> {label}
      </span>
    );
  }
  if (lane === 'no') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-ink-muted">
        <X size={12} /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
      <GitBranch size={12} /> {label}
    </span>
  );
}

/* ── recursive lane (the main trunk, or a branch's nodes) ── */

function Trunk({
  state, path, selId, onSelect, onAddAt,
}: {
  state: BuilderState;
  path: LanePath;
  selId: string | null;
  onSelect: (n: WorkflowNode) => void;
  onAddAt: (path: LanePath, index: number) => void;
}) {
  const nodes = getLaneNodes(state, path);
  const lastIsCondition = nodes.length > 0 && isConditionNode(nodes[nodes.length - 1]);
  return (
    <div className="flex flex-col items-center">
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <Connector onAdd={() => onAddAt(path, i)} />
          <NodeCard node={node} step={i + 1} selected={selId === node.id} onClick={() => onSelect(node)} />
          {isConditionNode(node) && (
            <BranchSplit node={node} path={path} state={state} selId={selId} onSelect={onSelect} onAddAt={onAddAt} />
          )}
        </React.Fragment>
      ))}
      {!lastIsCondition && (
        <>
          <Connector onAdd={() => onAddAt(path, nodes.length)} />
          <AddActionButton onAdd={() => onAddAt(path, nodes.length)} width="w-[280px]" />
          <span className="h-5 w-px bg-line" />
          <Terminal />
        </>
      )}
    </div>
  );
}

/* ── condition fork: render every lane (YES / NO / ELSE) with real steps ── */

function BranchSplit({
  node, path, state, selId, onSelect, onAddAt,
}: {
  node: WorkflowNode;
  path: LanePath;
  state: BuilderState;
  selId: string | null;
  onSelect: (n: WorkflowNode) => void;
  onAddAt: (path: LanePath, index: number) => void;
}) {
  const branches = node.branches ?? [];
  const twoLane = branches.length === 2;
  return (
    <div className="flex w-full flex-col items-center">
      <span className="h-5 w-px bg-line" />
      {/* horizontal bridge into the lanes */}
      {twoLane ? (
        <div className="relative h-5 w-full">
          <span className="absolute left-1/4 right-1/4 top-0 h-px bg-line" />
          <span className="absolute left-1/4 top-0 h-5 w-px bg-line" />
          <span className="absolute right-1/4 top-0 h-5 w-px bg-line" />
        </div>
      ) : (
        <div className="relative h-5 w-3/4">
          <span className="absolute inset-x-0 top-0 h-px bg-line" />
        </div>
      )}
      <div className={cx('grid gap-8', branches.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {branches.map((b) => (
          <div key={b.id} className="flex flex-col items-center">
            <BranchLabel lane={b.lane} label={b.label} />
            {b.condition && (
              <p className="mt-1 max-w-[260px] text-center text-[11px] text-ink-subtle">{b.condition}</p>
            )}
            <span className="h-3 w-px bg-line" />
            <Trunk state={state} path={[...path, b.id]} selId={selId} onSelect={onSelect} onAddAt={onAddAt} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── full canvas flow: trigger group + recursive trunk ── */

function FlowCanvas({
  state, selId, onSelect, onAddAt, onAddTrigger, onRemoveTrigger,
}: {
  state: BuilderState;
  selId: string | null;
  onSelect: (n: WorkflowNode) => void;
  onAddAt: (path: LanePath, index: number) => void;
  onAddTrigger: () => void;
  onRemoveTrigger: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center pt-2">
      <TriggerGroup
        triggers={state.triggers}
        selId={selId}
        onSelect={onSelect}
        onAddTrigger={onAddTrigger}
        onRemoveTrigger={onRemoveTrigger}
      />
      <Trunk state={state} path={[]} selId={selId} onSelect={onSelect} onAddAt={onAddAt} />
    </div>
  );
}

/* ── node config inspector (right drawer, demo-safe local config) ── */

const inputCx =
  'mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';
const labelCx = 'text-xs font-semibold text-ink-subtle';

/** Which config keys each node type exposes as editable string fields. */
const FIELD_KEYS: Record<string, string[]> = {
  send_sms: ['body', 'from'],
  send_email: ['subject', 'template', 'body'],
  wait: ['duration', 'unit'],
  wait_until: ['duration', 'unit'],
  wait_duration: ['duration', 'unit'],
  if_else: ['field', 'operator', 'value'],
  send_notification: ['message', 'assignee'],
  webhook: ['url', 'method'],
  inbound_webhook: ['url', 'method'],
};

function initForm(node: WorkflowNode): Record<string, string> {
  const keys = FIELD_KEYS[node.type] ?? [];
  const c = node.config ?? {};
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = c[k];
    out[k] = v == null ? '' : String(v);
  }
  return out;
}

function buildConfig(node: WorkflowNode, form: Record<string, string>): WorkflowNodeConfig {
  const base: WorkflowNodeConfig = { ...(node.config ?? {}) };
  for (const [k, v] of Object.entries(form)) {
    base[k] = k === 'duration' ? Number(v) || 0 : v;
  }
  return base;
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={labelCx}>{label}</p>
      {children}
    </div>
  );
}

function ConfigFields({
  node, form, set,
}: {
  node: WorkflowNode;
  form: Record<string, string>;
  set: (k: string, v: string) => void;
}) {
  switch (node.type) {
    case 'send_sms':
      return (
        <>
          <Labeled label="Message body">
            <textarea
              rows={4}
              value={form.body ?? ''}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Hi {{contact.first_name}}, thanks for reaching out!"
              className={cx(inputCx, 'resize-none')}
            />
            <p className="mt-1 text-[11px] text-ink-subtle">{(form.body ?? '').length} characters</p>
          </Labeled>
          <Labeled label="From">
            <select value={form.from ?? 'business_number'} onChange={(e) => set('from', e.target.value)} className={inputCx}>
              <option value="business_number">Business number</option>
              <option value="assigned_user">Assigned user&rsquo;s number</option>
            </select>
          </Labeled>
        </>
      );
    case 'send_email':
      return (
        <>
          <Labeled label="Subject">
            <input value={form.subject ?? ''} onChange={(e) => set('subject', e.target.value)} placeholder="We got your request" className={inputCx} />
          </Labeled>
          <Labeled label="Template name">
            <input value={form.template ?? ''} onChange={(e) => set('template', e.target.value)} placeholder="New Lead Welcome" className={inputCx} />
          </Labeled>
          <Labeled label="Preview / body">
            <textarea rows={4} value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} placeholder="Hi {{contact.first_name}}, here is what to expect…" className={cx(inputCx, 'resize-none')} />
          </Labeled>
        </>
      );
    case 'wait':
    case 'wait_until':
    case 'wait_duration':
      return (
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Duration">
            <input type="number" min={0} value={form.duration ?? ''} onChange={(e) => set('duration', e.target.value)} className={inputCx} />
          </Labeled>
          <Labeled label="Unit">
            <select value={form.unit ?? 'days'} onChange={(e) => set('unit', e.target.value)} className={inputCx}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </Labeled>
        </div>
      );
    case 'if_else':
      return (
        <>
          <Labeled label="Condition field">
            <input value={form.field ?? ''} onChange={(e) => set('field', e.target.value)} placeholder="appointment.status" className={inputCx} />
          </Labeled>
          <Labeled label="Operator">
            <select value={form.operator ?? 'is'} onChange={(e) => set('operator', e.target.value)} className={inputCx}>
              <option value="is">is</option>
              <option value="is not">is not</option>
              <option value="contains">contains</option>
              <option value="does not contain">does not contain</option>
              <option value="is greater than">is greater than</option>
              <option value="is less than">is less than</option>
              <option value="exists">exists</option>
              <option value="does not exist">does not exist</option>
            </select>
          </Labeled>
          <Labeled label="Value">
            <input value={form.value ?? ''} onChange={(e) => set('value', e.target.value)} placeholder="no-show" className={inputCx} />
          </Labeled>
        </>
      );
    case 'send_notification':
      return (
        <>
          <Labeled label="Message">
            <textarea rows={3} value={form.message ?? ''} onChange={(e) => set('message', e.target.value)} placeholder="New lead assigned to you — say hi within the hour." className={cx(inputCx, 'resize-none')} />
          </Labeled>
          <Labeled label="Notify (user / team)">
            <input value={form.assignee ?? ''} onChange={(e) => set('assignee', e.target.value)} placeholder="Assigned user" className={inputCx} />
          </Labeled>
        </>
      );
    case 'webhook':
    case 'inbound_webhook':
      return (
        <>
          <Labeled label="Webhook URL">
            <input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://example.com/hooks/lead" className={inputCx} />
          </Labeled>
          <Labeled label="Method">
            <select value={form.method ?? 'POST'} onChange={(e) => set('method', e.target.value)} className={inputCx}>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </select>
          </Labeled>
          <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
            Demo only — saving stores the URL locally. No request is ever sent.
          </p>
        </>
      );
    default:
      return (
        <p className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink-subtle">
          This step type has no editable fields in the demo. You can still rename it above.
        </p>
      );
  }
}

function NodeInspector({
  node, isLastTrigger, onClose, onSave, onDelete,
}: {
  node: WorkflowNode;
  isLastTrigger: boolean;
  onClose: () => void;
  onSave: (patch: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
}) {
  const rk = renderKindFor(node.kind);
  const Icon = iconFor(node.type);
  const isTrigger = rk === 'trigger';
  const isCondition = isConditionNode(node);
  const [label, setLabel] = useState(node.label);
  const [form, setForm] = useState<Record<string, string>>(() => initForm(node));
  const [confirm, setConfirm] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const cfg = buildConfig(node, form);
    const desc = summarizeConfig({ ...node, config: cfg } as WorkflowNode) ?? node.description;
    onSave({ label: label.trim() || node.label, config: cfg, description: desc });
  };

  const deleteDisabled = isTrigger && isLastTrigger;
  const deleteLabel = isCondition ? 'Delete branch' : isTrigger ? 'Delete trigger' : 'Delete step';

  return (
    <aside
      data-tour="automations.nodeInspector"
      className="flex h-full w-full flex-col border-l border-line bg-surface sm:w-[420px]"
      aria-label="Step settings"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', KIND_CHIP[rk])}><Icon size={16} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle">{KIND_LABEL[rk]} settings</p>
            <p className="truncate text-sm font-bold text-ink">{node.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        <Labeled label="Step name">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCx} />
        </Labeled>

        <ConfigFields node={node} form={form} set={set} />

        {node.note && (
          <div>
            <p className={labelCx}>What this step does</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{node.note}</p>
          </div>
        )}
        {node.example && (
          <div>
            <p className={labelCx}>Example</p>
            <p className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs italic leading-relaxed text-ink-subtle">{node.example}</p>
          </div>
        )}

        {/* delete */}
        <div className="border-t border-line pt-3">
          {confirm ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-muted">
                {isCondition
                  ? 'This removes the condition and every step inside both branch paths. This cannot be undone.'
                  : 'Remove this step from the workflow? This cannot be undone.'}
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => onDelete(node.id)}>
                  <Trash2 size={14} /> Confirm delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirm(true)}
                disabled={deleteDisabled}
                className={cx(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  deleteDisabled ? 'cursor-not-allowed text-ink-subtle' : 'text-bad hover:bg-bad/10',
                )}
              >
                <Trash2 size={15} /> {deleteLabel}
              </button>
              {deleteDisabled && <p className="mt-1 text-[11px] text-ink-subtle">A workflow needs at least one trigger.</p>}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        <Button size="sm" onClick={save}>Save</Button>
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
  wf, blank, onBack,
}: {
  wf: Workflow;
  blank: boolean;
  onBack: () => void;
}) {
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<BuilderTab>('builder');
  const [published, setPublished] = useState(wf.status === 'published');
  const [zoom, setZoom] = useState(100);
  const [selId, setSelId] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | 'trigger' | 'action'>(null);
  const [catalog, setCatalog] = useState<null | 'trigger' | 'action'>(null);
  const [pendingInsert, setPendingInsert] = useState<{ path: LanePath; index: number } | null>(null);
  const [builderModeOpen, setBuilderModeOpen] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * AI_PROMPTS.length));
  const [state, setState] = useState<BuilderState>(() => initialBuilderState(wf.id, wf.trigger, blank));

  const counts = countState(state);
  const empty = state.triggers.length === 0 && state.nodes.length === 0;
  const selNode = findNodeById(state, selId);

  const cosmetic = (title: string, description: string) => pushToast({ title, description, variant: 'info' });
  const selectNode = (n: WorkflowNode) => { setSelId(n.id); setPicker(null); setCatalog(null); };

  /* Open the action picker targeted at a specific lane + index (insert-at-position). */
  const openAddAt = (path: LanePath, index: number) => {
    setPendingInsert({ path, index });
    setSelId(null);
    setCatalog(null);
    setPicker('action');
  };
  /* Open the trigger picker (adds to the trigger group). */
  const openAddTrigger = () => {
    setPendingInsert(null);
    setSelId(null);
    setCatalog(null);
    setPicker('trigger');
  };

  /* Commit a picked catalog item into the canvas as a real (demo-only) node. */
  const commitAdd = (item: CatalogItem, kind: 'trigger' | 'action') => {
    const node = buildNodeFromCatalog(item, kind);
    if (kind === 'trigger') {
      setState((s) => addTrigger(s, node));
    } else if (pendingInsert) {
      setState((s) => insertNode(s, pendingInsert.path, pendingInsert.index, node));
    } else {
      setState((s) => appendNode(s, [], node));
    }
    setSelId(node.id);
    setPicker(null);
    setCatalog(null);
    setPendingInsert(null);
    pushToast({
      title: `${kind === 'trigger' ? 'Trigger' : 'Step'} added`,
      description: `“${item.label}” added to the canvas (demo session only).`,
      variant: 'success',
    });
  };
  const onPick = (item: CatalogItem) => { if (picker) commitAdd(item, picker); };
  const onCatalogPick = (item: CatalogItem) => { if (catalog) commitAdd(item, catalog); };

  const saveNode = (patch: Partial<WorkflowNode>) => {
    if (!selId) return;
    setState((s) => updateNodeById(s, selId, patch));
    pushToast({ title: 'Step saved', description: 'Configuration updated for this demo session.', variant: 'success' });
  };
  const deleteNode = (id: string) => {
    const target = findNodeById(state, id);
    setState((s) => removeNodeById(s, id));
    if (selId === id) setSelId(null);
    pushToast({
      title: `${target && isConditionNode(target) ? 'Branch' : 'Step'} removed`,
      description: 'Removed from the canvas (demo session only).',
      variant: 'info',
    });
  };
  const removeTriggerSafe = (id: string) => {
    if (state.triggers.length <= 1) {
      cosmetic('Keep one trigger', 'A workflow needs at least one trigger to run.');
      return;
    }
    setState((s) => removeTrigger(s, id));
    if (selId === id) setSelId(null);
    pushToast({ title: 'Trigger removed', description: 'Removed from the trigger group (demo only).', variant: 'info' });
  };

  const startBuild = (prompt: string) => {
    openAddTrigger();
    cosmetic('Let’s build that', prompt ? 'Pick a trigger to anchor your AI-assisted workflow (demo).' : 'Pick a trigger to start (demo).');
  };

  const isLastTrigger = state.triggers.length <= 1;
  const contextLabel = pendingInsert ? insertionContextLabel(state, pendingInsert.path, pendingInsert.index) : undefined;
  const showInspector = !!selNode && !picker && !catalog;

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

        <div className="hidden items-center gap-1.5 md:flex">
          <Badge tone="brand">{counts.triggers} trigger{counts.triggers === 1 ? '' : 's'}</Badge>
          <Badge tone="neutral">{counts.steps} step{counts.steps === 1 ? '' : 's'}</Badge>
          {counts.conditions > 0 && <Badge tone="neutral">{counts.conditions} branch{counts.conditions === 1 ? '' : 'es'}</Badge>}
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

              {/* add button top-right (appends to the main path) */}
              <button
                onClick={() => openAddAt([], state.nodes.length)}
                className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card hover:bg-surface-sunken"
              >
                <Plus size={15} /> Add
              </button>

              {/* flow */}
              <div className="flex min-h-full justify-center px-6 py-16" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                {empty ? (
                  <div className="flex flex-col items-center gap-6 pt-2">
                    <AiPanel
                      promptIndex={promptIndex}
                      onStartBuild={startBuild}
                      onOpenTrigger={openAddTrigger}
                    />
                    <div className="flex w-full max-w-2xl items-center gap-3 text-xs font-semibold text-ink-subtle">
                      <span className="h-px flex-1 bg-line" /> Or <span className="h-px flex-1 bg-line" />
                    </div>
                    <button
                      onClick={openAddTrigger}
                      data-tour="automations.triggerNode"
                      className="flex w-72 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/50 bg-brand-soft/40 px-4 py-5 text-sm font-bold text-brand hover:bg-brand-soft"
                    >
                      <Plus size={18} /> Add New Trigger
                    </button>
                    <Connector onAdd={() => openAddAt([], 0)} />
                    <Terminal />
                  </div>
                ) : (
                  <FlowCanvas
                    state={state}
                    selId={selId}
                    onSelect={selectNode}
                    onAddAt={openAddAt}
                    onAddTrigger={openAddTrigger}
                    onRemoveTrigger={removeTriggerSafe}
                  />
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

        {/* right rail: picker drawer OR node inspector (mutually exclusive) */}
        {picker && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-[420px]">
            <BuilderPicker
              kind={picker}
              context={picker === 'action' ? contextLabel : undefined}
              onClose={() => { setPicker(null); setPendingInsert(null); }}
              onSelect={onPick}
              onExpand={() => { setCatalog(picker); setPicker(null); }}
            />
          </div>
        )}
        {showInspector && selNode && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-[420px]">
            <NodeInspector
              key={selNode.id}
              node={selNode}
              isLastTrigger={isLastTrigger}
              onClose={() => setSelId(null)}
              onSave={saveNode}
              onDelete={deleteNode}
            />
          </div>
        )}
      </div>

      <CatalogModal kind={catalog} onClose={() => { setCatalog(null); setPendingInsert(null); }} onSelect={onCatalogPick} />
    </div>
  );
}
