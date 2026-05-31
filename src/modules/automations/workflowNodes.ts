/**
 * workflowNodes.ts — local display-only node data for the Automations builder.
 *
 * These nodes are NEVER stored in the global store. They exist purely as a
 * demo-mode visual representation of each workflow's trigger + action chain.
 * No real automation logic, no real API calls.
 *
 * Each node carries three layers of copy so the builder reads like the real
 * GoHighLevel canvas AND teaches a first-time demo visitor:
 *   • config  — the short technical setting shown on the node card
 *   • note    — plain-language "what this step does" (shown in the inspector)
 *   • example — example message body / settings detail (shown in the inspector)
 */

export type WorkflowNodeKind = 'trigger' | 'action' | 'condition' | 'wait';

export interface WorkflowDisplayNode {
  id: string;
  type: WorkflowNodeKind;
  subtype: string;
  label: string;
  /** Short technical config line rendered on the node card. */
  config?: string;
  /** Plain-language explanation of what the step does (inspector). */
  note?: string;
  /** Example message text or detailed settings (inspector). */
  example?: string;
  /** Branch metadata for `condition` nodes — drives the YES / NO fork rendered
   *  on the builder canvas. Absent on non-branching nodes. */
  branch?: { yesLabel: string; noLabel: string; noTerminal: string };
}

