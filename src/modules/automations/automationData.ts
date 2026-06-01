/**
 * automationData.ts — DEMO-ONLY catalogs & derived display data for the
 * Automations / Workflows module.
 *
 * Everything here is cosmetic, in-memory, and never persisted. No real
 * triggers/actions fire, no API calls are made. These structures back the
 * screenshot-faithful Workflows list, Overview dashboard, and Builder pickers.
 *
 * The catalogs are intentionally small and educational: each picker item
 * carries a category, a one-line explanation, and an example use case so a
 * first-time demo visitor understands what every trigger and action does.
 */
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft, Award, Banknote, BarChart3, Bell, BellOff, BookOpen, Bot,
  Briefcase, Building2, Cake, Calculator, CalendarCheck, CalendarClock,
  CalendarPlus, CheckSquare, CircleDollarSign, ClipboardList, Clock, Code2,
  CreditCard, FileCheck2, FileSignature, FileSpreadsheet, FileText, Flag,
  GitBranch, Globe, GraduationCap, Hash, Link2, ListChecks, Mail, MailOpen,
  Megaphone, MessageCircle, MessageSquare, MessagesSquare, MousePointerClick,
  Phone, PhoneCall, PhoneMissed, Plus, Receipt, Repeat, Share2, ShoppingCart,
  Sparkles, Split, StickyNote, Star, Tag, Timer, Type, Upload, UserCheck,
  UserCog, UserMinus, UserPlus, UserSearch, Users, Variable, Video, Voicemail,
  Wand2, Webhook, Workflow, Zap,
} from 'lucide-react';

/* ── Picker catalogs (Add Trigger / Add Action panels) ─────────────────── */

export interface CatalogItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Short category tag shown under the item name. */
  category?: string;
  /** One-line "what this does" explanation. */
  desc?: string;
  /** Example use case shown in the picker. */
  example?: string;
}
export interface CatalogGroup {
  id: string;
  label: string;
  items: CatalogItem[];
  defaultOpen?: boolean;
}

/**
 * Add-Trigger panel groups — modelled on HighLevel's live Workflow Builder
 * trigger library (categories: Contact, Events, Appointments, Opportunities,
 * Payments, Social & Ads, Memberships). The trigger names mirror the real
 * catalog (see help.gohighlevel.com "A List of Workflow Triggers"); all
 * descriptions/examples are original. Demo-only — nothing actually fires.
 */
