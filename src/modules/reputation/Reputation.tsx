import { useState } from 'react';
import { Star, MessageSquareReply } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { relativeTime, cx } from '@/utils';

function Stars({ n }: { n: number }) {
  return <span className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} className={cx(i < n ? 'fill-warn text-warn' : 'text-line')} />)}</span>;
}

export function Reputation() {
  const reviews = useStore((s) => s.reviews);
  const pushToast = useStore((s) => s.pushToast);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)).toFixed(1);
  const replied = reviews.filter((r) => r.replied).length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div>
      <PageHeader title="Reputation" subtitle="Monitor and respond to reviews" actions={<Button>Request Reviews</Button>} />
      <div className="space-y-4 px-5 pb-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="text-center">
              <p className="font-display text-4xl font-extrabold text-ink">{avg}</p>
              <Stars n={Math.round(+avg)} />
              <p className="mt-1 text-xs text-ink-muted">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {dist.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-ink-muted">{d.star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-warn" style={{ width: `${(d.count / reviews.length) * 100}%` }} /></div>
                  <span className="w-6 text-right text-ink-subtle">{d.count}</span>
                </div>
              ))}
            </div>
          </Card>
          <MiniStat label="Reply rate" value={`${Math.round((replied / reviews.length) * 100)}%`} sub={`${replied} of ${reviews.length} replied`} />
          <MiniStat label="This month" value={reviews.filter((r) => Date.now() - +new Date(r.createdAt) < 30 * 86400000).length} sub="new reviews" />
        </div>

        <div className="space-y-3">
          {reviews.slice(0, 10).map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cx('grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white', r.source === 'google' ? 'bg-[#4285F4]' : 'bg-[#1877F2]')}>{r.source === 'google' ? 'G' : 'f'}</span>
                  <div><p className="text-sm font-semibold text-ink">{r.author}</p><Stars n={r.rating} /></div>
                </div>
                <span className="text-xs text-ink-subtle">{relativeTime(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{r.text}</p>
              {r.replied ? (
                <div className="mt-3 rounded-lg border-l-2 border-brand bg-surface-sunken p-2.5 text-xs text-ink-muted"><span className="font-semibold text-ink">You replied:</span> {r.replyText}</div>
              ) : replyOpen === r.id ? (
                <div className="mt-3 flex gap-2">
                  <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" className="h-9 flex-1 rounded-lg border border-line px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  <Button size="sm" onClick={() => { pushToast({ title: 'Reply posted', description: 'Demo only — not sent anywhere.', variant: 'success' }); setReplyOpen(null); setReplyText(''); }}>Post</Button>
                </div>
              ) : (
                <button onClick={() => setReplyOpen(r.id)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"><MessageSquareReply size={14} /> Reply</button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