/** Maps workflow ID → ordered list of display nodes (trigger first). */
export const WORKFLOW_NODES: Record<string, WorkflowDisplayNode[]> = {
  /* 1 ─ New Lead Speed-to-Lead ─────────────────────────────────────────── */
  wf_1: [
    {
      id: 'n1', type: 'trigger', subtype: 'form_submitted', label: 'Form Submitted',
      config: 'Forms: "Contact Us", "Free Quote"',
      note: 'Starts the workflow the instant a contact submits a lead form on your website or a landing page.',
      example: 'Filter — Form is one of: Contact Us, Free Quote. New contacts are created automatically.',
    },
    {
      id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS',
      config: 'From business number · immediate',
      note: 'Immediately texts the lead from your business number so they hear back within seconds — speed-to-lead wins deals.',
      example: 'Hi {{contact.first_name}}, thanks for reaching out to {{location.name}}! A team member will call you shortly. Reply here anytime.',
    },
    {
      id: 'n3', type: 'action', subtype: 'send_email', label: 'Send Email',
      config: 'Template: New Lead Welcome',
      note: 'Sends a branded confirmation email so the lead knows their request was received.',
      example: 'Subject: We got your request 🎉 — Body: Hi {{contact.first_name}}, we will be in touch within the hour. Here is what to expect…',
    },
    {
      id: 'n4', type: 'action', subtype: 'assign_user', label: 'Assign To User',
      config: 'Round-robin · Sales team',
      note: 'Routes the lead to a sales rep using round-robin so a real person owns the follow-up.',
      example: 'Assignment: Round-robin across the Sales team (skips users who are out of office).',
    },
    {
      id: 'n5', type: 'action', subtype: 'create_task', label: 'Create Task',
      config: 'Due in 1 hour · lead owner',
      note: 'Creates a "Call new lead" task for the assigned rep, due within the hour.',
      example: 'Title: Call new lead — {{contact.first_name}} · Due: 1 hour from now · Assigned to: lead owner.',
    },
    {
      id: 'n6', type: 'action', subtype: 'move_opportunity', label: 'Create Opportunity',
      config: 'Sales → New Lead',
      note: 'Adds the lead to the Sales pipeline in the "New Lead" stage so the deal is tracked from day one.',
      example: 'Pipeline: Sales · Stage: New Lead · Lead value: copied from the form.',
    },
  ],

  /* 2 ─ Missed Call Text-Back ──────────────────────────────────────────── */
  wf_2: [
    {
      id: 'n1', type: 'trigger', subtype: 'missed_call', label: 'Missed Call',
      config: 'Inbound · No-answer / Busy',
      note: 'Fires when an inbound call is missed — no answer, busy, or cancelled — so a hot lead never slips away.',
      example: 'Filter — Call direction: Inbound · Call status: No-answer, Busy, or Cancelled.',
    },
    {
      id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS (Text-Back)',
      config: 'Immediate auto-reply',
      note: 'Instantly texts the caller back so the lead feels acknowledged and stays engaged. SMS has a ~98% open rate.',
      example: 'Sorry we missed your call! How can we help? Reply here or grab a time: {{custom_values.booking_link}}',
    },
    {
      id: 'n3', type: 'action', subtype: 'send_notification', label: 'Notify Assigned User',
      config: 'In-app + Email',
      note: 'Alerts the assigned rep in-app and by email so they can return the call quickly.',
      example: 'Notification: "Missed call from {{contact.first_name}} ({{contact.phone}}) — call back ASAP."',
    },
    {
      id: 'n4', type: 'action', subtype: 'create_task', label: 'Create Task',
      config: 'Due in 15 minutes',
      note: 'Creates a "Call back" task due in 15 minutes so the follow-up has an owner and a deadline.',
      example: 'Title: Call back — {{contact.first_name}} · Due: 15 minutes · Priority: High.',
    },
    {
      id: 'n5', type: 'action', subtype: 'add_tag', label: 'Add Tag',
      config: 'Tag: missed-call',
      note: 'Tags the contact "missed-call" so missed callers can be segmented and reported on later.',
      example: 'Adds tag: missed-call (used by reporting + the win-back smart list).',
    },
  ],

  /* 3 ─ Appointment Reminder + No-Show Recovery ────────────────────────── */
  wf_3: [
    {
      id: 'n1', type: 'trigger', subtype: 'appointment_status', label: 'Appointment Status Changed',
      config: 'Booked · Confirmed · No-Show',
      note: 'Starts when an appointment is booked or its status changes, so reminders and recovery run on autopilot.',
      example: 'Filter — Calendar: any · Status is one of: Booked, Confirmed, No-Show.',
    },
    {
      id: 'n2', type: 'wait', subtype: 'wait_until', label: 'Wait — 24h Before',
      config: 'Until 24 hours before appt',
      note: 'Pauses the workflow until 24 hours before the appointment start time.',
      example: 'Wait until: appointment start time − 24 hours (respects the contact timezone).',
    },
    {
      id: 'n3', type: 'action', subtype: 'send_sms', label: 'Send SMS Reminder',
      config: 'Day-before reminder',
      note: 'Sends the day-before reminder with simple confirm / reschedule options to cut no-shows.',
      example: 'Reminder: your appointment with {{location.name}} is tomorrow at {{appointment.start_time}}. Reply C to confirm or R to reschedule.',
    },
    {
      id: 'n4', type: 'wait', subtype: 'wait_until', label: 'Wait — 1h Before',
      config: 'Until 1 hour before appt',
      note: 'Waits again until 1 hour before the appointment so the contact gets a final heads-up.',
      example: 'Wait until: appointment start time − 1 hour.',
    },
    {
      id: 'n5', type: 'action', subtype: 'send_sms', label: 'Send Final Reminder',
      config: 'One-hour nudge',
      note: 'Last nudge an hour out to maximise the show rate.',
      example: 'See you in an hour! Your appointment is at {{appointment.start_time}}. Need directions? {{custom_values.map_link}}',
    },
    {
      id: 'n6', type: 'condition', subtype: 'if_else', label: 'If / Else — No-Show?',
      config: 'Status = No-Show → continue',
      note: 'Branches on the appointment status — only contacts marked No-Show continue down the recovery path; everyone else exits.',
      example: 'If Appointment status = No-Show → take the YES branch. Otherwise → end the workflow.',
      branch: { yesLabel: 'Yes · No-Show', noLabel: 'No · Showed', noTerminal: 'End — contact exits the workflow' },
    },
    {
      id: 'n7', type: 'action', subtype: 'send_sms', label: 'No-Show Follow-Up',
      config: 'Rebooking message',
      note: 'Sends a friendly rebooking message to contacts who missed their appointment.',
      example: 'Sorry we missed you today! Want to grab a new time? Book here: {{custom_values.booking_link}}',
    },
    {
      id: 'n8', type: 'action', subtype: 'move_opportunity', label: 'Move Opportunity',
      config: 'Stage: No-Show / Re-engage',
      note: 'Moves the deal to the "No-Show / Re-engage" stage so the opportunity is not forgotten.',
      example: 'Pipeline: Sales · Stage: No-Show / Re-engage.',
    },
  ],

  /* 4 ─ Review Request After Appointment ───────────────────────────────── */
  wf_4: [
    {
      id: 'n1', type: 'trigger', subtype: 'appointment_status', label: 'Appointment Status = Showed',
      config: 'Status: Showed / Completed',
      note: 'Starts only when an appointment is marked Showed / Completed — so you only ask happy, served customers.',
      example: 'Filter — Appointment status is: Showed (Completed).',
    },
    {
      id: 'n2', type: 'wait', subtype: 'wait_duration', label: 'Wait 1 Hour',
      config: '1 hour',
      note: 'Gives the visit a moment to settle, then reaches out while the experience is still fresh.',
      example: 'Wait: 1 hour after the appointment is completed.',
    },
    {
      id: 'n3', type: 'action', subtype: 'request_review', label: 'Request Review (SMS)',
      config: 'Google review link',
      note: 'Texts a direct Google review link to capture reviews from your happiest customers.',
      example: 'Thanks for coming in today! If you had a great experience, a quick review means the world: {{custom_values.review_link}}',
    },
    {
      id: 'n4', type: 'action', subtype: 'send_email', label: 'Send Email',
      config: 'Template: Review Request',
      note: 'Follows up by email with the same review link for contacts who prefer email.',
      example: 'Subject: How did we do? — Body: We loved having you, {{contact.first_name}}! Leave a quick review here…',
    },
    {
      id: 'n5', type: 'action', subtype: 'add_tag', label: 'Add Tag',
      config: 'Tag: review-requested',
      note: 'Tags the contact "review-requested" so they are never asked twice.',
      example: 'Adds tag: review-requested (excluded from future review campaigns).',
    },
  ],

  /* 5 ─ Pipeline Stage Follow-Up ───────────────────────────────────────── */
  wf_5: [
    {
      id: 'n1', type: 'trigger', subtype: 'opportunity_stage', label: 'Opportunity Stage Changed',
      config: 'Sales · Stage = Follow-Up',
      note: 'Fires when a deal moves into the "Follow-Up" stage of the Sales pipeline, so deals never stall.',
      example: 'Filter — Pipeline: Sales · Stage has changed to: Follow-Up.',
    },
    {
      id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send Message',
      config: 'Check-in text',
      note: 'Sends a check-in text to keep the conversation warm while the deal is open.',
      example: 'Hi {{contact.first_name}}, just following up on your quote — any questions I can answer?',
    },
    {
      id: 'n3', type: 'action', subtype: 'create_task', label: 'Create Follow-Up Task',
      config: 'Due today · opportunity owner',
      note: 'Creates a task for the deal owner to personally follow up.',
      example: 'Title: Follow up — {{opportunity.name}} · Due: today · Assigned to: opportunity owner.',
    },
    {
      id: 'n4', type: 'action', subtype: 'send_notification', label: 'Notify Owner',
      config: 'In-app',
      note: 'Alerts the deal owner that the opportunity has entered Follow-Up and needs attention.',
      example: 'Notification: "{{opportunity.name}} moved to Follow-Up — check in with the contact."',
    },
    {
      id: 'n5', type: 'wait', subtype: 'wait_duration', label: 'Wait 2 Days',
      config: '2 days',
      note: 'Gives the contact time to respond before the next touch.',
      example: 'Wait: 2 days (skips weekends if business hours are enabled).',
    },
    {
      id: 'n6', type: 'action', subtype: 'send_sms', label: 'Second Follow-Up',
      config: 'Second nudge',
      note: 'Sends a second, slightly different nudge if the deal is still sitting in Follow-Up.',
      example: 'Still thinking it over? Happy to hop on a quick call — what works for you this week?',
    },
  ],
};

/** Fallback nodes for any workflow not in WORKFLOW_NODES. */
export function getFallbackNodes(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return [
    {
      id: `${workflowId}_n1`, type: 'trigger', subtype: 'generic_trigger', label: trigger || 'Workflow Trigger',
      config: 'Starts the workflow',
      note: 'This trigger starts the workflow when the event above occurs.',
    },
    {
      id: `${workflowId}_n2`, type: 'action', subtype: 'send_sms', label: 'Send SMS',
      config: 'Automated text to contact',
      note: 'Sends an automated SMS to the contact.',
    },
    {
      id: `${workflowId}_n3`, type: 'action', subtype: 'create_task', label: 'Create Task',
      config: 'Internal follow-up task',
      note: 'Creates an internal follow-up task for the team.',
    },
  ];
}

export function getNodesForWorkflow(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return WORKFLOW_NODES[workflowId] ?? getFallbackNodes(workflowId, trigger);
}
