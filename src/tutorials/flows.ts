/**
 * Executable tutorial flows — the single source of truth for Tutorial Mode.
 *
 * The Tutorial Engine (TutorialOverlay) consumes this array directly, and the
 * Guides launcher derives its catalog cards from it: see
 * src/modules/guides/tutorialDefs.ts, which now projects each flow into a
 * TutorialDef rather than duplicating the data. Authoring a tutorial therefore
 * means editing exactly one place — here.
 *
 * Authoring rules:
 *  - `target` MUST be a real `data-tour` key that is rendered on the relevant
 *    screen, and that key MUST also have a help entry in
 *    src/help/helpContent.ts. The tutorial checker enforces both. Never use
 *    CSS or nth-child selectors.
 *  - Prefer targets that are always present once the route has loaded. For a
 *    target that only appears after an action (a modal, a drawer, a tab), gate
 *    the preceding step with `advanceOn: 'click'` so the element exists by the
 *    time the engine looks for it. The engine also degrades gracefully: a
 *    missing target falls back to a centered coachmark instead of breaking.
 *  - Only the first step of a flow needs a `route`. Later steps without one
 *    stay on the current screen, so a step can follow the user after they click
 *    into a sub-view (for example a Settings section opened from its menu).
 *  - Never instruct users to click a navigation item the shell hides. Describe
 *    the screen or the action instead ("This screen shows…", "Open the …
 *    section"). Use a short demo-safety note only where a real send, charge, or
 *    call would otherwise be implied.
 *
 * Prose uses typographic apostrophes (U+2019) so the dependency-free checker
 * can parse single-quoted fields without a stray ASCII apostrophe terminating a
 * string early. This file has no dependencies beyond the registry types.
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
  /** Route to navigate to before showing this step. Omit to stay put. */
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
  /** Matches the projected TutorialDef id. */
  id: string;
  title: string;
  area: string;
  /**
   * One-sentence, plain-language summary that leads with the business value of
   * the task. Shown on the Guides card and the preview modal (the Guides
   * catalog derives this from here — see tutorialDefs.ts).
   */
  description: string;
  estMinutes: number;
  steps: FlowStep[];
  completionTitle: string;
  completionBody: string;
}

