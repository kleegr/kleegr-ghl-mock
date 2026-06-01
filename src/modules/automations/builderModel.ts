/**
 * builderModel.ts - session-only editable state + pure tree operations for the
 * deeper Automations builder (Developer 6).
 *
 * The CURRENT canvas rendered a flat `WorkflowDisplayNode[]` (one linear chain +
 * a single YES/NO fork, NO lane was a dead end). This module migrates the canvas
 * onto Developer 7's forward-looking rich model from ./types:
 *   - `WorkflowNode` (recursive `branches` => real nested branching), and
 *   - a separate `triggers` array  (=> multiple triggers).
 *
 * Everything here is frontend-only and in-memory. Editing operations return NEW
 * state objects (immutable) so React re-renders cleanly; nothing is persisted and
 * nothing ever fires a real automation, SMS, email, or webhook.
 *
 * Scope note (Developer 6): this is an ADDITIVE helper that *consumes* Developer
 * 7's types (./types) and seeded rich data (./workflowTemplates). It never mutates
 * or re-exports a replacement for their foundation.
 */
import {
  renderKindFor,
  type WorkflowNode,
  type WorkflowBranch,
  type WorkflowNodeConfig,
  type WorkflowNodeKind,
  type WorkflowRenderKind,
} from './types';
import type { CatalogItem } from './automationData';
import { getWorkflowTemplate } from './workflowTemplates';

/* ── Lane addressing ────────────────────────────────────────────────────────────────
 * A LanePath is the list of branch ids to descend into from the main trunk.
 *   []                      -> the main trunk (state.nodes)
 *   ['c1_yes']              -> the YES lane of condition c1
 *   ['c1_no', 'no4_yes']    -> nested: YES lane inside the NO lane's condition
 */
export type LanePath = string[];

/** Session-only editable workflow body. Name/category/status live on `wf`. */
export interface BuilderState {
  triggers: WorkflowNode[];
  nodes: WorkflowNode[];
}

/* ── Ids ─────────────────────────────────────────────────── */

let seq = 0;
/** Collision-resistant id for a newly added node/branch (demo session only). */
export function mkId(prefix = 'n'): string {
  return `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`;
}

/* ── Render-kind helpers ─────────────────────────────────────── */

const WAIT_SUBTYPES = new Set(['wait', 'wait_until', 'wait_duration']);
const CONDITION_SUBTYPES = new Set(['if_else', 'check_appointment']);

/** Maps a catalog subtype id to the canvas render shape. */
export function renderKindForSubtype(subtype: string): WorkflowRenderKind {
  if (CONDITION_SUBTYPES.has(subtype)) return 'condition';
  if (WAIT_SUBTYPES.has(subtype)) return 'wait';
  return 'action';
}

/** True when a node draws as a branching condition card. */
export const isConditionNode = (n: WorkflowNode): boolean => renderKindFor(n.kind) === 'condition';

/* ── Deep clone (so seeded template data is never mutated) ──────────────── */

function cloneNode(n: WorkflowNode): WorkflowNode {
  return {
    ...n,
    config: n.config ? { ...n.config } : undefined,
    branches: n.branches ? n.branches.map(cloneBranch) : undefined,
  };
}
function cloneBranch(b: WorkflowBranch): WorkflowBranch {
  return { ...b, nodes: b.nodes.map(cloneNode) };
}

/* ── Initial state ────────────────────────────────────────────────── */

/**
 * Loads the editable session state for a workflow. Blank workflows start empty;
 * seeded workflows are hydrated from Developer 7's rich template
 * (`getWorkflowTemplate`), deep-cloned so edits stay local.
 */
export function initialBuilderState(workflowId: string, trigger: string, blank: boolean): BuilderState {
  if (blank) return { triggers: [], nodes: [] };
  const t = getWorkflowTemplate(workflowId, trigger);
  return { triggers: t.triggers.map(cloneNode), nodes: t.nodes.map(cloneNode) };
}

/* ── Per-type default config + summary line ────────────────────────── */

/** Demo-safe starting config for a freshly added node, by catalog subtype. */
export function defaultConfigFor(type: string): WorkflowNodeConfig {
  switch (type) {
    case 'send_sms':
      return { channel: 'sms', body: '', from: 'business_number' };
    case 'send_email':
      return { channel: 'email', subject: '', template: '', body: '' };
    case 'wait':
    case 'wait_duration':
      return { mode: 'duration', duration: 1, unit: 'days' };
    case 'wait_until':
      return { mode: 'until', duration: 24, unit: 'hours' };
    case 'if_else':
      return { field: 'contact.tags', operator: 'contains', value: '' };
    case 'send_notification':
      return { channels: ['in_app'], message: '', assignee: '' };
    case 'webhook':
    case 'inbound_webhook':
      return { url: '', method: 'POST' };
    default:
      return {};
  }
}

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
}

