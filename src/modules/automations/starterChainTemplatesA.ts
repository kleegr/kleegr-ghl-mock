/**
 * starterChainTemplatesA.ts - starter-chain templates (part 1 of 2) for the AI
 * composer: missed-call follow-up, new-lead nurture, appointment reminder,
 * quote follow-up, and invoice / payment reminder.
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

/* -- 1. Missed-call follow-up -- */

export const missedCallFollowUp: StarterChainTemplate = {
  id: 'sc_missed_call',
  intent: 'missed-call-follow-up',
  name: 'Missed-Call Text-Back',
  description:
    'When a call is missed, text the caller back instantly, give them a few minutes to respond, then branch on whether they re-engage.',
  category: 'speed-to-lead',
  status: 'draft',
  promptExamples: [
    'Follow up when we miss a call',
    'Text back missed calls automatically',
    'Missed call text back workflow',
  ],
  triggers: [
    node('t1', 'missed_call', 'trigger', 'Missed Call', {
      description: 'Inbound call - not answered',
      note: 'Starts the moment an inbound call goes unanswered.',
      icon: 'missed_call',
      category: 'Phone',
    }),
  ],
  nodes: [
    node('a1', 'send_sms', 'communication', 'Instant Text-Back', {
      description: 'From business number - immediate',
      note: 'Texts the caller within seconds so a missed call never goes cold.',
      example: "Sorry we missed your call! How can we help, {{contact.first_name}}?",
      config: { channel: 'sms', timing: 'immediate', from: 'business_number' },
    }),
    node('a2', 'wait', 'wait', 'Wait 5 Minutes', {
      description: '5 minutes',
      note: 'Gives the caller a short window to reply before escalating.',
      config: { mode: 'duration', durationMinutes: 5 },
    }),
    node('c1', 'if_else', 'condition', 'Caller Replied?', {
      description: 'Replied to the text-back?',
      note: 'Branches on whether the caller responded to the instant text.',
      config: { field: 'message.replied', operator: 'is', value: true, windowMinutes: 5 },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Replied',
          lane: 'yes',
          condition: 'Caller responded',
          nodes: [
            node('y1', 'send_notification', 'internal', 'Notify Front Desk', {
              description: 'In-app + Slack',
              note: 'Alerts the team so a person can jump into the live conversation.',
              config: { channels: ['in_app', 'slack'] },
            }),
            node('y2', 'create_task', 'action', 'Create Call-Back Task', {
              description: 'Due in 15 min',
              note: 'Ensures someone follows through on the now-warm lead.',
              config: { dueOffset: '+15m', assignee: 'front_desk' },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Quiet',
          lane: 'no',
          condition: 'No reply within 5 minutes',
          terminal: 'End - caller stays on the general nurture list.',
          nodes: [
            node('n1', 'send_sms', 'communication', 'Second Nudge', {
              description: 'Follow-up text',
              note: 'One gentle follow-up offering a callback time.',
              example: "Still here if you need us - reply and we'll call right back.",
              config: { channel: 'sms' },
            }),
            node('n2', 'add_tag', 'action', 'Tag: missed-call-open', {
              description: 'Tag: missed-call-open',
              note: 'Tags the contact so reporting can track unresolved missed calls.',
              config: { tag: 'missed-call-open' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 2. New-lead nurture -- */

export const newLeadNurture: StarterChainTemplate = {
  id: 'sc_new_lead',
  intent: 'new-lead-nurture',
  name: 'New-Lead Nurture Drip',
  description:
    'Welcome a new lead immediately, then drip helpful touches over a few days and branch on engagement.',
  category: 'lead-follow-up',
  status: 'draft',
  promptExamples: [
    'Nurture new leads over a few days',
    'New lead welcome sequence',
    'Drip campaign for fresh leads',
  ],
  triggers: [
    node('t1', 'form_submitted', 'trigger', 'Form Submitted', {
      description: 'Any lead capture form',
      note: 'Starts when a new lead submits a capture form.',
      icon: 'form_submitted',
      category: 'Events',
    }),
    node('t2', 'contact_created', 'trigger', 'Contact Created', {
      description: 'New contact added',
      note: 'Also starts for contacts added by import or manually.',
      icon: 'contact_created',
      category: 'Contacts',
    }),
  ],
  nodes: [
    node('a1', 'send_sms', 'communication', 'Welcome Text', {
      description: 'Immediate',
      note: 'Quick, friendly hello so the lead knows they reached the right place.',
      example: "Hi {{contact.first_name}}, thanks for reaching out! Mind if we ask a couple quick questions?",
      config: { channel: 'sms', timing: 'immediate' },
    }),
    node('a2', 'send_email', 'communication', 'Welcome Email', {
      description: 'Template: Welcome',
      note: 'Branded welcome with what to expect next.',
      config: { channel: 'email', template: 'welcome' },
    }),
    node('a3', 'wait', 'wait', 'Wait 1 Day', {
      description: '1 day',
      note: 'Spaces the next touch so it does not feel pushy.',
      config: { mode: 'duration', durationMinutes: 1440 },
    }),
    node('a4', 'send_email', 'communication', 'Value Email', {
      description: 'Template: How We Help',
      note: 'Shares a useful resource or case study.',
      config: { channel: 'email', template: 'how_we_help' },
    }),
    node('a5', 'wait', 'wait', 'Wait 2 Days', {
      description: '2 days',
      note: 'Another pause before checking interest.',
      config: { mode: 'duration', durationMinutes: 2880 },
    }),
    node('c1', 'if_else', 'condition', 'Engaged Yet?', {
      description: 'Opened, clicked, or replied?',
      note: 'Branches on whether the lead engaged with any touch so far.',
      config: { anyOf: ['email_opened', 'link_clicked', 'replied'] },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Engaged',
          lane: 'yes',
          condition: 'Showed interest',
          nodes: [
            node('y1', 'send_notification', 'internal', 'Notify Rep - Warm Lead', {
              description: 'In-app',
              note: 'Tells a rep this lead is warm enough for a personal reach-out.',
              config: { channels: ['in_app'] },
            }),
            node('y2', 'create_task', 'action', 'Create Outreach Task', {
              description: 'Due today',
              note: 'Prompts a human call while interest is high.',
              config: { dueOffset: '+0d', assignee: 'lead_owner' },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Cold',
          lane: 'no',
          condition: 'No engagement',
          terminal: 'End - lead moves to the long-term newsletter.',
          nodes: [
            node('n1', 'add_tag', 'action', 'Tag: nurture-long-term', {
              description: 'Tag: nurture-long-term',
              note: 'Hands the lead to the long-term nurture list.',
              config: { tag: 'nurture-long-term' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 3. Appointment reminder -- */

export const appointmentReminder: StarterChainTemplate = {
  id: 'sc_appt_reminder',
  intent: 'appointment-reminder',
  name: 'Appointment Reminder Sequence',
  description:
    'Confirm a booked appointment, then send timed reminders the day before and an hour before to cut no-shows.',
  category: 'appointments',
  status: 'draft',
  promptExamples: [
    'Remind people about their appointments',
    'Appointment reminder texts',
    'Reduce no-shows with reminders',
  ],
  triggers: [
    node('t1', 'appointment_status', 'trigger', 'Appointment Booked', {
      description: 'Status = Booked',
      note: 'Starts when an appointment is booked or confirmed.',
      icon: 'appointment_status',
      category: 'Appointments',
    }),
  ],
  nodes: [
    node('a1', 'send_email', 'communication', 'Booking Confirmation', {
      description: 'Template: Confirmation',
      note: 'Immediately confirms the booking with date, time, and location.',
      config: { channel: 'email', template: 'appt_confirmation' },
    }),
    node('a2', 'wait', 'wait', 'Wait Until 1 Day Before', {
      description: 'Until appt - 24h',
      note: 'Waits until the day before the appointment.',
      config: { mode: 'until', anchor: 'appointment_start', offsetMinutes: -1440 },
    }),
    node('a3', 'send_sms', 'communication', 'Day-Before Reminder', {
      description: 'SMS reminder',
      note: 'Texts a friendly reminder the day before.',
      example: "Reminder: you're booked with us tomorrow at {{appointment.time}}. Reply C to confirm.",
      config: { channel: 'sms' },
    }),
    node('a4', 'wait', 'wait', 'Wait Until 1 Hour Before', {
      description: 'Until appt - 1h',
      note: 'Waits until shortly before the appointment.',
      config: { mode: 'until', anchor: 'appointment_start', offsetMinutes: -60 },
    }),
    node('a5', 'send_sms', 'communication', 'Final Reminder', {
      description: 'SMS - 1 hour out',
      note: 'Last nudge with directions or a join link.',
      example: "See you in an hour, {{contact.first_name}}! Here are the details: {{appointment.location}}",
      config: { channel: 'sms' },
    }),
  ],
};

/* -- 4. Quote follow-up -- */

export const quoteFollowUp: StarterChainTemplate = {
  id: 'sc_quote_follow_up',
  intent: 'quote-follow-up',
  name: 'Quote / Estimate Follow-Up',
  description:
    'After a quote is sent, wait, check in, and branch on whether the prospect responds so nothing slips through.',
  category: 'sales-pipeline',
  status: 'draft',
  promptExamples: [
    'Follow up after sending a quote',
    'Chase estimates that went quiet',
    'Quote follow up sequence',
  ],
  triggers: [
    node('t1', 'opportunity_stage', 'trigger', 'Stage -> Quote Sent', {
      description: 'Pipeline: Sales - Quote Sent',
      note: 'Starts when an opportunity moves into the Quote Sent stage.',
      icon: 'opportunity_stage',
      category: 'Opportunities',
    }),
  ],
  nodes: [
    node('a1', 'wait', 'wait', 'Wait 2 Days', {
      description: '2 days',
      note: 'Gives the prospect time to review the quote.',
      config: { mode: 'duration', durationMinutes: 2880 },
    }),
    node('a2', 'send_email', 'communication', 'Check-In Email', {
      description: 'Template: Quote Check-In',
      note: 'Friendly nudge asking if they have questions on the quote.',
      config: { channel: 'email', template: 'quote_check_in' },
    }),
    node('a3', 'wait', 'wait', 'Wait 2 Days', {
      description: '2 days',
      note: 'Waits again before deciding whether to escalate.',
      config: { mode: 'duration', durationMinutes: 2880 },
    }),
    node('c1', 'if_else', 'condition', 'Prospect Replied?', {
      description: 'Replied to the quote?',
      note: 'Branches on whether the prospect responded.',
      config: { field: 'message.replied', operator: 'is', value: true },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Replied',
          lane: 'yes',
          condition: 'Responded to the quote',
          nodes: [
            node('y1', 'send_notification', 'internal', 'Notify Owner', {
              description: 'In-app',
              note: 'Alerts the opportunity owner to take the conversation forward.',
              config: { channels: ['in_app'] },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Silent',
          lane: 'no',
          condition: 'No response',
          nodes: [
            node('n1', 'send_sms', 'communication', 'Text Nudge', {
              description: 'SMS follow-up',
              note: 'A short text often gets a reply when email does not.',
              example: "Hi {{contact.first_name}}, any thoughts on the quote we sent? Happy to tweak it.",
              config: { channel: 'sms' },
            }),
            node('n2', 'create_task', 'action', 'Create Call Task', {
              description: 'Due tomorrow',
              note: 'Schedules a personal call to recover the deal.',
              config: { dueOffset: '+1d', assignee: 'opportunity_owner' },
            }),
          ],
        },
      ],
    }),
  ],
};

/* -- 5. Invoice / payment reminder -- */

export const invoicePaymentReminder: StarterChainTemplate = {
  id: 'sc_invoice_reminder',
  intent: 'invoice-payment-reminder',
  name: 'Invoice Payment Reminder',
  description:
    'After an invoice is sent, remind the customer, then branch on whether it is paid - thank payers and chase the rest. Demo-only; no real charge.',
  category: 'payments',
  status: 'draft',
  promptExamples: [
    'Remind customers to pay invoices',
    'Chase unpaid invoices',
    'Payment reminder workflow',
  ],
  triggers: [
    node('t1', 'invoice_sent', 'trigger', 'Invoice Sent', {
      description: 'Invoice issued',
      note: 'Starts when an invoice is issued to a customer (demo-only).',
      icon: 'invoice_sent',
      category: 'Payments',
    }),
  ],
  nodes: [
    node('a1', 'wait', 'wait', 'Wait 3 Days', {
      description: '3 days',
      note: 'Gives the customer a few days before the first reminder.',
      config: { mode: 'duration', durationMinutes: 4320 },
    }),
    node('a2', 'send_email', 'communication', 'Friendly Reminder Email', {
      description: 'Template: Invoice Reminder',
      note: 'Polite reminder with the invoice link and due date.',
      config: { channel: 'email', template: 'invoice_reminder' },
    }),
    node('a3', 'wait', 'wait', 'Wait Until Due Date', {
      description: 'Until invoice due',
      note: 'Waits until the invoice due date to check status.',
      config: { mode: 'until', anchor: 'invoice_due', offsetMinutes: 0 },
    }),
    node('c1', 'if_else', 'condition', 'Invoice Paid?', {
      description: 'Payment received?',
      note: 'Branches on whether the invoice has been paid.',
      config: { field: 'invoice.status', operator: 'is', value: 'paid' },
      branches: [
        {
          id: 'c1_yes',
          label: 'Yes - Paid',
          lane: 'yes',
          condition: 'Payment received',
          terminal: 'End - receipt handled by billing.',
          nodes: [
            node('y1', 'send_email', 'communication', 'Thank-You + Receipt', {
              description: 'Template: Payment Thanks',
              note: 'Thanks the customer and confirms the payment.',
              config: { channel: 'email', template: 'payment_thanks' },
            }),
            node('y2', 'move_opportunity', 'action', "Move to 'Paid'", {
              description: 'Sales -> Paid',
              note: 'Advances the deal to reflect the completed payment.',
              config: { pipeline: 'sales', stage: 'paid' },
            }),
          ],
        },
        {
          id: 'c1_no',
          label: 'No - Unpaid',
          lane: 'no',
          condition: 'Not paid by due date',
          nodes: [
            node('n1', 'send_sms', 'communication', 'Past-Due Text', {
              description: 'SMS reminder',
              note: 'A short text reminder once the invoice is past due.',
              example: "Hi {{contact.first_name}}, just a heads up your invoice is now due: {{custom_values.invoice_link}}",
              config: { channel: 'sms' },
            }),
            node('n2', 'send_notification', 'internal', 'Notify Billing', {
              description: 'In-app',
              note: 'Flags the unpaid invoice for the billing owner.',
              config: { channels: ['in_app'] },
            }),
            node('n3', 'create_task', 'action', 'Create Collections Task', {
              description: 'Due in 2 days',
              note: 'Schedules a personal follow-up on the overdue balance.',
              config: { dueOffset: '+2d', assignee: 'billing_owner' },
            }),
          ],
        },
      ],
    }),
  ],
};
