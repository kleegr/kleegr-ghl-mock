/**
 * Executable tutorial flows — the runtime config consumed by the Tutorial
 * Engine (TutorialOverlay). Each flow corresponds 1:1 (by `id`) to a
 * TutorialDef in `src/modules/guides/tutorialDefs.ts`, but adds the concrete
 * data the engine needs to drive an interactive, Arcade-style walkthrough:
 * a stable `target` selector (from the data-tour registry), a `route` to
 * navigate to, placement, and a gating rule.
 *
 * Authoring rules (mirrors plan §18):
 *  - `target` MUST be a real `data-tour` key that is rendered on the relevant
 *    screen. Never use CSS/nth-child selectors.
 *  - Prefer targets that are always present on the page. For steps that point
 *    at an element which only appears after an action (e.g. a modal), gate the
 *    preceding step with `advanceOn: 'click'` so the element exists by the time
 *    the engine looks for it. The engine also degrades gracefully: if a target
 *    is missing it shows a centered coachmark instead of breaking.
 *  - To add a tutorial: add a TutorialFlow here and a matching TutorialDef in
 *    tutorialDefs.ts. No new components required.
 *
 * This file has no external dependencies beyond the registry types.
 */

import type { TourKey } from './registry';

export interface FlowStep {
  /** Stable id (unique within the flow). */
  id: string;
  /**
   * data-tour key to spotlight. Omit for a centered, target-less step.
   * Typed against the registry for autocomplete, but accepts any rendered key
   * (the registry's union type can lag behind what modules actually render —
   * the live `data-tour` attribute in the DOM is the source of truth).
   */
  target?: TourKey | (string & {});
  /** Route to navigate to before showing this step. */
  route?: string;
  /** Coachmark heading. */
  title: string;
  /** One- or two-sentence instruction. */
  body: string;
  /** Preferred coachmark placement relative to the target. Defaults to 'auto'. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /**
   * How the step advances:
   *  - 'next'  (default): the learner reads, then clicks Next.
   *  - 'click': clicking the highlighted target advances (teach-by-doing). The
   *             Next button still works as an escape hatch.
   */
  advanceOn?: 'next' | 'click';
}

export interface TutorialFlow {
  /** Matches the TutorialDef id. */
  id: string;
  title: string;
  area: string;
  estMinutes: number;
  steps: FlowStep[];
  completionTitle: string;
  completionBody: string;
}

