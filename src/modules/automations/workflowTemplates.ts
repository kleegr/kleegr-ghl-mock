/**
 * workflowTemplates.ts - the forward-looking rich workflow model for the
 * Automations builder: multiple triggers, nested branches, and structured
 * per-node config.
 *
 * Split out of workflowNodes.ts so each module stays focused - workflowNodes.ts
 * owns the flat display chains the CURRENT canvas renders; this file owns the
 * richer WorkflowTemplate model the NEXT builder (Developer 6) consumes, plus
 * the adapters/counters that bridge the two. One-way dependency: this module
 * imports the display data from ./workflowNodes, never the reverse.
 *
 * Demo-only: nothing here ever fires a real automation.
 */
import {
  renderKindFor,
  type WorkflowDisplayNode,
  type WorkflowNode,
  type WorkflowTemplate,
  type WorkflowNodeCounts,
  type WorkflowCategory,
  type WorkflowStatus,
  type WorkflowNodeKind as WorkflowSemanticKind,
} from './types';
import { WORKFLOW_NODES, getFallbackNodes } from './workflowNodes';

/* ==
 * RICH TEMPLATE MODEL (Developer 6 consumes this)
 * == */

/** Ids of workflows flagged as the flagship "what the builder can do" showcase. */
export const SHOWCASE_WORKFLOW_IDS: ReadonlySet<string> = new Set(['wf_6']);
export const isShowcaseWorkflow = (id: string): boolean => SHOWCASE_WORKFLOW_IDS.has(id);

/** Small constructor to keep the showcase template readable. */
function node(
  id: string,
  type: string,
  kind: WorkflowSemanticKind,
  label: string,
  extra: Partial<WorkflowNode> = {},
): WorkflowNode {
  return { id, type, kind, label, ...extra };
}

/**
 * Hand-authored showcase template - the full multi-trigger, dual-branch,
 * one-level-nested vision the deeper builder should be able to render. Demo-
 * safe and generic: no real business or customer data.
 */
