/**
 * workflowNodes.ts — local display-only node data for the Automations builder.
 *
 * These nodes are NEVER stored in the global store. They exist purely as
 * a demo-mode visual representation of each workflow's trigger + action chain.
 * No real automation logic, no real API calls.
 */

export type WorkflowNodeKind = 'trigger' | 'action' | 'condition' | 'wait';

export interface WorkflowDisplayNode {
  id: string;
  type: WorkflowNodeKind;
  subtype: string;
  label: string;
  config?: string;
  icon?: string;
}

/** Maps workflow ID → ordered list of display nodes. */
export const WORKFLOW_NODES: Record<string, WorkflowDisplayNode[]> = {
  wf_1: [
    { id: 'n1', type: 'trigger', subtype: 'form_submitted', label: 'Form Submitted', config: 'Any contact form on the site.' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS', config: 'Thanks for reaching out! We will call you shortly.' },
    { id: 'n3', type: 'action', subtype: 'send_email', label: 'Send Email', config: 'Subject: We received your request! Body: Hi {{first_name}}, our team will be in touch within the hour.' },
    { id: 'n4', type: 'action', subtype: 'create_task', label: 'Create Task', config: 'Owner notified to follow up within 1 hour.' },
    { id: 'n5', type: 'action', subtype: 'add_tag', label: 'Add Tag', config: 'Tag: lead' },
  ],
  wf_2: [
    { id: 'n1', type: 'trigger', subtype: 'missed_call', label: 'Missed Call', config: 'Triggers on any missed inbound call.' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send SMS', config: 'Hey! We missed your call — we will ring you back shortly. Reply with a good time.' },
    { id: 'n3', type: 'action', subtype: 'create_task', label: 'Create Task', config: 'Call back this contact within 15 minutes.' },
  ],
  wf_3: [
    { id: 'n1', type: 'trigger', subtype: 'appointment_booked', label: 'Appointment Booked', config: 'Any new confirmed appointment.' },
    { id: 'n2', type: 'wait', subtype: 'wait_until', label: 'Wait', config: '24 hours before appointment start time.' },
    { id: 'n3', type: 'action', subtype: 'send_sms', label: 'Send SMS Reminder', config: 'Reminder: your appointment is tomorrow at {{appt_time}}. Reply C to confirm or R to reschedule.' },
    { id: 'n4', type: 'action', subtype: 'send_email', label: 'Send Email Reminder', config: 'Subject: Your appointment is tomorrow — see you soon!' },
    { id: 'n5', type: 'wait', subtype: 'wait_until', label: 'Wait', config: '1 hour before appointment start time.' },
    { id: 'n6', type: 'action', subtype: 'send_sms', label: 'Send Final Reminder SMS', config: 'Heads up — your appointment starts in 1 hour. See you soon!' },
  ],
  wf_4: [
    { id: 'n1', type: 'trigger', subtype: 'opportunity_won', label: 'Opportunity Won', config: 'Any pipeline, any stage moved to Won.' },
    { id: 'n2', type: 'wait', subtype: 'wait_duration', label: 'Wait 1 Day', config: '1 day after trigger.' },
    { id: 'n3', type: 'action', subtype: 'send_sms', label: 'Send Review Request SMS', config: 'Hi {{first_name}}! We hope everything is great. Would you mind leaving us a quick Google review? [link]' },
    { id: 'n4', type: 'action', subtype: 'send_email', label: 'Send Review Request Email', config: 'Subject: How did we do? Your review matters!' },
  ],
  wf_5: [
    { id: 'n1', type: 'trigger', subtype: 'tag_added', label: 'Tag Added: past-client', config: 'Contact tag "past-client" applied.' },
    { id: 'n2', type: 'action', subtype: 'send_email', label: 'Send Email — Day 1', config: 'Subject: We have been thinking about you!' },
    { id: 'n3', type: 'wait', subtype: 'wait_duration', label: 'Wait 3 Days', config: '3 days.' },
    { id: 'n4', type: 'action', subtype: 'send_sms', label: 'Send SMS — Day 4', config: 'Hey! Have not heard from you in a while. Got something special for you — want to hear it?' },
    { id: 'n5', type: 'wait', subtype: 'wait_duration', label: 'Wait 4 Days', config: '4 days.' },
    { id: 'n6', type: 'action', subtype: 'send_email', label: 'Final Email — Day 8', config: 'Subject: Last chance — your exclusive offer expires soon.' },
  ],
  wf_6: [
    { id: 'n1', type: 'trigger', subtype: 'birthday', label: 'Birthday', config: 'On contact birthday (date custom field).' },
    { id: 'n2', type: 'action', subtype: 'send_sms', label: 'Send Birthday SMS', config: '🎂 Happy Birthday {{first_name}}! Hope your day is wonderful. Here is a little gift from us: BDAY20 for 20% off.' },
  ],
  wf_7: [
    { id: 'n1', type: 'trigger', subtype: 'booking_started', label: 'Booking Started', config: 'Contact started but did not complete the booking flow.' },
    { id: 'n2', type: 'wait', subtype: 'wait_duration', label: 'Wait 30 Minutes', config: '30 minutes.' },
    { id: 'n3', type: 'condition', subtype: 'check_appointment', label: 'Has Appointment?', config: 'Branch: Yes → exit. No → continue.' },
    { id: 'n4', type: 'action', subtype: 'send_sms', label: 'Send Nudge SMS', config: 'Looks like you did not finish booking — want us to grab a spot for you? [link]' },
  ],
  wf_8: [
    { id: 'n1', type: 'trigger', subtype: 'tag_added', label: 'Tag Added: new-client', config: 'Contact tag "new-client" applied.' },
    { id: 'n2', type: 'action', subtype: 'send_email', label: 'Welcome Email', config: 'Subject: Welcome to the family, {{first_name}}!' },
    { id: 'n3', type: 'wait', subtype: 'wait_duration', label: 'Wait 1 Day', config: '1 day.' },
    { id: 'n4', type: 'action', subtype: 'send_sms', label: 'Day 2 SMS', config: 'Hi {{first_name}}! Quick check-in — everything going smoothly? Let us know if you need anything.' },
    { id: 'n5', type: 'wait', subtype: 'wait_duration', label: 'Wait 2 Days', config: '2 days.' },
    { id: 'n6', type: 'action', subtype: 'create_task', label: 'Create Onboarding Task', config: 'Schedule onboarding call if not yet completed.' },
    { id: 'n7', type: 'action', subtype: 'send_email', label: 'Day 4 Tips Email', config: 'Subject: 3 tips to get the most out of your new plan.' },
  ],
};

/** Fallback nodes for any workflow not in WORKFLOW_NODES. */
export function getFallbackNodes(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return [
    { id: `${workflowId}_n1`, type: 'trigger', subtype: 'generic_trigger', label: trigger, config: 'Workflow starts when this trigger fires.' },
    { id: `${workflowId}_n2`, type: 'action', subtype: 'send_sms', label: 'Send SMS', config: 'Automated SMS to contact.' },
    { id: `${workflowId}_n3`, type: 'action', subtype: 'create_task', label: 'Create Task', config: 'Internal follow-up task created.' },
  ];
}

export function getNodesForWorkflow(workflowId: string, trigger: string): WorkflowDisplayNode[] {
  return WORKFLOW_NODES[workflowId] ?? getFallbackNodes(workflowId, trigger);
}
