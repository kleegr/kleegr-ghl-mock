/**
 * Reporting — attribution, appointments, calls, campaigns, revenue, agents.
 * Demo Mode: KPIs from store; charts use store + local static trend arrays.
 *
 * data-tour targets:
 *   reporting.page, reporting.dateRange, reporting.kpis, reporting.tabs,
 *   reporting.charts, reporting.attribution, reporting.table,
 *   reporting.export, reporting.aiSummary
 */
import { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card, CardHeader, Tabs } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { money, pct } from '@/utils';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const REVENUE_TREND = [
  {m:'Jan',won:18000,lost:4000},{m:'Feb',won:22000,lost:6000},{m:'Mar',won:26500,lost:5200},
  {m:'Apr',won:31000,lost:7100},{m:'May',won:28500,lost:4800},{m:'Jun',won:34200,lost:6300},
];
const APPT_TREND = [
  {m:'Jan',booked:18,showed:14,noShow:2},{m:'Feb',booked:21,showed:16,noShow:3},
  {m:'Mar',booked:24,showed:19,noShow:2},{m:'Apr',booked:27,showed:22,noShow:4},
  {m:'May',booked:26,showed:20,noShow:3},{m:'Jun',booked:32,showed:26,noShow:3},
];
const CALL_TREND = [
  {m:'Jan',inbound:22,outbound:15,missed:6},{m:'Feb',inbound:26,outbound:18,missed:5},
  {m:'Mar',inbound:30,outbound:21,missed:4},{m:'Apr',inbound:34,outbound:24,missed:4},
  {m:'May',inbound:32,outbound:22,missed:3},{m:'Jun',inbound:38,outbound:27,missed:3},
];
const CAMP_TREND = [
  {m:'Jan',opens:38,clicks:8,replies:5},{m:'Feb',opens:40,clicks:9,replies:6},
  {m:'Mar',opens:42,clicks:10,replies:6},{m:'Apr',opens:45,clicks:11,replies:7},
  {m:'May',opens:48,clicks:12,replies:8},{m:'Jun',opens:51,clicks:14,replies:8},
];
const AGENT_DATA = [
  {id:'u_me',name:'Jordan Avery',leads:28,won:11,revenue:28500},
  {id:'u_2', name:'Priya Raman', leads:22,won:8, revenue:21200},
  {id:'u_3', name:'Marcus Bell', leads:18,won:6, revenue:16800},
  {id:'u_4', name:'Dana Cole',   leads:16,won:5, revenue:13400},
];
const PIE_COLORS = ['#1f6feb','#12986a','#d99111','#7c3aed','#d9363e','#0891b2','#db2777','#65a30d'];
const REPORT_TABS = [
  {id:'attribution',label:'Attribution'},{id:'appointments',label:'Appointments'},
  {id:'calls',label:'Calls'},{id:'campaigns',label:'Campaigns'},
  {id:'revenue',label:'Revenue'},{id:'agents',label:'Agents'},
];
const DATE_RANGES = [{id:'last7',label:'Last 7d'},{id:'last30',label:'Last 30d'},{id:'last90',label:'Last 90d'},{id:'allTime',label:'All time'}];
const TT = { borderRadius:10, border:'1px solid #e4e7ec', fontSize:12 };
const TICK = { fontSize:11, fill:'#98a2b3' };

