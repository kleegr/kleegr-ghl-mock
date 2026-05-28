import type {
  Appointment,
  Calendar,
  Call,
  Campaign,
  Company,
  Contact,
  Conversation,
  DemoData,
  ID,
  Invoice,
  LeadSourceDatum,
  Message,
  Notification,
  Opportunity,
  Pipeline,
  Product,
  Review,
  Task,
  User,
  Workflow,
} from '@/types';

/**
 * Deterministic seed generator. Produces internally-consistent, clearly-fake
 * demo data that clusters around "today". Deterministic (seeded PRNG) so
 * resetDemo() always restores the exact same state.
 *
 * RULES (plan §11): no real PII; @example.com emails only; every related
 * record points at a real entity; dates relative to now.
 */

// ---- seeded PRNG (mulberry32) ----
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Ava', 'Liam', 'Maya', 'Noah', 'Sofia', 'Ethan', 'Isla', 'Mason', 'Aria', 'Leo',
  'Nora', 'Kai', 'Zoe', 'Owen', 'Lila', 'Jude', 'Ivy', 'Theo', 'Ruby', 'Felix',
  'Hazel', 'Milo', 'Cleo', 'Arlo', 'Iris', 'Reed', 'June', 'Cole', 'Wren', 'Otis',
  'Carmen', 'Blake', 'Miles', 'Sage', 'Rowan', 'Harper', 'Finn', 'Quinn', 'Piper', 'Cruz',
  'Jasper', 'Violet', 'Eli', 'Stella', 'Dante', 'Luna', 'Remy', 'Nadia', 'Kit', 'Bex',
];
const LAST = [
  'Hartwell', 'Okafor', 'Lindqvist', 'Marsh', 'Delgado', 'Whitfield', 'Castellano',
  'Bramwell', 'Nakamura', 'Vance', 'Ferraro', 'Holloway', 'Quintero', 'Eastwood',
  'Beaumont', 'Sandoval', 'Calloway', 'Rosseau', 'Albright', 'Mercer', 'Voss',
  'Pennington', 'Ashby', 'Carrick', 'Lowell', 'Bishop', 'Ravensdale', 'Thorne',
  'Mcallister', 'Fairchild', 'Weston', 'Osei', 'Takahashi', 'Reyes', 'Nkosi',
  'Petrov', 'Laurent', 'Amaro', 'Sinclair', 'Dupont',
];
const COMPANY_NAMES = [
  'Brightline Dental', 'Peak Form Fitness', 'Aster Realty Group', 'Coastal HVAC Co',
  'Verde Landscaping', 'Lumen Med Spa', 'Ironclad Roofing', 'Nimbus Marketing',
  'Harbor Law Partners', 'Sprout Pediatrics', 'Apex Auto Detail', 'Willow Wellness',
  'Granite Home Loans', 'Tidewater Plumbing', 'Sienna Salon', 'Forge Solar',
  'Maple & Co Accounting', 'Drift Surf School', 'Pioneer Pest Control', 'Echo Studio',
  'Sunrise Orthodontics', 'Vantage Commercial Cleaning', 'Blue Ridge Electrical',
  'Meridian Physical Therapy', 'Shoreline Insurance', 'Ember Bakery',
  'Summit Window Treatments', 'Cascade Digital Marketing', 'Redwood Family Chiro',
  'Lakeside Auto Repair', 'Prairie Wind Photography', 'Harborview Eye Care',
  'Keystone Pool & Spa', 'Wellspring Mental Health', 'Goldleaf Catering',
  'Civic Title & Escrow', 'Trailhead CrossFit', 'Birchwood Landscaping',
  'Nova Med Aesthetics', 'Sterling Financial Planning',
];
const INDUSTRIES = [
  'Healthcare', 'Fitness', 'Real Estate', 'Home Services',
  'Legal', 'Marketing', 'Beauty', 'Automotive', 'Finance', 'Education',
];
const SOURCES = [
  'Facebook Ads', 'Google Ads', 'Website Form', 'Referral',
  'Instagram', 'Cold Outreach', 'Walk-in', 'Webinar',
  'TikTok Ads', 'Email Campaign',
];
const TAGS = [
  'lead', 'hot', 'vip', 'nurture', 'newsletter', 'past-client',
  'no-show', 'consult-booked', 'follow-up', 'new-client',
  'cold', 'upsell-candidate', 'promo-2024', 'high-value',
];

