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
 * Deterministic seed generator — Wave 1 / Dev 6 enriched version.
 * Fixed PRNG seed ensures resetDemo() always restores identical state.
 *
 * V1 TARGETS:
 *   Contacts 200 | Companies 48 | Conversations 35 | Messages 8-15/thread
 *   Pipelines 4 | Opportunities ~96 | Calendars 3 | Appointments 55
 *   Workflows 12 | Email campaigns 10 | SMS campaigns 8 | Calls 70
 *   Tasks 45 | Reviews 26 | Invoices 32 | Products 15 | Notifications 15
 */

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
  'Ava','Liam','Maya','Noah','Sofia','Ethan','Isla','Mason','Aria','Leo',
  'Nora','Kai','Zoe','Owen','Lila','Jude','Ivy','Theo','Ruby','Felix',
  'Hazel','Milo','Cleo','Arlo','Iris','Reed','June','Cole','Wren','Otis',
  'Carmen','Blake','Miles','Sage','Rowan','Harper','Finn','Quinn','Piper','Cruz',
  'Jasper','Violet','Eli','Stella','Dante','Luna','Remy','Nadia','Kit','Bex',
];
const LAST = [
  'Hartwell','Okafor','Lindqvist','Marsh','Delgado','Whitfield','Castellano',
  'Bramwell','Nakamura','Vance','Ferraro','Holloway','Quintero','Eastwood',
  'Beaumont','Sandoval','Calloway','Rosseau','Albright','Mercer','Voss',
  'Pennington','Ashby','Carrick','Lowell','Bishop','Ravensdale','Thorne',
  'Mcallister','Fairchild','Weston','Osei','Takahashi','Reyes','Nkosi',
  'Petrov','Laurent','Amaro','Sinclair','Dupont',
];
const COMPANY_NAMES = [
  'Brightline Dental','Peak Form Fitness','Aster Realty Group','Coastal HVAC Co',
  'Verde Landscaping','Lumen Med Spa','Ironclad Roofing','Nimbus Marketing',
  'Harbor Law Partners','Sprout Pediatrics','Apex Auto Detail','Willow Wellness',
  'Granite Home Loans','Tidewater Plumbing','Sienna Salon','Forge Solar',
  'Maple Co Accounting','Drift Surf School','Pioneer Pest Control','Echo Studio',
  'Sunrise Orthodontics','Vantage Commercial Cleaning','Blue Ridge Electrical',
  'Meridian Physical Therapy','Shoreline Insurance','Ember Bakery',
  'Summit Window Treatments','Cascade Digital Marketing','Redwood Family Chiro',
  'Lakeside Auto Repair','Prairie Wind Photography','Harborview Eye Care',
  'Keystone Pool Spa','Wellspring Mental Health','Goldleaf Catering',
  'Civic Title Escrow','Trailhead CrossFit','Birchwood Landscaping',
  'Nova Med Aesthetics','Sterling Financial Planning','Horizon Roofing',
  'Clearview Windows','Compass Property Management','Tidal Wave Car Wash',
  'Elevation Fitness Studio','Oakhurst Veterinary Clinic','Riviera Med Spa',
  'Pixel Pine Photography',
];
const INDUSTRIES = [
  'Healthcare','Fitness','Real Estate','Home Services','Legal','Marketing',
  'Beauty and Wellness','Automotive','Finance','Photography','Education','Veterinary',
];
const SOURCES = ['Facebook Ads','Google Ads','Website Form','Referral','Instagram','Cold Outreach','Walk-in','Webinar'];
const TAGS = ['lead','hot','vip','nurture','newsletter','past-client','no-show','consult-booked','follow-up'];

const now = () => Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms: number) => new Date(ms).toISOString();

