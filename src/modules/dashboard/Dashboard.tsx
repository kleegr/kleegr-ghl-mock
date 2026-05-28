import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, MessageSquare, Calendar, CheckSquare, Star,
  TrendingUp, Phone, ArrowRight, Plus, Clock, AlertTriangle,
  CheckCircle2, UserPlus, CalendarPlus, Target, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { PageHeader, Card, CardHeader, Badge, Button } from '@/components/ui/primitives';
import { money, relativeTime, clockTime, fullName } from '@/utils';

const PIE_COLORS = ['#1f6feb', '#12986a', '#d99111', '#7c3aed', '#d9363e', '#0891b2', '#db2777', '#65a30d'];

const ACTIVITY_ICON: Record<string, string> = {
  missed_call: '📵',
  call: '📞',
  conversation: '💬',
  opportunity: '💰',
  appointment: '📅',
  payment: '✅',
  task: '☑️',
};

export function Dashboard() {
  const navigate = useNavigate();
  const opps = useStore((s) => s.opportunities);
  const contacts = useStore((s) => s.contacts);
  const conversations = useStore((s) => s.conversations);
  const tasks = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);
  const invoices = useStore((s) => s.invoices);
  const reviews = useStore((s) => s.reviews);
  const calls = useStore((s) => s.calls);
  const leadSources = useStore((s) => s.leadSources);
  const messages = useStore((s) => s.messages);
  const pipelines = useStore((s) => s.pipelines);
  const users = useStore((s) => s.users);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);
  const todayEnd = useMemo(() => todayStart + 86400000, [todayStart]);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const openOpps = useMemo(() => opps.filter((o) => o.status === 'open'), [opps]);
  const pipelineValue = useMemo(() => openOpps.reduce((s, o) => s + o.monetaryValue, 0), [openOpps]);
  const newContacts30 = useMemo(() =>
    contacts.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 30 * 86400000).length,
    [contacts]);
  const unreadConvs = useMemo(() => conversations.filter((c) => c.unread).length, [conversations]);
  const upcomingAppts = useMemo(() =>
    appointments.filter((a) => new Date(a.startTime).getTime() >= Date.now() && a.status === 'confirmed'),
    [appointments]);
  const openTasks = useMemo(() => tasks.filter((t) => t.status === 'open'), [tasks]);
  const revenueCollected = useMemo(() =>
    invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    [invoices]);
  const avgRating = useMemo(() =>
    reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—',
    [reviews]);

  // ── Today ──────────────────────────────────────────────────────────────
  const apptsTodaySorted = useMemo(() =>
    appointments
      .filter((a) => new Date(a.startTime).getTime() >= todayStart && new Date(a.startTime).getTime() < todayEnd)
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
    [appointments, todayStart, todayEnd]);
  const tasksDueToday = useMemo(() =>
    tasks.filter((t) => {
      const d = new Date(t.dueDate).getTime();
      return d >= todayStart && d < todayEnd && t.status === 'open';
    }), [tasks, todayStart, todayEnd]);
  const overdueTasks = useMemo(() =>
    tasks.filter((t) => new Date(t.dueDate).getTime() < todayStart && t.status === 'open'),
    [tasks, todayStart]);
  const missedCallsToday = useMemo(() =>
    calls.filter((c) => c.direction === 'missed' && Date.now() - new Date(c.createdAt).getTime() < 86400000),
    [calls]);

  // ── Activity Feed ──────────────────────────────────────────────────────
  const activityFeed = useMemo(() => {
    type Item = { id: string; type: string; title: string; sub: string; time: string; color: string };
    const items: Item[] = [];
    calls.slice(0, 8).forEach((c) => {
      const contact = contacts.find((x) => x.id === c.contactId);
      items.push({
        id: c.id,
        type: c.direction === 'missed' ? 'missed_call' : 'call',
        title: c.direction === 'missed'
          ? `Missed call — ${contact ? fullName(contact) : 'Unknown'}`
          : `${c.direction === 'inbound' ? 'Inbound' : 'Outbound'} call (${Math.floor(c.durationSec / 60)}m ${c.durationSec % 60}s)`,
        sub: contact ? fullName(contact) : '',
        time: c.createdAt,
        color: c.direction === 'missed' ? '#d9363e' : '#1f6feb',
      });
    });
    conversations.slice(0, 6).forEach((c) => {
      const contact = contacts.find((x) => x.id === c.contactId);
      const lastMsg = messages.filter((m) => m.conversationId === c.id).at(-1);
      items.push({
        id: `c_${c.id}`,
        type: 'conversation',
        title: `${c.unread ? '● ' : ''}${c.channel.toUpperCase()} message — ${contact ? fullName(contact) : 'Unknown'}`,
        sub: lastMsg ? lastMsg.body.slice(0, 60) : '',
        time: c.lastMessageAt,
        color: '#12986a',
      });
    });
    opps.filter((o) => o.status !== 'open').slice(0, 4).forEach((o) => {
      items.push({
        id: `o_${o.id}`,
        type: 'opportunity',
        title: `Deal ${o.status} — ${o.name}`,
        sub: money(o.monetaryValue),
        time: o.updatedAt,
        color: o.status === 'won' ? '#12986a' : '#d9363e',
      });
    });
    appointments.filter((a) => a.status === 'showed' || a.status === 'no_show').slice(0, 4).forEach((a) => {
      items.push({
        id: `a_${a.id}`,
        type: 'appointment',
        title: `${a.status === 'showed' ? 'Showed' : 'No-show'} — ${a.title}`,
        sub: clockTime(a.startTime),
        time: a.startTime,
        color: a.status === 'showed' ? '#12986a' : '#d99111',
      });
    });
    invoices.filter((i) => i.status === 'paid').slice(0, 3).forEach((inv) => {
      items.push({
        id: `i_${inv.id}`,
        type: 'payment',
        title: `Payment received — ${inv.number}`,
        sub: money(inv.total),
        time: inv.issuedAt,
        color: '#12986a',
      });
    });
    return items.sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 16);
  }, [calls, conversations, opps, appointments, invoices, contacts, messages]);

  // ── Pipeline by stage ─────────────────────────────────────────────────
  const salesPipeline = useMemo(() => {
    const pipe = pipelines.find((p) => p.id === 'pipe_sales');
    if (!pipe) return [];
    return pipe.stages.map((stage) => ({
      name: stage.name,
      value: opps.filter((o) => o.pipelineId === pipe.id && o.stageId === stage.id && o.status === 'open')
        .reduce((s, o) => s + o.monetaryValue, 0),
    }));
  }, [opps, pipelines]);

  const topLeadSources = useMemo(() =>
    leadSources.slice().sort((a, b) => b.value - a.value).slice(0, 7),
    [leadSources]);

  const contactById = (id: string) => contacts.find((c) => c.id === id);

  const ONBOARDING = [
    { id: 'inbox', label: 'Check unread conversations', done: unreadConvs === 0, path: '/conversations' },
    { id: 'tasks', label: 'Clear overdue tasks', done: overdueTasks.length === 0, path: '/tasks' },
    { id: 'appts', label: "Confirm today's appointments", done: apptsTodaySorted.length > 0, path: '/calendars' },
    { id: 'opps', label: 'Move a deal in the pipeline', done: false, path: '/opportunities' },
    { id: 'contact', label: 'Add a new contact', done: false, path: '/contacts' },
    { id: 'workflow', label: 'Review active workflows', done: true, path: '/automations' },
  ];

  return (
    <div data-tour="dashboard.page" className="flex flex-col">
      <PageHeader
        title="Dashboard"
        subtitle={`Good morning, Jordan — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        actions={
          <Button size="sm" onClick={() => navigate('/contacts')}>
            <Plus size={14} /> Add Contact
          </Button>
        }
      />

      {/* ── KPI Bar ── */}
      <div
        data-tour="dashboard.kpis"
        className="grid grid-cols-2 gap-2.5 px-5 pt-4 sm:grid-cols-4 lg:grid-cols-8"
      >
        {[
          { label: 'Pipeline Value', value: money(pipelineValue), icon: TrendingUp, color: '#1f6feb', sub: `${openOpps.length} open deals` },
          { label: 'Open Deals', value: openOpps.length, icon: Target, color: '#d99111', sub: 'across all pipelines' },
          { label: 'New Contacts', value: newContacts30, icon: Users, color: '#12986a', sub: 'last 30 days' },
          { label: 'Unread Msgs', value: unreadConvs, icon: MessageSquare, color: unreadConvs > 0 ? '#d9363e' : '#98a2b3', sub: 'in inbox' },
          { label: 'Appointments', value: upcomingAppts.length, icon: Calendar, color: '#7c3aed', sub: 'upcoming' },
          { label: 'Open Tasks', value: openTasks.length, icon: CheckSquare, color: openTasks.length > 10 ? '#d99111' : '#12986a', sub: `${overdueTasks.length} overdue` },
          { label: 'Revenue', value: money(revenueCollected), icon: DollarSign, color: '#12986a', sub: 'collected (paid)' },
          { label: 'Avg Rating', value: `${avgRating}★`, icon: Star, color: '#d99111', sub: `${reviews.length} reviews` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-line bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle truncate pr-1">{kpi.label}</p>
              <kpi.icon size={13} style={{ color: kpi.color, flexShrink: 0 }} />
            </div>
            <p className="mt-1.5 font-display text-xl font-extrabold text-ink leading-none">{kpi.value}</p>
            <p className="mt-1 text-[10px] text-ink-muted truncate">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 gap-4 px-5 pt-4 lg:grid-cols-3">

        {/* Left column: Today + Quick Actions + Onboarding */}
        <div className="flex flex-col gap-4">

          {/* Today — Appointments */}
          <Card data-tour="dashboard.appointments">
            <CardHeader
              title="Today's Appointments"
              subtitle={`${apptsTodaySorted.length} scheduled`}
              actions={<button onClick={() => navigate('/calendars')} className="text-xs text-brand hover:underline">Calendar →</button>}
            />
            <div className="divide-y divide-line">
              {apptsTodaySorted.length === 0 ? (
                <p className="px-4 py-3 text-xs text-ink-subtle">No appointments today.</p>
              ) : (
                apptsTodaySorted.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Calendar size={13} className="shrink-0 text-[#7c3aed]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{a.title}</p>
                      <p className="text-[11px] text-ink-muted">{clockTime(a.startTime)} · {a.location ?? 'Office'}</p>
                    </div>
                    <Badge tone="brand" size="sm">{clockTime(a.startTime)}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Tasks Due Today + Overdue */}
          <Card data-tour="dashboard.tasksDue">
            <CardHeader
              title="Tasks Due"
              subtitle={`${tasksDueToday.length} today · ${overdueTasks.length} overdue · ${missedCallsToday.length} missed calls`}
              actions={<button onClick={() => navigate('/tasks')} className="text-xs text-brand hover:underline">All tasks →</button>}
            />
            <div className="divide-y divide-line">
              {overdueTasks.slice(0, 3).map((t) => {
                const contact = t.contactId ? contactById(t.contactId) : undefined;
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <AlertTriangle size={13} className="shrink-0 text-bad" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{t.title}</p>
                      {contact && <p className="text-[11px] text-ink-muted">{fullName(contact)}</p>}
                    </div>
                    <Badge tone="bad" size="sm">Overdue</Badge>
                  </div>
                );
              })}
              {tasksDueToday.slice(0, 3).map((t) => {
                const contact = t.contactId ? contactById(t.contactId) : undefined;
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Clock size={13} className="shrink-0 text-warn" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{t.title}</p>
                      {contact && <p className="text-[11px] text-ink-muted">{fullName(contact)}</p>}
                    </div>
                    <Badge tone={t.priority === 'high' ? 'bad' : t.priority === 'medium' ? 'warn' : 'neutral'} size="sm">
                      {t.priority}
                    </Badge>
                  </div>
                );
              })}
              {tasksDueToday.length === 0 && overdueTasks.length === 0 && (
                <p className="px-4 py-3 text-xs text-ink-subtle">All caught up! 🎉</p>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                { label: 'Add Contact', icon: UserPlus, path: '/contacts', color: '#1f6feb' },
                { label: 'Reply to Inbox', icon: MessageSquare, path: '/conversations', color: '#12986a', badge: unreadConvs || undefined },
                { label: 'Book Appointment', icon: CalendarPlus, path: '/calendars', color: '#7c3aed' },
                { label: 'Complete Tasks', icon: CheckSquare, path: '/tasks', color: '#d99111', badge: overdueTasks.length || undefined },
                { label: 'Move Opportunity', icon: Target, path: '/opportunities', color: '#d99111' },
                { label: 'View Pipeline', icon: TrendingUp, path: '/opportunities', color: '#1f6feb' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="relative flex flex-col items-start gap-1.5 rounded-lg border border-line p-3 text-left transition-colors hover:border-brand/30 hover:bg-surface-sunken"
                >
                  <action.icon size={15} style={{ color: action.color }} />
                  <span className="text-[11px] font-semibold text-ink">{action.label}</span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-bad px-1.5 py-px text-[10px] font-bold text-white">
                      {action.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Onboarding checklist */}
          <Card data-tour="dashboard.onboardingChecklist">
            <CardHeader title="Daily Checklist" subtitle="Demo only — not tracked" />
            <div className="divide-y divide-line">
              {ONBOARDING.map((step) => (
                <button
                  key={step.id}
                  onClick={() => navigate(step.path)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-sunken"
                >
                  {step.done ? (
                    <CheckCircle2 size={14} className="shrink-0 text-good" />
                  ) : (
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-line" />
                  )}
                  <span className={`flex-1 text-xs ${step.done ? 'text-ink-muted line-through' : 'font-medium text-ink'}`}>
                    {step.label}
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-ink-subtle" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 2/3: Activity Feed + Charts */}
        <div className="flex flex-col gap-4 lg:col-span-2">

          {/* Activity Feed */}
          <Card data-tour="dashboard.activity">
            <CardHeader
              title="Activity Feed"
              subtitle="Recent CRM activity across contacts, calls, deals & conversations"
              actions={<button className="text-xs text-brand hover:underline" onClick={() => navigate('/conversations')}>View inbox →</button>}
            />
            <div className="max-h-72 divide-y divide-line overflow-y-auto">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: item.color + '1a', color: item.color }}
                  >
                    {ACTIVITY_ICON[item.type] ?? <Activity size={12} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink leading-snug">{item.title}</p>
                    {item.sub && <p className="mt-0.5 truncate text-[11px] text-ink-muted">{item.sub}</p>}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-subtle">{relativeTime(item.time)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Pipeline by stage */}
            <Card data-tour="dashboard.pipelineChart">
              <CardHeader title="Pipeline by Stage" subtitle="Sales pipeline — open deal value" />
              <div className="h-48 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesPipeline} margin={{ left: -10, right: 4, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#98a2b3' }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(v: number) => [money(v), 'Value']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e4e7ec', fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="#1f6feb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Lead Sources */}
            <Card data-tour="dashboard.leadSources">
              <CardHeader title="Lead Sources" subtitle="Contacts by acquisition channel" />
              <div className="max-h-48 divide-y divide-line overflow-y-auto">
                {topLeadSources.map((src, i) => {
                  const max = topLeadSources[0]?.value ?? 1;
                  return (
                    <div key={src.source} className="flex items-center gap-3 px-4 py-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-ink">{src.source}</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(src.value / max) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs font-semibold text-ink-muted">{src.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Revenue trend (static) */}
          <Card>
            <CardHeader title="Revenue Trend" subtitle="Won deal value — last 6 months" />
            <div className="h-44 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { m: 'Dec', value: 21400 }, { m: 'Jan', value: 28600 },
                    { m: 'Feb', value: 31200 }, { m: 'Mar', value: 27900 },
                    { m: 'Apr', value: 38400 }, { m: 'May', value: 44100 },
                  ]}
                  margin={{ left: -10, right: 4, top: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#98a2b3' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => [money(v), 'Revenue']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e4e7ec', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#12986a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
