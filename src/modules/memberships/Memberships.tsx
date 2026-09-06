/**
 * Memberships — client portal, courses, communities, events, and credentials.
 * The demo mirrors Kleegr's workspace while keeping every record fictional.
 */
import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Copy,
  GraduationCap,
  Link2,
  Mail,
  MoreVertical,
  Plus,
  Send,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Avatar, Badge, Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';

const MEMBERSHIP_TABS: ModuleHeaderTab[] = [
  { id: 'portal', label: 'Client Portal⌄' },
  { id: 'courses', label: 'Courses⌄' },
  { id: 'communities', label: 'Communities⌄' },
  { id: 'events', label: 'Events' },
  { id: 'credentials', label: 'Credentials⌄' },
  { id: 'marketplace', label: 'Gokollab Marketplace' },
];

type Notify = (title: string, description: string) => void;

function PortalHero({ notify }: { notify: Notify }) {
  return (
    <button type="button" onClick={() => notify('White-label mobile app', 'The mobile app overview would open in the live account.')} className="relative flex min-h-[158px] w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#cf78a1] via-[#a58cc5] to-[#62afe0] px-9 py-7 text-left text-white shadow-card">
      <div className="relative z-10 max-w-[370px]"><p className="text-[30px] font-semibold tracking-[-0.02em]">Your Brand. Your App.</p><p className="mt-2 max-w-sm text-[15px] leading-6 text-white/95">Launch your white-label app with courses and communities</p></div>
      <div className="absolute bottom-[-22px] right-32 hidden h-[180px] items-end gap-5 lg:flex">
        {[['Courses', '#fee8ef'], ['Community', '#fff4c8'], ['Events', '#dceeff']].map(([label, color], index) => (
          <div key={label} className="h-[165px] w-[104px] rounded-[18px] border-[5px] border-white bg-white p-2 shadow-xl" style={{ transform: `rotate(${index === 0 ? -8 : index === 2 ? 8 : 2}deg)` }}>
            <div className="h-20 rounded-lg" style={{ background: color }}><Smartphone className="m-auto pt-6 text-[#516079]" size={29} /></div><p className="mt-3 text-center text-[9px] font-semibold text-[#233047]">{label}</p><div className="mx-auto mt-2 h-2 w-12 rounded-full bg-[#dbe3ed]" />
          </div>
        ))}
      </div>
      <span className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-semibold text-[#43526b] shadow md:flex">Learn More <ArrowUpRight size={14} /></span>
    </button>
  );
}

function PortalAction({ icon, title, description, onClick }: { icon: ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[88px] items-center gap-3 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-brand/40 hover:bg-[#fbfdff]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{icon}</span>
      <span><span className="block text-sm font-semibold text-ink">{title}</span><span className="mt-1 block text-[11px] leading-4 text-ink-muted">{description}</span></span>
    </button>
  );
}

function ClientPortalDashboard({ notify }: { notify: Notify }) {
  return (
    <div className="space-y-5">
      <PortalHero notify={notify} />
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-[29px] font-medium tracking-[-0.02em] text-ink">Dashboard</h2><p className="text-sm text-ink-muted">Manage your client portal activities</p></div><Button onClick={() => notify('New client portal preview', 'A safe preview would open here in the full Kleegr account.')}><Badge tone="brand" className="border border-white/40 bg-white/15 text-white">New</Badge>Try the new client portal<ArrowUpRight size={15} /></Button></div>
      <section className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <h3 className="text-lg font-medium text-ink">Creating a protected online gateway for client interactions</h3>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="rounded-xl bg-[#f8f9fb] p-6"><p className="text-lg font-medium text-ink">What is a client portal?</p><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Your clients can log in anytime to access courses, community updates, files, and account resources.</p><p className="mt-6 text-lg font-medium text-ink">Client portal URL</p><button type="button" onClick={() => notify('Portal URL copied', 'The fictional demo portal URL was copied locally.')} className="mt-3 flex items-center gap-2 text-sm font-medium text-brand">https://demo.app.clientclub.net/ <Copy size={15} /></button></div>
          <div className="grid gap-4"><div className="rounded-xl border border-line p-5 shadow-card"><p className="text-xs text-ink-muted">Invited</p><p className="mt-2 text-4xl font-semibold text-ink">24</p></div><div className="rounded-xl border border-line p-5 shadow-card"><p className="text-xs text-ink-muted">Users</p><p className="mt-2 text-4xl font-semibold text-ink">86</p></div></div>
        </div>
        <div className="mt-6"><p className="mb-3 text-sm font-medium text-ink">Actions</p><div className="grid gap-3 md:grid-cols-3"><PortalAction icon={<Link2 size={18} />} title="Generate magic link" description="Create a one-time portal access link." onClick={() => notify('Magic link generated', 'A fictional portal access link is ready in the demo.')} /><PortalAction icon={<Users size={18} />} title="Invite to client portal" description="Choose contacts and send an invitation." onClick={() => notify('Invite panel opened', 'No message is sent from this public demo.')} /><PortalAction icon={<Mail size={18} />} title="Send login email" description="Help an existing member sign in again." onClick={() => notify('Login email preview', 'The email stays inside the public demo.')} /></div></div>
      </section>
    </div>
  );
}

function MiniLineChart({ color = '#2583d8' }: { color?: string }) {
  return (
    <svg viewBox="0 0 260 82" className="mt-5 h-[82px] w-full" aria-hidden="true"><defs><linearGradient id={`fade-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d="M0 67 C22 61, 36 70, 55 53 S91 43, 112 51 S147 31, 170 38 S205 17, 228 28 S247 16, 260 10 L260 82 L0 82 Z" fill={`url(#fade-${color.replace('#', '')})`} /><path d="M0 67 C22 61, 36 70, 55 53 S91 43, 112 51 S147 31, 170 38 S205 17, 228 28 S247 16, 260 10" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /></svg>
  );
}

function CoursesDashboard({ notify }: { notify: Notify }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between"><div><p className="text-sm text-ink-muted">Welcome!</p><h2 className="mt-1 text-xl font-semibold text-ink">Avery Morgan — Demo Admin</h2></div><button type="button" className="text-xs text-ink-muted">Last 30 days⌄</button></div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-brand bg-[#f8fbff] px-4 py-3 text-sm text-brand"><span className="flex items-center gap-2"><Sparkles size={17} />You are viewing sample data. Create a course to begin tracking actual data.</span><div className="flex gap-2"><Button size="sm" onClick={() => notify('Course builder opened', 'The demo course builder would start here.')}><Plus size={15} />Create Course</Button><Button variant="secondary" size="sm" onClick={() => notify('Sample data preserved', 'Sample data remains visible for demo visitors.')}>Clear Sample Data</Button></div></div>
      <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-line bg-surface p-5 shadow-card"><div className="flex items-start justify-between"><div><p className="text-xs text-ink-muted">Course enrollments</p><p className="mt-1 text-2xl font-semibold text-ink">286</p></div><Badge tone="good">+18%</Badge></div><MiniLineChart /></div><div className="rounded-xl border border-line bg-surface p-5 shadow-card"><div className="flex items-start justify-between"><div><p className="text-xs text-ink-muted">Lesson completion</p><p className="mt-1 text-2xl font-semibold text-ink">72%</p></div><Badge tone="good">+6.4%</Badge></div><MiniLineChart color="#7b61d1" /></div></div>
      <div className="rounded-xl bg-[#0a0a0d] px-6 py-7 text-center text-white"><p className="text-sm">Bring Your Ideas to Life. Start Creating Your First Course Today!</p><Button variant="secondary" size="sm" className="mt-4 border-white/30 bg-white text-ink" onClick={() => notify('Course builder opened', 'Choose a fictional template to begin.')}><Plus size={15} />Create Course</Button></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[['Revenue generated', '$67,890', '+33%'], ['Average order value', '$2,121.56', '+5.2%'], ['Course orders', '142', '+14%'], ['Active learners', '238', '+9%']].map(([label, value, change]) => <div key={label} className="rounded-xl border border-line bg-surface p-4 shadow-card"><p className="text-xs text-ink-muted">{label}</p><p className="mt-3 text-xl font-semibold text-ink">{value}</p><p className="mt-2 text-xs font-semibold text-good">▲ {change}</p></div>)}</div>
    </div>
  );
}

const COMMUNITY_ROWS = [
  { name: 'Kleegr Growth Circle', members: 184, posts: 38, activity: 'Active now', color: 'from-[#7157d9] to-[#3ba9dd]' },
  { name: 'Client Success Hub', members: 92, posts: 17, activity: '12 min ago', color: 'from-[#ec7d96] to-[#f6aa55]' },
  { name: 'Workshop Alumni', members: 64, posts: 9, activity: '2 hr ago', color: 'from-[#45a887] to-[#5bc8c4]' },
];

function CommunitiesDashboard({ notify }: { notify: Notify }) {
  return (
    <div><div className="flex items-center justify-between"><div><h2 className="text-[28px] font-medium text-ink">Communities</h2><p className="mt-1 text-sm text-ink-muted">Bring members together around your brand.</p></div><Button onClick={() => notify('New community', 'The community setup panel would open here.')}><Plus size={15} />New community</Button></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{COMMUNITY_ROWS.map((community) => <button key={community.name} type="button" onClick={() => notify(community.name, 'This fictional community is ready to explore in the demo.')} className="overflow-hidden rounded-xl border border-line bg-surface text-left shadow-card transition-transform hover:-translate-y-0.5"><div className={`h-24 bg-gradient-to-r ${community.color}`} /><div className="p-5"><div className="flex items-start justify-between"><div><p className="font-semibold text-ink">{community.name}</p><p className="mt-1 text-xs text-good">● {community.activity}</p></div><MoreVertical size={17} className="text-ink-muted" /></div><div className="mt-5 flex gap-6 border-t border-line pt-4 text-xs text-ink-muted"><span><strong className="block text-base text-ink">{community.members}</strong>Members</span><span><strong className="block text-base text-ink">{community.posts}</strong>Posts this month</span></div></div></button>)}</div></div>
  );
}

function EventsDashboard({ notify }: { notify: Notify }) {
  const events = [
    ['Growth Systems Workshop', 'Sep 18, 2026 · 1:00 PM', 'Online', '86 registered'],
    ['Customer Success Roundtable', 'Sep 24, 2026 · 11:30 AM', 'Community room', '42 registered'],
    ['Quarterly Strategy Session', 'Oct 3, 2026 · 10:00 AM', 'Online', '118 registered'],
    ['Local Business Meetup', 'Oct 12, 2026 · 6:00 PM', 'Demo venue', '57 registered'],
  ];
  return (
    <div>
      <div className="flex items-center justify-between"><div><h2 className="text-[28px] font-medium text-ink">Events</h2><p className="mt-1 text-sm text-ink-muted">Create member events and manage registrations.</p></div><Button onClick={() => notify('New event', 'A fictional event editor would open here.')}><Plus size={15} />Create event</Button></div>
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line bg-[#f8f9fb] text-xs text-ink-muted"><th className="px-5 py-3 font-semibold">Event</th><th className="px-5 py-3 font-semibold">Date & time</th><th className="px-5 py-3 font-semibold">Location</th><th className="px-5 py-3 font-semibold">Registrations</th><th className="w-12" /></tr></thead>
          <tbody>{events.map(([name, date, place, registered]) => (
            <tr key={name} onClick={() => notify(name, 'This event detail stays local to the demo.')} className="cursor-pointer border-b border-line last:border-0 hover:bg-[#f8fbff]">
              <td className="px-5 py-4 font-medium text-ink"><button type="button" onClick={(event) => { event.stopPropagation(); notify(name, 'This event detail stays local to the demo.'); }} className="flex w-full items-center gap-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><CalendarDays size={17} /></span>{name}</button></td>
              <td className="px-5 py-4 text-ink-muted">{date}</td><td className="px-5 py-4 text-ink-muted">{place}</td><td className="px-5 py-4"><Badge tone="brand">{registered}</Badge></td><td><MoreVertical size={16} className="text-ink-muted" /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function CredentialsDashboard({ notify }: { notify: Notify }) {
  const credentials = [['Growth Foundations', '84 issued', '#3f8dd8'], ['Client Success Specialist', '37 issued', '#825bd2'], ['Automation Builder', '29 issued', '#2b9b7b']];
  return (
    <div><div className="flex items-center justify-between"><div><h2 className="text-[28px] font-medium text-ink">Credentials</h2><p className="mt-1 text-sm text-ink-muted">Recognize course milestones with branded certificates.</p></div><Button onClick={() => notify('Create credential', 'The certificate designer would open here.')}><Plus size={15} />Create credential</Button></div><div className="mt-6 grid gap-4 md:grid-cols-3">{credentials.map(([name, issued, color]) => <button key={name} type="button" onClick={() => notify(name, 'This fictional certificate template would open in the designer.')} className="rounded-xl border border-line bg-surface p-5 text-left shadow-card hover:border-brand/40"><div className="grid h-44 place-items-center rounded-lg border border-dashed border-line bg-[#fafbfd]"><div className="text-center"><Award size={46} className="mx-auto" style={{ color }} /><p className="mt-3 text-sm font-semibold text-ink">Certificate of Completion</p><p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-ink-subtle">Demo Academy</p></div></div><p className="mt-4 font-semibold text-ink">{name}</p><p className="mt-1 text-xs text-ink-muted">{issued}</p></button>)}</div></div>
  );
}

function MarketplaceDashboard({ notify }: { notify: Notify }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"><div className="grid min-h-[430px] gap-8 bg-gradient-to-br from-[#edf7ff] via-white to-[#f7efff] p-10 lg:grid-cols-[1fr_440px]"><div className="self-center"><Badge tone="warn">New</Badge><h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.03em] text-ink">Reach more learners with the Gokollab Marketplace</h2><p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">Publish fictional demo courses, showcase your expertise, and give members a simple place to discover what comes next.</p><Button className="mt-7" onClick={() => notify('Marketplace setup', 'The marketplace activation guide would open here.')}><Sparkles size={16} />Explore marketplace</Button></div><div className="grid place-items-center"><div className="relative h-72 w-full max-w-sm rounded-[28px] bg-[#102653] p-7 text-white shadow-2xl"><GraduationCap size={40} className="text-[#55c0e5]" /><p className="mt-8 text-2xl font-semibold">Discover. Learn. Grow.</p><div className="mt-7 grid grid-cols-2 gap-3">{['Marketing', 'Sales', 'Leadership', 'Automation'].map((item) => <div key={item} className="rounded-lg bg-white/10 px-3 py-3 text-xs">{item}</div>)}</div><span className="absolute -right-5 -top-5 grid h-14 w-14 place-items-center rounded-full bg-[#f2bc3e] text-[#102653] shadow-lg"><Award size={27} /></span></div></div></div></div>
  );
}

export function Memberships() {
  const pushToast = useStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState('portal');
  const notify: Notify = (title, description) => pushToast({ title, description, variant: 'info' });

  return (
    <div className="min-h-full bg-surface-sunken" data-tour="memberships.page">
      <ModuleHeader title="Memberships" tabs={MEMBERSHIP_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="p-6">{activeTab === 'portal' ? <ClientPortalDashboard notify={notify} /> : null}{activeTab === 'courses' ? <CoursesDashboard notify={notify} /> : null}{activeTab === 'communities' ? <CommunitiesDashboard notify={notify} /> : null}{activeTab === 'events' ? <EventsDashboard notify={notify} /> : null}{activeTab === 'credentials' ? <CredentialsDashboard notify={notify} /> : null}{activeTab === 'marketplace' ? <MarketplaceDashboard notify={notify} /> : null}</main>
    </div>
  );
}