const now = () => Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms: number) => new Date(ms).toISOString();

export function generateDemoData(): DemoData {
  const r = rng(20260528); // fixed seed — do not change
  const pick = <T>(arr: T[]): T => arr[Math.floor(r() * arr.length)];
  const int = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
  const chance = (p: number) => r() < p;

  // ---- Users / staff ----
  const users: User[] = [
    { id: 'u_me', name: 'Jordan Avery', email: 'jordan@kleegr-demo.example.com', avatarColor: '#1f6feb', role: 'admin', phone: '+1 (555) 010-0100', isCurrentUser: true },
    { id: 'u_2', name: 'Priya Raman', email: 'priya@kleegr-demo.example.com', avatarColor: '#12986a', role: 'user', phone: '+1 (555) 010-0102' },
    { id: 'u_3', name: 'Marcus Bell', email: 'marcus@kleegr-demo.example.com', avatarColor: '#d99111', role: 'user', phone: '+1 (555) 010-0103' },
    { id: 'u_4', name: 'Dana Cole', email: 'dana@kleegr-demo.example.com', avatarColor: '#7c3aed', role: 'user', phone: '+1 (555) 010-0104' },
  ];
  const ownerIds = users.map((u) => u.id);

  // ---- Companies (40) ----
  const companies: Company[] = COMPANY_NAMES.map((name, i) => ({
    id: `co_${i + 1}`,
    name,
    industry: pick(INDUSTRIES),
    website: `https://${name.toLowerCase().replace(/[^a-z]+/g, '')}.example.com`,
    phone: `+1 (555) 0${int(10, 99)}-0${int(100, 999)}`,
    contactIds: [] as ID[],
    createdAt: iso(now() - int(60, 800) * DAY),
  }));

  // ---- Contacts (200) ----
  const CONTACT_COUNT = 200;
  const contacts: Contact[] = [];
  for (let i = 0; i < CONTACT_COUNT; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const company = chance(0.65) ? pick(companies) : undefined;
    const createdAt = now() - int(0, 365) * DAY;
    const tagCount = chance(0.6) ? int(2, 3) : 1;
    const tags = Array.from(new Set(Array.from({ length: tagCount }, () => pick(TAGS))));
    const c: Contact = {
      id: `c_${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i > 0 ? i : ''}@example.com`,
      phone: `+1 (555) ${int(200, 989)}-${String(int(0, 9999)).padStart(4, '0')}`,
      companyId: company?.id,
      tags,
      source: pick(SOURCES),
      ownerId: pick(ownerIds),
      dnd: chance(0.07),
      createdAt: iso(createdAt),
      lastActivityAt: iso(createdAt + int(0, 60) * DAY),
      customFields: {
        leadScore: int(5, 99),
        preferredChannel: pick(['SMS', 'Email', 'Phone']),
      },
    };
    if (company) company.contactIds.push(c.id);
    contacts.push(c);
  }

  // ---- Conversations (35) + Messages (8–16 per thread) ----
  const channels: Conversation['channel'][] = [
    'sms', 'email', 'webchat', 'facebook', 'instagram', 'whatsapp', 'call',
  ];
  const SNIPPETS_IN = [
    'Hi! I saw your ad — do you have any openings this week?',
    'Is the consultation free?',
    'What are your prices?',
    'Can we reschedule to Friday?',
    'Thanks, that works for me!',
    'Do you offer financing?',
    'Still interested, sorry for the delay.',
    'Can you send more details?',
    'Perfect, see you then.',
    'What time do you open?',
    'How long does the process take?',
    'Do you have a payment plan?',
    'Is there parking at your office?',
    'I have a few questions before I book.',
    'Can I bring someone with me?',
    'What should I expect from the first session?',
    'Do you take insurance?',
    'What happens if I need to cancel?',
    'Sounds great, I am in!',
    'Actually, can we do Thursday instead?',
  ];
  const SNIPPETS_OUT = [
    'Absolutely! We have a few slots open. Want me to book you in?',
    'Yes — the first consult is completely free.',
    'Happy to help! Let me send over our options.',
    'No problem, I moved you to Friday at 2 PM.',
    'Great, you are all set 🎉',
    'We do! I can send a quick breakdown.',
    'No worries at all — whenever works for you.',
    'Just sent it to your email. Let me know if it lands.',
    'See you then — text if anything changes.',
    'We open at 9 AM Mon–Sat.',
    'Usually about 45–60 minutes for the first visit.',
    'Yes, we offer 3 and 6-month payment plans — no interest.',
    'Plenty of parking in the lot out front.',
    'Happy to answer! What would you like to know?',
    'Of course, bring whoever you like!',
    'We will do an intake, go over your goals, and put together a plan.',
    'We accept most major providers — let me check yours specifically.',
    'Just give us 24 hours notice and we will take care of it.',
    'Wonderful — I will get you confirmed right now.',
    'Thursday works perfectly. I will update your booking.',
  ];
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const CONV_COUNT = 35;
  for (let i = 0; i < CONV_COUNT; i++) {
    const contact = contacts[i % contacts.length];
    const channel = pick(channels);
    const convId = `conv_${i + 1}`;
    const turns = int(8, 16);
    const msgIds: ID[] = [];
    let t = now() - int(0, 10) * DAY - int(0, 12) * HOUR;
    for (let m = 0; m < turns; m++) {
      const inbound = m % 2 === 0;
      const msgId = `msg_${convId}_${m}`;
      const msg: Message = {
        id: msgId,
        conversationId: convId,
        direction: inbound ? 'inbound' : 'outbound',
        channel,
        body: inbound ? pick(SNIPPETS_IN) : pick(SNIPPETS_OUT),
        createdAt: iso(t),
      };
      if (!inbound) {
        msg.status = pick(['delivered', 'read'] as const);
      }
      messages.push(msg);
      msgIds.push(msgId);
      t += int(1, 180) * 60000;
    }
    conversations.push({
      id: convId,
      contactId: contact.id,
      channel,
      unread: chance(0.35),
      starred: chance(0.18),
      lastMessageAt: iso(t),
      assignedTo: pick(ownerIds),
      messageIds: msgIds,
    });
  }
  conversations.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

  // ---- Pipelines (4) + Opportunities (102) ----
  const pipelines: Pipeline[] = [
    {
      id: 'pipe_sales',
      name: 'Sales Pipeline',
      stages: ['New Lead', 'Contacted', 'Consult Booked', 'Proposal Sent', 'Won'].map((name, o) => ({ id: `st_s_${o}`, name, order: o })),
    },
    {
      id: 'pipe_onboard',
      name: 'Client Onboarding',
      stages: ['Welcome', 'Kickoff Call', 'Setup', 'Live'].map((name, o) => ({ id: `st_o_${o}`, name, order: o })),
    },
    {
      id: 'pipe_react',
      name: 'Reactivation',
      stages: ['Identified', 'Outreach', 'Re-engaged'].map((name, o) => ({ id: `st_r_${o}`, name, order: o })),
    },
    {
      id: 'pipe_upsell',
      name: 'Upsell & Renewal',
      stages: ['Candidate', 'Pitched', 'Negotiating', 'Closed'].map((name, o) => ({ id: `st_u_${o}`, name, order: o })),
    },
  ];
  const OPP_LABELS = [
    'Package', 'Retainer', 'Setup', 'Plan', 'Project',
    'Service', 'Bundle', 'Renewal', 'Upgrade', 'Contract',
  ];
  const OPP_VALUES = [99, 199, 299, 499, 750, 999, 1200, 1500, 2000, 2500, 3000, 4500, 6000, 8000];
  const opportunities: Opportunity[] = [];
  let oppN = 1;
  const oppCounts: Record<string, number> = {
    pipe_sales: 42,
    pipe_onboard: 22,
    pipe_react: 18,
    pipe_upsell: 20,
  };
  pipelines.forEach((p) => {
    const count = oppCounts[p.id] ?? 20;
    for (let i = 0; i < count; i++) {
      const contact = pick(contacts);
      const weighted = Math.floor(Math.pow(r(), 1.5) * p.stages.length);
      const stage = p.stages[Math.min(weighted, p.stages.length - 1)];
      const isLastStage = stage.order === p.stages.length - 1;
      const created = now() - int(2, 120) * DAY;
      opportunities.push({
        id: `opp_${oppN++}`,
        name: `${contact.firstName} ${contact.lastName} — ${pick(OPP_LABELS)}`,
        contactId: contact.id,
        pipelineId: p.id,
        stageId: stage.id,
        monetaryValue: pick(OPP_VALUES),
        status: isLastStage && chance(0.65)
          ? 'won'
          : chance(0.07)
          ? 'lost'
          : chance(0.03)
          ? 'abandoned'
          : 'open',
        ownerId: pick(ownerIds),
        source: pick(SOURCES),
        createdAt: iso(created),
        updatedAt: iso(created + int(0, 30) * DAY),
      });
    }
  });

  // ---- Calendars (3) + Appointments (52) ----
  const calendars: Calendar[] = [
    { id: 'cal_discovery', name: 'Discovery Call', color: '#1f6feb' },
    { id: 'cal_demo', name: 'Demo', color: '#12986a' },
    { id: 'cal_consult', name: 'Consultation', color: '#d99111' },
  ];
  const APPT_NOTES: (string | undefined)[] = [
    'Client referred by existing member.',
    'Asked about financing options.',
    'Follow up on previous inquiry.',
    'Needs full audit before proposal.',
    'Prefers video call.',
    'Walk-in — wants same-week slot.',
    undefined,
    undefined,
    undefined,
  ];
  const APPT_LOCATIONS = ['Zoom (link in invite)', 'Office', 'Phone', 'Google Meet'];
  const appointments: Appointment[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 52; i++) {
    const dayOffset = int(-14, 21);
    const hour = int(8, 17);
    const cal = pick(calendars);
    const contact = pick(contacts);
    const start = startOfToday.getTime() + dayOffset * DAY + hour * HOUR;
    const past = start < now();
    const appt: Appointment = {
      id: `appt_${i + 1}`,
      calendarId: cal.id,
      contactId: contact.id,
      title: `${cal.name} — ${contact.firstName} ${contact.lastName}`,
      startTime: iso(start),
      endTime: iso(start + 45 * 60000),
      status: past
        ? pick(['showed', 'showed', 'showed', 'no_show', 'cancelled'] as const)
        : pick(['confirmed', 'confirmed', 'confirmed', 'cancelled'] as const),
      location: pick(APPT_LOCATIONS),
    };
    const note = pick(APPT_NOTES);
    if (note !== undefined) appt.notes = note;
    appointments.push(appt);
  }
  appointments.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  // ---- Workflows (12) ----
  const workflows: Workflow[] = [
    { id: 'wf_1', name: 'New Lead Follow-up', status: 'published', enrolled: int(280, 520), trigger: 'Form submitted', explanation: 'When a new lead submits a form, send an instant text and a follow-up email, then create a task for the owner.' },
    { id: 'wf_2', name: 'Missed Call Text-Back', status: 'published', enrolled: int(140, 280), trigger: 'Missed call', explanation: 'If a call is missed, automatically text the caller back so no lead goes cold.' },
    { id: 'wf_3', name: 'Appointment Reminder', status: 'published', enrolled: int(380, 700), trigger: 'Appointment booked', explanation: 'Sends SMS + email reminders 24 hours and 1 hour before an appointment.' },
    { id: 'wf_4', name: 'Review Request', status: 'published', enrolled: int(90, 240), trigger: 'Opportunity won', explanation: 'After a deal is won, waits 1 day then asks the client for a Google review.' },
    { id: 'wf_5', name: 'Reactivation Drip', status: 'published', enrolled: int(55, 130), trigger: 'Tag added: past-client', explanation: 'A 3-message drip to win back past clients who have gone quiet.' },
    { id: 'wf_6', name: 'Birthday Greeting', status: 'published', enrolled: int(60, 160), trigger: 'Birthday', explanation: 'Sends a friendly birthday message with a small offer.' },
    { id: 'wf_7', name: 'Abandoned Booking', status: 'draft', enrolled: 0, trigger: 'Booking started', explanation: 'Nudges contacts who started but did not finish booking.' },
    { id: 'wf_8', name: 'Welcome Sequence', status: 'published', enrolled: int(110, 360), trigger: 'Tag added: new-client', explanation: 'Onboards new clients with a welcome series over the first week.' },
    { id: 'wf_9', name: 'Upsell Trigger', status: 'published', enrolled: int(40, 110), trigger: 'Tag added: upsell-candidate', explanation: 'Sends a targeted upgrade offer to clients who qualify for a higher-tier service.' },
    { id: 'wf_10', name: 'No-Show Follow-up', status: 'published', enrolled: int(30, 80), trigger: 'Appointment no-show', explanation: 'Automatically reaches out after a missed appointment to reschedule.' },
    { id: 'wf_11', name: 'Invoice Overdue Nudge', status: 'published', enrolled: int(20, 55), trigger: 'Invoice past due', explanation: 'Sends a gentle payment reminder 3 days after invoice due date.' },
    { id: 'wf_12', name: 'Post-Service Survey', status: 'draft', enrolled: 0, trigger: 'Opportunity won', explanation: 'Collects satisfaction feedback 48 hours after service delivery.' },
  ];

  // ---- Campaigns (email: 10, sms: 8) ----
  const campaigns: Campaign[] = [
    { id: 'cmp_e1', type: 'email', name: 'March Newsletter', status: 'sent', audienceSize: 2140, sentAt: iso(now() - 62 * DAY), metrics: { delivered: 2098, openRate: 0.42, clickRate: 0.07, bounceRate: 0.02 }, content: { subject: 'Spring updates + a little gift inside', body: 'Hi {{first_name}}, here is what is new this month…' } },
    { id: 'cmp_e2', type: 'email', name: 'Spring Promo — 20% Off', status: 'sent', audienceSize: 1580, sentAt: iso(now() - 34 * DAY), metrics: { delivered: 1551, openRate: 0.51, clickRate: 0.14, bounceRate: 0.018 }, content: { subject: '48 hours only: 20% off', body: 'Our biggest offer of the season…' } },
    { id: 'cmp_e3', type: 'email', name: 'April Check-In', status: 'sent', audienceSize: 1920, sentAt: iso(now() - 20 * DAY), metrics: { delivered: 1890, openRate: 0.38, clickRate: 0.05, bounceRate: 0.016 }, content: { subject: 'Quick update from our team', body: 'Hi {{first_name}}, just checking in to see how things are going…' } },
    { id: 'cmp_e4', type: 'email', name: 'VIP Early Access', status: 'sent', audienceSize: 340, sentAt: iso(now() - 10 * DAY), metrics: { delivered: 338, openRate: 0.66, clickRate: 0.22, bounceRate: 0.006 }, content: { subject: 'You are on the VIP list 🎉', body: 'As one of our best clients, you get first access…' } },
    { id: 'cmp_e5', type: 'email', name: 'May Product Spotlight', status: 'sent', audienceSize: 1740, sentAt: iso(now() - 5 * DAY), metrics: { delivered: 1710, openRate: 0.44, clickRate: 0.09, bounceRate: 0.017 }, content: { subject: 'Have you tried our Growth Retainer?', body: 'Our most popular recurring plan just got an upgrade…' } },
    { id: 'cmp_e6', type: 'email', name: 'Re-engagement', status: 'scheduled', audienceSize: 640, metrics: {}, content: { subject: 'We miss you 👋', body: 'It has been a while — here is 15% to come back.' } },
    { id: 'cmp_e7', type: 'email', name: 'Webinar Invite', status: 'scheduled', audienceSize: 920, metrics: {}, content: { subject: 'You are invited — live session June 12', body: 'Join us for a 30-minute deep-dive on growing your business…' } },
    { id: 'cmp_e8', type: 'email', name: 'Summer Kickoff', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'Make this summer your best yet', body: 'We are putting together something special for June…' } },
    { id: 'cmp_e9', type: 'email', name: 'Year-End Review', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'How did we do this year?', body: 'Your feedback helps us get better every single day…' } },
    { id: 'cmp_e10', type: 'email', name: 'Referral Program Launch', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'Refer a friend, earn $50 credit', body: 'We are launching our first referral program and you are first to know…' } },
    { id: 'cmp_s1', type: 'sms', name: 'Flash Sale Blast', status: 'sent', audienceSize: 900, sentAt: iso(now() - 28 * DAY), metrics: { delivered: 889, replyRate: 0.06, optOutRate: 0.011 }, content: { body: 'Flash sale today only — reply YES to claim 🎉' } },
    { id: 'cmp_s2', type: 'sms', name: 'Appointment Nudge', status: 'sent', audienceSize: 320, sentAt: iso(now() - 14 * DAY), metrics: { delivered: 318, replyRate: 0.21, optOutRate: 0.003 }, content: { body: 'Reminder: your appt is tomorrow. Reply C to confirm.' } },
    { id: 'cmp_s3', type: 'sms', name: 'May Promo Text', status: 'sent', audienceSize: 1120, sentAt: iso(now() - 7 * DAY), metrics: { delivered: 1101, replyRate: 0.08, optOutRate: 0.009 }, content: { body: 'Hey {{first_name}}, book before May 31 and save 10%! Reply STOP to opt out.' } },
    { id: 'cmp_s4', type: 'sms', name: 'Review Request Blast', status: 'sent', audienceSize: 260, sentAt: iso(now() - 3 * DAY), metrics: { delivered: 258, replyRate: 0.15, optOutRate: 0.004 }, content: { body: 'Hi {{first_name}}! Mind leaving us a quick Google review? Takes 30 seconds 🙏' } },
    { id: 'cmp_s5', type: 'sms', name: 'Win-back', status: 'scheduled', audienceSize: 180, metrics: {}, content: { body: 'We saved your spot — want it back?' } },
    { id: 'cmp_s6', type: 'sms', name: 'New Service Announcement', status: 'scheduled', audienceSize: 840, metrics: {}, content: { body: 'Exciting news — we just launched something new. Reply INFO for details!' } },
    { id: 'cmp_s7', type: 'sms', name: 'Holiday Offer', status: 'draft', audienceSize: 0, metrics: {}, content: { body: 'Happy holidays from our team! Enjoy 20% off through end of month.' } },
    { id: 'cmp_s8', type: 'sms', name: 'Feedback Request', status: 'draft', audienceSize: 0, metrics: {}, content: { body: 'Quick question — how did your last visit go? Reply 1-5 to rate us.' } },
  ];

  // ---- Tasks (45) ----
  const TASK_TITLES = [
    'Call back about quote', 'Send proposal', 'Confirm appointment',
    'Follow up on invoice', 'Prep consult notes', 'Email contract',
    'Check in after service', 'Schedule demo', 'Send welcome packet',
    'Update contact record', 'Review intake form', 'Book follow-up call',
    'Send payment link', 'Verify address on file', 'Add to nurture sequence',
  ];
  const TASK_DESCS: (string | undefined)[] = [
    'Client expressed strong interest — priority follow-up.',
    'Waiting on signed contract before proceeding.',
    'Left voicemail, try again in 2 days.',
    'Confirm payment method before appointment.',
    undefined,
    undefined,
    undefined,
  ];
  const tasks: Task[] = Array.from({ length: 45 }, (_, i) => {
    const contact = pick(contacts);
    const t: Task = {
      id: `task_${i + 1}`,
      title: `${pick(TASK_TITLES)} — ${contact.firstName}`,
      dueDate: iso(now() + int(-7, 14) * DAY),
      assigneeId: pick(ownerIds),
      contactId: contact.id,
      priority: pick(['low', 'medium', 'medium', 'high'] as const),
      status: chance(0.35) ? 'completed' : 'open',
    };
    const desc = pick(TASK_DESCS);
    if (desc !== undefined) t.description = desc;
    return t;
  });

  // ---- Reviews (34) ----
  const REVIEW_TEXT_POS = [
    'Absolutely fantastic service, highly recommend!',
    'The team went above and beyond.',
    'Quick, friendly, and professional — 5 stars without question.',
    'Best experience I have had. Will definitely be back.',
    'Incredibly smooth from start to finish.',
    'They really listened and delivered exactly what I needed.',
    'Outstanding results. My expectations were exceeded.',
  ];
  const REVIEW_TEXT_MID = [
    'Good overall, a couple of small hiccups.',
    'Solid service, booking was a little slow.',
    'Pretty happy with the outcome — would come back.',
    'Good value for the price. Minor room for improvement.',
  ];
  const REVIEW_TEXT_NEG = [
    'Waited longer than expected.',
    'Communication could be better.',
    'Service was fine but follow-up was lacking.',
  ];
  const REPLY_TEXTS = [
    'Thank you so much for the kind words!',
    'We really appreciate your feedback — glad we could help!',
    'Your support means the world to us. Hope to see you again soon!',
    'Thanks for taking the time to share this. We are always here if you need us.',
  ];
  const reviews: Review[] = Array.from({ length: 34 }, (_, i) => {
    const rating = (
      chance(0.65) ? 5 : chance(0.55) ? 4 : chance(0.5) ? 3 : chance(0.5) ? 2 : 1
    ) as Review['rating'];
    const text =
      rating >= 4
        ? pick(REVIEW_TEXT_POS)
        : rating === 3
        ? pick(REVIEW_TEXT_MID)
        : pick(REVIEW_TEXT_NEG);
    const replied = chance(0.55);
    return {
      id: `rev_${i + 1}`,
      source: chance(0.68) ? 'google' : 'facebook',
      rating,
      author: `${pick(FIRST)} ${pick(LAST)[0]}.`,
      text,
      createdAt: iso(now() - int(0, 180) * DAY),
      replied,
      replyText: replied ? pick(REPLY_TEXTS) : undefined,
    };
  });

  // ---- Calls (68) ----
  const VOICEMAIL_SNIPPETS = [
    'Hi, this is a callback about my appointment — please ring me back, thanks!',
    'Hey, I was calling to get a quote. Give me a call when you get a chance.',
    'Hi there, I had a question about the invoice. Thanks.',
    'Just checking in — feel free to call me back at your convenience.',
    'Hi, I am interested in the starter package. Please give me a ring.',
  ];
  const calls: Call[] = Array.from({ length: 68 }, (_, i) => {
    const contact = pick(contacts);
    const dir = pick(['inbound', 'outbound', 'outbound', 'missed', 'missed'] as const);
    return {
      id: `call_${i + 1}`,
      contactId: contact.id,
      direction: dir,
      durationSec: dir === 'missed' ? 0 : int(15, 900),
      createdAt: iso(now() - int(0, 21) * DAY - int(0, 23) * HOUR),
      voicemailTranscript:
        dir === 'missed' && chance(0.38) ? pick(VOICEMAIL_SNIPPETS) : undefined,
    };
  });
  calls.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // ---- Products (15) + Invoices (36) ----
  const products: Product[] = [
    { id: 'prod_1', name: 'Starter Package', price: 499, type: 'one_time' },
    { id: 'prod_2', name: 'Growth Retainer', price: 1200, type: 'recurring' },
    { id: 'prod_3', name: 'Setup & Onboarding', price: 750, type: 'one_time' },
    { id: 'prod_4', name: 'Premium Plan', price: 2500, type: 'recurring' },
    { id: 'prod_5', name: 'Consultation', price: 150, type: 'one_time' },
    { id: 'prod_6', name: 'Ad Management', price: 900, type: 'recurring' },
    { id: 'prod_7', name: 'Website Build', price: 1800, type: 'one_time' },
    { id: 'prod_8', name: 'SEO Booster', price: 650, type: 'recurring' },
    { id: 'prod_9', name: 'Social Media Bundle', price: 550, type: 'recurring' },
    { id: 'prod_10', name: 'Email Automation Setup', price: 400, type: 'one_time' },
    { id: 'prod_11', name: 'CRM Migration', price: 350, type: 'one_time' },
    { id: 'prod_12', name: 'Review Management', price: 299, type: 'recurring' },
    { id: 'prod_13', name: 'Sales Funnel Design', price: 1200, type: 'one_time' },
    { id: 'prod_14', name: 'Enterprise Plan', price: 4500, type: 'recurring' },
    { id: 'prod_15', name: 'Strategy Session', price: 250, type: 'one_time' },
  ];
  const invoices: Invoice[] = Array.from({ length: 36 }, (_, i) => {
    const contact = pick(contacts);
    const lineCount = int(1, 3);
    const lineItems = Array.from({ length: lineCount }, () => {
      const prod = pick(products);
      const qty = int(1, 2);
      return { productId: prod.id, name: prod.name, qty, unitPrice: prod.price };
    });
    const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const tax = Math.round(subtotal * 0.08);
    const issued = now() - int(0, 90) * DAY;
    return {
      id: `inv_${i + 1}`,
      number: `INV-${1000 + i}`,
      contactId: contact.id,
      status: pick(['paid', 'paid', 'paid', 'sent', 'draft', 'overdue'] as const),
      issuedAt: iso(issued),
      dueAt: iso(issued + 14 * DAY),
      lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });

  // ---- Notifications (15) ----
  const notifications: Notification[] = [
    { id: 'n_1', type: 'new_lead', title: 'New lead', body: 'Ava Hartwell submitted the contact form.', createdAt: iso(now() - 12 * 60000), read: false, link: '/contacts' },
    { id: 'n_2', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 814-2231.', createdAt: iso(now() - 55 * 60000), read: false, link: '/phone' },
    { id: 'n_3', type: 'appointment', title: 'Appointment booked', body: 'Demo booked for tomorrow at 10:00 AM.', createdAt: iso(now() - 3 * HOUR), read: false, link: '/calendars' },
    { id: 'n_4', type: 'payment', title: 'Payment received', body: 'Invoice INV-1003 was paid ($1,296).', createdAt: iso(now() - 6 * HOUR), read: true, link: '/payments' },
    { id: 'n_5', type: 'review', title: 'New 5★ review', body: 'A new Google review just came in.', createdAt: iso(now() - 20 * HOUR), read: true, link: '/reputation' },
    { id: 'n_6', type: 'new_lead', title: 'New lead', body: 'Milo Vance submitted the website form.', createdAt: iso(now() - 2 * HOUR), read: false, link: '/contacts' },
    { id: 'n_7', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 322-8874.', createdAt: iso(now() - 4 * HOUR), read: false, link: '/phone' },
    { id: 'n_8', type: 'appointment', title: 'Appointment cancelled', body: 'Ruby Ferraro cancelled her 2:00 PM consult.', createdAt: iso(now() - 5 * HOUR), read: true, link: '/calendars' },
    { id: 'n_9', type: 'payment', title: 'Invoice overdue', body: 'INV-1017 is 3 days past due ($750).', createdAt: iso(now() - 1 * DAY), read: false, link: '/payments' },
    { id: 'n_10', type: 'review', title: 'New 4★ review', body: 'A new Facebook review — solid service.', createdAt: iso(now() - 1 * DAY - 3 * HOUR), read: true, link: '/reputation' },
    { id: 'n_11', type: 'new_lead', title: 'New lead', body: 'Theo Carrick booked a discovery call.', createdAt: iso(now() - 2 * DAY), read: true, link: '/contacts' },
    { id: 'n_12', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 501-9943.', createdAt: iso(now() - 2 * DAY - 2 * HOUR), read: true, link: '/phone' },
    { id: 'n_13', type: 'appointment', title: 'Appointment confirmed', body: 'Iris Lowell confirmed her 11:00 AM session.', createdAt: iso(now() - 3 * DAY), read: true, link: '/calendars' },
    { id: 'n_14', type: 'payment', title: 'Payment received', body: 'Invoice INV-1021 was paid ($2,700).', createdAt: iso(now() - 3 * DAY - 1 * HOUR), read: true, link: '/payments' },
    { id: 'n_15', type: 'review', title: 'New 5★ review', body: 'Another 5-star Google review from Cleo Ashby.', createdAt: iso(now() - 4 * DAY), read: true, link: '/reputation' },
  ];

  // ---- Lead sources (for dashboard chart) ----
  const leadSources: LeadSourceDatum[] = SOURCES.map((source) => ({
    source,
    value: contacts.filter((c) => c.source === source).length,
  }));

  return {
    users, companies, contacts, conversations, messages, pipelines, opportunities,
    calendars, appointments, workflows, campaigns, tasks, reviews, calls, products,
    invoices, notifications, leadSources,
  };
}
