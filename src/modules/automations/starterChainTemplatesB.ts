/**
 * starterChainTemplatesB.ts - starter-chain templates (part 2 of 2) for the AI
 * composer: review request, reactivation campaign, no-show recovery, and
 * abandoned-form follow-up.
 *
 * Split out of aiStarterChains.ts purely to keep each module a comfortable size.
 * aiStarterChains.ts imports these, assembles the registry, and owns the
 * prompt -> chain resolver. Demo-only: nothing here fires a real automation.
 */
import type { StarterChainTemplate, WorkflowNode } from './types';
import type { WorkflowNodeKind } from './types';

/* Small constructor mirroring the one in workflowTemplates.ts - keeps the chain
   definitions below readable. */
function node(
  id: string,
  type: string,
  kind: WorkflowNodeKind,
  label: string,
  extra: Partial<WorkflowNode> = {},
): WorkflowNode {
  return { id, type, kind, label, ...extra };
}

/* -- 6. Review request -- */

export const reviewRequest: StarterChainTemplate = {
  id: 'sc_review_request',
  intent: 'review-request',
  name: 'Review Request After Win',
  description:
    'After a job is won or completed, wait a day, ask for a review, and follow up once if no review lands.',
  category: 'reputation',
  status: 'draft',
  promptExamples: [
    'Ask happy customers for a review',
    'Request Google reviews automatically',
    'Review request workflow after a sale',
  ],
  triggers: [
    node('t1', 'opportunity_stage', 'trigger', 'Stage -> Won', {
      description: 'Pipeline: Sales - Won',
      note: 'Starts when a deal is marked Won.',
      icon: 'opportunity_stage',
      category: 'Opportunities',
    }),
    node('t2', 'appointment_status', 'trigger', 'Appointment Completed', {
      description: 'Status = Completed',
      note: 'Also starts after a completed appointment, for service businesses.',
      icon: 'appointment_status',
      category: 'Appointments',
    }),
  ],
  nodes: [
    node('a1', 'wait', 'wait', 'Wait 1 Day', {
      description: '1 day',
      note: 'Lets the experience settle before asking for feedback.',
      config: { mode: 'duration', durationMinutes: 1440 },
    }),
    node('a2', 'request_review', 'communication', 'Request Review (SMS)', {
      description: 'Google review link',
      note: 'Asks the happy customer for a review with a direct link.',
      example: "Thanks for choosing us, {{contact.first_name}}! Mind leaving a quick review? {{custom_values.review_link}}",
      config: { channel: 'sms', target: 'google' },
    }),
    node('a3', 'wait', 'wait', 'Wait 2 Days', {
      description: '2 days',
      note: 'Waits to see whether a review comes in.',
      config: { mode: 'duration', durationMinutes: 2880 },
    }),
    node('c1', 'if_else', 'condition', 'Left a Review?', {
      description: 'Review submitted?',
      note: 'Branches on whether the customer left a review.',
      config: { field: 'review.submitted', operator: 'is', value: true },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Reviewed',
          lane: 'yes',
          condition: 'Review submitted',
          terminal: 'End - thank-you handled separately.',
          nodes: [
            node('y1', 'add_tag', 'action', 'Tag: happy-customer', {
              description: 'Tag: happy-customer',
              note: 'Flags promoters for referrals and testimonials.',
              config: { tag: 'happy-customer' },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Pending',
          lane: 'no',
          condition: 'No review yet',
          nodes: [
            node('n1', 'send_email', 'communication', 'Gentle Review Reminder', {
              description: 'Template: Review Reminder',
              note: 'One soft reminder with the review link.',
              config: { channel: 'email', template: 'review_reminder' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 7. Reactivation campaign -- */

export const reactivationCampaign: StarterChainTemplate = {
  id: 'sc_reactivation',
  intent: 'reactivation-campaign',
  name: 'Cold-Lead Reactivation',
  description:
    'Re-engage dormant contacts with a we-miss-you message and an offer, then branch on whether they come back.',
  category: 'reactivation',
  status: 'draft',
  promptExamples: [
    'Win back cold leads',
    'Reactivate old contacts',
    'Re-engagement campaign for dormant leads',
  ],
  triggers: [
    node('t1', 'tag_added', 'trigger', 'Tagged "cold-lead"', {
      description: 'Tag added: cold-lead',
      note: 'Starts when a contact is tagged as a cold lead (manually or by a rule).',
      icon: 'add_tag',
      category: 'Contacts',
    }),
  ],
  nodes: [
    node('a1', 'send_email', 'communication', 'We Miss You Email', {
      description: 'Template: We Miss You',
      note: 'Re-opens the conversation with a warm, low-pressure note.',
      config: { channel: 'email', template: 'we_miss_you' },
    }),
    node('a2', 'wait', 'wait', 'Wait 3 Days', {
      description: '3 days',
      note: 'Gives the email time to land before the next touch.',
      config: { mode: 'duration', durationMinutes: 4320 },
    }),
    node('a3', 'send_sms', 'communication', 'Comeback Offer Text', {
      description: 'SMS - offer',
      note: 'A short text with a reason to come back.',
      example: "Hi {{contact.first_name}}, we'd love to help again - here's something for you: {{custom_values.offer_link}}",
      config: { channel: 'sms' },
    }),
    node('a4', 'wait', 'wait', 'Wait 2 Days', {
      description: '2 days',
      note: 'Final pause before checking re-engagement.',
      config: { mode: 'duration', durationMinutes: 2880 },
    }),
    node('c1', 'if_else', 'condition', 'Re-Engaged?', {
      description: 'Replied or clicked?',
      note: 'Branches on whether the dormant contact came back to life.',
      config: { anyOf: ['replied', 'link_clicked'] },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Back',
          lane: 'yes',
          condition: 'Replied or clicked',
          nodes: [
            node('y1', 'move_opportunity', 'action', "Move to 'Re-Engaged'", {
              description: 'Sales -> Re-Engaged',
              note: 'Reopens the deal so a rep can pick it up.',
              config: { pipeline: 'sales', stage: 're_engaged' },
            }),
            node('y2', 'send_notification', 'internal', 'Notify Rep - Reactivated', {
              description: 'In-app',
              note: 'Tells a rep this contact is warm again.',
              config: { channels: ['in_app'] },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Still Cold',
          lane: 'no',
          condition: 'No engagement',
          terminal: 'End - contact marked dormant.',
          nodes: [
            node('n1', 'add_tag', 'action', 'Tag: dormant', {
              description: 'Tag: dormant',
              note: 'Marks the contact dormant so future sends respect frequency limits.',
              config: { tag: 'dormant' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 8. No-show recovery -- */

export const noShowRecovery: StarterChainTemplate = {
  id: 'sc_no_show',
  intent: 'no-show-recovery',
  name: 'No-Show Recovery',
  description:
    'When someone misses an appointment, reach out, offer an easy rebook link, and branch on whether they rebook.',
  category: 'appointments',
  status: 'draft',
  promptExamples: [
    'Recover no-show appointments',
    'Follow up when someone misses an appointment',
    'No show rebooking workflow',
  ],
  triggers: [
    node('t1', 'appointment_status', 'trigger', 'Appointment No-Show', {
      description: 'Status = No-Show',
      note: 'Starts when an appointment is marked as a no-show.',
      icon: 'appointment_status',
      category: 'Appointments',
    }),
  ],
  nodes: [
    node('a1', 'send_sms', 'communication', 'Sorry We Missed You Text', {
      description: 'Immediate SMS',
      note: 'A friendly, non-judgmental note keeps the door open.',
      example: "We missed you today, {{contact.first_name}}! Want to grab another time? {{custom_values.booking_link}}",
      config: { channel: 'sms', timing: 'immediate' },
    }),
    node('a2', 'wait', 'wait', 'Wait 1 Hour', {
      description: '1 hour',
      note: 'Short pause before the rebook email.',
      config: { mode: 'duration', durationMinutes: 60 },
    }),
    node('a3', 'send_email', 'communication', 'Rebook Email', {
      description: 'Template: Rebook',
      note: 'Email with a one-click rebooking link and available times.',
      config: { channel: 'email', template: 'rebook' },
    }),
    node('a4', 'wait', 'wait', 'Wait 1 Day', {
      description: '1 day',
      note: 'Waits a day to see whether they rebook.',
      config: { mode: 'duration', durationMinutes: 1440 },
    }),
    node('c1', 'if_else', 'condition', 'Rebooked?', {
      description: 'New appointment booked?',
      note: 'Branches on whether the no-show booked a new time.',
      config: { field: 'appointment.rebooked', operator: 'is', value: true },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Rebooked',
          lane: 'yes',
          condition: 'New appointment booked',
          terminal: 'End - reminder sequence takes over.',
          nodes: [
            node('y1', 'send_notification', 'internal', 'Notify Rep - Rebooked', {
              description: 'In-app',
              note: 'Confirms to the team that the no-show recovered.',
              config: { channels: ['in_app'] },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Still Out',
          lane: 'no',
          condition: 'No rebooking',
          nodes: [
            node('n1', 'create_task', 'action', 'Create Personal Call Task', {
              description: 'Due tomorrow',
              note: 'Schedules a human call to win the appointment back.',
              config: { dueOffset: '+1d', assignee: 'appointment_owner' },
            }),
            node('n2', 'add_tag', 'action', 'Tag: no-show-open', {
              description: 'Tag: no-show-open',
              note: 'Tracks unresolved no-shows for reporting.',
              config: { tag: 'no-show-open' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 9. Abandoned-form follow-up -- */

export const abandonedFormFollowUp: StarterChainTemplate = {
  id: 'sc_abandoned_form',
  intent: 'abandoned-form-follow-up',
  name: 'Abandoned-Form Follow-Up',
  description:
    'When someone starts but does not finish a form, nudge them to complete it, then branch on whether they do.',
  category: 'forms',
  status: 'draft',
  promptExamples: [
    'Follow up on abandoned forms',
    'Recover incomplete form submissions',
    'Nudge people who did not finish the form',
  ],
  triggers: [
    node('t1', 'form_abandoned', 'trigger', 'Form Abandoned', {
      description: 'Form started - not submitted',
      note: 'Starts when a visitor begins a form but does not submit it.',
      icon: 'form_submitted',
      category: 'Events',
    }),
  ],
  nodes: [
    node('a1', 'wait', 'wait', 'Wait 15 Minutes', {
      description: '15 minutes',
      note: 'Brief wait in case they were simply interrupted.',
      config: { mode: 'duration', durationMinutes: 15 },
    }),
    node('a2', 'send_sms', 'communication', 'Need a Hand? Text', {
      description: 'SMS - only if phone captured',
      note: 'A quick text offering help to finish the form.',
      example: "Hi {{contact.first_name}}, noticed you started our form - need a hand finishing? {{custom_values.form_link}}",
      config: { channel: 'sms', requires: 'phone_present' },
    }),
    node('a3', 'wait', 'wait', 'Wait 1 Day', {
      description: '1 day',
      note: 'Gives them a day before the email nudge.',
      config: { mode: 'duration', durationMinutes: 1440 },
    }),
    node('a4', 'send_email', 'communication', 'Finish-Up Email', {
      description: 'Template: Complete Your Form',
      note: 'Email with a resume link back to the form.',
      config: { channel: 'email', template: 'complete_form' },
    }),
    node('c1', 'if_else', 'condition', 'Form Completed?', {
      description: 'Submitted the form?',
      note: 'Branches on whether the visitor finally submitted.',
      config: { field: 'form.completed', operator: 'is', value: true },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Completed',
          lane: 'yes',
          condition: 'Form submitted',
          terminal: 'End - new-lead nurture takes over.',
          nodes: [
            node('y1', 'send_notification', 'internal', 'Notify Rep - New Lead', {
              description: 'In-app',
              note: 'Lets a rep know a recovered lead just completed the form.',
              config: { channels: ['in_app'] },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Abandoned',
          lane: 'no',
          condition: 'Still incomplete',
          terminal: 'End - contact kept for a future campaign.',
          nodes: [
            node('n1', 'add_tag', 'action', 'Tag: form-abandoned', {
              description: 'Tag: form-abandoned',
              note: 'Tags the contact so they can be re-targeted later.',
              config: { tag: 'form-abandoned' },
            }),
          ],
        },
      ],
    }),
  ],
};
