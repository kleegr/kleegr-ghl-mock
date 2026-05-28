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
];
const LAST = [
  'Hartwell', 'Okafor', 'Lindqvist', 'Marsh', 'Delgado', 'Whitfield', 'Castellano',
  'Bramwell', 'Nakamura', 'Vance', 'Ferraro', 'Holloway', 'Quintero', 'Eastwood',
  'Beaumont', 'Sandoval', 'Calloway', 'Rosseau', 'Albright', 'Mercer', 'Voss',
  'Pennington', 'Ashby', 'Carrick', 'Lowell', 'Bishop', 'Ravensdale', 'Thorne',
];
const COMPANIES = [
  'Brightline Dental', 'Peak Form Fitness', 'Aster Realty Group', 'Coastal HVAC Co',
  'Verde Landscaping', 'Lumen Med Spa', 'Ironclad Roofing', 'Nimbus Marketing',
  'Harbor Law Partners', 'Sprout Pediatrics', 'Apex Auto Detail', 'Willow Wellness',
  'Granite Home Loans', 'Tidewater Plumbing', 'Sienna Salon', 'Forge Solar',
  'Maple & Co Accounting', 'Drift Surf School', 'Pioneer Pest Control', 'Echo Studio',
];
const INDUSTRIES = ['Healthcare', 'Fitness', 'Real Estate', 'Home Services', 'Legal', 'Marketing', 'Beauty', 'Automotive'];
const SOURCES = ['Facebook Ads', 'Google Ads', 'Website Form', 'Referral', 'Instagram', 'Cold Outreach', 'Walk-in', 'Webinar'];
const TAGS = ['lead', 'hot', 'vip', 'nurture', 'newsletter', 'past-client', 'no-show', 'consult-booked', 'follow-up'];
const AVATAR_COLORS = ['#1f6feb', '#12986a', '#d99111', '#7c3aed', '#d9363e', '#0891b2', '#db2777', '#65a30d'];

const now = () => Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms: number) => new Date(ms).toISOString();