/**
 * One-line technical summary of a node's config for the node card. Returns
 * `undefined` when there is nothing meaningful to show yet (so the caller can
 * fall back to the catalog category).
 */
export function summarizeConfig(node: WorkflowNode): string | undefined {
  const c = node.config ?? {};
  switch (node.type) {
    case 'send_sms': {
      const b = asStr(c.body).trim();
      return b ? `“${truncate(b, 42)}”` : undefined;
    }
    case 'send_email': {
      const s = asStr(c.subject).trim();
      const t = asStr(c.template).trim();
      return s ? `Subject: ${truncate(s, 38)}` : t ? `Template: ${t}` : undefined;
    }
    case 'wait':
    case 'wait_until':
    case 'wait_duration': {
      const d = c.duration;
      const u = asStr(c.unit) || 'days';
      if (typeof d !== 'number' || d <= 0) return undefined;
      const unit = d === 1 ? u.replace(/s$/, '') : u;
      return node.type === 'wait_until' ? `Until ${d} ${unit} before` : `${d} ${unit}`;
    }
    case 'if_else': {
      const f = asStr(c.field).trim();
      const op = asStr(c.operator).trim();
      const v = asStr(c.value).trim();
      return f ? `${f} ${op} ${v}`.trim() : undefined;
    }
    case 'send_notification': {
      const a = asStr(c.assignee).trim();
      return a ? `Notify ${a}` : undefined;
    }
    case 'webhook':
    case 'inbound_webhook': {
      const u = asStr(c.url).trim();
      const m = asStr(c.method) || 'POST';
      return u ? `${m} ${hostOf(u)}` : undefined;
    }
    default:
      return undefined;
  }
}

/* ── Node factory (catalog item -> rich node) ──────────────────────── */

/**
 * Builds a rich `WorkflowNode` from a picked catalog item. Conditions are seeded
 * with empty YES and NO lanes so the user can immediately add steps to *both*
 * (so a user-created branch is never a dead end). Demo-only - never stored.
 */
export function buildNodeFromCatalog(item: CatalogItem, kind: 'trigger' | 'action'): WorkflowNode {
  const rk: WorkflowRenderKind = kind === 'trigger' ? 'trigger' : renderKindForSubtype(item.id);
  const node: WorkflowNode = {
    id: mkId('new'),
    type: item.id,
    kind: rk as WorkflowNodeKind,
    label: item.label,
    description: item.category ?? (kind === 'trigger' ? 'Trigger' : 'Action'),
    note: item.desc,
    example: item.example,
    icon: item.id,
    category: item.category,
    config: defaultConfigFor(item.id),
  };
  if (rk === 'condition') {
    node.branches = [
      { id: mkId('yes'), label: 'Yes', lane: 'yes', nodes: [] },
      { id: mkId('no'), label: 'No', lane: 'no', terminal: 'End — contact exits the workflow', nodes: [] },
    ];
  }
  const summary = summarizeConfig(node);
  if (summary) node.description = summary;
  return node;
}

/* ── Lane resolution + immutable tree edits ──────────────────────── */

/** Reads the node array for a lane (trunk or nested branch). */
export function getLaneNodes(state: BuilderState, path: LanePath): WorkflowNode[] {
  let list = state.nodes;
  for (const branchId of path) {
    const parent = list.find((n) => n.branches?.some((b) => b.id === branchId));
    const branch = parent?.branches?.find((b) => b.id === branchId);
    if (!branch) return [];
    list = branch.nodes;
  }
  return list;
}

/** Returns new state with the target lane's node array transformed by `fn`. */
function withLane(
  state: BuilderState,
  path: LanePath,
  fn: (nodes: WorkflowNode[]) => WorkflowNode[],
): BuilderState {
  const recur = (nodes: WorkflowNode[], depth: number): WorkflowNode[] => {
    if (depth === path.length) return fn(nodes);
    const branchId = path[depth];
    return nodes.map((n) => {
      if (!n.branches || !n.branches.some((b) => b.id === branchId)) return n;
      return {
        ...n,
        branches: n.branches.map((b) =>
          b.id === branchId ? { ...b, nodes: recur(b.nodes, depth + 1) } : b,
        ),
      };
    });
  };
  return { ...state, nodes: recur(state.nodes, 0) };
}

