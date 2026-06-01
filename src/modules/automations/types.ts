/**
 * types.ts - shared, frontend-only type foundation for the Automations /
 * Workflows module.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The current builder (WorkflowBuilder.tsx) renders a *display-only* node model
 * (`WorkflowDisplayNode`) that supports a single linear chain plus one YES / NO
 * condition fork. The next builder iteration needs a richer, recursive model:
 * multiple triggers, nested branches, per-node config, and starter-chain
 * templates. This module defines that richer model **additively** so it can be
 * adopted incrementally without breaking anything that exists today.
 *
 * DESIGN RULES (read before editing)
 * - Frontend-only. No backend/runtime assumptions, no API shapes.
 * - Additive. Nothing here replaces or mutates an existing export elsewhere.
 * - Two node "kind" vocabularies, on purpose:
 * - `WorkflowRenderKind` - the 4 shapes the CURRENT canvas can draw.
 * `WorkflowDisplayNode.type` uses this. The
 * builder keys exhaustive `Record<...>` maps on it,
 * so it must stay exactly these four members.
 * - `WorkflowNodeKind` - the broad semantic grouping the NEXT builder
 * will categorise the catalog by (adds internal,
 * communication, payment, webhook, ai). Use this
 * on the forward-looking `WorkflowNode`.
 * - `WorkflowDisplayNode` here is the single source of truth for the bridge
 * shape; `workflowNodes.ts` re-exports it so both stay identical.
 *
 * Nothing in this file ever fires a real automation.
 */

/* -- Identifiers -- */

export type WorkflowId = string;
export type WorkflowNodeId = string;
export type WorkflowBranchId = string;
export type WorkflowTemplateId = string;

/* -- Category / status -- */

/**
 * Demo workflow categories. Kept open-ended with a trailing `string` so the
 * existing free-text `Workflow.category` seed values ("Lead Follow-Up", etc.)
 * remain assignable while still giving editors useful autocomplete.
 */
export type WorkflowCategory =
  | 'lead-follow-up'
  | 'speed-to-lead'
  | 'appointments'
  | 'reputation'
  | 'sales-pipeline'
  | 'payments'
  | 'reactivation'
  | 'forms'
  | 'onboarding'
  | 'showcase'
  | 'custom'
  | (string & {});

/** Matches the runtime `Workflow.status` plus forward-looking lifecycle states. */
export type WorkflowStatus = 'draft' | 'published' | 'paused' | 'needs-review' | 'archived';

/* -- Node kinds -- */

/**
 * The four node shapes the CURRENT builder canvas knows how to draw. The
 * builder keys exhaustive `Record<WorkflowRenderKind, ...>` style maps on this,
 * so adding members here is a breaking change - don't, unless the canvas grows
 * a genuinely new visual primitive.
 */
export type WorkflowRenderKind = 'trigger' | 'action' | 'condition' | 'wait';

/**
 * Broad semantic grouping for the next-generation builder + catalog. A node's
 * `kind` answers "what family of step is this?" independent of how it is drawn.
 * Several of these (communication, internal, payment, webhook, ai) all render
 * as an `action` card today but deserve their own category in a deeper builder.
 */
export type WorkflowNodeKind =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'wait'
  | 'internal'
  | 'communication'
  | 'payment'
  | 'webhook'
  | 'ai';

/** Frozen lists so editors/UIs can iterate the unions at runtime. */
export const WORKFLOW_RENDER_KINDS = ['trigger', 'action', 'condition', 'wait'] as const;
export const WORKFLOW_NODE_KINDS = [
  'trigger', 'action', 'condition', 'wait',
  'internal', 'communication', 'payment', 'webhook', 'ai',
] as const;

/** Maps a broad semantic `kind` down to the render shape the canvas uses. */
export function renderKindFor(kind: WorkflowNodeKind): WorkflowRenderKind {
  switch (kind) {
    case 'trigger':
      return 'trigger';
    case 'condition':
      return 'condition';
    case 'wait':
      return 'wait';
    default:
      // action / internal / communication / payment / webhook / ai all draw
      // as an action card in the current builder.
      return 'action';
  }
}

export const isRenderKind = (v: string): v is WorkflowRenderKind =>
  (WORKFLOW_RENDER_KINDS as readonly string[]).includes(v);

/* -- Picker catalog items -- */

export type CatalogItemKind = 'trigger' | 'action';

/**
 * A single Add-Trigger / Add-Action picker entry. Structurally compatible with
 * the existing `automationData.CatalogItem` (which carries a `LucideIcon` in
 * `icon`); here `icon` is widened to `unknown` so this module stays free of a
 * `lucide-react` dependency. Import the concrete picker type from
 * `automationData.ts` when you need the icon component itself.
 */
export interface CatalogItem {
  id: string;
  label: string;
  /** Short category tag shown under the item name (e.g. "Communication"). */
  category?: string;
  /** One-line "what this does" explanation. */
  desc?: string;
  /** Example use case shown in the picker. */
  example?: string;
  /** Trigger vs action - optional so existing icon-bearing items stay assignable. */
  kind?: CatalogItemKind;
  /** Icon component (kept opaque here to avoid a lucide dependency). */
  icon?: unknown;
  /** Flags catalog items that belong to a premium / paid tier. */
  premium?: boolean;
}

export interface TriggerItem extends CatalogItem {
  kind?: 'trigger';
}

export interface ActionItem extends CatalogItem {
  kind?: 'action';
}

/* -- Per-node configuration -- */

export type WorkflowNodeConfigValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | WorkflowNodeConfig;