export function generateDemoData(): DemoData {
  const r = rng(20260528);
  const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const int = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
  const chance = (p: number) => r() < p;

  const users: User[] = [
    { id: 'u_me', name: 'Jordan Avery', email: 'jordan@kleegr-demo.example.com', avatarColor: '#1f6feb', role: 'admin', phone: '+1 (555) 010-0100', isCurrentUser: true },
    { id: 'u_2', name: 'Priya Raman', email: 'priya@kleegr-demo.example.com', avatarColor: '#12986a', role: 'user', phone: '+1 (555) 010-0102' },
    { id: 'u_3', name: 'Marcus Bell', email: 'marcus@kleegr-demo.example.com', avatarColor: '#d99111', role: 'user', phone: '+1 (555) 010-0103' },
    { id: 'u_4', name: 'Dana Cole', email: 'dana@kleegr-demo.example.com', avatarColor: '#7c3aed', role: 'user', phone: '+1 (555) 010-0104' },
  ];
  const ownerIds = users.map((u) => u.id);

  const companies: Company[] = COMPANY_NAMES.map((name, i) => ({
    id: `co_${i + 1}`,
    name,
    industry: pick(INDUSTRIES),
    website: `https://${name.toLowerCase().replace(/[^a-z]+/g, '')}.example.com`,
    phone: `+1 (555) 0${int(10, 99)}-0${int(100, 999)}`,
    contactIds: [],
    createdAt: iso(now() - int(120, 700) * DAY),
  }));

  const contacts: Contact[] = [];
  for (let i = 0; i < 200; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const company = chance(0.65) ? pick(companies) : undefined;
    const createdAt = now() - int(0, 180) * DAY;
    const tags = Array.from(new Set([pick(TAGS), ...(chance(0.5) ? [pick(TAGS)] : [])]));
    const c: Contact = {
      id: `c_${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+1 (555) ${int(200, 989)}-${String(int(0, 9999)).padStart(4, '0')}`,
      companyId: company?.id,
      tags,
      source: pick(SOURCES),
      ownerId: pick(ownerIds),
      dnd: chance(0.07),
      createdAt: iso(createdAt),
      lastActivityAt: iso(createdAt + int(0, 30) * DAY),
      customFields: { leadScore: int(10, 99), preferredChannel: pick(['SMS', 'Email', 'Phone']) },
    };
    if (company) company.contactIds.push(c.id);
    contacts.push(c);
  }

  const channels: Conversation['channel'][] = ['sms','email','webchat','facebook','instagram','whatsapp'];
  const SNIPPETS_IN = [
    'Hi! I saw your ad - do you have any openings this week?',
    'Is the consultation free?','What are your prices?','Can we reschedule to Friday?',
    'Thanks, that works for me!','Do you offer financing?','Still interested, sorry for the delay.',
    'Can you send more details?','Perfect, see you then.','What time do you open?',
    'Do you have availability next Monday?','How long does the process take?',
    'My friend referred me - is there a referral discount?','Just confirming our appointment tomorrow.',
    'I have a question about the invoice I received.','Can I bring someone with me?',
  ];
  const SNIPPETS_OUT = [
    'Absolutely! We have a few slots open. Want me to book you in?',
    'Yes - the first consult is completely free.','Happy to help! Let me send over our options.',
    'No problem, I moved you to Friday at 2pm.','Great, you are all set!',
    'We do! I can send a quick breakdown.','No worries at all - whenever works for you.',
    'Just sent it to your email. Let me know if it lands.','See you then - text if anything changes.',
    'We open at 9am Mon-Sat.','Monday works - I just booked you for 10am.',
    'Typically 45-60 minutes from start to finish.','Absolutely - we will apply the discount!',
    'Confirmed! See you tomorrow at your scheduled time.','Happy to look into that for you.',
    'Of course, guests are always welcome.',
  ];

  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const contactPool = [...contacts];
  const convContacts: Contact[] = [];
  const usedForConv = new Set<string>();
  for (let i = 0; i < contactPool.length && convContacts.length < 35; i++) {
    const idx = Math.floor(r() * (contactPool.length - i) + i);
    const tmp = contactPool[i]; contactPool[i] = contactPool[idx]; contactPool[idx] = tmp;
    if (!usedForConv.has(contactPool[i].id)) {
      convContacts.push(contactPool[i]);
      usedForConv.add(contactPool[i].id);
    }
  }
  convContacts.forEach((contact, i) => {
    const channel = pick(channels);
    const convId = `conv_${i + 1}`;
    const turns = int(8, 15);
    const msgIds: ID[] = [];
    let t = now() - int(0, 6) * DAY - int(0, 8) * HOUR;
    for (let m = 0; m < turns; m++) {
      const inbound = m % 2 === 0;
      const msgId = `msg_${convId}_${m}`;
      messages.push({
        id: msgId,
        conversationId: convId,
        direction: inbound ? 'inbound' : 'outbound',
        channel,
        body: inbound ? pick(SNIPPETS_IN) : pick(SNIPPETS_OUT),
        createdAt: iso(t),
        status: inbound ? undefined : 'delivered',
      });
      msgIds.push(msgId);
      t += int(2, 90) * 60000;
    }
    conversations.push({
      id: convId,
      contactId: contact.id,
      channel,
      unread: chance(0.38),
      starred: chance(0.15),
      lastMessageAt: iso(t),
      assignedTo: pick(ownerIds),
      messageIds: msgIds,
    });
  });
  conversations.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

  const pipelines: Pipeline[] = [
    {
      id: 'pipe_sales',
      name: 'Kleegr Sales',
      stages: ['New Lead', 'Called 1', 'Called 2', 'Called 3', 'Called 4', 'Nurturing', 'Won']
        .map((name, o) => ({ id: `st_s_${o}`, name, order: o })),
    },
    {
      id: 'pipe_onboard',
      name: 'Onboarding Process',
      stages: ['New Client', 'Welcome Call', 'Account Setup', 'Training', 'Live']
        .map((name, o) => ({ id: `st_o_${o}`, name, order: o })),
    },
    {
      id: 'pipe_react',
      name: 'Phone System',
      stages: ['New Call', 'Voicemail', 'Callback Scheduled', 'Resolved']
        .map((name, o) => ({ id: `st_r_${o}`, name, order: o })),
    },
    {
      id: 'pipe_nurture',
      name: 'Archive',
      stages: ['Archived', 'Closed Lost', 'Do Not Contact']
        .map((name, o) => ({ id: `st_n_${o}`, name, order: o })),
    },
  ];

  // The Phone System pipeline tracks call handling, not deal value, so it reads
  // $0.00 in the real portal (the cards/stage totals already format with cents).
  // Kleegr Sales keeps realistic values so the Dashboard pipeline charts stay alive.
  const ZERO_VALUE_PIPELINES = new Set(['pipe_react']);

  const opportunities: Opportunity[] = [];
  let oppN = 1;
  const pipelineCounts: Record<string, number> = { pipe_sales: 38, pipe_onboard: 22, pipe_react: 18, pipe_nurture: 18 };
  pipelines.forEach((p) => {
    const count = pipelineCounts[p.id] ?? 20;
    const zeroValue = ZERO_VALUE_PIPELINES.has(p.id);
    const isArchive = p.id === 'pipe_nurture';
    for (let i = 0; i < count; i++) {
      const contact = pick(contacts);
      const weighted = Math.floor(Math.pow(r(), 1.6) * p.stages.length);
      const stage = p.stages[Math.min(weighted, p.stages.length - 1)];
      const isLastStage = stage.order === p.stages.length - 1;
      const created = now() - int(2, 90) * DAY;
      const status: Opportunity['status'] = isArchive
        ? (chance(0.5) ? 'lost' : 'abandoned')
        : isLastStage && chance(0.6)
          ? 'won'
          : chance(0.08)
            ? 'lost'
            : 'open';
      opportunities.push({
        id: `opp_${oppN++}`,
        name: zeroValue
          ? `${contact.firstName} ${contact.lastName}`
          : `${contact.firstName} ${contact.lastName} - ${pick(['Package','Retainer','Setup','Plan','Project','Service','Campaign'])}`,
        contactId: contact.id,
        pipelineId: p.id,
        stageId: stage.id,
        monetaryValue: zeroValue ? 0 : int(5, 90) * 100,
        status,
        ownerId: pick(ownerIds),
        source: pick(SOURCES),
        createdAt: iso(created),
        updatedAt: iso(created + int(0, 20) * DAY),
      });
    }
  });

  const calendars: Calendar[] = [
    { id: 'cal_discovery', name: 'Discovery Call', color: '#1f6feb' },
    { id: 'cal_demo', name: 'Demo', color: '#12986a' },
    { id: 'cal_consult', name: 'Consultation', color: '#d99111' },
  ];
  const appointments: Appointment[] = [];
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 55; i++) {
    const dayOffset = int(-12, 20);
    const hour = int(8, 17);
    const cal = pick(calendars);
    const contact = pick(contacts);
    const start = startOfToday.getTime() + dayOffset * DAY + hour * HOUR;
    const past = start < now();
    appointments.push({
      id: `appt_${i + 1}`,
      calendarId: cal.id,
      contactId: contact.id,
      title: `${cal.name} - ${contact.firstName} ${contact.lastName}`,
      startTime: iso(start),
      endTime: iso(start + 30 * 60000),
      status: past ? pick(['showed','showed','no_show','cancelled'] as const) : 'confirmed',
      location: chance(0.55) ? 'Zoom (link in invite)' : 'Office',
    });
  }
  appointments.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  const workflows: Workflow[] = [
    { id: 'wf_1', name: 'New Lead Follow-up', status: 'published', enrolled: int(120, 480), trigger: 'Form submitted', explanation: 'When a new lead submits a form, send an instant text and a follow-up email, then create a task for the owner.' },
    { id: 'wf_2', name: 'Missed Call Text-Back', status: 'published', enrolled: int(60, 220), trigger: 'Missed call', explanation: 'If a call is missed, automatically text the caller back so no lead goes cold.' },
    { id: 'wf_3', name: 'Appointment Reminder', status: 'published', enrolled: int(200, 600), trigger: 'Appointment booked', explanation: 'Sends SMS + email reminders 24 hours and 1 hour before an appointment.' },
    { id: 'wf_4', name: 'Review Request', status: 'published', enrolled: int(80, 260), trigger: 'Opportunity won', explanation: 'After a deal is won, waits 1 day then asks the client for a Google review.' },
    { id: 'wf_5', name: 'Reactivation Drip', status: 'draft', enrolled: 0, trigger: 'Tag added: past-client', explanation: 'A 3-message drip to win back past clients who have gone quiet.' },
    { id: 'wf_6', name: 'Birthday Greeting', status: 'published', enrolled: int(40, 120), trigger: 'Birthday', explanation: 'Sends a friendly birthday message with a small offer.' },
    { id: 'wf_7', name: 'Abandoned Booking', status: 'draft', enrolled: 0, trigger: 'Booking started', explanation: 'Nudges contacts who started but did not finish booking.' },
    { id: 'wf_8', name: 'Welcome Sequence', status: 'published', enrolled: int(90, 300), trigger: 'Tag added: new-client', explanation: 'Onboards new clients with a welcome series over the first week.' },
    { id: 'wf_9', name: 'No-Show Follow-up', status: 'published', enrolled: int(30, 90), trigger: 'Appointment no-show', explanation: 'Sends a re-booking prompt to contacts who missed their appointment.' },
    { id: 'wf_10', name: 'Invoice Overdue Reminder', status: 'published', enrolled: int(20, 80), trigger: 'Invoice overdue', explanation: 'Sends a payment reminder when an invoice passes its due date.' },
    { id: 'wf_11', name: 'New Client Onboarding Checklist', status: 'draft', enrolled: 0, trigger: 'Opportunity moved to Onboarding', explanation: 'Triggers a checklist and welcome email series for newly closed clients.' },
    { id: 'wf_12', name: 'Referral Thank-you', status: 'published', enrolled: int(15, 60), trigger: 'Tag added: referred-by', explanation: 'Sends a thank-you note whenever a new client is tagged as a referral.' },
  ];

  const campaigns: Campaign[] = [
    { id: 'cmp_e1', type: 'email', name: 'March Newsletter', status: 'sent', audienceSize: 2140, sentAt: iso(now() - 9 * DAY), metrics: { delivered: 2098, openRate: 0.42, clickRate: 0.07, bounceRate: 0.02 }, content: { subject: 'Spring updates + a little gift inside', body: 'Hi {{first_name}}, here is what is new this month...' } },
    { id: 'cmp_e2', type: 'email', name: 'Spring Promo 20 Percent Off', status: 'sent', audienceSize: 1580, sentAt: iso(now() - 4 * DAY), metrics: { delivered: 1551, openRate: 0.51, clickRate: 0.14, bounceRate: 0.018 }, content: { subject: '48 hours only: 20% off', body: 'Our biggest offer of the season...' } },
    { id: 'cmp_e3', type: 'email', name: 'Re-engagement Sequence', status: 'scheduled', audienceSize: 640, metrics: {}, content: { subject: 'We miss you', body: 'It has been a while - here is 15% to come back.' } },
    { id: 'cmp_e4', type: 'email', name: 'Webinar Invite', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'You are invited', body: 'Join our live session...' } },
    { id: 'cmp_e5', type: 'email', name: 'VIP Client Update', status: 'sent', audienceSize: 380, sentAt: iso(now() - 18 * DAY), metrics: { delivered: 374, openRate: 0.67, clickRate: 0.22, bounceRate: 0.01 }, content: { subject: 'A personal note for our VIP clients', body: 'Thank you for being with us...' } },
    { id: 'cmp_e6', type: 'email', name: 'Product Feature Spotlight', status: 'sent', audienceSize: 1100, sentAt: iso(now() - 30 * DAY), metrics: { delivered: 1078, openRate: 0.38, clickRate: 0.09, bounceRate: 0.025 }, content: { subject: 'Have you tried this yet?', body: 'This month we want to highlight...' } },
    { id: 'cmp_e7', type: 'email', name: 'Holiday Promo', status: 'sent', audienceSize: 2500, sentAt: iso(now() - 45 * DAY), metrics: { delivered: 2430, openRate: 0.44, clickRate: 0.11, bounceRate: 0.02 }, content: { subject: 'Holiday deals just for you', body: 'Celebrate the season with exclusive savings...' } },
    { id: 'cmp_e8', type: 'email', name: 'Post-Service Survey', status: 'sent', audienceSize: 760, sentAt: iso(now() - 7 * DAY), metrics: { delivered: 748, openRate: 0.35, clickRate: 0.06, bounceRate: 0.015 }, content: { subject: 'How did we do?', body: 'We would love your feedback on your recent experience...' } },
    { id: 'cmp_e9', type: 'email', name: 'Referral Program Launch', status: 'scheduled', audienceSize: 1200, metrics: {}, content: { subject: 'Give 50 Get 50', body: 'Introduce a friend and you both save...' } },
    { id: 'cmp_e10', type: 'email', name: 'End-of-Quarter Recap', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'Q1 highlights + what is coming next', body: 'A look back at what we accomplished together...' } },
    { id: 'cmp_s1', type: 'sms', name: 'Flash Sale Blast', status: 'sent', audienceSize: 900, sentAt: iso(now() - 2 * DAY), metrics: { delivered: 889, replyRate: 0.06, optOutRate: 0.011 }, content: { body: 'Flash sale today only - reply YES to claim' } },
    { id: 'cmp_s2', type: 'sms', name: 'Appointment Nudge', status: 'sent', audienceSize: 320, sentAt: iso(now() - 6 * DAY), metrics: { delivered: 318, replyRate: 0.21, optOutRate: 0.003 }, content: { body: 'Reminder: your appt is tomorrow. Reply C to confirm.' } },
    { id: 'cmp_s3', type: 'sms', name: 'Win-back', status: 'draft', audienceSize: 0, metrics: {}, content: { body: 'We saved your spot - want it back?' } },
    { id: 'cmp_s4', type: 'sms', name: 'Review Request Blast', status: 'sent', audienceSize: 450, sentAt: iso(now() - 12 * DAY), metrics: { delivered: 443, replyRate: 0.08, optOutRate: 0.005 }, content: { body: 'We loved working with you! Mind leaving us a quick review?' } },
    { id: 'cmp_s5', type: 'sms', name: 'New Year Offer', status: 'sent', audienceSize: 1800, sentAt: iso(now() - 55 * DAY), metrics: { delivered: 1762, replyRate: 0.04, optOutRate: 0.012 }, content: { body: 'Happy New Year! Start the year right - reply DEAL for a special offer.' } },
    { id: 'cmp_s6', type: 'sms', name: 'Late Cancellation Follow-up', status: 'sent', audienceSize: 95, sentAt: iso(now() - 3 * DAY), metrics: { delivered: 94, replyRate: 0.32, optOutRate: 0.0 }, content: { body: 'We noticed you missed your appointment. Ready to reschedule? Reply YES.' } },
    { id: 'cmp_s7', type: 'sms', name: 'Summer Special', status: 'scheduled', audienceSize: 1100, metrics: {}, content: { body: 'Summer is here! Book before June 30 and save 15%. Reply INFO.' } },
    { id: 'cmp_s8', type: 'sms', name: 'VIP Early Access', status: 'draft', audienceSize: 0, metrics: {}, content: { body: 'You are on our VIP list - get early access to our new packages. Reply VIP.' } },
  ];

  const TASK_TITLES = [
    'Call back about quote','Send proposal','Confirm appointment','Follow up on invoice',
    'Prep consult notes','Email contract','Check in','Schedule demo',
    'Send onboarding materials','Review service agreement','Follow up on review request',
    'Update contact record','Reschedule missed call',
  ];
  const tasks: Task[] = Array.from({ length: 45 }, (_, i) => {
    const contact = pick(contacts);
    return {
      id: `task_${i + 1}`,
      title: `${pick(TASK_TITLES)} - ${contact.firstName}`,
      dueDate: iso(now() + int(-4, 12) * DAY),
      assigneeId: pick(ownerIds),
      contactId: contact.id,
      priority: pick(['low','medium','high'] as const),
      status: chance(0.28) ? 'completed' : 'open',
    };
  });

  const REVIEW_TEXT_POS = [
    'Absolutely fantastic service, highly recommend!','The team went above and beyond.',
    'Quick, friendly, and professional.','Best experience I have had, hands down.',
    'Super responsive and knowledgeable. Will be back for sure.',
    '5 stars - could not ask for more. Outstanding team!',
  ];
  const REVIEW_TEXT_MID = [
    'Good overall, a couple of small hiccups.','Solid service, booking was a little slow.',
    'Pretty happy, would come back.','Good value, took a bit longer than expected.',
  ];
  const REVIEW_TEXT_NEG = [
    'Waited longer than expected.','Communication could be better.',
    'Had some issues but they did get resolved.',
  ];
  const reviews: Review[] = Array.from({ length: 26 }, (_, i) => {
    const rating = (chance(0.7) ? 5 : chance(0.6) ? 4 : chance(0.6) ? 3 : 2) as Review['rating'];
    const text = rating >= 4 ? pick(REVIEW_TEXT_POS) : rating === 3 ? pick(REVIEW_TEXT_MID) : pick(REVIEW_TEXT_NEG);
    return {
      id: `rev_${i + 1}`,
      source: chance(0.7) ? 'google' : 'facebook',
      rating,
      author: `${pick(FIRST)} ${pick(LAST)[0]}.`,
      text,
      createdAt: iso(now() - int(0, 120) * DAY),
      replied: chance(0.45),
      replyText: chance(0.45) ? 'Thank you so much for the kind words!' : undefined,
    };
  });

  const calls: Call[] = Array.from({ length: 70 }, (_, i) => {
    const contact = pick(contacts);
    const dir = pick(['inbound','outbound','missed','missed'] as const);
    return {
      id: `call_${i + 1}`,
      contactId: contact.id,
      direction: dir,
      durationSec: dir === 'missed' ? 0 : int(20, 600),
      createdAt: iso(now() - int(0, 14) * DAY - int(0, 23) * HOUR),
      voicemailTranscript: dir === 'missed' && chance(0.4) ? 'Hi, this is a callback about my appointment - please ring me back, thanks!' : undefined,
    };
  });
  calls.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const products: Product[] = [
    { id: 'prod_1', name: 'Starter Package', price: 499, type: 'one_time' },
    { id: 'prod_2', name: 'Growth Retainer', price: 1200, type: 'recurring' },
    { id: 'prod_3', name: 'Setup and Onboarding', price: 750, type: 'one_time' },
    { id: 'prod_4', name: 'Premium Plan', price: 2500, type: 'recurring' },
    { id: 'prod_5', name: 'Consultation', price: 150, type: 'one_time' },
    { id: 'prod_6', name: 'Ad Management', price: 900, type: 'recurring' },
    { id: 'prod_7', name: 'Social Media Package', price: 650, type: 'recurring' },
    { id: 'prod_8', name: 'Website Audit', price: 350, type: 'one_time' },
    { id: 'prod_9', name: 'Email Marketing Add-on', price: 400, type: 'recurring' },
    { id: 'prod_10', name: 'CRM Setup', price: 1500, type: 'one_time' },
    { id: 'prod_11', name: 'Reputation Management', price: 300, type: 'recurring' },
    { id: 'prod_12', name: 'Funnel Build', price: 1200, type: 'one_time' },
    { id: 'prod_13', name: 'Annual Plan', price: 9600, type: 'one_time' },
    { id: 'prod_14', name: 'Training Session', price: 200, type: 'one_time' },
    { id: 'prod_15', name: 'SMS Automation Add-on', price: 250, type: 'recurring' },
  ];

  const invoices: Invoice[] = Array.from({ length: 32 }, (_, i) => {
    const contact = pick(contacts);
    const lineCount = int(1, 3);
    const lineItems = Array.from({ length: lineCount }, () => {
      const prod = pick(products);
      const qty = int(1, 2);
      return { productId: prod.id, name: prod.name, qty, unitPrice: prod.price };
    });
    const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const tax = Math.round(subtotal * 0.08);
    const issued = now() - int(0, 60) * DAY;
    return {
      id: `inv_${i + 1}`,
      number: `INV-${1000 + i}`,
      contactId: contact.id,
      status: pick(['paid','paid','sent','draft','overdue'] as const),
      issuedAt: iso(issued),
      dueAt: iso(issued + 14 * DAY),
      lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });

  const notifications: Notification[] = [
    { id: 'n_1', type: 'new_lead', title: 'New lead', body: 'Ava Hartwell submitted the contact form.', createdAt: iso(now() - 12 * 60000), read: false, link: '/contacts' },
    { id: 'n_2', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 814-2231.', createdAt: iso(now() - 55 * 60000), read: false, link: '/phone' },
    { id: 'n_3', type: 'appointment', title: 'Appointment booked', body: 'Demo booked for tomorrow at 10:00 AM.', createdAt: iso(now() - 3 * HOUR), read: false, link: '/calendars' },
    { id: 'n_4', type: 'payment', title: 'Payment received', body: 'Invoice INV-1003 was paid ($1,296).', createdAt: iso(now() - 6 * HOUR), read: true, link: '/payments' },
    { id: 'n_5', type: 'review', title: 'New 5-star review', body: 'A new Google review just came in.', createdAt: iso(now() - 20 * HOUR), read: true, link: '/reputation' },
    { id: 'n_6', type: 'new_lead', title: 'New lead', body: 'Maya Delgado filled out the consultation form.', createdAt: iso(now() - 2 * HOUR), read: false, link: '/contacts' },
    { id: 'n_7', type: 'missed_call', title: 'Missed call', body: 'Missed call from Liam Vance (+1 555 342-7890).', createdAt: iso(now() - 4 * HOUR), read: false, link: '/phone' },
    { id: 'n_8', type: 'appointment', title: 'Appointment confirmed', body: 'Sofia Nakamura confirmed her Discovery Call for Friday.', createdAt: iso(now() - 5 * HOUR), read: true, link: '/calendars' },
    { id: 'n_9', type: 'payment', title: 'Payment received', body: 'Invoice INV-1008 was paid ($2,700).', createdAt: iso(now() - 1 * DAY), read: true, link: '/payments' },
    { id: 'n_10', type: 'review', title: 'New 4-star review', body: 'A new Facebook review from Noah Mercer.', createdAt: iso(now() - 1 * DAY - 2 * HOUR), read: true, link: '/reputation' },
    { id: 'n_11', type: 'new_lead', title: 'New lead', body: 'Ethan Lowell booked a free consultation.', createdAt: iso(now() - 2 * DAY), read: true, link: '/contacts' },
    { id: 'n_12', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 623-4410.', createdAt: iso(now() - 2 * DAY - 3 * HOUR), read: true, link: '/phone' },
    { id: 'n_13', type: 'appointment', title: 'No-show recorded', body: 'Reed Bishop did not attend the 3pm Consultation.', createdAt: iso(now() - 3 * DAY), read: true, link: '/calendars' },
    { id: 'n_14', type: 'payment', title: 'Invoice overdue', body: 'Invoice INV-1015 is now 7 days overdue ($900).', createdAt: iso(now() - 3 * DAY - 4 * HOUR), read: true, link: '/payments' },
    { id: 'n_15', type: 'new_lead', title: 'New lead', body: 'Zoe Whitfield submitted the website chat form.', createdAt: iso(now() - 4 * DAY), read: true, link: '/contacts' },
  ];

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
