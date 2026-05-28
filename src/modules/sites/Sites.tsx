import { LayoutTemplate, Globe, MousePointerClick, Plus, ExternalLink } from 'lucide-react';
import { PageHeader, Button, Badge, Card } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';

const FUNNELS = [
  { name: 'Free Consult Funnel', steps: 3, visits: 1840, conv: '12.4%', status: 'Published' },
  { name: 'Webinar Registration', steps: 4, visits: 920, conv: '28.1%', status: 'Published' },
  { name: 'Spring Promo Landing', steps: 2, visits: 2310, conv: '8.7%', status: 'Published' },
  { name: 'New Patient Intake', steps: 5, visits: 410, conv: '41.0%', status: 'Draft' },
];
const SITES = [
  { name: 'Brightline Dental — Main', pages: 8, status: 'Published' },
  { name: 'Membership Portal', pages: 4, status: 'Draft' },
];

export function Sites() {
  return (
    <div>
      <PageHeader title="Sites & Funnels" subtitle="Landing pages, funnels, and websites" actions={<Button><Plus size={16} /> New Funnel</Button>} />
      <div className="space-y-5 px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="Funnels" value={FUNNELS.length} />
          <MiniStat label="Websites" value={SITES.length} />
          <MiniStat label="Total visits (30d)" value="5.5k" />
          <MiniStat label="Avg conversion" value="22.6%" />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-ink">Funnels</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FUNNELS.map((f) => (
              <Card key={f.name} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><LayoutTemplate size={18} /></span>
                  <Badge tone={f.status === 'Published' ? 'good' : 'neutral'}>{f.status}</Badge>
                </div>
                <p className="mt-3 font-semibold text-ink">{f.name}</p>
                <p className="text-xs text-ink-muted">{f.steps} steps</p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
                  <span className="flex items-center gap-1 text-ink-muted"><MousePointerClick size={13} /> {f.visits.toLocaleString()} visits</span>
                  <span className="font-bold text-good">{f.conv}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-ink">Websites</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SITES.map((s) => (
              <Card key={s.name} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Globe size={18} /></span>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.pages} pages</p>
                </div>
                <Badge tone={s.status === 'Published' ? 'good' : 'neutral'}>{s.status}</Badge>
                <ExternalLink size={15} className="text-ink-subtle" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