/**
 * Free-form, JSON-serialisable settings bag for a node (channel, template id,
 * wait duration, filter rules, ...). Intentionally permissive: the deeper builder
 * will narrow this per node `type` with discriminated configs later.
 */
export interface WorkflowNodeConfig {
  [key: string]: WorkflowNodeConfigValue | undefined;
}

/* -- Branch / condition model -- */

export type WorkflowBranchLane = 'yes' | 'no' | 'else';

/**
 * One lane out of a condition node. `nodes` is itself a list of `WorkflowNode`s,
 * and any of those nodes may carry its own `branches` - that recursion is how
 * the model supports nested branching.
 */
export interface WorkflowBranch {
  id: WorkflowBranchId;
  label: string;
  lane: WorkflowBranchLane;
  /** Human-readable condition for this lane (e.g. "Appointment = No-Show"). */
  condition?: string;
  /** Copy shown when this lane simply ends the workflow (no further steps). */
  terminal?: string;
  /** Steps taken when this lane is followed. May themselves branch (nesting). */
  nodes: WorkflowNode[];
}

/* -- Forward-looking node model (what Developer 6 migrates the canvas to) -- */

export interface WorkflowNode {
  id: WorkflowNodeId;
  /** Catalog subtype id, e.g. "send_sms", "if_else", "wait", "form_submitted". */
  type: string;
  /** Broad semantic family - see `WorkflowNodeKind`. */
  kind: WorkflowNodeKind;
  label: string;
  /** Short technical config line shown on the node card. */
  description?: string;
  /** Plain-language "what this step does" copy for the inspector. */
  note?: string;
  /** Example message body / settings detail for the inspector. */
  example?: string;
  /** Catalog icon id / lucide name (kept as a string so this module is icon-free). */
  icon?: string;
  /** Category tag mirrored from the catalog item. */
  category?: string;
  /** Structured settings for the step. */
  config?: WorkflowNodeConfig;
  /** Present on `condition` nodes; each entry is a YES / NO / ELSE lane. */
  branches?: WorkflowBranch[];
}

/** A trigger is just a node whose `kind` is `'trigger'`. */
export type WorkflowTrigger = WorkflowNode & { kind: 'trigger' };

/* -- Bridge: the exact shape the CURRENT builder renders today -- */

/**
 * Display-only node consumed by WorkflowBuilder.tsx via `getNodesForWorkflow`.
 * `workflowNodes.ts` re-exports this so the builder and this module never drift.
 * Keep this identical to the historical interface - the builder depends on it.
 */
export interface WorkflowDisplayNode {
  id: string;
  type: WorkflowRenderKind;
  subtype: string;
  label: string;
  /** Short technical config line rendered on the node card. */
  config?: string;
  /** Plain-language explanation of what the step does (inspector). */
  note?: string;
  /** Example message text or detailed settings (inspector). */
  example?: string;
  /** Branch metadata for `condition` nodes - drives the YES / NO fork. */
  branch?: { yesLabel: string; noLabel: string; noTerminal: string };
}

/* -- Templates (showcase flows + starter chains) -- */

/**
 * A complete, multi-trigger workflow definition in the rich model. Unlike the
 * display map (which keys nodes by workflow id), a template carries its own
 * triggers and body so it can be cloned, previewed, or expanded by the deeper
 * builder. `nodes` is the main trunk after the trigger(s); branching lives
 * inside individual condition nodes via `WorkflowNode.branches`.
 */
export interface WorkflowTemplate {
  id: WorkflowTemplateId;
  name: string;
  description: string;
  category: WorkflowCategory;
  status?: WorkflowStatus;
  /** One or more entry points - the next builder renders these as trigger lanes. */
  triggers: WorkflowNode[];
  /** Main step trunk after the trigger(s). */
  nodes: WorkflowNode[];
  /** Marks the flagship "what the builder can do" demonstration flow. */
  showcase?: boolean;
}

/* -- AI starter chains -- */

/** Common AI-composer intents that map to a ready-made starter chain. */
export type StarterChainIntent =
  | 'missed-call-follow-up'
  | 'new-lead-nurture'
  | 'appointment-reminder'
  | 'quote-follow-up'
  | 'invoice-payment-reminder'
  | 'review-request'
  | 'reactivation-campaign'
  | 'no-show-recovery'
  | 'abandoned-form-follow-up'
  | (string & {});

/**
 * A starter chain is a template plus the AI-composer metadata used to surface
 * it: the intent it satisfies and example prompts that should resolve to it.
 */
export interface StarterChainTemplate extends WorkflowTemplate {
  intent: StarterChainIntent;
  /** Example natural-language prompts that should map to this chain. */
  promptExamples: string[];
}

/** Lightweight prompt -> template index for the AI composer to consume. */
export interface AiStarterPromptMapping {
  intent: StarterChainIntent;
  templateId: WorkflowTemplateId;
  promptExamples: string[];
  /** Lowercased keywords used for naive prompt matching. */
  keywords: string[];
}

/* -- Adapter / factory signatures (implemented in workflowNodes.ts) -- */

/** Builds a display node from a picked catalog item (used by the builder). */
export type WorkflowNodeFactory = (item: CatalogItem, kind: WorkflowRenderKind) => WorkflowDisplayNode;

/** Flattens a rich template into the display chain the current canvas renders. */
export type TemplateToDisplayNodes = (template: WorkflowTemplate) => WorkflowDisplayNode[];

/** Aggregate counts surfaced in the list / overview. */
export interface WorkflowNodeCounts {
  triggers: number;
  actions: number;
  conditions: number;
  waits: number;
  /** Total branch lanes across all condition nodes (YES / NO / ELSE). */
  branches: number;
  /** Total step count (everything except triggers). */
  steps: number;
}
