/**
 * workflowNodes.ts — local display-only node data for the Automations builder.
 *
 * These nodes are NEVER stored in the global store. They exist purely as a
 * demo-mode visual representation of each workflow's trigger + action chain.
 * No real automation logic, no real API calls.
 *
 * Scoped to the five flagship demo workflows (wf_1 … wf_5) so the builder
 * shows a small set of strong, realistic automations rather than dozens of
 * shallow ones. Each node carries:
 *   - `config` — the concrete detail (message body, timing, tag, stage)
 *   - `note`   — a plain-language "what this step does" explanation
 * so a first-time visitor understands every step on the canvas.
 */

export type WorkflowNodeKind = 'trigger' | 'action' | 'condition' | 'wait';

export interface WorkflowDisplayNode {
  id: string;
  type: WorkflowNodeKind;
  /** Catalog id (matches TRIGGER_GROUPS / ACTION_GROUPS) — drives the icon. */
  subtype: string;
  label: string;
  /** Concrete configuration detail (message text, delay, tag, stage…). */
  config?: string;
  /** Plain-language "what this step accomplishes" note, shown in step detail. */
  note?: string;
  icon?: string;
}

/** Maps workflow ID → ordered list of display nodes. */
export const WORKFLOW_NODES: Record<string, WorkflowDisplayNode[]> = {
  /* 1 — New Lead Speed-to-Lead ----------------------------------------- */
  wf_1: [
    { id: 'n1', type: 'trigger', subtype: 'form_submitted', label: 'Form Submitted', config: 'Any "Get a Free Quote" form on the website.', note: 'Starts the workflow the moment a new lead submits a form.' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS', config: '"Thanks {{contact.first_name}}! A specialist will call you in the next few minutes."', note: 'Texts the lead instantly so they hear from you first.' },
    { id: 'n3', type: 'action', subtype: 'send_email', label: 'Send Email', config: 'Subject: "We got your request — here is what happens next."', note: 'Sends a branded confirmation email with clear next steps.' },
    { id: 'n4', type: 'action', subtype: 'assign_user', label: 'Assign To User', config: 'Round-robin to the Sales team.', note: 'Routes the lead to an available rep so someone clearly owns it.' },
    { id: 'n5', type: 'action', subtype: 'create_task', label: 'Create Task', config: '"Call new lead" — due in 15 minutes, assigned to the owner.', note: 'Creates a fast follow-up call task so the lead is not forgotten.' },
    { id: 'n6', type: 'action', subtype: 'move_opportunity', label: 'Move Opportunity', config: 'Open a deal in the "New Lead" stage.', note: 'Adds the deal to the pipeline so it can be tracked to close.' },
  ],

  /* 2 — Missed Call Text Back ------------------------------------------ */
  wf_2: [
    { id: 'n1', type: 'trigger', subtype: 'missed_call', label: 'Missed Call', config: 'Any inbound call that is missed or goes to voicemail.', note: 'Starts whenever a caller could not be reached.' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS', config: '"Sorry we missed your call! Reply here and we will help right away."', note: 'Texts the caller back within seconds so the lead stays warm.' },
    { id: 'n3', type: 'action', subtype: 'send_notification', label: 'Notify Assigned User', config: 'In-app + email alert to the contact owner.', note: 'Tells the rep to return the call promptly.' },
    { id: 'n4', type: 'action', subtype: 'create_task', label: 'Create Task', config: '"Call back this contact" — due in 10 minutes.', note: 'Schedules the callback so it actually happens.' },
    { id: 'n5', type: 'action', subtype: 'add_tag', label: 'Add Tag', config: 'Tag: "missed-call".', note: 'Tags the contact for reporting and later segmentation.' },
  ],

  /* 3 — Appointment Reminder + No-Show Recovery ------------------------ */
  wf_3: [
    { id: 'n1', type: 'trigger', subtype: 'appointment_booked', label: 'Appointment Booked', config: 'Any new confirmed appointment on a booking calendar.', note: 'Starts as soon as a contact books a time.' },
    { id: 'n2', type: 'wait', subtype: 'wait_until', label: 'Wait Until 24h Before', config: 'Hold until 24 hours before the appointment start time.', note: 'Pauses so the reminder lands the day before, not too early.' },
    { id: 'n3', type: 'action', subtype: 'send_sms', label: 'Send SMS Reminder', config: '"Reminder: your appointment is tomorrow at {{appointment.time}}. Reply C to confirm."', note: 'Reminds the contact by text 24 hours out.' },
    { id: 'n4', type: 'action', subtype: 'send_email', label: 'Send Email Reminder', config: 'Subject: "Your appointment is tomorrow — see you soon!"', note: 'Backs up the SMS with an email reminder.' },
    { id: 'n5', type: 'condition', subtype: 'check_no_show', label: 'If Appointment = No-Show', config: 'Branch when the appointment status becomes "No-Show".', note: 'Splits the flow so only no-shows get the recovery steps.' },
    { id: 'n6', type: 'action', subtype: 'send_sms', label: 'Send No-Show Follow-Up', config: '"Sorry we missed you today! Tap here to grab a new time."', note: 'Re-engages no-shows with an easy rebooking link.' },
    { id: 'n7', type: 'action', subtype: 'move_opportunity', label: 'Move Opportunity', config: 'Move the deal to the "No-Show / Re-engage" stage.', note: 'Flags the deal so the team can actively recover it.' },
  ],

  /* 4 — Review Request After Completed Appointment --------------------- */
  wf_4: [
    { id: 'n1', type: 'trigger', subtype: 'appointment_status', label: 'Appointment Completed', config: 'Appointment status changes to "Showed / Completed".', note: 'Starts right after a successful, completed visit.' },
    { id: 'n2', type: 'wait', subtype: 'wait_duration', label: 'Wait 1 Hour', config: 'Wait 1 hour after the appointment completes.', note: 'Gives the client a moment before asking for feedback.' },
    { id: 'n3', type: 'action', subtype: 'request_review', label: 'Send Review Request SMS', config: '"Thanks for visiting! Mind leaving us a quick Google review? {{review.link}}"', note: 'Asks happy clients for a review by text while it is fresh.' },
    { id: 'n4', type: 'action', subtype: 'send_email', label: 'Send Review Request Email', config: 'Subject: "How did we do? Your review means a lot."', note: 'Follows up with an email review request and link.' },
    { id: 'n5', type: 'action', subtype: 'add_tag', label: 'Add Tag', config: 'Tag: "review-requested".', note: 'Tags the contact so they are never asked twice.' },
  ],

  /* 5 — Pipeline Stage Follow-Up --------------------------------------- */
  wf_5: [
    { id: 'n1', type: 'trigger', subtype: 'opportunity_stage', label: 'Opportunity Stage Changed', config: 'A deal moves into the "Follow-Up" stage.', note: 'Starts when a deal clearly needs another touch.' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send Follow-Up Message', config: '"Hi {{contact.first_name}}, just checking in on your quote — any questions?"', note: 'Sends the first follow-up the moment the stage changes.' },
    { id: 'n3', type: 'action', subtype: 'create_task', label: 'Create Follow-Up Task', config: '"Personal follow-up" — due tomorrow, assigned to the deal owner.', note: 'Reminds the owner to reach out personally.' },
    { id: 'n4', type: 'action', subtype: 'send_notification', label: 'Notify Owner', config: 'In-app alert to the opportunity owner.', note: 'Lets the owner know the deal is waiting on them.' },
    { id: 'n5', type: 'wait', subtype: 'wait_duration', label: 'Wait 2 Days', config: 'Wait 2 days for a reply before the next touch.', note: 'Spaces the touches out so the follow-up is not pushy.' },
    { id: 'n6', type: 'action', subtype: 'send_email', label: 'Send Second Follow-Up', config: 'Subject: "Still here to help — want to move forward?"', note: 'Sends a softer second follow-up if the deal has gone quiet.' },
  ],
};

/** Fallback nodes for any workflow not in WORKFLOW_NODES (e.g. brand-new). */
export function getFallbackNodes(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return [
    { id: `${workflowId}_n1`, type: 'trigger', subtype: 'generic_trigger', label: trigger || 'Workflow Trigger', config: 'This event starts the workflow.', note: 'Every workflow begins with a single trigger.' },
    { id: `${workflowId}_n2`, type: 'action', subtype: 'send_sms', label: 'Send SMS', config: 'Automated text message to the contact.', note: 'A first action — reach out to the contact automatically.' },
    { id: `${workflowId}_n3`, type: 'action', subtype: 'create_task', label: 'Create Task', config: 'Internal follow-up task for the owner.', note: 'Make sure a human follows up where it matters.' },
  ];
}

export function getNodesForWorkflow(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return WORKFLOW_NODES[workflowId] ?? getFallbackNodes(workflowId, trigger);
}