export const TUTORIAL_FLOWS: TutorialFlow[] = [
  {
    id: 'add-contact',
    title: 'Add a new contact',
    area: 'Contacts',
    estMinutes: 3,
    completionTitle: 'You added your first contact! 🎉',
    completionBody: 'New leads and clients can be added any time from the Contacts module.',
    steps: [
      {
        id: 'open',
        route: '/contacts',
        target: 'contacts.page',
        title: 'This is your Contacts list',
        body: 'Every lead and client lives here. You can sort, filter, and open any record. Let’s add a new one.',
        placement: 'bottom',
      },
      {
        id: 'click-add',
        target: 'contacts.addButton',
        title: 'Click “Add Contact”',
        body: 'Use the button in the top right to open the new-contact form.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'contacts.addModal',
        title: 'Fill in the details',
        body: 'Enter the contact’s name, email, and phone, then add a tag to categorize them.',
        placement: 'left',
      },
      {
        id: 'save',
        target: 'contacts.addSubmit',
        title: 'Save the contact',
        body: 'Click Save — the new contact instantly appears at the top of your list.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'reply-conversation',
    title: 'Reply to a conversation',
    area: 'Conversations',
    estMinutes: 4,
    completionTitle: 'Reply sent! 💬',
    completionBody: 'You can now reply to any inbound message from the unified inbox.',
    steps: [
      {
        id: 'open',
        route: '/conversations',
        target: 'conversations.list',
        title: 'Your unified inbox',
        body: 'SMS, email, web chat and social all land here. Unread threads are highlighted.',
        placement: 'right',
      },
      {
        id: 'open-thread',
        target: 'conversations.threadItem',
        title: 'Open a thread',
        body: 'Click a conversation to read the full message history in the center pane.',
        placement: 'right',
        advanceOn: 'click',
      },
      {
        id: 'composer',
        target: 'conversations.composer',
        title: 'Write your reply',
        body: 'Type a message in the composer. You can switch channels and add snippets here too.',
        placement: 'top',
      },
      {
        id: 'send',
        target: 'conversations.sendButton',
        title: 'Send it',
        body: 'Click Send — your reply appears instantly as an outbound bubble (demo only, nothing is really sent).',
        placement: 'left',
      },
    ],
  },
  {
    id: 'move-pipeline',
    title: 'Move a lead through a pipeline',
    area: 'Opportunities',
    estMinutes: 3,
    completionTitle: 'Deal moved forward! 📈',
    completionBody: 'Drag-and-drop keeps your pipeline current and recalculates stage totals automatically.',
    steps: [
      {
        id: 'open',
        route: '/opportunities',
        target: 'opportunities.board',
        title: 'Your pipeline board',
        body: 'Each column is a stage. The header shows how many deals and the total value in that stage.',
        placement: 'bottom',
      },
      {
        id: 'card',
        target: 'opportunities.card',
        title: 'Find a deal card',
        body: 'A card shows the deal name, value, and contact. Cards live in whatever stage they’re currently in.',
        placement: 'right',
      },
      {
        id: 'drag',
        target: 'opportunities.stageColumn',
        title: 'Drag to the next stage',
        body: 'Grab any card and drop it into another column. The stage updates and the column totals recalculate live.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'book-appointment',
    title: 'Book an appointment',
    area: 'Calendars',
    estMinutes: 4,
    completionTitle: 'Appointment booked! 📅',
    completionBody: 'You can book directly from the calendar any time — it appears instantly on the grid.',
    steps: [
      {
        id: 'open',
        route: '/calendars',
        target: 'calendars.page',
        title: 'Your calendar',
        body: 'Switch between Month, Week, Day and Agenda views. Each calendar is color-coded.',
        placement: 'bottom',
      },
      {
        id: 'click-book',
        target: 'calendars.bookButton',
        title: 'Start a booking',
        body: 'Click “Book Appointment” to open the booking form (you can also click any empty slot).',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'calendars.bookModal',
        title: 'Pick a contact and time',
        body: 'Choose the calendar, the contact, and a time slot for the appointment.',
        placement: 'left',
      },
      {
        id: 'confirm',
        target: 'calendars.bookSubmit',
        title: 'Confirm the booking',
        body: 'Click Book — the appointment appears on the calendar straight away.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'create-workflow',
    title: 'Create a workflow',
    area: 'Automations',
    estMinutes: 6,
    completionTitle: 'Automation ready! ⚙️',
    completionBody: 'Workflows run 24/7 on their trigger, so follow-ups never slip through the cracks.',
    steps: [
      {
        id: 'open',
        route: '/automations',
        target: 'automations.list',
        title: 'Your automations',
        body: 'These workflows run automatically based on a trigger — a missed call, a new lead, a won deal, and more.',
        placement: 'bottom',
      },
      {
        id: 'new',
        target: 'automations.addButton',
        title: 'Create a workflow',
        body: 'Click “Create Workflow” to start from a blank canvas or a ready-made template.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'open-builder',
        target: 'automations.row',
        title: 'Open the builder',
        body: 'Click any workflow to open the visual builder, where a trigger connects to action steps like Send SMS or Send Email.',
        placement: 'bottom',
      },
      {
        id: 'publish',
        target: 'automations.publishToggle',
        title: 'Publish to go live',
        body: 'Toggle a workflow between Draft and Published right from the list. Published workflows are active immediately.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'view-campaign-performance',
    title: 'View campaign performance',
    area: 'Marketing',
    estMinutes: 3,
    completionTitle: 'You read the numbers! 📊',
    completionBody: 'Open and click rates tell you what resonates so you can double down on what works.',
    steps: [
      {
        id: 'open',
        route: '/marketing/email',
        target: 'marketing.campaignList',
        title: 'Your email campaigns',
        body: 'Each row shows status (Sent, Scheduled, Draft) and headline metrics at a glance.',
        placement: 'bottom',
      },
      {
        id: 'summary',
        target: 'marketing.summary',
        title: 'Top-line metrics',
        body: 'These cards roll up audience size, delivery, opens and clicks across your campaigns.',
        placement: 'bottom',
      },
      {
        id: 'open-detail',
        target: 'marketing.campaignRow',
        title: 'Open a campaign',
        body: 'Click a Sent campaign to drill into its open rate, click rate, and delivery breakdown.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'send-review-request',
    title: 'Send a review request',
    area: 'Reputation',
    estMinutes: 3,
    completionTitle: 'Review request sent! ⭐',
    completionBody: 'More 5-star reviews build trust and bring in new prospects on autopilot.',
    steps: [
      {
        id: 'open',
        route: '/reputation',
        target: 'reputation.summary',
        title: 'Your reputation at a glance',
        body: 'See your average rating and review volume across Google and Facebook.',
        placement: 'bottom',
      },
      {
        id: 'click-request',
        target: 'reputation.requestButton',
        title: 'Request a review',
        body: 'Click “Send Review Request” to ask a happy client for a review.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'channel',
        target: 'reputation.channelChoice',
        title: 'Choose SMS or Email',
        body: 'Pick a contact and the channel to reach them on — the message is pre-written for you.',
        placement: 'top',
      },
      {
        id: 'send',
        target: 'reputation.requestSubmit',
        title: 'Send the request',
        body: 'Click Send — the request goes out (demo only) and you’ll get a confirmation toast.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'check-missed-calls',
    title: 'Check missed calls',
    area: 'Phone',
    estMinutes: 3,
    completionTitle: 'No missed lead left behind! 📞',
    completionBody: 'Following up on missed calls quickly is one of the fastest ways to win more business.',
    steps: [
      {
        id: 'open',
        route: '/phone',
        target: 'phone.callLog',
        title: 'Your call log',
        body: 'Every inbound, outbound and missed call is logged here with duration and caller details.',
        placement: 'top',
      },
      {
        id: 'filter',
        target: 'phone.filters',
        title: 'Filter to missed calls',
        body: 'Use the filters to show only missed calls so nothing slips by.',
        placement: 'bottom',
      },
      {
        id: 'detail',
        target: 'phone.callRow',
        title: 'Open a call',
        body: 'Click a missed call to see the caller info and a voicemail transcript if one was left.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'create-invoice',
    title: 'Create an invoice',
    area: 'Payments',
    estMinutes: 5,
    completionTitle: 'Invoice created! 💳',
    completionBody: 'Digital invoices get you paid faster and keep your transaction history tidy.',
    steps: [
      {
        id: 'open',
        route: '/payments',
        target: 'payments.tabs',
        title: 'Payments & invoices',
        body: 'Switch between Invoices, Products, Transactions and Subscriptions using these tabs.',
        placement: 'bottom',
      },
      {
        id: 'click-create',
        target: 'payments.createInvoice',
        title: 'Create an invoice',
        body: 'Click “New Invoice” to build one from your product catalog.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'payments.invoiceModal',
        title: 'Add a client and line items',
        body: 'Select the contact to bill, add products, and the subtotal and tax calculate automatically.',
        placement: 'left',
      },
      {
        id: 'send',
        target: 'payments.invoiceSubmit',
        title: 'Send the invoice',
        body: 'Click Send — the invoice status flips to “Sent” (demo only).',
        placement: 'top',
      },
    ],
  },
  {
    id: 'outlook-inbox',
    title: 'Connect / view an Outlook-style inbox',
    area: 'Integrations',
    estMinutes: 3,
    completionTitle: 'Inbox connected! 📧',
    completionBody: 'Your email lives right inside the platform — no tab-switching required.',
    steps: [
      {
        id: 'open',
        route: '/integrations',
        target: 'integrations.cards',
        title: 'Connected accounts',
        body: 'This is where you link external tools. Find the Outlook / email account card.',
        placement: 'bottom',
      },
      {
        id: 'connect',
        target: 'integrations.connectOutlook',
        title: 'Connect Outlook',
        body: 'Click Connect to run the mock OAuth flow — it succeeds instantly in the demo.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'inbox',
        target: 'integrations.outlookInbox',
        title: 'Browse your inbox',
        body: 'Your connected inbox renders here with folders, a message list and a reading pane.',
        placement: 'top',
      },
    ],
  },
];

export function getFlow(id: string | null | undefined): TutorialFlow | undefined {
  if (!id) return undefined;
  return TUTORIAL_FLOWS.find((f) => f.id === id);
}