export function generateDemoData(): DemoData {
  const r = rng(20260528); // fixed seed
  const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)];
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

  // ---- Companies ----
  const companies: Company[] = COMPANIES.map((name, i) => ({
    id: `co_${i + 1}`,
    name,
    industry: pick(INDUSTRIES),
    website: `https://${name.toLowerCase().replace(/[^a-z]+/g, '')}.example.com`,
    phone: `+1 (555) 0${int(10, 99)}-0${int(100, 999)}`,
    contactIds: [],
    createdAt: iso(now() - int(120, 700) * DAY),
  }));

  // ---- Contacts ----
  const CONTACT_COUNT = 84;
  const contacts: Contact[] = [];
  for (let i = 0; i < CONTACT_COUNT; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const company = chance(0.7) ? pick(companies) : undefined;
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
      dnd: chance(0.08),
      createdAt: iso(createdAt),
      lastActivityAt: iso(createdAt + int(0, 30) * DAY),
      customFields: { leadScore: int(10, 99), preferredChannel: pick(['SMS', 'Email', 'Phone']) },
    };
    if (company) company.contactIds.push(c.id);
    contacts.push(c);
  }

  // ---- Conversations + Messages ----
  const channels: Conversation['channel'][] = ['sms', 'email', 'webchat', 'facebook', 'instagram', 'whatsapp'];
  const SNIPPETS_IN = [
    'Hi! I saw your ad — do you have any openings this week?',
    'Is the consultation free?', 'What are your prices?', 'Can we reschedule to Friday?',
    'Thanks, that works for me!', 'Do you offer financing?', 'Still interested, sorry for the delay.',
    'Can you send more details?', 'Perfect, see you then.', 'What time do you open?',
  ];
  const SNIPPETS_OUT = [
    'Absolutely! We have a few slots open. Want me to book you in?',
    'Yes — the first consult is completely free.', 'Happy to help! Let me send over our options.',
    'No problem, I moved you to Friday at 2pm.', 'Great, you are all set 🎉',
    'We do! I can send a quick breakdown.', 'No worries at all — whenever works for you.',
    'Just sent it to your email. Let me know if it lands.', 'See you then — text if anything changes.',
    'We open at 9am Mon–Sat.',
  ];
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const convContacts = [...contacts].sort(() => r() - 0.5).slice(0, 18);
  convContacts.forEach((contact, i) => {
    const channel = pick(channels);
    const convId = `conv_${i + 1}`;
    const turns = int(3, 9);
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
      unread: chance(0.4),
      starred: chance(0.15),
      lastMessageAt: iso(t),
      assignedTo: pick(ownerIds),
      messageIds: msgIds,
    });
  });
  conversations.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

  // ---- Pipelines + Opportunities ----
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
  ];
  const opportunities: Opportunity[] = [];
  let oppN = 1;
  pipelines.forEach((p) => {
    const count = p.id === 'pipe_sales' ? 28 : p.id === 'pipe_onboard' ? 14 : 10;
    for (let i = 0; i < count; i++) {
      const contact = pick(contacts);
      // weight toward earlier stages
      const weighted = Math.floor(Math.pow(r(), 1.6) * p.stages.length);
      const stage = p.stages[Math.min(weighted, p.stages.length - 1)];
      const isLastStage = stage.order === p.stages.length - 1;
      const created = now() - int(2, 90) * DAY;
      opportunities.push({
        id: `opp_${oppN++}`,
        name: `${contact.firstName} ${contact.lastName} — ${pick(['Package', 'Retainer', 'Setup', 'Plan', 'Project'])}`,
        contactId: contact.id,
        pipelineId: p.id,
        stageId: stage.id,
        monetaryValue: int(5, 90) * 100,
        status: isLastStage && chance(0.6) ? 'won' : chance(0.08) ? 'lost' : 'open',
        ownerId: pick(ownerIds),
        source: pick(SOURCES),
        createdAt: iso(created),
        updatedAt: iso(created + int(0, 20) * DAY),
      });
    }
  });

  // ---- Calendars + Appointments (clustered around today) ----
  const calendars: Calendar[] = [
    { id: 'cal_discovery', name: 'Discovery Call', color: '#1f6feb' },
    { id: 'cal_demo', name: 'Demo', color: '#12986a' },
    { id: 'cal_consult', name: 'Consultation', color: '#d99111' },
  ];
  const appointments: Appointment[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 46; i++) {
    const dayOffset = int(-10, 18);
    const hour = int(8, 17);
    const cal = pick(calendars);
    const contact = pick(contacts);
    const start = startOfToday.getTime() + dayOffset * DAY + hour * HOUR;
    const past = start < now();
    appointments.push({
      id: `appt_${i + 1}`,
      calendarId: cal.id,
      contactId: contact.id,
      title: `${cal.name} — ${contact.firstName} ${contact.lastName}`,
      startTime: iso(start),
      endTime: iso(start + 30 * 60000),
      status: past ? pick(['showed', 'showed', 'no_show', 'cancelled'] as const) : 'confirmed',
      location: chance(0.5) ? 'Zoom (link in invite)' : 'Office',
    });
  }
  appointments.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

  // ---- Workflows ----
  const workflows: Workflow[] = [
    { id: 'wf_1', name: 'New Lead Follow-up', status: 'published', enrolled: int(120, 480), trigger: 'Form submitted', explanation: 'When a new lead submits a form, send an instant text and a follow-up email, then create a task for the owner.' },
    { id: 'wf_2', name: 'Missed Call Text-Back', status: 'published', enrolled: int(60, 220), trigger: 'Missed call', explanation: 'If a call is missed, automatically text the caller back so no lead goes cold.' },
    { id: 'wf_3', name: 'Appointment Reminder', status: 'published', enrolled: int(200, 600), trigger: 'Appointment booked', explanation: 'Sends SMS + email reminders 24 hours and 1 hour before an appointment.' },
    { id: 'wf_4', name: 'Review Request', status: 'published', enrolled: int(80, 260), trigger: 'Opportunity won', explanation: 'After a deal is won, waits 1 day then asks the client for a Google review.' },
    { id: 'wf_5', name: 'Reactivation Drip', status: 'draft', enrolled: 0, trigger: 'Tag added: past-client', explanation: 'A 3-message drip to win back past clients who have gone quiet.' },
    { id: 'wf_6', name: 'Birthday Greeting', status: 'published', enrolled: int(40, 120), trigger: 'Birthday', explanation: 'Sends a friendly birthday message with a small offer.' },
    { id: 'wf_7', name: 'Abandoned Booking', status: 'draft', enrolled: 0, trigger: 'Booking started', explanation: 'Nudges contacts who started but did not finish booking.' },
    { id: 'wf_8', name: 'Welcome Sequence', status: 'published', enrolled: int(90, 300), trigger: 'Tag added: new-client', explanation: 'Onboards new clients with a welcome series over the first week.' },
  ];

  // ---- Campaigns ----
  const campaigns: Campaign[] = [
    { id: 'cmp_e1', type: 'email', name: 'March Newsletter', status: 'sent', audienceSize: 2140, sentAt: iso(now() - 9 * DAY), metrics: { delivered: 2098, openRate: 0.42, clickRate: 0.07, bounceRate: 0.02 }, content: { subject: 'Spring updates + a little gift inside', body: 'Hi {{first_name}}, here is what is new this month…' } },
    { id: 'cmp_e2', type: 'email', name: 'Spring Promo — 20% Off', status: 'sent', audienceSize: 1580, sentAt: iso(now() - 4 * DAY), metrics: { delivered: 1551, openRate: 0.51, clickRate: 0.14, bounceRate: 0.018 }, content: { subject: '48 hours only: 20% off', body: 'Our biggest offer of the season…' } },
    { id: 'cmp_e3', type: 'email', name: 'Re-engagement', status: 'scheduled', audienceSize: 640, metrics: {}, content: { subject: 'We miss you 👋', body: 'It has been a while — here is 15% to come back.' } },
    { id: 'cmp_e4', type: 'email', name: 'Webinar Invite', status: 'draft', audienceSize: 0, metrics: {}, content: { subject: 'You are invited', body: 'Join our live session…' } },
    { id: 'cmp_s1', type: 'sms', name: 'Flash Sale Blast', status: 'sent', audienceSize: 900, sentAt: iso(now() - 2 * DAY), metrics: { delivered: 889, replyRate: 0.06, optOutRate: 0.011 }, content: { body: 'Flash sale today only — reply YES to claim 🎉' } },
    { id: 'cmp_s2', type: 'sms', name: 'Appointment Nudge', status: 'sent', audienceSize: 320, sentAt: iso(now() - 6 * DAY), metrics: { delivered: 318, replyRate: 0.21, optOutRate: 0.003 }, content: { body: 'Reminder: your appt is tomorrow. Reply C to confirm.' } },
    { id: 'cmp_s3', type: 'sms', name: 'Win-back', status: 'draft', audienceSize: 0, metrics: {}, content: { body: 'We saved your spot — want it back?' } },
  ];

  // ---- Tasks ----
  const TASK_TITLES = ['Call back about quote', 'Send proposal', 'Confirm appointment', 'Follow up on invoice', 'Prep consult notes', 'Email contract', 'Check in', 'Schedule demo'];
  const tasks: Task[] = Array.from({ length: 32 }, (_, i) => {
    const contact = pick(contacts);
    return {
      id: `task_${i + 1}`,
      title: `${pick(TASK_TITLES)} — ${contact.firstName}`,
      dueDate: iso(now() + int(-4, 10) * DAY),
      assigneeId: pick(ownerIds),
      contactId: contact.id,
      priority: pick(['low', 'medium', 'high'] as const),
      status: chance(0.3) ? 'completed' : 'open',
    };
  });

  // ---- Reviews ----
  const REVIEW_TEXT_POS = ['Absolutely fantastic service, highly recommend!', 'The team went above and beyond.', 'Quick, friendly, and professional.', 'Best experience I have had, hands down.'];
  const REVIEW_TEXT_MID = ['Good overall, a couple of small hiccups.', 'Solid service, booking was a little slow.', 'Pretty happy, would come back.'];
  const REVIEW_TEXT_NEG = ['Waited longer than expected.', 'Communication could be better.'];
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

  // ---- Calls ----
  const calls: Call[] = Array.from({ length: 54 }, (_, i) => {
    const contact = pick(contacts);
    const dir = pick(['inbound', 'outbound', 'missed', 'missed'] as const);
    return {
      id: `call_${i + 1}`,
      contactId: contact.id,
      direction: dir,
      durationSec: dir === 'missed' ? 0 : int(20, 600),
      createdAt: iso(now() - int(0, 14) * DAY - int(0, 23) * HOUR),
      voicemailTranscript: dir === 'missed' && chance(0.4) ? 'Hi, this is a callback about my appointment — please ring me back, thanks!' : undefined,
    };
  });
  calls.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // ---- Products + Invoices ----
  const products: Product[] = [
    { id: 'prod_1', name: 'Starter Package', price: 499, type: 'one_time' },
    { id: 'prod_2', name: 'Growth Retainer', price: 1200, type: 'recurring' },
    { id: 'prod_3', name: 'Setup & Onboarding', price: 750, type: 'one_time' },
    { id: 'prod_4', name: 'Premium Plan', price: 2500, type: 'recurring' },
    { id: 'prod_5', name: 'Consultation', price: 150, type: 'one_time' },
    { id: 'prod_6', name: 'Ad Management', price: 900, type: 'recurring' },
  ];
  const invoices: Invoice[] = Array.from({ length: 24 }, (_, i) => {
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
      status: pick(['paid', 'paid', 'sent', 'draft', 'overdue'] as const),
      issuedAt: iso(issued),
      dueAt: iso(issued + 14 * DAY),
      lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });

  // ---- Notifications ----
  const notifications: Notification[] = [
    { id: 'n_1', type: 'new_lead', title: 'New lead', body: 'Ava Hartwell submitted the contact form.', createdAt: iso(now() - 12 * 60000), read: false, link: '/contacts' },
    { id: 'n_2', type: 'missed_call', title: 'Missed call', body: 'Missed call from +1 (555) 814-2231.', createdAt: iso(now() - 55 * 60000), read: false, link: '/phone' },
    { id: 'n_3', type: 'appointment', title: 'Appointment booked', body: 'Demo booked for tomorrow at 10:00 AM.', createdAt: iso(now() - 3 * HOUR), read: false, link: '/calendars' },
    { id: 'n_4', type: 'payment', title: 'Payment received', body: 'Invoice INV-1003 was paid ($1,296).', createdAt: iso(now() - 6 * HOUR), read: true, link: '/payments' },
    { id: 'n_5', type: 'review', title: 'New 5★ review', body: 'A new Google review just came in.', createdAt: iso(now() - 20 * HOUR), read: true, link: '/reputation' },
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
