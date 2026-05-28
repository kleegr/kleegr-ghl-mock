import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { useStore } from '@/store/useStore';
import { PageHeader, Card, CardHeader } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { money } from '@/utils';

const PIPE_TREND = [
  { m: 'Jan', won: 18000, lost: 4000 }, { m: 'Feb', won: 22000, lost: 6000 },
  { m: 'Mar', won: 26500, lost: 5200 }, { m: 'Apr', won: 31000, lost: 7100 },
  { m: 'May', won: 28500, lost: 4800 }, { m: 'Jun', won: 34200, lost: 6300 },
];

export function Reporting() {
  const opps = useStore((s) => s.opportunities);
  const contacts = useStore((s) => s.contacts);
  const appointments = useStore((s) => s.appointments);
  const leadSources = useStore((s) => s.leadSources);

  const won = opps.filter((o) => o.status === 'won');
  const winRate = Math.round((won.length / (opps.length || 1)) * 100);
  const showRate = Math.round((appointments.filter((a) => a.status === 'showed').length / (appointments.filter((a) => a.status !== 'confirmed').length || 1)) * 100);

  return (
    <div>
      <PageHeader title="Reporting" subtitle="Performance across sales, marketing, and appointments" />
      <div className="space-y-4 px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="Won revenue" value={money(won.reduce((s, o) => s + o.monetaryValue, 0))} sub="all time" />
          <MiniStat label="Win rate" value={`${winRate}%`} />
          <MiniStat label="New contacts" value={contacts.length} />
          <MiniStat label="Show rate" value={`${showRate}%`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Won vs lost revenue" subtitle="Last 6 months" />
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PIPE_TREND} margin={{ left: -10, right: 6, top: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e4e7ec', fontSize: 13 }} />
                  <Bar dataKey="won" fill="#1f6feb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" fill="#e4e7ec" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Leads by source" />
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={leadSources} margin={{ left: 30, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: '#98a2b3' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e7ec', fontSize: 13 }} />
                  <Bar dataKey="value" fill="#12986a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Appointment volume" subtitle="Bookings trend" />
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PIPE_TREND} margin={{ left: -10, right: 6, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e7ec', fontSize: 13 }} />
                <Line type="monotone" dataKey="won" stroke="#d99111" strokeWidth={2.5} dot={false} name="bookings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