export const TRIGGER_GROUPS: CatalogGroup[] = [
  {
    id: 'recommended',
    label: 'Suggested',
    defaultOpen: true,
    items: [
      { id: 'form_submitted', label: 'Form Submitted', icon: FileText, category: 'Events', desc: 'Starts the workflow when a contact submits one of your forms.', example: 'e.g. follow up the instant someone completes your "Free Quote" form.' },
      { id: 'customer_replied', label: 'Customer Replied', icon: MessagesSquare, category: 'Events', desc: 'Starts when a contact replies on any connected channel.', example: 'e.g. stop a drip the moment someone texts back.' },
      { id: 'missed_call', label: 'Missed Call', icon: PhoneMissed, category: 'Events', desc: 'Starts when an inbound call goes unanswered.', example: 'e.g. text back every caller you could not reach.' },
      { id: 'appointment_status', label: 'Appointment Status', icon: CalendarClock, category: 'Appointments', desc: 'Starts when an appointment is booked or its status changes.', example: 'e.g. send reminders, then recover no-shows.' },
      { id: 'opportunity_stage', label: 'Pipeline Stage Changed', icon: GitBranch, category: 'Opportunities', desc: 'Starts when a deal moves to a different pipeline stage.', example: 'e.g. follow up when a deal enters "Follow-Up".' },
      { id: 'contact_created', label: 'Contact Created', icon: UserPlus, category: 'Contact', desc: 'Starts when a new contact is added in any way.', example: 'e.g. send a welcome text to every new contact.' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    defaultOpen: true,
    items: [
      { id: 'contact_created', label: 'Contact Created', icon: UserPlus, category: 'Contact', desc: 'Fires when a new contact record is added to the CRM.', example: 'e.g. welcome every brand-new lead automatically.' },
      { id: 'contact_changed', label: 'Contact Changed', icon: UserCog, category: 'Contact', desc: 'Fires when chosen contact fields change to the values you set.', example: 'e.g. re-segment when lifecycle stage changes.' },
      { id: 'tag_added', label: 'Contact Tag', icon: Tag, category: 'Contact', desc: 'Fires when a selected tag is added to or removed from a contact.', example: 'e.g. begin onboarding when "new-client" is added.' },
      { id: 'birthday_reminder', label: 'Birthday Reminder', icon: Cake, category: 'Contact', desc: 'Fires around a contact birthday using the offset you choose.', example: 'e.g. send a birthday greeting with a small offer.' },
      { id: 'custom_date_reminder', label: 'Custom Date Reminder', icon: CalendarClock, category: 'Contact', desc: 'Fires before, on, or after a custom date field on the contact.', example: 'e.g. nudge 30 days before a policy renews.' },
      { id: 'contact_dnd', label: 'Contact DND', icon: BellOff, category: 'Contact', desc: 'Fires when a contact Do-Not-Disturb preference is turned on or off.', example: 'e.g. pause outreach the moment a contact opts out.' },
      { id: 'note_added', label: 'Note Added', icon: StickyNote, category: 'Contact', desc: 'Fires when a new note is added to a contact.', example: 'e.g. alert a manager when a support note is logged.' },
      { id: 'task_reminder', label: 'Task Reminder', icon: CheckSquare, category: 'Contact', desc: 'Fires when a task reminder time is reached.', example: 'e.g. ping the owner when a call-back is due.' },
      { id: 'task_completed', label: 'Task Completed', icon: ListChecks, category: 'Contact', desc: 'Fires when a task on the contact is marked complete.', example: 'e.g. advance onboarding once setup is done.' },
      { id: 'engagement_score', label: 'Contact Engagement Score', icon: BarChart3, category: 'Contact', desc: 'Fires when a contact engagement score meets your rule.', example: 'e.g. flag a hot lead once the score passes 80.' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    items: [
      { id: 'form_submitted_evt', label: 'Form Submitted', icon: FileText, category: 'Events', desc: 'Fires when one of your HighLevel forms is submitted.', example: 'e.g. route "Contact Us" leads straight to sales.' },
      { id: 'survey_submitted', label: 'Survey Submitted', icon: ClipboardList, category: 'Events', desc: 'Fires when a selected survey is submitted.', example: 'e.g. score and tag respondents automatically.' },
      { id: 'quiz_submitted', label: 'Quiz Submitted', icon: ListChecks, category: 'Events', desc: 'Fires when a selected quiz is submitted.', example: 'e.g. branch on the quiz result to tailor follow-up.' },
      { id: 'trigger_link_clicked', label: 'Trigger Link Clicked', icon: MousePointerClick, category: 'Events', desc: 'Fires when the contact clicks a defined trigger link.', example: 'e.g. mark interest when a pricing link is clicked.' },
      { id: 'email_events', label: 'Email Events', icon: MailOpen, category: 'Events', desc: 'Fires on email delivered, opened, clicked, bounced, or unsubscribed.', example: 'e.g. resend with a new subject after a non-open.' },
      { id: 'call_details', label: 'Call Status', icon: PhoneCall, category: 'Events', desc: 'Fires when a call log matches the outcomes you select.', example: 'e.g. follow up after a completed sales call.' },
      { id: 'inbound_webhook', label: 'Inbound Webhook', icon: Webhook, category: 'Events', desc: 'Fires when data is received at the workflow webhook URL.', example: 'e.g. start a flow from an external lead source.' },
      { id: 'scheduler', label: 'Scheduler', icon: Timer, category: 'Events', desc: 'Fires on a time-based schedule, no contact required.', example: 'e.g. run a weekly clean-up every Monday at 6am.' },
      { id: 'page_view', label: 'Funnel / Website Page View', icon: Globe, category: 'Events', desc: 'Fires when the contact views a chosen page, URL, or UTM.', example: 'e.g. re-engage visitors who hit the pricing page.' },
      { id: 'conversation_ai_trigger', label: 'Conversation AI', icon: Bot, category: 'Events', desc: 'Fires when a configured Conversation AI event occurs.', example: 'e.g. hand off to a human when AI detects intent to buy.' },
      { id: 'video_tracking', label: 'Video Tracking', icon: Video, category: 'Events', desc: 'Fires when a viewer reaches a chosen percentage of a video.', example: 'e.g. follow up with viewers who watched 75%.' },
      { id: 'custom_trigger', label: 'Custom Trigger', icon: Zap, category: 'Events', desc: 'Fires from a custom event you define for non-standard cases.', example: 'e.g. start from another workflow or an app event.' },
    ],
  },
  {
    id: 'appointments',
    label: 'Appointments',
    items: [
      { id: 'appointment_status_appt', label: 'Appointment Status', icon: CalendarClock, category: 'Appointments', desc: 'Fires on status changes like booked, rescheduled, cancelled, or no-show.', example: 'e.g. send reminders and recover no-shows.' },
      { id: 'appointment_booked', label: 'Customer Booked Appointment', icon: CalendarCheck, category: 'Appointments', desc: 'Fires when a customer books an appointment.', example: 'e.g. send prep instructions right after booking.' },
      { id: 'service_booking', label: 'Service Booking', icon: CalendarPlus, category: 'Appointments', desc: 'Fires when a booking is made through Services.', example: 'e.g. confirm and assign the right specialist.' },
    ],
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    items: [
      { id: 'opportunity_created', label: 'Opportunity Created', icon: Briefcase, category: 'Opportunities', desc: 'Fires when a new opportunity (deal) is created.', example: 'e.g. assign and notify on every new deal.' },
      { id: 'opportunity_status', label: 'Opportunity Status Changed', icon: GitBranch, category: 'Opportunities', desc: 'Fires when an opportunity status changes (Open, Won, Lost).', example: 'e.g. trigger a win-back when a deal is marked Lost.' },
      { id: 'opportunity_stage_opp', label: 'Pipeline Stage Changed', icon: GitBranch, category: 'Opportunities', desc: 'Fires when an opportunity moves to a different pipeline stage.', example: 'e.g. keep deals moving when they enter "Follow-Up".' },
      { id: 'opportunity_changed', label: 'Opportunity Changed', icon: ArrowRightLeft, category: 'Opportunities', desc: 'Fires when selected opportunity fields change.', example: 'e.g. re-route when deal value crosses a threshold.' },
      { id: 'stale_opportunity', label: 'Stale Opportunities', icon: Clock, category: 'Opportunities', desc: 'Fires when opportunities meet your inactivity rule.', example: 'e.g. nudge deals untouched for 7 days.' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    items: [
      { id: 'invoice_paid', label: 'Invoice', icon: Receipt, category: 'Payments', desc: 'Fires on invoice events like created, sent, due, or paid.', example: 'e.g. send a receipt and start onboarding when paid.' },
      { id: 'payment_received', label: 'Payment Received', icon: CircleDollarSign, category: 'Payments', desc: 'Fires when a payment is successfully captured.', example: 'e.g. grant access the moment payment clears.' },
      { id: 'order_submitted', label: 'Order Submitted', icon: ShoppingCart, category: 'Payments', desc: 'Fires when an order is submitted at checkout.', example: 'e.g. send fulfilment details after an order.' },
      { id: 'subscription', label: 'Subscription', icon: Repeat, category: 'Payments', desc: 'Fires on subscription create, trial-to-active, pause, or cancel.', example: 'e.g. run a save flow when a subscription cancels.' },
      { id: 'refund', label: 'Refund', icon: Banknote, category: 'Payments', desc: 'Fires when a refund is issued.', example: 'e.g. send a confirmation and log the reason.' },
      { id: 'estimates', label: 'Estimates', icon: FileText, category: 'Payments', desc: 'Fires on estimate events like sent, accepted, or declined.', example: 'e.g. follow up the day after an estimate is sent.' },
      { id: 'documents_contracts', label: 'Documents & Contracts', icon: FileSignature, category: 'Payments', desc: 'Fires on document events like sent, signed, or declined.', example: 'e.g. kick off onboarding once a contract is signed.' },
    ],
  },
  {
    id: 'social',
    label: 'Social & Ads',
    items: [
      { id: 'fb_lead_form', label: 'Facebook Lead Form Submitted', icon: Megaphone, category: 'Social & Ads', desc: 'Fires when a Facebook lead-ad form submission is received.', example: 'e.g. respond to Facebook leads within seconds.' },
      { id: 'google_lead_form', label: 'Google Lead Form Submitted', icon: Megaphone, category: 'Social & Ads', desc: 'Fires when a Google Ads lead form submission is received.', example: 'e.g. auto-assign Google leads to a rep.' },
      { id: 'tiktok_form', label: 'TikTok Form Submitted', icon: Megaphone, category: 'Social & Ads', desc: 'Fires when a TikTok lead form is submitted.', example: 'e.g. text TikTok leads a booking link.' },
      { id: 'fb_comment', label: 'Facebook — Comment on a Post', icon: MessageCircle, category: 'Social & Ads', desc: 'Fires when a comment is added to a selected Facebook post.', example: 'e.g. auto-DM commenters a coupon.' },
      { id: 'ig_comment', label: 'Instagram — Comment on a Post', icon: MessageCircle, category: 'Social & Ads', desc: 'Fires when a comment is added to a selected Instagram post.', example: 'e.g. reply and DM the link they asked for.' },
      { id: 'whatsapp_ads', label: 'Click to WhatsApp Ads', icon: MessageSquare, category: 'Social & Ads', desc: 'Fires when an inbound WhatsApp thread starts from a click-to-WhatsApp ad.', example: 'e.g. greet and qualify the new WhatsApp lead.' },
    ],
  },
  {
    id: 'memberships',
    label: 'Memberships & Reviews',
    items: [
      { id: 'new_signup', label: 'New Signup', icon: GraduationCap, category: 'Memberships', desc: 'Fires when a user signs up for a course or offer.', example: 'e.g. send login details and a welcome lesson.' },
      { id: 'lesson_completed', label: 'Lesson Completed', icon: BookOpen, category: 'Memberships', desc: 'Fires when a learner completes a lesson.', example: 'e.g. unlock the next module and celebrate progress.' },
      { id: 'offer_access', label: 'Offer Access Granted', icon: Award, category: 'Memberships', desc: 'Fires when access to an offer is granted.', example: 'e.g. start a fulfilment sequence for new members.' },
      { id: 'group_access', label: 'Group Access Granted', icon: Users, category: 'Communities', desc: 'Fires when a member is granted access to a group.', example: 'e.g. welcome a member to the community space.' },
      { id: 'certificate_issued', label: 'Certificate Issued', icon: Award, category: 'Certificates', desc: 'Fires when a course certificate is generated.', example: 'e.g. email the certificate and request a review.' },
      { id: 'review_received', label: 'New Review Received', icon: Star, category: 'Reputation', desc: 'Fires when a new review arrives in Reputation.', example: 'e.g. notify the team and thank the reviewer.' },
    ],
  },
];

/**
 * Add-Action panel groups — modelled on HighLevel's live Workflow Builder
 * action library (categories: Communication, Contact, Opportunities,
 * Appointments, Logic & Timing, AI, Payments, Send Data, Courses &
 * Communities). Action names mirror the real catalog (see help.gohighlevel.com
 * "A List of Workflow Actions"); descriptions/examples are original.
 */
export const ACTION_GROUPS: CatalogGroup[] = [
  {
    id: 'communication',
    label: 'Communication',
    defaultOpen: true,
    items: [
      { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, category: 'Communication', desc: 'Texts the contact from your business number.', example: 'e.g. instant reply to a brand-new lead.' },
      { id: 'send_email', label: 'Send Email', icon: Mail, category: 'Communication', desc: 'Sends a templated email to the contact.', example: 'e.g. a branded booking confirmation.' },
      { id: 'call', label: 'Call', icon: PhoneCall, category: 'Communication', desc: 'Dials the contact and, on answer, connects an assigned user.', example: 'e.g. auto-dial hot leads and ring the rep.' },
      { id: 'voicemail', label: 'Ringless Voicemail', icon: Voicemail, category: 'Communication', desc: 'Drops a pre-recorded voicemail without ringing the phone.', example: 'e.g. leave a friendly reminder the night before.' },
      { id: 'whatsapp', label: 'Send WhatsApp', icon: MessageSquare, category: 'Communication', desc: 'Sends a WhatsApp message to the contact.', example: 'e.g. confirm a booking on WhatsApp.' },
      { id: 'messenger', label: 'Messenger', icon: MessageCircle, category: 'Communication', desc: 'Sends a Facebook Messenger message to the contact.', example: 'e.g. reply to an inbound Messenger lead.' },
      { id: 'instagram_dm', label: 'Instagram DM', icon: MessageCircle, category: 'Communication', desc: 'Sends an Instagram direct message to the contact.', example: 'e.g. DM the link a commenter requested.' },
      { id: 'slack', label: 'Send Slack Message', icon: Hash, category: 'Internal', desc: 'Posts a message to a connected Slack channel.', example: 'e.g. alert #sales when a big deal lands.' },
      { id: 'gmb_messaging', label: 'GMB Messaging', icon: MessageSquare, category: 'Communication', desc: 'Replies to a Google Business Profile message.', example: 'e.g. respond to a maps enquiry automatically.' },
      { id: 'send_notification', label: 'Send Internal Notification', icon: Bell, category: 'Internal', desc: 'Alerts an assigned user in-app or by email.', example: 'e.g. notify the rep about a missed call.' },
      { id: 'request_review', label: 'Send Review Request', icon: Star, category: 'Reputation', desc: 'Sends a Google review link by SMS or email.', example: 'e.g. ask for a review after a completed visit.' },
      { id: 'manual_call', label: 'Manual Call', icon: Phone, category: 'Communication', desc: 'Adds a manual call task for a user to complete.', example: 'e.g. queue a personal call for top leads.' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    defaultOpen: true,
    items: [
      { id: 'create_contact', label: 'Create Contact', icon: UserPlus, category: 'Contact', desc: 'Creates a new contact record.', example: 'e.g. capture a referred friend.' },
      { id: 'find_contact', label: 'Find Contact', icon: UserSearch, category: 'Contact', desc: 'Looks up a contact to use later in the workflow.', example: 'e.g. match an inbound reply to an existing record.' },
      { id: 'update_contact_field', label: 'Update Contact Field', icon: UserCog, category: 'Contact', desc: 'Updates a field on the contact record.', example: 'e.g. set lifecycle stage to "Customer".' },
      { id: 'add_tag', label: 'Add Contact Tag', icon: Tag, category: 'Contact', desc: 'Adds a tag to the contact.', example: 'e.g. tag "missed-call" for reporting.' },
      { id: 'remove_tag', label: 'Remove Contact Tag', icon: Tag, category: 'Contact', desc: 'Removes a tag from the contact.', example: 'e.g. clear "lead" once they convert.' },
      { id: 'assign_user', label: 'Assign to User', icon: UserCheck, category: 'Contact', desc: 'Assigns the contact to a team member.', example: 'e.g. round-robin new leads to sales.' },
      { id: 'remove_assigned_user', label: 'Remove Assigned User', icon: UserMinus, category: 'Contact', desc: 'Clears the assigned user from the contact.', example: 'e.g. release a lead back to the pool.' },
      { id: 'add_note', label: 'Add Note', icon: StickyNote, category: 'Contact', desc: 'Writes an internal note on the contact record.', example: 'e.g. log why the contact entered this flow.' },
      { id: 'create_task', label: 'Add Task', icon: CheckSquare, category: 'Tasks', desc: 'Creates a task with a due date and an owner.', example: 'e.g. a "Call back" task due in 15 minutes.' },
      { id: 'edit_conversation', label: 'Edit Conversation', icon: MessagesSquare, category: 'Contact', desc: 'Marks, archives, or unarchives the conversation.', example: 'e.g. auto-archive once the flow finishes.' },
      { id: 'dnd_toggle', label: 'Enable / Disable DND', icon: BellOff, category: 'Contact', desc: 'Turns Do-Not-Disturb on or off for the contact.', example: 'e.g. pause all outbound after they opt out.' },
      { id: 'engagement_score_mod', label: 'Modify Engagement Score', icon: BarChart3, category: 'Contact', desc: 'Adjusts the contact engagement score.', example: 'e.g. +25 for clicking a key link.' },
    ],
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    items: [
      { id: 'create_opportunity', label: 'Create / Update Opportunity', icon: Briefcase, category: 'Opportunities', desc: 'Opens or updates a deal in a pipeline stage.', example: 'e.g. create a deal when a lead form is submitted.' },
      { id: 'move_opportunity', label: 'Move Opportunity Stage', icon: ArrowRightLeft, category: 'Opportunities', desc: 'Moves a deal to a different pipeline stage.', example: 'e.g. advance to "No-Show / Re-engage".' },
      { id: 'remove_opportunity', label: 'Remove Opportunity', icon: Briefcase, category: 'Opportunities', desc: 'Removes the deal from one or more pipelines.', example: 'e.g. drop lost deals out of the active board.' },
    ],
  },
  {
    id: 'appointments',
    label: 'Appointments',
    items: [
      { id: 'update_appointment', label: 'Update Appointment Status', icon: CalendarCheck, category: 'Appointments', desc: 'Sets an appointment status such as confirmed, no-show, or completed.', example: 'e.g. mark Completed to start the review flow.' },
      { id: 'booking_link', label: 'Generate Booking Link', icon: CalendarPlus, category: 'Appointments', desc: 'Creates a one-time booking link to send the contact.', example: 'e.g. text a protected link to reschedule.' },
    ],
  },
  {
    id: 'logic',
    label: 'Logic & Timing',
    items: [
      { id: 'if_else', label: 'If / Else', icon: Split, category: 'Logic', desc: 'Branches the workflow based on a condition.', example: 'e.g. only continue for contacts marked no-show.' },
      { id: 'wait', label: 'Wait', icon: Clock, category: 'Logic', desc: 'Pauses the workflow for a set time or until an event.', example: 'e.g. wait until 24 hours before an appointment.' },
      { id: 'goal_event', label: 'Goal Event', icon: Flag, category: 'Logic', desc: 'Jumps contacts ahead when they hit a goal.', example: 'e.g. skip reminders once they book.' },
      { id: 'split_test', label: 'Split (A/B Test)', icon: GitBranch, category: 'Logic', desc: 'Randomly splits contacts to compare two paths.', example: 'e.g. test two subject lines 50/50.' },
      { id: 'go_to', label: 'Go To Step', icon: ArrowRightLeft, category: 'Logic', desc: 'Sends the contact to another step or workflow.', example: 'e.g. hand off to the nurture workflow.' },
      { id: 'remove_from_workflow', label: 'Remove from Workflow', icon: Workflow, category: 'Logic', desc: 'Removes the contact from this or another workflow.', example: 'e.g. stop a drip once they reply.' },
      { id: 'drip_mode', label: 'Drip Mode', icon: Timer, category: 'Logic', desc: 'Releases contacts through the flow in batches.', example: 'e.g. send to 50 contacts per hour.' },
      { id: 'math_operation', label: 'Math Operation', icon: Calculator, category: 'Logic', desc: 'Performs a calculation and stores the result.', example: 'e.g. add loyalty points to a custom field.' },
      { id: 'text_formatter', label: 'Format Data (Text)', icon: Type, category: 'Logic', desc: 'Transforms text into a chosen format.', example: 'e.g. title-case a name before sending.' },
      { id: 'update_custom_value', label: 'Update Custom Value', icon: Variable, category: 'Logic', desc: 'Updates an account or contact custom value.', example: 'e.g. refresh the current promo code.' },
      { id: 'custom_code', label: 'Custom Code', icon: Code2, category: 'Logic', desc: 'Runs a custom code step for advanced logic.', example: 'e.g. transform a payload from a webhook.' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      { id: 'conversation_ai', label: 'Conversation AI', icon: Bot, category: 'AI', desc: 'Lets an AI agent handle the inbound conversation.', example: 'e.g. answer FAQs and book the meeting.' },
      { id: 'ai_prompt', label: 'AI Prompt', icon: Sparkles, category: 'AI', desc: 'Generates an AI response from a prompt you write.', example: 'e.g. draft a personalised follow-up line.' },
      { id: 'ai_summarize', label: 'AI Summarize', icon: Wand2, category: 'AI', desc: 'Summarises a conversation or notes into a few lines.', example: 'e.g. summarise the call before assigning.' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    items: [
      { id: 'send_invoice', label: 'Send Invoice', icon: Receipt, category: 'Payments', desc: 'Sends a HighLevel invoice to the contact.', example: 'e.g. invoice automatically when a deal is won.' },
      { id: 'stripe_charge', label: 'Stripe One-Time Charge', icon: CreditCard, category: 'Payments', desc: 'Charges a one-time fee via connected Stripe.', example: 'e.g. collect a deposit on booking.' },
      { id: 'send_documents', label: 'Send Documents & Contracts', icon: FileSignature, category: 'Payments', desc: 'Sends a document or contract from a template.', example: 'e.g. send the agreement after a verbal yes.' },
    ],
  },
  {
    id: 'send_data',
    label: 'Send Data & Marketing',
    items: [
      { id: 'webhook', label: 'Webhook', icon: Webhook, category: 'Send Data', desc: 'Sends workflow data to an external service.', example: 'e.g. push the new lead to your data warehouse.' },
      { id: 'google_sheets', label: 'Google Sheets', icon: FileSpreadsheet, category: 'Send Data', desc: 'Adds or updates a row in a Google Sheet.', example: 'e.g. log every booking to a tracking sheet.' },
      { id: 'ga_event', label: 'Add to Google Analytics', icon: BarChart3, category: 'Marketing', desc: 'Sends an event to Google Analytics.', example: 'e.g. record a conversion for reporting.' },
      { id: 'fb_audience', label: 'Add to Custom Audience', icon: Megaphone, category: 'Marketing', desc: 'Adds the contact to a Facebook custom audience.', example: 'e.g. retarget new leads with an offer.' },
      { id: 'fb_capi', label: 'Facebook Conversion API', icon: Share2, category: 'Marketing', desc: 'Sends conversion data to Facebook for ad tracking.', example: 'e.g. attribute a purchase back to the ad.' },
    ],
  },
  {
    id: 'courses',
    label: 'Courses & Communities',
    items: [
      { id: 'grant_offer', label: 'Grant Course Offer', icon: GraduationCap, category: 'Courses', desc: 'Grants a course or offer to the contact.', example: 'e.g. unlock the course the moment they pay.' },
      { id: 'revoke_offer', label: 'Revoke Course Offer', icon: GraduationCap, category: 'Courses', desc: 'Revokes a previously granted course or offer.', example: 'e.g. remove access after a refund.' },
      { id: 'grant_group', label: 'Grant Group Access', icon: Users, category: 'Communities', desc: 'Grants access to a community group.', example: 'e.g. add new members to the VIP space.' },
      { id: 'revoke_group', label: 'Revoke Group Access', icon: Users, category: 'Communities', desc: 'Removes access to a community group.', example: 'e.g. revoke access when membership lapses.' },
    ],
  },
];

/* ── AI "What do you want to automate?" panel ──────────────────────────── */

export interface AiChip { id: string; label: string; icon: LucideIcon; tone: 'brand' | 'good' | 'bad'; }
export const AI_CHIPS: AiChip[] = [
  { id: 'lead_nurturing', label: 'Lead Nurturing', icon: UserPlus, tone: 'brand' },
  { id: 'form_automation', label: 'Form Automation', icon: FileText, tone: 'good' },
  { id: 'email_campaigns', label: 'Email Campaigns', icon: Mail, tone: 'bad' },
];

/** Rotating placeholder prompts shown in the AI composer (purely cosmetic). */
export const AI_PROMPTS: string[] = [
  'When a form is submitted, text the lead, assign a rep, and create a 1-hour call-back task',
  'If appointment status changes to no-show, wait 15 minutes then send an SMS asking to reschedule',
  'One hour after an appointment is completed, ask the client for a Google review by SMS and email',
];

/* ── "Create Workflow" dropdown options ────────────────────────────────── */

export interface CreateOption { id: string; label: string; icon: LucideIcon; }
export const CREATE_OPTIONS: CreateOption[] = [
  { id: 'scratch', label: 'Start from Scratch', icon: Plus },
  { id: 'ai', label: 'Build Using AI', icon: Sparkles },
  { id: 'template', label: 'Select from Template', icon: FileCheck2 },
  { id: 'campaign', label: 'Import from a campaign', icon: Upload },
  { id: 'company', label: 'Company based workflow', icon: Building2 },
  { id: 'urls', label: 'Urls based workflow', icon: Link2 },
];

/* ── Folder row (cosmetic, shown atop the All Workflows list) ──────────── */
/* Kept to a single archive folder so the five live workflows stay the focus. */

export interface FolderRow { id: string; name: string; updated: string; created: string; }
export const FOLDERS: FolderRow[] = [
  { id: 'fld_archives', name: 'Archived Workflows', updated: 'Jan 06 2026, 10:43 AM', created: 'Nov 22 2025, 9:15 AM' },
];

/* ── Workflow templates (New Workflow modal) ───────────────────────────── */

export interface TemplateItem { id: string; name: string; desc: string; }
export const TEMPLATES: TemplateItem[] = [
  { id: 't1', name: 'New Lead Speed-to-Lead', desc: 'Instant text + email, assign a rep, create a task, open the deal.' },
  { id: 't2', name: 'Missed Call Text-Back', desc: 'Instant SMS reply when an inbound call is missed.' },
  { id: 't3', name: 'Appointment Reminder + No-Show', desc: '24h & 1h reminders, then recover no-shows automatically.' },
  { id: 't4', name: 'Review Request', desc: 'Ask for a Google review after a completed appointment.' },
  { id: 't5', name: 'Pipeline Stage Follow-Up', desc: 'Keep deals moving when they enter the Follow-Up stage.' },
  { id: 't6', name: 'Blank Workflow', desc: 'Start from scratch with no steps.' },
];

/* ── Overview (Beta) demo metrics ──────────────────────────────────────── */
/* Scaled to match a five-workflow account: a few hundred enrollments total,
 * tens of new enrollments per week — never thousands. */

export interface EnrollPoint { week: string; value: number; }
export const ENROLLMENT_TREND: EnrollPoint[] = [
  { week: 'Apr 12 - Apr 18', value: 22 },
  { week: 'Apr 19 - Apr 25', value: 35 },
  { week: 'Apr 26 - May 2', value: 28 },
  { week: 'May 3 - May 9', value: 41 },
  { week: 'May 10 - May 16', value: 39 },
  { week: 'May 17 - May 23', value: 53 },
  { week: 'May 24 - May 30', value: 48 },
];

/** Number of actions executed across all workflows in the last 7 days. */
export const ACTIONS_THIS_WEEK = 28;

/** Trigger-match funnel, coherent with ~312 lifetime enrollments. */
export const TRIGGER_ANALYSIS = { attempted: '486', matched: '312', unmatched: '174' };

export interface OverviewError { id: string; name: string; lastError: string; }
export const OVERVIEW_ERRORS: OverviewError[] = [
  { id: 'wf_3', name: 'Appointment Reminder + No-Show Recovery', lastError: 'SMS step failed — invalid phone number · 2 days ago' },
];

/* ── Deterministic demo timestamps ─────────────────────────────────────── */
/* Used only as a fallback when a workflow has no explicit lastUpdatedAt /
 * createdAt. Captured once at module load so displayed strings don't drift. */

const NOW = Date.now();
const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function fmtStamp(d: Date): string {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')} ${d.getFullYear()}, ${h}:${m} ${ampm}`;
}

export function demoTimestamps(seed: string): { updated: string; created: string } {
  const h = hashStr(seed);
  const createdDaysAgo = 45 + (h % 320);
  const updatedDaysAgo = h % 30;
  const created = new Date(NOW - createdDaysAgo * DAY - (h % 18) * 3_600_000);
  const updated = new Date(NOW - updatedDaysAgo * DAY - (h % 11) * 3_600_000);
  return { updated: fmtStamp(updated), created: fmtStamp(created) };
}

/** Deterministic small "active enrolled" demo number derived from id. */
export function demoActiveEnrolled(seed: string, total: number): number {
  if (total === 0) return 0;
  return hashStr(seed) % 5 === 0 ? hashStr(seed) % 4 : 0;
}
