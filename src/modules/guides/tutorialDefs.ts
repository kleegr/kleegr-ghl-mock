/**
 * Tutorial definitions — the 10 required V1 onboarding tutorials.
 *
 * Each entry is a TutorialDef with:
 *  - A stable id (used as the config key)
 *  - Module area and route hint
 *  - A written description and planned step outline
 *  - An estimated duration and completion note
 *
 * In Wave 3 the Tutorial Engine (TutorialProvider + overlay/spotlight/coachmark)
 * will consume these definitions and execute them as interactive walkthroughs.
 * For now they power the Guides launcher and preview modals.
 *
 * To add a tutorial: append a new TutorialDef object to this array.
 * No new components are required.
 */

export interface TutorialDef {
  /** Stable kebab-case identifier. Referenced by data-tour attributes. */
  id: string;
  /** Human-readable title shown on the card and modal. */
  title: string;
  /** Module area label (e.g. "Contacts", "Payments"). */
  area: string;
  /** Route the tutorial begins at (for future engine navigation). */
  module: string;
  /** One-sentence description for the card. */
  description: string;
  /** Estimated completion time in minutes. */
  estMinutes: number;
  /** Ordered step outline — used in the preview modal and future Tutorial engine. */
  plannedSteps: string[];
  /** Message shown on the completion screen. */
  completionNote: string;
}

export const TUTORIALS: TutorialDef[] = [
  {
    id: 'add-contact',
    title: 'Add a new contact',
    area: 'Contacts',
    module: '/contacts',
    description: 'Create a new contact record, add their details, assign tags, and link them to your pipeline.',
    estMinutes: 3,
    plannedSteps: [
      'Open the Contacts module from the sidebar',
      'Click the "+ Add Contact" button in the top right',
      'Fill in the contact name, email, and phone number',
      'Add at least one tag to categorize the contact',
      'Click Save — the contact appears in your list',
    ],
    completionNote: 'You know how to add contacts. New leads and clients can be added any time.',
  },
  {
    id: 'reply-conversation',
    title: 'Reply to a conversation',
    area: 'Conversations',
    module: '/conversations',
    description: 'Navigate the unified inbox, open a thread, and send a reply across SMS, email, or web chat.',
    estMinutes: 4,
    plannedSteps: [
      'Open Conversations from the sidebar',
      'Click an unread thread to open it',
      'Read the message in the thread view',
      'Type your reply in the message composer at the bottom',
      'Click Send — your reply appears as an outbound bubble',
    ],
    completionNote: 'You can now reply to any inbound message from the unified inbox.',
  },
  {
    id: 'move-pipeline',
    title: 'Move a lead through a pipeline',
    area: 'Opportunities',
    module: '/opportunities',
    description: 'Open the pipeline board, view your deal cards, and drag an opportunity to the next stage.',
    estMinutes: 3,
    plannedSteps: [
      'Open Opportunities from the sidebar',
      'View the Kanban board with stage columns',
      'Find a deal card in the first column',
      'Drag the card to the next stage column',
      'Confirm the stage label updated on the card',
    ],
    completionNote: 'Pipeline management is in your toolkit. Keep deals moving forward!',
  },
  {
    id: 'book-appointment',
    title: 'Book an appointment',
    area: 'Calendars',
    module: '/calendars',
    description: 'Use the calendar to find an open slot and book an appointment for a contact.',
    estMinutes: 4,
    plannedSteps: [
      'Open Calendars from the sidebar',
      'Switch to the Week view to see open time slots',
      'Click an empty slot on a future day',
      'Fill in the contact name and appointment details',
      'Click Book — the appointment appears on the calendar',
    ],
    completionNote: 'You can now book appointments directly from the calendar.',
  },
  {
    id: 'create-workflow',
    title: 'Create a workflow',
    area: 'Automations',
    module: '/automations',
    description: 'Build a simple automation that triggers on a form submission and sends a follow-up message.',
    estMinutes: 6,
    plannedSteps: [
      'Open Automations from the sidebar',
      'Click "+ New Workflow"',
      'Choose a trigger: "Form Submitted"',
      'Add an action node: "Send SMS"',
      'Configure the SMS message body',
      'Click Save & Publish to activate the workflow',
    ],
    completionNote: 'Your first automation is live. Workflows run 24/7 so you never miss a follow-up.',
  },
  {
    id: 'view-campaign-performance',
    title: 'View campaign performance',
    area: 'Marketing',
    module: '/marketing/email',
    description: 'Find a sent email campaign and review its delivery, open rate, and click-through metrics.',
    estMinutes: 3,
    plannedSteps: [
      'Open Marketing > Email Campaigns from the sidebar',
      'Find a campaign with "Sent" status',
      'Click the campaign name to open the detail view',
      'Review the Open Rate, Click Rate, and Delivered count',
      'Explore the Analytics tab for time-series charts',
    ],
    completionNote: 'Campaign analytics help you understand what resonates with your audience.',
  },
  {
    id: 'send-review-request',
    title: 'Send a review request',
    area: 'Reputation',
    module: '/reputation',
    description: 'Select a contact and send a review request via SMS or email to collect Google or Facebook reviews.',
    estMinutes: 3,
    plannedSteps: [
      'Open Reputation from the sidebar',
      'Click "Send Review Request"',
      'Search for and select a contact',
      'Choose the delivery channel: SMS or Email',
      'Preview the message and click Send',
    ],
    completionNote: 'More 5-star reviews build trust and bring in new prospects.',
  },
  {
    id: 'check-missed-calls',
    title: 'Check missed calls',
    area: 'Phone',
    module: '/phone',
    description: 'Open the call log, filter to missed calls, and review voicemail transcripts.',
    estMinutes: 3,
    plannedSteps: [
      'Open Phone from the sidebar',
      'Scan the call log for red "Missed" badges',
      'Click the filter to show Missed calls only',
      'Open a missed call record to view the transcript (if available)',
      'Note the caller info so you can follow up quickly',
    ],
    completionNote: 'No missed opportunity goes unnoticed. Follow up fast to close more deals.',
  },
  {
    id: 'create-invoice',
    title: 'Create an invoice',
    area: 'Payments',
    module: '/payments/invoices',
    description: 'Build a new invoice for a contact, add line items from your product catalog, and send it.',
    estMinutes: 5,
    plannedSteps: [
      'Open Payments > Invoices from the sidebar',
      'Click "+ New Invoice"',
      'Select a contact to bill',
      'Add line items from the product catalog',
      'Review the subtotal and tax',
      'Click Send — the invoice status changes to "Sent"',
    ],
    completionNote: 'Invoicing is now part of your flow. Get paid faster with digital invoices.',
  },
  {
    id: 'outlook-inbox',
    title: 'Connect / view an Outlook-style inbox',
    area: 'Integrations',
    module: '/integrations/outlook',
    description: 'Simulate connecting an email account and browsing the mock inbox inside the platform.',
    estMinutes: 3,
    plannedSteps: [
      'Open Integrations from the sidebar',
      'Find the Outlook / Email Account card',
      'Click "Connect Account" to start the mock OAuth flow',
      'Confirm the connection — status shows "Connected"',
      'Click "View Inbox" to browse your connected email folders',
    ],
    completionNote: 'Your email is now accessible directly inside the platform — no tab-switching required.',
  },
];
