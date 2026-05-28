import { useState } from 'react';
import { Megaphone, Mail, MessageSquare, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge } from '@/components/ui/primitives';
import { SimpleTable, type Column, MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { dateLabel, pct } from '@/utils';
import type { Campaign } from '@/types';

export function Marketing({ type }: { type: 'email' | 'sms' }) {
  const campaigns = useStore((s) => s.campaigns).filter((c) => c.type === type);
  const [preview, setPreview] = useState<Campaign | null>(null);

  const sent = campaigns.filter((c) => c.status === 'sent');
  const totalAudience = sent.reduce((s, c) => s + c.audienceSize, 0);
  const avgOpen = type === 'email'
    ? sent.reduce((s, c) => s + (c.metrics.openRate ?? 0), 0) / (sent.length || 1)
    : sent.reduce((s, c) => s + (c.metrics.replyRate ?? 0), 0) / (sent.length || 1);

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Campaign', render: (c) => (
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">{type === 'email' ? <Mail size={15} /> : <MessageSquare size={15} />}</span>
        <span className="font-semibold text-ink">{c.name}</span>
      </div>
    ) },
    { key: 'status', header: 'Status', render: (c) => <Badge tone={c.status === 'sent' ? 'good' : c.status === 'scheduled' ? 'warn' : 'neutral'}>{c.status}</Badge> },
    { key: 'audience', header: 'Audience', render: (c) => <span className="text-ink-muted">{c.audienceSize.toLocaleString()}</span> },
    { key: 'metric', header: type === 'email' ? 'Open rate' : 'Reply rate', render: (c) => <span className="text-ink-muted">{type === 'email' ? (c.metrics.openRate ? pct(c.metrics.openRate) : '—') : (c.metrics.replyRate ? pct(c.metrics.replyRate) : '—')}</span> },
    { key: 'sent', header: 'Sent', render: (c) => <span className="text-ink-subtle">{c.sentAt ? dateLabel(c.sentAt) : '—'}</span> },
  ];

  return (
    <div>
      <PageHeader
        title={type === 'email' ? 'Email Marketing' : 'SMS Marketing'}
        subtitle={type === 'email' ? 'Broadcast emails and track engagement' : 'Bulk text campaigns and replies'}
        actions={<Button><Plus size={16} /> New {type === 'email' ? 'Email' : 'SMS'}</Button>}
      />
      <div className="space-y-4 px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="Campaigns" value={campaigns.length} />
          <MiniStat label="Sent" value={sent.length} />
          <MiniStat label="Total reached" value={totalAudience.toLocaleString()} />
          <MiniStat label={type === 'email' ? 'Avg open' : 'Avg reply'} value={pct(avgOpen)} />
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <SimpleTable columns={columns} rows={campaigns} onRowClick={setPreview} />
        </div>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ''}>
        {preview && (
          <div className="space-y-3">
            {preview.content.subject && <p className="text-sm"><span className="font-semibold text-ink">Subject:</span> <span className="text-ink-muted">{preview.content.subject}</span></p>}
            <div className="rounded-lg border border-line bg-surface-sunken p-4 text-sm text-ink-muted">{preview.content.body}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(preview.metrics).map(([k, v]) => (
                <Badge key={k}>{k}: {typeof v === 'number' && v < 1 ? pct(v) : v.toLocaleString()}</Badge>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