export function Reporting() {
  const opps         = useStore(s => s.opportunities);
  const contacts     = useStore(s => s.contacts);
  const appointments = useStore(s => s.appointments);
  const calls        = useStore(s => s.calls);
  const campaigns    = useStore(s => s.campaigns);
  const invoices     = useStore(s => s.invoices);
  const reviews      = useStore(s => s.reviews);
  const leadSources  = useStore(s => s.leadSources);
  const pushToast    = useStore(s => s.pushToast);
  const [activeTab, setActiveTab] = useState('attribution');
  const [dateRange, setDateRange] = useState('last30');

  const won          = opps.filter(o => o.status==='won');
  const winRate      = opps.length ? Math.round(won.length/opps.length*100) : 0;
  const totalRevenue = won.reduce((s,o) => s+o.monetaryValue, 0);
  const pastAppts    = appointments.filter(a => a.status!=='confirmed');
  const showedAppts  = appointments.filter(a => a.status==='showed');
  const showRate     = pastAppts.length ? Math.round(showedAppts.length/pastAppts.length*100) : 0;
  const avgRating    = reviews.length ? (reviews.reduce((s,r) => s+r.rating,0)/reviews.length).toFixed(1) : '0';
  const sentCamps    = campaigns.filter(c => c.status==='sent');
  const avgOpen      = sentCamps.length ? sentCamps.reduce((s,c) => s+(c.metrics.openRate??0),0)/sentCamps.length : 0;
  const missedCalls  = calls.filter(c => c.direction==='missed').length;
  const paidRevenue  = invoices.filter(inv => inv.status==='paid').reduce((s,inv) => s+inv.total, 0);
  const openOpps     = opps.filter(o => o.status==='open').length;

  const kpis = [
    {label:'Won revenue',   value:money(totalRevenue), sub:`${winRate}% win rate`},
    {label:'Contacts',      value:contacts.length,     sub:'total in CRM'},
    {label:'Appts booked',  value:appointments.length, sub:`${showRate}% show rate`},
    {label:'Calls handled', value:calls.length,        sub:`${missedCalls} missed`},
    {label:'Collected',     value:money(paidRevenue),  sub:'paid invoices'},
    {label:'Review rating', value:`${avgRating}★`,     sub:`${reviews.length} reviews`},
    {label:'Avg email open',value:pct(avgOpen),         sub:`${sentCamps.length} campaigns`},
  ];

  return (
    <div data-tour="reporting.page">
      <PageHeader
        title="Reporting"
        subtitle="Performance across attribution, appointments, calls, campaigns, and revenue"
        actions={
          <div className="flex items-center gap-2">
            <div data-tour="reporting.dateRange" className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1">
              {DATE_RANGES.map(d => (
                <button key={d.id} onClick={() => setDateRange(d.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${dateRange===d.id?'bg-brand text-brand-fg':'text-ink-muted hover:text-ink'}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" data-tour="reporting.export"
              onClick={() => pushToast({ title:'Demo: export', description:'CSV would download here (demo only).', variant:'info' })}>
              <Download size={14}/> Export
            </Button>
          </div>
        }
      />
      <div className="space-y-4 px-5 pb-8 pt-4">
        <div data-tour="reporting.kpis" className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {kpis.map(k => <MiniStat key={k.label} label={k.label} value={k.value} sub={k.sub}/>)}
        </div>
        <Card data-tour="reporting.aiSummary" className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Sparkles size={16}/></span>
            <div>
              <p className="text-sm font-bold text-ink">AI Performance Summary</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Your pipeline is trending positively — won revenue is up <span className="font-semibold text-good">19%</span> vs prior period. Appointment show rates are solid at <span className="font-semibold text-ink">{showRate}%</span>. Email open rates of <span className="font-semibold text-ink">{pct(avgOpen)}</span> exceed the industry average. Consider following up on the <span className="font-semibold text-ink">{openOpps}</span> open opportunities in the pipeline.
              </p>
            </div>
          </div>
        </Card>
        <div data-tour="reporting.tabs"><Tabs tabs={REPORT_TABS} active={activeTab} onChange={setActiveTab}/></div>
        <div data-tour="reporting.charts">

          {activeTab==='attribution' && (
            <div data-tour="reporting.attribution" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Leads by source" subtitle="All contacts"/>
                  <div className="h-72 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={leadSources} margin={{left:30,right:10}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" horizontal={false}/>
                        <XAxis type="number" tick={TICK} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="source" tick={TICK} axisLine={false} tickLine={false} width={90}/>
                        <Tooltip contentStyle={TT}/>
                        <Bar dataKey="value" fill="#1f6feb" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Source breakdown" subtitle="By share"/>
                  <div className="h-72 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={leadSources} dataKey="value" nameKey="source" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                          {leadSources.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={TT}/>
                        <Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
              <Card>
                <CardHeader title="Lead source details"/>
                <div data-tour="reporting.table" className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead><tr className="border-b border-line text-left">
                      {['Source','Leads','Share','Opportunities','Conv. rate'].map(h => <th key={h} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {leadSources.map(ls => {
                        const tot = leadSources.reduce((s,l) => s+l.value, 0);
                        const opp = opps.filter(o => contacts.find(c => c.id===o.contactId)?.source===ls.source);
                        return (
                          <tr key={ls.source} className="border-b border-line/70 hover:bg-surface-sunken">
                            <td className="px-4 py-3 font-medium text-ink">{ls.source}</td>
                            <td className="px-4 py-3 text-ink-muted">{ls.value}</td>
                            <td className="px-4 py-3 text-ink-muted">{tot?pct(ls.value/tot):'—'}</td>
                            <td className="px-4 py-3 text-ink-muted">{opp.length}</td>
                            <td className="px-4 py-3 text-ink-muted">{ls.value?pct(opp.length/ls.value):'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab==='appointments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Appointment volume" subtitle="6-month trend"/>
                  <div className="h-64 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={APPT_TREND} margin={{left:-10,right:6}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false}/>
                        <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false}/>
                        <YAxis tick={TICK} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={TT}/>
                        <Bar dataKey="booked" fill="#1f6feb" radius={[4,4,0,0]} name="Booked"/>
                        <Bar dataKey="showed" fill="#12986a" radius={[4,4,0,0]} name="Showed"/>
                        <Bar dataKey="noShow" fill="#e4e7ec" radius={[4,4,0,0]} name="No-show"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="p-4">
                  <p className="mb-3 text-sm font-bold text-ink">Status breakdown</p>
                  <div className="space-y-2">
                    {[
                      {label:'Confirmed',count:appointments.filter(a=>a.status==='confirmed').length,color:'bg-brand'},
                      {label:'Showed',count:showedAppts.length,color:'bg-good'},
                      {label:'No-show',count:appointments.filter(a=>a.status==='no_show').length,color:'bg-bad'},
                      {label:'Cancelled',count:appointments.filter(a=>a.status==='cancelled').length,color:'bg-warn'},
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.color}`}/>
                        <span className="flex-1 text-sm text-ink-muted">{s.label}</span>
                        <span className="text-sm font-semibold text-ink">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab==='calls' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Call volume" subtitle="6-month trend"/>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={CALL_TREND} margin={{left:-10,right:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false}/>
                      <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false}/>
                      <YAxis tick={TICK} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={TT}/>
                      <Line type="monotone" dataKey="inbound"  stroke="#1f6feb" strokeWidth={2.5} dot={false} name="Inbound"/>
                      <Line type="monotone" dataKey="outbound" stroke="#12986a" strokeWidth={2.5} dot={false} name="Outbound"/>
                      <Line type="monotone" dataKey="missed"   stroke="#d9363e" strokeWidth={2} dot={false} name="Missed" strokeDasharray="4 2"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card><CardHeader title="Direction breakdown"/>
                <div data-tour="reporting.table" className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[{label:'Inbound',count:calls.filter(c=>c.direction==='inbound').length,color:'text-brand'},{label:'Outbound',count:calls.filter(c=>c.direction==='outbound').length,color:'text-good'},{label:'Missed',count:missedCalls,color:'text-bad'}].map(d => (
                      <div key={d.label} className="rounded-xl bg-surface-sunken p-4 text-center">
                        <p className={`text-2xl font-extrabold ${d.color}`}>{d.count}</p>
                        <p className="mt-1 text-xs text-ink-muted">{d.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab==='campaigns' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Campaign engagement" subtitle="Email open/click & SMS reply trends (%)"/>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={CAMP_TREND} margin={{left:-10,right:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false}/>
                      <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false}/>
                      <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                      <Tooltip contentStyle={TT} formatter={(v:number) => `${v}%`}/>
                      <Line type="monotone" dataKey="opens"   stroke="#1f6feb" strokeWidth={2.5} dot={false} name="Open %"/>
                      <Line type="monotone" dataKey="clicks"  stroke="#12986a" strokeWidth={2}   dot={false} name="Click %"/>
                      <Line type="monotone" dataKey="replies" stroke="#d99111" strokeWidth={2}   dot={false} name="Reply %"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card><CardHeader title="Campaign performance"/>
                <div data-tour="reporting.table" className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead><tr className="border-b border-line text-left">
                      {['Name','Type','Audience','Delivered','Open/Reply','Clicks','Sent'].map(h => <th key={h} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {sentCamps.map(c => (
                        <tr key={c.id} className="border-b border-line/70 hover:bg-surface-sunken">
                          <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                          <td className="px-4 py-3"><Badge tone="neutral">{c.type}</Badge></td>
                          <td className="px-4 py-3 text-ink-muted">{c.audienceSize.toLocaleString()}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.metrics.delivered?.toLocaleString()??'—'}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.type==='email'?(c.metrics.openRate?pct(c.metrics.openRate):'—'):(c.metrics.replyRate?pct(c.metrics.replyRate):'—')}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.metrics.clickRate?pct(c.metrics.clickRate):'—'}</td>
                          <td className="px-4 py-3 text-xs text-ink-subtle">{c.sentAt?new Date(c.sentAt).toLocaleDateString():'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab==='revenue' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Won vs lost revenue" subtitle="Last 6 months"/>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REVENUE_TREND} margin={{left:-10,right:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false}/>
                      <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false}/>
                      <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                      <Tooltip formatter={(v:number) => money(v)} contentStyle={TT}/>
                      <Bar dataKey="won"  fill="#1f6feb" radius={[4,4,0,0]} name="Won"/>
                      <Bar dataKey="lost" fill="#e4e7ec" radius={[4,4,0,0]} name="Lost"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MiniStat label="Total won" value={money(totalRevenue)}/>
                <MiniStat label="Win rate" value={`${winRate}%`}/>
                <MiniStat label="Avg deal size" value={won.length?money(Math.round(totalRevenue/won.length)):'$0'}/>
                <MiniStat label="Collected" value={money(paidRevenue)}/>
              </div>
            </div>
          )}

          {activeTab==='agents' && (
            <Card><CardHeader title="Agent performance"/>
              <div data-tour="reporting.table" className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="border-b border-line text-left">
                    {['Agent','Leads owned','Deals won','Win rate','Revenue'].map(h => <th key={h} className="whitespace-nowrap bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {AGENT_DATA.map(a => (
                      <tr key={a.id} className="border-b border-line/70 hover:bg-surface-sunken">
                        <td className="px-4 py-3 font-semibold text-ink">{a.name}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.leads}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.won}</td>
                        <td className="px-4 py-3 text-ink-muted">{pct(a.won/a.leads)}</td>
                        <td className="px-4 py-3 font-semibold text-good">{money(a.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