/** Inserts `node` at `index` within the lane addressed by `path`. */
export function insertNode(state: BuilderState, path: LanePath, index: number, node: WorkflowNode): BuilderState {
  return withLane(state, path, (nodes) => {
    const out = nodes.slice();
    out.splice(Math.max(0, Math.min(index, out.length)), 0, node);
    return out;
  });
}

/** Appends `node` to the end of the lane addressed by `path`. */
export function appendNode(state: BuilderState, path: LanePath, node: WorkflowNode): BuilderState {
  return insertNode(state, path, getLaneNodes(state, path).length, node);
}

/** Removes a node (and, if it is a condition, its whole branch subtree) by id. */
export function removeNodeById(state: BuilderState, id: string): BuilderState {
  const recur = (nodes: WorkflowNode[]): WorkflowNode[] =>
    nodes
      .filter((n) => n.id !== id)
      .map((n) =>
        n.branches ? { ...n, branches: n.branches.map((b) => ({ ...b, nodes: recur(b.nodes) })) } : n,
      );
  return {
    triggers: state.triggers.filter((t) => t.id !== id),
    nodes: recur(state.nodes),
  };
}

/** Shallow-merges `patch` into the node with the given id (searches everywhere). */
export function updateNodeById(state: BuilderState, id: string, patch: Partial<WorkflowNode>): BuilderState {
  const apply = (n: WorkflowNode): WorkflowNode =>
    n.id === id ? { ...n, ...patch, config: patch.config ?? n.config } : n;
  const recur = (nodes: WorkflowNode[]): WorkflowNode[] =>
    nodes.map((n) => {
      const u = apply(n);
      return u.branches ? { ...u, branches: u.branches.map((b) => ({ ...b, nodes: recur(b.nodes) })) } : u;
    });
  return { triggers: state.triggers.map(apply), nodes: recur(state.nodes) };
}

/** Finds a node anywhere in the tree (triggers, trunk, or any nested lane). */
export function findNodeById(state: BuilderState, id: string | null): WorkflowNode | null {
  if (!id) return null;
  let found: WorkflowNode | null = null;
  const scan = (nodes: WorkflowNode[]): void => {
    for (const n of nodes) {
      if (n.id === id) found = n;
      if (n.branches) for (const b of n.branches) scan(b.nodes);
    }
  };
  for (const t of state.triggers) if (t.id === id) found = t;
  scan(state.nodes);
  return found;
}

/** Looks up a branch (lane) by its id for context labelling. */
export function findBranchById(state: BuilderState, branchId: string): WorkflowBranch | null {
  let found: WorkflowBranch | null = null;
  const scan = (nodes: WorkflowNode[]): void => {
    for (const n of nodes) {
      if (n.branches) {
        for (const b of n.branches) {
          if (b.id === branchId) found = b;
          scan(b.nodes);
        }
      }
    }
  };
  scan(state.nodes);
  return found;
}

/* ── Triggers ───────────────────────────────────────────────────── */

export function addTrigger(state: BuilderState, node: WorkflowNode): BuilderState {
  return { ...state, triggers: [...state.triggers, node] };
}
export function removeTrigger(state: BuilderState, id: string): BuilderState {
  return { ...state, triggers: state.triggers.filter((t) => t.id !== id) };
}

/* ── Counts (header chips) ────────────────────────────────────── */

export interface BuilderCounts {
  triggers: number;
  steps: number;
  conditions: number;
}

/** Walks the tree (including nested branches) to count triggers, steps, forks. */
export function countState(state: BuilderState): BuilderCounts {
  let steps = 0;
  let conditions = 0;
  const tally = (nodes: WorkflowNode[]): void => {
    for (const n of nodes) {
      if (isConditionNode(n)) {
        conditions += 1;
        steps += 1;
        if (n.branches) for (const b of n.branches) tally(b.nodes);
      } else {
        steps += 1; // actions + waits both count as steps
      }
    }
  };
  tally(state.nodes);
  return { triggers: state.triggers.length, steps, conditions };
}

/* ── Picker insertion context label ──────────────────────────── */

/** Human label describing where a picked node will land (shown in the picker). */
export function insertionContextLabel(state: BuilderState, path: LanePath, index: number): string {
  const lane = getLaneNodes(state, path);
  const atEnd = index >= lane.length;
  if (path.length === 0) {
    return atEnd ? 'Adds to the end of the main path' : `Inserts at step ${index + 1} of the main path`;
  }
  const branch = findBranchById(state, path[path.length - 1]);
  const laneName = branch ? `${branch.label} branch` : 'branch';
  return atEnd ? `Adds to the end of the ${laneName}` : `Inserts at step ${index + 1} of the ${laneName}`;
}