export const TUTORIAL_FLOWS: TutorialFlow[] = [
  {
    id: 'tour-dashboard',
    title: 'Take a tour of Kleegr',
    area: 'Dashboard',
    description: 'Get your bearings — your dashboard, the main menu, search, and where to start a guided walkthrough whenever you need one.',
    estMinutes: 3,
    completionTitle: 'You know your way around! 🧭',
    completionBody: 'Your dashboard is home base. Come back any time to see what needs your attention today.',
    steps: [
      {
        id: 'open',
        route: '/',
        target: 'dashboard.page',
        title: 'Welcome — this is your dashboard',
        body: 'This is your home base. It pulls together what needs attention today: new leads, recent conversations, tasks, and how the business is tracking.',
        placement: 'bottom',
      },
      {
        id: 'nav',
        target: 'sidebar.nav',
        title: 'Everything is one click away',
        body: 'This menu moves you around Kleegr — Conversations, Contacts, Opportunities, Calendars, Payments and more. Each area opens here in the main panel.',
        placement: 'right',
      },
      {
        id: 'search',
        target: 'topbar.search',
        title: 'Search across everything',
        body: 'Jump straight to any contact, conversation, or record from here. Use it any time, or press the keyboard shortcut shown on the button.',
        placement: 'bottom',
      },
      {
        id: 'checklist',
        target: 'dashboard.onboardingChecklist',
        title: 'Your setup checklist',
        body: 'These are the first steps to get your workspace ready. Working through them is the quickest way to start getting value out of Kleegr.',
        placement: 'top',
      },
      {
        id: 'guides',
        target: 'topbar.guides',
        title: 'Guided help, whenever you want it',
        body: 'This opens Guides, where walkthroughs like this one live. Start one any time you want a hand with a task.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'add-contact',
    title: 'Add a new contact',
    area: 'Contacts',
    description: 'Create a contact record so every message, appointment, invoice, and opportunity stays tied to the same person.',
    estMinutes: 3,
    completionTitle: 'Your first contact is in! 🎉',
    completionBody: 'Every lead and client starts as a contact. Add a new one any time from this screen.',
    steps: [
      {
        id: 'open',
        route: '/contacts',
        target: 'contacts.page',
        title: 'This is your contact list',
        body: 'Every lead and client lives here. A contact record is what keeps each person\u2019s messages, appointments, and invoices connected in one place. Let\u2019s add one.',
        placement: 'bottom',
      },
      {
        id: 'click-add',
        target: 'contacts.addButton',
        title: 'Start a new contact',
        body: 'Use Add Contact to open the new-contact form.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'contacts.addModal',
        title: 'Add their details',
        body: 'Enter the name, email, and phone, then add a tag or two so you can group and find this person later.',
        placement: 'left',
      },
      {
        id: 'save',
        target: 'contacts.addSubmit',
        title: 'Save the record',
        body: 'Save it, and the new contact appears at the top of your list — ready for messages, deals, and bookings.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'reply-conversation',
    title: 'Reply to a conversation',
    area: 'Conversations',
    description: 'Handle SMS, email, and chat from one inbox so a reply is never more than a couple of clicks away.',
    estMinutes: 4,
    completionTitle: 'Reply sent! 💬',
    completionBody: 'Every channel lands in this one inbox, so you can answer leads and clients without switching apps.',
    steps: [
      {
        id: 'open',
        route: '/conversations',
        target: 'conversations.list',
        title: 'Your unified inbox',
        body: 'SMS, email, web chat, and social messages all arrive here in one place. Unread threads are highlighted so you can see what needs a reply.',
        placement: 'right',
      },
      {
        id: 'open-thread',
        target: 'conversations.threadItem',
        title: 'Open a conversation',
        body: 'Click a thread to read its full history in the center pane.',
        placement: 'right',
        advanceOn: 'click',
      },
      {
        id: 'composer',
        target: 'conversations.composer',
        title: 'Write your reply',
        body: 'Type here. You can switch the channel and drop in saved snippets without ever leaving the thread.',
        placement: 'top',
      },
      {
        id: 'send',
        target: 'conversations.sendButton',
        title: 'Send it',
        body: 'Your reply appears instantly as an outbound message. This is a demo, so nothing actually leaves the app.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'check-missed-calls',
    title: 'Check missed calls',
    area: 'Phone',
    description: 'Spot the calls you missed and follow up fast — a quick callback is one of the easiest ways to win more business.',
    estMinutes: 3,
    completionTitle: 'No missed lead left behind! 📞',
    completionBody: 'A quick callback after a missed call is one of the highest-return habits there is.',
    steps: [
      {
        id: 'open',
        route: '/phone',
        target: 'phone.callLog',
        title: 'Your call history',
        body: 'Every inbound, outbound, and missed call is logged here with the caller, the time, and how long it lasted.',
        placement: 'top',
      },
      {
        id: 'filter',
        target: 'phone.filters',
        title: 'Focus on what you missed',
        body: 'Filter the log down to missed calls so the ones that need a callback rise to the top.',
        placement: 'bottom',
      },
      {
        id: 'detail',
        target: 'phone.callRow',
        title: 'Open a call to follow up',
        body: 'Click a call to see the caller\u2019s details and any voicemail they left, then reach back out.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'move-pipeline',
    title: 'Move a deal through your pipeline',
    area: 'Opportunities',
    description: 'Keep your pipeline honest by dragging deals between stages — stage totals and your forecast update as you go.',
    estMinutes: 3,
    completionTitle: 'Deal moved forward! 📈',
    completionBody: 'Keeping cards in the right stage means your pipeline totals and forecast always reflect reality.',
    steps: [
      {
        id: 'open',
        route: '/opportunities',
        target: 'opportunities.board',
        title: 'Your pipeline board',
        body: 'Each column is a stage in your sales process. The header shows how many deals are in the stage and their combined value.',
        placement: 'bottom',
      },
      {
        id: 'card',
        target: 'opportunities.card',
        title: 'A deal at a glance',
        body: 'Each card shows the deal name, its value, and the contact behind it.',
        placement: 'right',
      },
      {
        id: 'drag',
        target: 'opportunities.stageColumn',
        title: 'Drag it to the next stage',
        body: 'Grab a card and drop it into another column. The deal\u2019s stage updates and the column totals recalculate right away.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'book-appointment',
    title: 'Book an appointment',
    area: 'Calendars',
    description: 'Schedule a meeting against the right calendar and contact so everyone knows where to be.',
    estMinutes: 4,
    completionTitle: 'Appointment booked! 📅',
    completionBody: 'Booking straight from the calendar keeps your schedule and your contacts in sync.',
    steps: [
      {
        id: 'open',
        route: '/calendars',
        target: 'calendars.page',
        title: 'Your calendar',
        body: 'Switch between Month, Week, Day, and Agenda views. Each calendar is color-coded so it\u2019s easy to tell them apart.',
        placement: 'bottom',
      },
      {
        id: 'click-book',
        target: 'calendars.bookButton',
        title: 'Start a booking',
        body: 'Use Book Appointment to open the booking form. You can also click any open slot directly on the grid.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'calendars.bookModal',
        title: 'Pick the who, when, and where',
        body: 'Choose the calendar, the contact, and a time slot for the appointment.',
        placement: 'left',
      },
      {
        id: 'confirm',
        target: 'calendars.bookSubmit',
        title: 'Confirm it',
        body: 'Book the appointment and it appears on the calendar straight away.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'create-invoice',
    title: 'Create an invoice',
    area: 'Payments',
    description: 'Bill a client in a few clicks — line items, tax, and totals are handled for you.',
    estMinutes: 5,
    completionTitle: 'Invoice created! 💳',
    completionBody: 'Digital invoices get you paid faster and keep your billing history in one tidy place.',
    steps: [
      {
        id: 'open',
        route: '/payments',
        target: 'payments.tabs',
        title: 'Payments and invoices',
        body: 'These tabs move you between Invoices, Products, Transactions, and Subscriptions.',
        placement: 'bottom',
      },
      {
        id: 'click-create',
        target: 'payments.createInvoice',
        title: 'Start an invoice',
        body: 'Use New Invoice to build one from your product catalog.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'fill',
        target: 'payments.invoiceModal',
        title: 'Add the client and line items',
        body: 'Pick the contact to bill and add products — the subtotal and tax total themselves automatically.',
        placement: 'left',
      },
      {
        id: 'send',
        target: 'payments.invoiceSubmit',
        title: 'Send the invoice',
        body: 'Send it and the status flips to Sent. This is a demo, so no real invoice goes out and no payment is taken.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'review-document',
    title: 'Review a document or contract',
    area: 'Documents',
    description: 'Open a contract or agreement and check its terms in the document editor before it goes out to a client.',
    estMinutes: 4,
    completionTitle: 'Document reviewed! 📄',
    completionBody: 'Keeping contracts and agreements here means the latest version is always a click away.',
    steps: [
      {
        id: 'open',
        route: '/documents',
        target: 'payments.documentList',
        title: 'Your documents and contracts',
        body: 'Proposals, contracts, and agreements live here, each with its status — draft, sent, or signed. Click one to open it.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'editor',
        target: 'payments.documentEditor',
        title: 'Read it in the editor',
        body: 'The document opens in a full editor. Review the wording, the terms, and the signing blocks before anything reaches the client.',
        placement: 'left',
      },
      {
        id: 'send',
        target: 'payments.documentEditor',
        title: 'Ready when you are',
        body: 'When it looks right, you can send it for signature or download a copy — all from this editor.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'send-review-request',
    title: 'Send a review request',
    area: 'Reputation',
    description: 'Ask a happy client for a review — more 5-star reviews build trust and bring in new prospects on their own.',
    estMinutes: 3,
    completionTitle: 'Review request sent! ⭐',
    completionBody: 'Steady 5-star reviews build trust and quietly bring in new prospects over time.',
    steps: [
      {
        id: 'open',
        route: '/reputation',
        target: 'reputation.summary',
        title: 'Your reputation at a glance',
        body: 'See your average rating and how many reviews you\u2019ve collected across Google and Facebook.',
        placement: 'bottom',
      },
      {
        id: 'click-request',
        target: 'reputation.requestButton',
        title: 'Ask for a review',
        body: 'Use Send Review Request to invite a happy client to leave one.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'channel',
        target: 'reputation.channelChoice',
        title: 'Choose how to reach them',
        body: 'Pick the contact and whether to send by SMS or email — the message is already written for you.',
        placement: 'top',
      },
      {
        id: 'send',
        target: 'reputation.requestSubmit',
        title: 'Send the request',
        body: 'Send it and you\u2019ll get a confirmation. This is a demo, so no message actually goes out.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'create-workflow',
    title: 'Create a workflow',
    area: 'Automations',
    description: 'Put repetitive follow-up on autopilot so leads get a timely response even when you\u2019re busy.',
    estMinutes: 6,
    completionTitle: 'Automation ready! ⚙️',
    completionBody: 'A workflow runs on its trigger around the clock, so follow-ups never slip through the cracks.',
    steps: [
      {
        id: 'open',
        route: '/automations',
        target: 'automations.list',
        title: 'Your automations',
        body: 'These workflows run on their own when something happens — a new lead, a missed call, a won deal. This is where you manage them.',
        placement: 'bottom',
      },
      {
        id: 'new',
        target: 'automations.addButton',
        title: 'Create a workflow',
        body: 'Use Create Workflow to start from a blank canvas or a ready-made template.',
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
        body: 'Flip a workflow between Draft and Published right from the list. A published workflow starts running immediately.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'view-campaign-performance',
    title: 'View campaign performance',
    area: 'Marketing',
    description: 'Read the open and click numbers on an email campaign so you can double down on what actually works.',
    estMinutes: 3,
    completionTitle: 'You read the numbers! 📊',
    completionBody: 'Open and click rates tell you what resonates, so you can do more of what works.',
    steps: [
      {
        id: 'open',
        route: '/marketing/email',
        target: 'marketing.campaignList',
        title: 'Your email campaigns',
        body: 'Each row shows a campaign\u2019s status — Sent, Scheduled, or Draft — with its headline numbers right alongside.',
        placement: 'bottom',
      },
      {
        id: 'summary',
        target: 'marketing.summary',
        title: 'The top-line numbers',
        body: 'These cards roll up audience size, delivery, opens, and clicks across all of your campaigns.',
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
    id: 'explore-reporting',
    title: 'Explore your reports',
    area: 'Reporting',
    description: 'See where leads, conversions, and revenue are heading so you can make decisions from data, not guesses.',
    estMinutes: 4,
    completionTitle: 'You read the room! 📈',
    completionBody: 'Checking these reports regularly is how you catch what\u2019s working — and what needs attention — early.',
    steps: [
      {
        id: 'open',
        route: '/reporting',
        target: 'reporting.kpis',
        title: 'Your key numbers',
        body: 'Reporting opens on the metrics that matter most — leads, conversion, revenue, and more — summarized across the business.',
        placement: 'bottom',
      },
      {
        id: 'range',
        target: 'reporting.dateRange',
        title: 'Set the time window',
        body: 'Choose the period you care about — this week, this month, last quarter — and every number updates to match.',
        placement: 'bottom',
      },
      {
        id: 'charts',
        target: 'reporting.charts',
        title: 'See the trend',
        body: 'These charts show how things move over time, so you can spot what\u2019s growing and what\u2019s slipping.',
        placement: 'top',
      },
      {
        id: 'summary',
        target: 'reporting.aiSummary',
        title: 'The highlights in plain language',
        body: 'The summary reads your data and calls out the most important changes for you, so you don\u2019t have to dig for them.',
        placement: 'bottom',
      },
      {
        id: 'export',
        target: 'reporting.export',
        title: 'Share it',
        body: 'Export any report to share with your team or a client.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'productivity-tickets',
    title: 'Work your ticket board',
    area: 'Productivity',
    description: 'Track requests and issues as tickets so nothing falls through the cracks and your team knows what\u2019s next.',
    estMinutes: 5,
    completionTitle: 'Your board is under control! 🎫',
    completionBody: 'Logging work as tickets keeps requests visible and assigned, so nothing quietly gets dropped.',
    steps: [
      {
        id: 'overview',
        route: '/productivity',
        target: 'productivity.overview',
        title: 'Your team\u2019s command center',
        body: 'Productivity brings tickets, tasks, and projects together. The Overview shows what needs attention across the team today. Open Tickets to see the board.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'stats',
        target: 'productivity.ticket-stats',
        title: 'Your queue at a glance',
        body: 'These cards summarize the board — open, overdue, and unread tickets — so you can tell where to focus first.',
        placement: 'bottom',
      },
      {
        id: 'create',
        target: 'productivity.create-ticket',
        title: 'Log a new ticket',
        body: 'Use New Ticket to capture a request or an issue so it doesn\u2019t get lost.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'submit',
        target: 'productivity.create-ticket-submit',
        title: 'Add it to the board',
        body: 'Give it a subject and a requester, then create it — the ticket drops straight onto the board, ready to assign and work.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'configure-business-profile',
    title: 'Set up your business profile',
    area: 'Settings',
    description: 'Get your company details right once — they flow onto your invoices, emails, and booking pages everywhere.',
    estMinutes: 3,
    completionTitle: 'Your profile is set! 🏢',
    completionBody: 'Your business details now carry through to invoices, emails, and booking pages automatically.',
    steps: [
      {
        id: 'open',
        route: '/settings',
        target: 'settings.page',
        title: 'Your workspace control center',
        body: 'Settings is where you configure how Kleegr works for your business. It opens on your Business Profile.',
        placement: 'bottom',
      },
      {
        id: 'nav',
        target: 'settings.nav',
        title: 'Everything is grouped here',
        body: 'This menu moves you between sections — Business Profile, Pipelines, Phone numbers, Staff, Notifications, and more.',
        placement: 'right',
      },
      {
        id: 'profile',
        target: 'settings.businessProfile',
        title: 'Start with your business profile',
        body: 'Your company name, address, and contact details here appear on invoices, outgoing emails, and your booking pages — so it\u2019s the right first thing to set up.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'invite-team-member',
    title: 'Invite or manage a teammate',
    area: 'Settings',
    description: 'Bring your team into the workspace and give each person the right level of access.',
    estMinutes: 3,
    completionTitle: 'Your team is set up! 👥',
    completionBody: 'Each teammate now has the access they need — adjust roles or invite more people any time from Staff.',
    steps: [
      {
        id: 'open',
        route: '/settings',
        target: 'settings.nav',
        title: 'Find the Staff section',
        body: 'Your team lives in the Staff section. Open it from this menu to see who has access to the workspace.',
        placement: 'right',
        advanceOn: 'click',
      },
      {
        id: 'list',
        target: 'settings.staff',
        title: 'Your team',
        body: 'This is your staff list. Each teammate has a role that controls what they can see and do across the workspace.',
        placement: 'top',
      },
      {
        id: 'manage',
        target: 'settings.staff',
        title: 'Invite and manage access',
        body: 'From here you can invite a new teammate, change someone\u2019s role, or switch off access when a person leaves.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'outlook-inbox',
    title: 'Connect an email inbox',
    area: 'Integrations',
    description: 'Link an external email account so messages live inside Kleegr — no more switching tabs to keep up.',
    estMinutes: 3,
    completionTitle: 'Inbox connected! 📧',
    completionBody: 'Your email now lives right inside the platform, alongside everything else about each contact.',
    steps: [
      {
        id: 'open',
        route: '/integrations',
        target: 'integrations.cards',
        title: 'Connected accounts',
        body: 'This screen is where you link external tools to Kleegr. Find the email account card to connect your inbox.',
        placement: 'bottom',
      },
      {
        id: 'connect',
        target: 'integrations.connectOutlook',
        title: 'Connect your email',
        body: 'Use Connect to run the secure sign-in. This is a demo, so it connects instantly without a real account.',
        placement: 'bottom',
        advanceOn: 'click',
      },
      {
        id: 'inbox',
        target: 'integrations.outlookInbox',
        title: 'Browse your inbox',
        body: 'Your connected inbox renders right here, with folders, a message list, and a reading pane — all without leaving Kleegr.',
        placement: 'top',
      },
    ],
  },
];

export function getFlow(id: string | null | undefined): TutorialFlow | undefined {
  if (!id) return undefined;
  return TUTORIAL_FLOWS.find((f) => f.id === id);
}
