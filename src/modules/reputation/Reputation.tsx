import { useState, useMemo } from 'react';
import { Star, MessageSquareReply, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge, Card, Tabs } from '@/components/ui/primitives';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { relativeTime, fullName, cx } from '@/utils';
import type { Review } from '@/types';

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type SourceFilter = 'all' | 'google' | 'facebook';
type ReplyFilter = 'all' | 'replied' | 'unreplied';

const REPUTATION_TABS: ModuleHeaderTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Requests' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'testimonials', label: 'Video Testimonials' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'listings', label: 'Listings' },
  { id: 'gbp', label: 'GBP Optimization' },
  { id: 'settings', label: 'Settings' },
];

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={cx(i < n ? 'fill-warn text-warn' : 'text-line')} />
      ))}
    </span>
  );
}

const SOURCE_LABEL: Record<Review['source'], string> = {
  google: 'Google',
  facebook: 'Facebook',
};

const SOURCE_COLOR: Record<Review['source'], string> = {
  google: 'bg-[#4285F4]',
  facebook: 'bg-[#1877F2]',
};

export function Reputation() {
  const reviews = useStore((s) => s.reviews);
  const contacts = useStore((s) => s.contacts);
  const pushToast = useStore((s) => s.pushToast);
  const [primaryTab, setPrimaryTab] = useState('overview');
  const [overviewTab, setOverviewTab] = useState('my-stats');

  // Filters
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('all');

  // Modals
  const [detailReview, setDetailReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);

  // Request form
  const [reqContact, setReqContact] = useState('');
  const [reqChannel, setReqChannel] = useState<'sms' | 'email'>('sms');

  // Derived stats
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)).toFixed(1);
  const replied = reviews.filter((r) => r.replied).length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const thisMonth = reviews.filter(
    (r) => Date.now() - +new Date(r.createdAt) < 30 * 86400000,
  ).length;

  // Filtered reviews
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (replyFilter === 'replied' && !r.replied) return false;
      if (replyFilter === 'unreplied' && r.replied) return false;
      return true;
    });
  }, [reviews, ratingFilter, sourceFilter, replyFilter]);

  const ratingTabs = [
    { id: 'all', label: 'All', count: reviews.length },
    ...([5, 4, 3, 2, 1] as const).map((star) => ({
      id: String(star),
      label: `${star}★`,
      count: reviews.filter((r) => r.rating === star).length,
    })),
  ];

  const sourceTabs = [
    { id: 'all', label: 'All sources' },
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
  ];

  const replyTabs = [
    { id: 'all', label: 'All' },
    { id: 'unreplied', label: 'Unreplied', count: reviews.filter((r) => !r.replied).length },
    { id: 'replied', label: 'Replied', count: replied },
  ];

  const selectedContact = contacts.find((c) => c.id === reqContact);
  const reviewRequestMsg =
    reqChannel === 'sms'
      ? `Hi${selectedContact ? ` ${selectedContact.firstName}` : ''}! We'd love your feedback. Please leave us a review: https://g.page/review-demo`
      : `Subject: We'd love your feedback\n\nHi${selectedContact ? ` ${selectedContact.firstName}` : ''},\n\nThank you for your business! If you have a moment, we'd really appreciate a quick review.\n\nhttps://g.page/review-demo\n\nThanks!`;

  function handleRequestSubmit() {
    pushToast({
      title: `Review request sent via ${reqChannel.toUpperCase()}`,
      description: 'Demo only — no real message was sent.',
      variant: 'success',
    });
    setRequestOpen(false);
    setReqContact('');
    setReqChannel('sms');
  }

  function handleReplySubmit() {
    pushToast({ title: 'Reply posted', description: 'Demo only — not sent to any review platform.', variant: 'success' });
    setDetailReview(null);
    setReplyText('');
  }

  return (
    <div data-tour="reputation.page">
      <ModuleHeader
        title="Reputation"
        tabs={REPUTATION_TABS}
        activeTab={primaryTab}
        onTabChange={setPrimaryTab}
      />

      <div className="flex min-h-[58px] items-center justify-between border-b border-line bg-surface px-5">
        <div className="flex h-full items-center gap-6">
          {['overview', 'my-stats', 'competitors'].map((id) => (
            <button key={id} onClick={() => setOverviewTab(id)} className={cx('h-[58px] border-b-2 px-1 text-xs font-semibold', overviewTab === id ? 'border-brand text-brand' : 'border-transparent text-ink-muted')}>
              {id === 'overview' ? 'Overview' : id === 'my-stats' ? 'My Stats' : 'Competitor Analysis'}
            </button>
          ))}
        </div>
        <Button data-tour="reputation.requestButton" onClick={() => setRequestOpen(true)}><Send size={15} /> Send Review Request</Button>
      </div>

      <div className="min-h-[calc(100vh-148px)] space-y-4 bg-[#f4f5f7] px-5 pb-8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-4 py-3">
          <button className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted">Sources · All</button>
          <div className="flex gap-2"><button className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted">Sections</button><button className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted">Aug 8, 2026 → Sep 6, 2026</button></div>
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4" data-tour="reputation.summary">
          <Card className="flex items-center gap-4 p-5">
            <div className="text-center">
              <p className="font-display text-4xl font-extrabold text-ink">{avg}</p>
              <Stars n={Math.round(Number(avg))} />
              <p className="mt-1 text-xs text-ink-muted">{reviews.length} total reviews</p>
            </div>
          </Card>
          <MiniStat
            label="Unreplied"
            value={reviews.filter((r) => !r.replied).length}
            sub="need a response"
          />
          <MiniStat
            label="Reply rate"
            value={`${Math.round((replied / (reviews.length || 1)) * 100)}%`}
            sub={`${replied} of ${reviews.length} replied`}
          />
          <MiniStat label="This month" value={thisMonth} sub="new reviews" />
        </div>

        {/* Rating breakdown */}
        <Card className="p-4" data-tour="reputation.breakdown">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Rating breakdown</p>
          <div className="space-y-1.5">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="w-6 text-right text-xs font-semibold text-ink-muted">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-warn transition-all"
                    style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-xs text-ink-subtle">{d.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            {(['google', 'facebook'] as const).map((src) => {
              const count = reviews.filter((r) => r.source === src).length;
              return (
                <div key={src} className="flex items-center gap-2">
                  <span
                    className={cx(
                      'grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white',
                      SOURCE_COLOR[src],
                    )}
                  >
                    {src === 'google' ? 'G' : 'f'}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {SOURCE_LABEL[src]}: <strong className="text-ink">{count}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Tabs
            tabs={ratingTabs}
            active={ratingFilter}
            onChange={(id) => setRatingFilter(id as RatingFilter)}
            variant="pill"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Tabs
            tabs={sourceTabs}
            active={sourceFilter}
            onChange={(id) => setSourceFilter(id as SourceFilter)}
            variant="pill"
          />
          <Tabs
            tabs={replyTabs}
            active={replyFilter}
            onChange={(id) => setReplyFilter(id as ReplyFilter)}
            variant="pill"
          />
        </div>

        {/* Reviews list */}
        <div className="space-y-3" data-tour="reputation.reviewList">
          {filtered.length === 0 && (
            <Card className="px-4 py-10">
              <p className="text-center text-sm text-ink-subtle">No reviews match this filter</p>
            </Card>
          )}
          {filtered.map((r) => (
            <div
              key={r.id}
              data-tour="reputation.reviewRow"
              className="rounded-xl border border-line bg-surface shadow-card cursor-pointer p-4 transition-colors hover:bg-surface-sunken"
              onClick={() => { setDetailReview(r); setReplyText(''); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDetailReview(r); setReplyText(''); } }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white',
                      SOURCE_COLOR[r.source],
                    )}
                  >
                    {r.source === 'google' ? 'G' : 'f'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.author}</p>
                    <Stars n={r.rating} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-ink-subtle">{relativeTime(r.createdAt)}</span>
                  {r.replied ? (
                    <Badge tone="good">replied</Badge>
                  ) : (
                    <Badge tone="warn">needs reply</Badge>
                  )}
                </div>
              </div>
              <p className="mt-2.5 text-sm text-ink-muted line-clamp-2">{r.text}</p>
              {r.replied && r.replyText && (
                <div className="mt-3 rounded-lg border-l-2 border-brand bg-surface-sunken p-2.5 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Your reply: </span>{r.replyText}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review detail / reply modal */}
      <Modal
        open={!!detailReview}
        onClose={() => { setDetailReview(null); setReplyText(''); }}
        title="Review"
        size="md"
      >
        {detailReview && (
          <div data-tour="reputation.reviewDetail" className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white',
                  SOURCE_COLOR[detailReview.source],
                )}
              >
                {detailReview.source === 'google' ? 'G' : 'f'}
              </span>
              <div>
                <p className="font-semibold text-ink">{detailReview.author}</p>
                <div className="flex items-center gap-2">
                  <Stars n={detailReview.rating} />
                  <span className="text-xs text-ink-subtle">{SOURCE_LABEL[detailReview.source]} · {relativeTime(detailReview.createdAt)}</span>
                </div>
              </div>
            </div>

            <p className="rounded-lg bg-surface-sunken p-3 text-sm text-ink-muted">{detailReview.text}</p>

            {detailReview.replied && detailReview.replyText ? (
              <div className="rounded-lg border-l-2 border-brand bg-surface-sunken p-3">
                <p className="mb-1 text-xs font-semibold text-brand">Your reply</p>
                <p className="text-sm text-ink-muted">{detailReview.replyText}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink-muted">Reply to this review</p>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional reply…"
                  rows={3}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <Button size="sm" onClick={handleReplySubmit} disabled={!replyText.trim()}>
                  <MessageSquareReply size={14} /> Post reply
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Send review request modal */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Send Review Request"
        size="md"
      >
        <div data-tour="reputation.requestModal" className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Select contact</label>
            <select
              value={reqContact}
              onChange={(e) => setReqContact(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Choose a contact…</option>
              {contacts.slice(0, 40).map((c) => (
                <option key={c.id} value={c.id}>{fullName(c)} — {c.email}</option>
              ))}
            </select>
          </div>

          <div data-tour="reputation.channelChoice">
            <p className="mb-2 text-xs font-semibold text-ink-muted">Send via</p>
            <div className="flex gap-2">
              <button
                onClick={() => setReqChannel('sms')}
                className={cx(
                  'flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors',
                  reqChannel === 'sms'
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken',
                )}
              >
                SMS
              </button>
              <button
                onClick={() => setReqChannel('email')}
                className={cx(
                  'flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors',
                  reqChannel === 'email'
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken',
                )}
              >
                Email
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-muted">Message preview</p>
            <div className="rounded-lg border border-line bg-surface-sunken p-3 text-xs text-ink-muted whitespace-pre-wrap">
              {reviewRequestMsg}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              data-tour="reputation.requestSubmit"
              onClick={handleRequestSubmit}
              disabled={!reqContact}
            >
              <Send size={14} />
              Send Request
            </Button>
            <Button variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