const SHOWCASE_TEMPLATE: WorkflowTemplate = {
  id: 'wf_6',
  name: 'VIP Lead -> Consult -> Revenue Engine',
  description:
    'Flagship showcase: two triggers, an instant welcome, a consult check that branches, a full revenue path on YES, and a multi-step nurture drip with a nested re-engagement check on NO.',
  category: 'showcase',
  status: 'draft',
  showcase: true,
  triggers: [
    node('t1', 'form_submitted', 'trigger', 'Form Submitted - High-Intent', {
      description: 'Forms: "Book a Consult", "Pricing"',
      note: 'Starts when a high-intent lead submits a consult or pricing form.',
      icon: 'form_submitted',
      category: 'Events',
    }),
    node('t2', 'opportunity_created', 'trigger', 'Opportunity Created', {
      description: 'Pipeline: Sales (any new deal)',
      note: 'Also starts when a new opportunity is created in the Sales pipeline, so manually-added deals get the same treatment.',
      icon: 'opportunity_created',
      category: 'Opportunities',
    }),
  ],
  nodes: [
    node('s1', 'send_sms', 'communication', 'Instant SMS Welcome', {
      description: 'From business number - immediate',
      note: 'Texts the lead within seconds so they feel an immediate, human response.',
      example: 'Hi {{contact.first_name}}! Want to grab a consult time? {{custom_values.booking_link}}',
      config: { channel: 'sms', timing: 'immediate', from: 'business_number' },
    }),
    node('s2', 'send_email', 'communication', 'Send Welcome Email', {
      description: 'Template: VIP Welcome',
      note: 'Branded welcome with what to expect and a booking link.',
      config: { channel: 'email', template: 'vip_welcome' },
    }),
    node('s3', 'assign_user', 'action', 'Assign To Rep - Round-Robin', {
      description: 'Round-robin - Sales team',
      note: 'Gives the lead a real owner immediately.',
      config: { strategy: 'round_robin', team: 'sales' },
    }),
    node('s4', 'wait', 'wait', 'Wait 1 Hour', {
      description: '1 hour',
      note: 'Brief pause so the welcome lands before the internal alert.',
      config: { mode: 'duration', durationMinutes: 60 },
    }),
    node('s5', 'send_notification', 'internal', 'Notify Assigned Rep', {
      description: 'In-app + Slack',
      note: 'Alerts the assigned rep internally so a human can personally reach out.',
      config: { channels: ['in_app', 'slack'] },
    }),
    node('c1', 'if_else', 'condition', 'Booked a Consult?', {
      description: 'Appointment booked within 24h?',
      note: 'Branches on whether the lead booked a consult.',
      example: 'If an appointment is booked within 24h -> YES; otherwise -> NO.',
      config: { field: 'appointment.status', operator: 'is', value: 'booked', windowHours: 24 },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Booked',
          lane: 'yes',
          condition: 'Appointment booked within 24 hours',
          nodes: [
            node('y1', 'move_opportunity', 'action', "Move to 'Consult Booked'", {
              description: 'Sales -> Consult Booked',
              note: 'Advances the deal so the pipeline reflects reality.',
              config: { pipeline: 'sales', stage: 'consult_booked' },
            }),
            node('y2', 'create_task', 'action', 'Create Prep Task', {
              description: 'Due before consult - owner',
              note: 'Prep task for the rep ahead of the consult.',
              config: { dueOffset: '-1h', assignee: 'opportunity_owner' },
            }),
            node('y3', 'wait', 'wait', 'Wait Until 1h After Consult', {
              description: 'Until appt end + 1 hour',
              note: 'Waits until just after the consult to follow up while it is fresh.',
              config: { mode: 'until', anchor: 'appointment_end', offsetMinutes: 60 },
            }),
            node('y4', 'request_review', 'communication', 'Request Google Review (SMS)', {
              description: 'Google review link',
              note: 'Asks the happy customer for a Google review.',
              config: { channel: 'sms', target: 'google' },
            }),
            node('y5', 'send_invoice', 'payment', 'Send Invoice', {
              description: 'Invoice: Consult Package',
              note: 'Sends a HighLevel invoice (demo-only - no real charge).',
              config: { template: 'consult_package', dueDays: 7 },
            }),
            node('y6', 'ai_prompt', 'ai', 'AI - Draft Personalized Recap', {
              description: 'AI Prompt - recap + next steps',
              note: 'Drafts a personalized recap for the rep to review (human approves before sending).',
              config: { prompt: 'Summarize consult notes and propose 3 next steps', mode: 'draft' },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Not booked',
          lane: 'no',
          condition: 'No appointment within 24 hours',
          nodes: [
            node('no1', 'wait', 'wait', 'Wait 1 Day', {
              description: '1 day',
              note: 'Gives the lead a day before the nurture nudge.',
              config: { mode: 'duration', durationMinutes: 1440 },
            }),
            node('no2', 'send_sms', 'communication', 'Nurture SMS - Offer Booking Link', {
              description: 'Booking link nudge',
              note: 'Gently re-offers a consult time.',
              example: 'Still thinking it over, {{contact.first_name}}? Here is an easy time to chat: {{custom_values.booking_link}}',
              config: { channel: 'sms' },
            }),
            node('no3', 'add_tag', 'action', 'Tag: nurture-active', {
              description: 'Tag: nurture-active',
              note: 'Tags the contact so the long-term nurture list can pick them up.',
              config: { tag: 'nurture-active' },
            }),
            node('no4', 'if_else', 'condition', 'Replied or Clicked?', {
              description: 'Engaged with the nurture nudge?',
              note: 'Nested branch - re-engages contacts who reply or click, and lets the rest fall to the long-term newsletter.',
              config: { anyOf: ['replied', 'link_clicked'] },
              branches: [
                {
                  id: 'no4_yes',
                  label: 'Yes - Engaged',
                  lane: 'yes',
                  condition: 'Replied or clicked the link',
                  nodes: [
                    node('ny1', 'move_opportunity', 'action', "Move to 'Re-Engaged'", {
                      description: 'Sales -> Re-Engaged',
                      note: 'Flags the deal as warm again.',
                      config: { pipeline: 'sales', stage: 're_engaged' },
                    }),
                    node('ny2', 'send_notification', 'internal', 'Notify Rep - Hot Again', {
                      description: 'In-app',
                      note: 'Tells the rep this contact re-engaged.',
                      config: { channels: ['in_app'] },
                    }),
                  ],
                },
                {
                  id: 'no4_no',
                  label: 'No - Quiet',
                  lane: 'no',
                  condition: 'No engagement',
                  terminal: 'End - contact moves to the long-term newsletter.',
                  nodes: [
                    node('nn1', 'wait', 'wait', 'Wait 3 Days', {
                      description: '3 days',
                      note: 'Final spacing before the last touch.',
                      config: { mode: 'duration', durationMinutes: 4320 },
                    }),
                    node('nn2', 'send_email', 'communication', 'Final Nurture Email', {
                      description: 'Template: Stay In Touch',
                      note: 'Last touch before handing off to the newsletter.',
                      config: { channel: 'email', template: 'stay_in_touch' },
                    }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
};

/** Metadata used when deriving rich templates from the flat display chains. */
const DERIVED_META: Record<string, { name: string; description: string; category: WorkflowCategory; status: WorkflowStatus }> = {
  wf_1: { name: 'New Lead Speed-to-Lead', description: 'Instantly follows up with a new lead by SMS and email, assigns a rep, creates a task, and opens the deal.', category: 'speed-to-lead', status: 'published' },
  wf_2: { name: 'Missed Call Text-Back', description: 'Texts back missed inbound callers, notifies the rep, and tags the contact for win-back.', category: 'speed-to-lead', status: 'published' },
  wf_3: { name: 'Appointment Reminder + No-Show Recovery', description: 'Reminds contacts before their appointment, then recovers no-shows automatically.', category: 'appointments', status: 'published' },
  wf_4: { name: 'Review Request After Completed Appointment', description: 'Asks happy clients for a Google review after a completed appointment.', category: 'reputation', status: 'published' },
  wf_5: { name: 'Pipeline Stage Follow-Up', description: 'Keeps deals moving when they enter the Follow-Up stage.', category: 'sales-pipeline', status: 'draft' },
};

/** Maps a display node's render `type` to a reasonable broad semantic kind. */
function semanticKindFor(dn: WorkflowDisplayNode): WorkflowSemanticKind {
  if (dn.type === 'trigger') return 'trigger';
  if (dn.type === 'condition') return 'condition';
  if (dn.type === 'wait') return 'wait';
  const COMMS = new Set(['send_sms', 'send_email', 'whatsapp', 'messenger', 'instagram_dm', 'request_review', 'call', 'voicemail']);
  const INTERNAL = new Set(['send_notification', 'slack', 'add_note', 'create_task']);
  const PAYMENT = new Set(['send_invoice', 'stripe_charge', 'send_documents']);
  const AI = new Set(['ai_prompt', 'ai_summarize', 'conversation_ai']);
  if (AI.has(dn.subtype)) return 'ai';
  if (PAYMENT.has(dn.subtype)) return 'payment';
  if (COMMS.has(dn.subtype)) return 'communication';
  if (INTERNAL.has(dn.subtype)) return 'internal';
  return 'action';
}

/** Converts a flat display node into a rich WorkflowNode. */
function displayToWorkflowNode(dn: WorkflowDisplayNode): WorkflowNode {
  return {
    id: dn.id,
    type: dn.subtype,
    kind: semanticKindFor(dn),
    label: dn.label,
    description: dn.config,
    note: dn.note,
    example: dn.example,
    icon: dn.subtype,
  };
}

/**
 * Derives a rich template from a flat display chain. The first condition (if
 * any) becomes a YES lane (the nodes after it) plus a NO terminal lane - mirror
 * of how the current builder renders. Multi-trigger / nested-branch flows are
 * hand-authored instead (see SHOWCASE_TEMPLATE).
 */
export function displayNodesToTemplate(
  id: string,
  displayNodes: WorkflowDisplayNode[],
  meta?: Partial<{ name: string; description: string; category: WorkflowCategory; status: WorkflowStatus }>,
): WorkflowTemplate {
  const triggers = displayNodes.filter((n) => n.type === 'trigger').map(displayToWorkflowNode);
  const rest = displayNodes.filter((n) => n.type !== 'trigger');
  const condIdx = rest.findIndex((n) => n.type === 'condition');

  let nodes: WorkflowNode[];
  if (condIdx === -1) {
    nodes = rest.map(displayToWorkflowNode);
  } else {
    const pre = rest.slice(0, condIdx).map(displayToWorkflowNode);
    const condDn = rest[condIdx];
    const post = rest.slice(condIdx + 1).map(displayToWorkflowNode);
    const cond = displayToWorkflowNode(condDn);
    const b = condDn.branch;
    cond.branches = [
      {
        id: `${cond.id}_yes`,
        label: b?.yesLabel ?? 'Yes',
        lane: 'yes',
        nodes: post,
      },
      {
        id: `${cond.id}_no`,
        label: b?.noLabel ?? 'No',
        lane: 'no',
        terminal: b?.noTerminal ?? 'End - contact exits the workflow',
        nodes: [],
      },
    ];
    nodes = [...pre, cond];
  }

  return {
    id,
    name: meta?.name ?? id,
    description: meta?.description ?? '',
    category: meta?.category ?? 'custom',
    status: meta?.status ?? 'draft',
    triggers,
    nodes,
    showcase: isShowcaseWorkflow(id),
  };
}

/** workflow id -> rich template. Showcase is hand-authored; others are derived. */
export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = (() => {
  const out: Record<string, WorkflowTemplate> = {};
  for (const [id, dnodes] of Object.entries(WORKFLOW_NODES)) {
    out[id] = id === 'wf_6'
      ? SHOWCASE_TEMPLATE
      : displayNodesToTemplate(id, dnodes, DERIVED_META[id]);
  }
  return out;
})();

/** Returns the rich template for a workflow id (deriving from display data,
 * or from a fallback chain when the id is unknown). */
export function getWorkflowTemplate(workflowId: string, trigger = ''): WorkflowTemplate {
  return (
    WORKFLOW_TEMPLATES[workflowId] ??
    displayNodesToTemplate(workflowId, getFallbackNodes(workflowId, trigger), {
      name: workflowId,
      description: '',
      category: 'custom',
      status: 'draft',
    })
  );
}

/* -- Template -> display adapter (for the deeper builder / previews) -- */

/**
 * Flattens a rich template back into the flat display chain today's builder
 * renders: single trigger summary, the trunk, the first condition's YES lane
 * inline, and the NO lane collapsed to its terminal copy.
 */
export function toDisplayNodes(template: WorkflowTemplate): WorkflowDisplayNode[] {
  const out: WorkflowDisplayNode[] = [];

  // Collapse one or more triggers into a single representative trigger card.
  const t0 = template.triggers[0];
  if (t0) {
    const multi = template.triggers.length > 1;
    out.push({
      id: t0.id,
      type: 'trigger',
      subtype: t0.type,
      label: multi ? `Multiple Triggers (${template.triggers.length})` : t0.label,
      config: multi ? template.triggers.map((t) => t.label).join(' - ') : t0.description,
      note: t0.note,
      example: t0.example,
    });
  }

  const toCard = (n: WorkflowNode): WorkflowDisplayNode => ({
    id: n.id,
    type: renderKindFor(n.kind),
    subtype: n.type,
    label: n.label,
    config: n.description,
    note: n.note,
    example: n.example,
  });

  for (const n of template.nodes) {
    if (n.branches && n.branches.length) {
      const yes = n.branches.find((b) => b.lane === 'yes');
      const no = n.branches.find((b) => b.lane === 'no');
      out.push({
        ...toCard(n),
        branch: {
          yesLabel: yes?.label ?? 'Yes',
          noLabel: no?.label ?? 'No',
          noTerminal: no?.terminal ?? (no?.nodes.length ? `${no.label} -> ${no.nodes.length} step(s)` : 'End - contact exits the workflow'),
        },
      });
      // Inline the YES lane (today's builder renders post-condition nodes as YES).
      for (const yn of yes?.nodes ?? []) out.push(toCard(yn));
    } else {
      out.push(toCard(n));
    }
  }
  return out;
}

/* -- Counts (surfaced in the list / overview) -- */

function tallyNodes(nodes: WorkflowNode[], acc: WorkflowNodeCounts): void {
  for (const n of nodes) {
    const rk = renderKindFor(n.kind);
    if (rk === 'condition') {
      acc.conditions += 1;
      acc.steps += 1;
      if (n.branches) {
        acc.branches += n.branches.length;
        for (const b of n.branches) tallyNodes(b.nodes, acc);
      }
    } else if (rk === 'wait') {
      acc.waits += 1;
      acc.steps += 1;
    } else if (rk === 'trigger') {
      acc.triggers += 1;
    } else {
      acc.actions += 1;
      acc.steps += 1;
    }
  }
}

/** Aggregate node counts for a rich template (walks nested branches). */
export function countTemplateNodes(template: WorkflowTemplate): WorkflowNodeCounts {
  const acc: WorkflowNodeCounts = { triggers: 0, actions: 0, conditions: 0, waits: 0, branches: 0, steps: 0 };
  acc.triggers += template.triggers.length;
  tallyNodes(template.nodes, acc);
  return acc;
}

/** Convenience: counts for a workflow id (used by the list / overview). */
export function workflowNodeCounts(workflowId: string, trigger = ''): WorkflowNodeCounts {
  return countTemplateNodes(getWorkflowTemplate(workflowId, trigger));
}

