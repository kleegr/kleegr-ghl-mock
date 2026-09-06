import React, { useState } from 'react';
import {
  Mail, Calendar, CreditCard, Facebook, MessageCircle, Zap,
  Check, Inbox, Send, FileText, Archive, ChevronRight,
  Star, Paperclip, Reply, MoreHorizontal, X, RefreshCw,
  Search, Settings, Download, ChevronDown, Bot, LifeBuoy,
  LayoutTemplate, DollarSign, SlidersHorizontal, Package,
  ShoppingBag, ExternalLink,
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx, relativeTime } from '@/utils';

/* ─── Local Fake Email Data ─────────────────────────
   Per spec: no real Outlook/Microsoft API. All emails are local
   fake data created purely inside this module.
   ─────────────────────────────────────── */

interface FakeEmail {
  id: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive';
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
}

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms: number) => new Date(ms).toISOString();

const FAKE_EMAILS: FakeEmail[] = [
  {
    id: 'em_1', folder: 'inbox',
    from: 'Ava Hartwell', fromEmail: 'ava.hartwell@example.com',
    to: 'demo.user@example.com',
    subject: 'Question about your consultation service',
    preview: 'Hi Demo, I saw your ad online and I am interested in booking a free consultation…',
    body: 'Hi Demo,\n\nI saw your ad online and I am interested in booking a free consultation. Could you let me know what times are available this week?\n\nLooking forward to hearing from you!\n\nAva',
    date: iso(now - 25 * 60000), read: false, starred: true, hasAttachment: false,
  },
  {
    id: 'em_2', folder: 'inbox',
    from: 'Liam Okafor', fromEmail: 'liam.okafor@example.com',
    to: 'demo.user@example.com',
    subject: 'Re: Your proposal — a few questions',
    preview: 'Thanks for sending over the proposal. Before we move forward, I had a couple of questions about pricing…',
    body: 'Hi Demo,\n\nThanks for sending over the proposal. Before we move forward I had a couple of questions:\n\n1. Is the onboarding fee a one-time cost?\n2. What is the minimum contract term?\n\nPlease let me know at your earliest convenience.\n\nBest,\nLiam',
    date: iso(now - 2 * HOUR), read: false, starred: false, hasAttachment: false,
  },
  {
    id: 'em_3', folder: 'inbox',
    from: 'Maya Lindqvist', fromEmail: 'maya.lindqvist@example.com',
    to: 'demo.user@example.com',
    subject: 'Invoice INV-1014 — payment confirmation',
    preview: 'Please find attached the payment confirmation for invoice INV-1014 ($1,350)…',
    body: 'Hi Demo,\n\nPlease find attached the payment confirmation for invoice INV-1014 ($1,350). Transaction processed on ' + new Date(now - 3 * HOUR).toLocaleDateString() + '.\n\nThank you!\nMaya',
    date: iso(now - 3 * HOUR), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_4', folder: 'inbox',
    from: 'Noah Marsh', fromEmail: 'noah.marsh@example.com',
    to: 'demo.user@example.com',
    subject: 'Appointment reschedule request',
    preview: 'Hey, something came up on Thursday. Would it be possible to move our 10am appointment to Friday at 2pm?',
    body: 'Hey Demo,\n\nSomething came up on Thursday. Would it be possible to move our 10 am appointment to Friday at 2 pm?\n\nSorry for the short notice!\nNoah',
    date: iso(now - 5 * HOUR), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_5', folder: 'inbox',
    from: 'Sofia Delgado', fromEmail: 'sofia.delgado@example.com',
    to: 'demo.user@example.com',
    subject: 'New 5-star Google review!',
    preview: 'We just received a 5-star Google review from Sofia Delgado. Read it now in your Reputation dashboard…',
    body: 'Great news!\n\nYou just received a new 5-star Google review:\n\n"Absolutely fantastic service, highly recommend! The team went above and beyond."\n— Sofia D.\n\nKeep up the great work!',
    date: iso(now - 1 * DAY), read: true, starred: true, hasAttachment: false,
  },
  {
    id: 'em_6', folder: 'inbox',
    from: 'Priya Raman', fromEmail: 'priya.raman@example.com',
    to: 'demo.user@example.com',
    subject: 'Team update — Q2 targets',
    preview: 'Hi Demo, just wanted to loop you in on the Q2 target review before Fridays call…',
    body: 'Hi Demo,\n\nJust wanted to loop you in on the Q2 target review before Friday\'s call. We are currently at 87% of goal with 3 weeks left in the quarter. Strong finish is very achievable!\n\nMore details attached.\n\nPriya',
    date: iso(now - 2 * DAY), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_7', folder: 'sent',
    from: 'Demo User', fromEmail: 'demo.user@example.com',
    to: 'ava.hartwell@example.com',
    subject: 'Re: Question about your consultation service',
    preview: 'Hi Ava! Thanks for reaching out. We have openings Tuesday at 10am and Thursday at 2pm…',
    body: 'Hi Ava!\n\nThanks for reaching out. We have openings Tuesday at 10 am and Thursday at 2 pm — which works best for you?\n\nThe first consultation is completely free and takes about 30 minutes.\n\nLooking forward to connecting!\nDemo',
    date: iso(now - 20 * 60000), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_8', folder: 'sent',
    from: 'Demo User', fromEmail: 'demo.user@example.com',
    to: 'liam.okafor@example.com',
    subject: 'Proposal — Growth Retainer Package',
    preview: 'Hi Liam, please find the updated proposal attached. Happy to hop on a quick call to walk through it…',
    body: 'Hi Liam,\n\nPlease find the updated proposal attached. Happy to hop on a quick call to walk through it.\n\nKey terms:\n- Monthly retainer: $1,200/month\n- Setup fee (one-time): $750\n- Minimum term: 3 months\n\nLet me know if you have any questions!\nDemo',
    date: iso(now - 4 * HOUR), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_9', folder: 'drafts',
    from: 'Demo User', fromEmail: 'demo.user@example.com',
    to: 'noah.marsh@example.com',
    subject: 'Re: Appointment reschedule request',
    preview: 'Hi Noah, no problem at all! I have moved you to Friday at 2pm…',
    body: 'Hi Noah,\n\nNo problem at all! I have moved you to Friday at 2 pm. You should receive a calendar invite shortly.\n\nSee you then!\nDemo',
    date: iso(now - 30 * 60000), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_10', folder: 'archive',
    from: 'Ethan Whitfield', fromEmail: 'ethan.whitfield@example.com',
    to: 'demo.user@example.com',
    subject: 'Thank you — great experience!',
    preview: 'Just wanted to drop a quick note to say how impressed I was with the whole process from start to finish…',
    body: 'Hi Demo,\n\nJust wanted to drop a quick note to say how impressed I was with the whole process from start to finish. Everything was smooth, professional, and exactly what I needed.\n\nI will definitely be recommending you to my network.\n\nThanks again,\nEthan',
    date: iso(now - 5 * DAY), read: true, starred: false, hasAttachment: false,
  },
];

/* ─── Integration Card Data ──────────────────────── */

type IntegrationStatus = 'connected' | 'not_connected' | 'demo_only';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  icon: React.ReactNode;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'outlook', name: 'Outlook / Email', description: 'Sync your Microsoft Outlook inbox and send emails directly from Kleegr.', status: 'not_connected', icon: <Mail size={22} />, color: 'text-blue-600 bg-blue-50' },
  { id: 'gcal', name: 'Google Calendar', description: 'Two-way sync with Google Calendar so appointments are always up to date.', status: 'demo_only', icon: <Calendar size={22} />, color: 'text-red-500 bg-red-50' },
  { id: 'stripe', name: 'Stripe / Payments', description: 'Collect payments and manage invoices with your Stripe account.', status: 'demo_only', icon: <CreditCard size={22} />, color: 'text-purple-600 bg-purple-50' },
  { id: 'facebook', name: 'Facebook & Instagram', description: 'Connect your Business Page to manage leads and conversations.', status: 'demo_only', icon: <Facebook size={22} />, color: 'text-blue-700 bg-blue-50' },
  { id: 'webchat', name: 'Web Chat', description: 'Embed the Kleegr live chat widget on your website.', status: 'demo_only', icon: <MessageCircle size={22} />, color: 'text-green-600 bg-green-50' },
  { id: 'zapier', name: 'Zapier / Webhooks', description: 'Connect Kleegr to 5,000+ apps via Zapier or custom webhooks.', status: 'demo_only', icon: <Zap size={22} />, color: 'text-orange-500 bg-orange-50' },
];

const STATUS_TONE: Record<IntegrationStatus, 'good' | 'neutral' | 'warn'> = {
  connected: 'good',
  not_connected: 'neutral',
  demo_only: 'warn',
};
const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  not_connected: 'Not connected',
  demo_only: 'Demo only',
};

/* ─── OAuth Mock Modal ─────────────────────── */

function OAuthModal({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: () => void }) {
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form');
  React.useEffect(() => {
    if (!open) {
      setStep('form');
      return undefined;
    }
    if (step !== 'loading') return undefined;

    const timer = window.setTimeout(() => setStep('done'), 1400);
    return () => window.clearTimeout(timer);
  }, [open, step]);

  function handleConnect() {
    setStep('loading');
  }

  return (
    <Modal open={open} onClose={onClose} title="Connect Outlook" size="sm" data-tour="integrations.oauthModal">
      {step === 'form' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-sunken p-4">
            <Mail size={28} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-ink">Microsoft Outlook</p>
              <p className="text-xs text-ink-muted">Kleegr will request read/write access to your inbox.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-subtle">Microsoft Account Email</label>
            <input
              defaultValue="demo.user@example.com"
              aria-label="Microsoft Account Email"
              className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              readOnly
            />
          </div>
          <p className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
            This is a demo — no real Microsoft OAuth flow will occur. Click Connect to simulate a successful connection.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleConnect}>Connect with Microsoft</Button>
          </div>
        </div>
      )}
      {step === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <RefreshCw size={28} className="animate-spin text-brand" />
          <p className="text-sm font-semibold text-ink">Connecting to Outlook…</p>
          <p className="text-xs text-ink-muted">Demo mode — simulating OAuth handshake.</p>
        </div>
      )}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-good/10 text-good"><Check size={28} /></div>
          <p className="text-sm font-bold text-ink">Outlook Connected!</p>
          <p className="text-xs text-ink-muted">Your inbox is now synced (demo only).</p>
          <Button size="sm" onClick={onConnect}>Open Inbox</Button>
        </div>
      )}
    </Modal>
  );
}

/* ─── Outlook Inbox ──────────────────────── */

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox size={15} /> },
  { id: 'sent', label: 'Sent', icon: <Send size={15} /> },
  { id: 'drafts', label: 'Drafts', icon: <FileText size={15} /> },
  { id: 'archive', label: 'Archive', icon: <Archive size={15} /> },
];

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function OutlookInbox() {
  const [folder, setFolder] = useState<FakeEmail['folder']>('inbox');
  const [selEmail, setSelEmail] = useState<FakeEmail | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const pushToast = useStore((s) => s.pushToast);

  const emails = FAKE_EMAILS.filter((e) => e.folder === folder);
  const unreadCount = FAKE_EMAILS.filter((e) => e.folder === 'inbox' && !e.read && !readIds.has(e.id)).length;

  function openEmail(e: FakeEmail) {
    setSelEmail(e);
    setReadIds((prev) => new Set([...prev, e.id]));
  }

  return (
    <div className="flex h-[600px] rounded-xl border border-line overflow-hidden" data-tour="integrations.outlookInbox">
      {/* Folder sidebar */}
      <div className="w-40 shrink-0 border-r border-line bg-surface-sunken">
        <div className="border-b border-line px-3 py-3">
          <p className="text-xs font-bold text-ink">Outlook</p>
          <p className="text-[10px] text-ink-muted">demo.user@example.com</p>
        </div>
        {FOLDERS.map((f) => {
          const count = f.id === 'inbox' ? unreadCount : 0;
          return (
            <button
              key={f.id}
              onClick={() => { setFolder(f.id as FakeEmail['folder']); setSelEmail(null); }}
              className={cx(
                'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                folder === f.id ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-muted hover:bg-surface hover:text-ink',
              )}
            >
              <span className="flex items-center gap-2">{f.icon}{f.label}</span>
              {count > 0 && <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-white">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Email list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-line">
        <div className="border-b border-line px-3 py-2.5">
          <p className="text-xs font-bold capitalize text-ink">{folder}</p>
          <p className="text-[10px] text-ink-muted">{emails.length} messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.length === 0 && <p className="px-3 py-6 text-center text-xs text-ink-subtle">No messages</p>}
          {emails.map((e) => {
            const isRead = e.read || readIds.has(e.id);
            return (
              <button
                key={e.id}
                onClick={() => openEmail(e)}
                data-tour="integrations.emailRow"
                className={cx(
                  'flex w-full flex-col gap-0.5 border-b border-line/60 px-3 py-3 text-left transition-colors hover:bg-surface-sunken',
                  selEmail?.id === e.id && 'bg-brand-soft/50',
                  !isRead && 'bg-blue-50/40',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={cx('truncate text-xs', !isRead ? 'font-bold text-ink' : 'font-medium text-ink-muted')}>{e.from}</p>
                  <span className="shrink-0 text-[10px] text-ink-subtle">{timeLabel(e.date)}</span>
                </div>
                <p className={cx('truncate text-xs', !isRead ? 'font-semibold text-ink' : 'text-ink-muted')}>{e.subject}</p>
                <p className="truncate text-[11px] text-ink-subtle">{e.preview}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {e.starred && <Star size={10} className="text-warn fill-warn" />}
                  {e.hasAttachment && <Paperclip size={10} className="text-ink-subtle" />}
                  {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading pane */}
      <div className="flex-1 flex flex-col min-w-0" data-tour="integrations.readingPane">
        {selEmail ? (
          <>
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink">{selEmail.subject}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="font-medium text-ink">{selEmail.from}</span>
                    <span>&lt;{selEmail.fromEmail}&gt;</span>
                  </div>
                  <p className="text-xs text-ink-subtle">To: {selEmail.to} · {timeLabel(selEmail.date)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" aria-label={selEmail.starred ? 'Unstar email' : 'Star email'} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><Star size={15} className={selEmail.starred ? 'fill-warn text-warn' : ''} /></button>
                  <button type="button" aria-label="More email actions" className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><MoreHorizontal size={15} /></button>
                  <button type="button" aria-label="Close email" onClick={() => setSelEmail(null)} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><X size={15} /></button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{selEmail.body}</p>
              {selEmail.hasAttachment && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-3 py-2.5">
                  <Paperclip size={14} className="text-ink-muted" />
                  <span className="text-xs font-medium text-ink">attachment.pdf</span>
                  <span className="text-xs text-ink-subtle">· 84 KB</span>
                </div>
              )}
            </div>
            <div className="border-t border-line px-5 py-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => pushToast({ title: 'Reply (demo only)', description: 'Replies are not sent in demo mode.', variant: 'info' })}
              >
                <Reply size={13} /> Reply
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Mail size={32} className="text-ink-subtle" />
            <p className="text-sm font-semibold text-ink">Select an email to read</p>
            <p className="text-xs text-ink-muted">Choose from the list on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Marketplace surface ────────────────── */

type MarketTab = 'all' | 'installed' | 'reselling' | 'agents' | 'earnings' | 'tickets' | 'templates';

interface MarketplaceApp {
  id: string;
  name: string;
  author: string;
  description: string;
  installs: string;
  rating: string;
  price: 'Free' | 'Paid';
  initials: string;
  accent: string;
  whiteLabel?: boolean;
}

const MARKET_TABS: Array<{ id: MarketTab; label: string }> = [
  { id: 'all', label: 'All Apps' },
  { id: 'installed', label: 'Installed Apps' },
  { id: 'reselling', label: 'App Reselling' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'templates', label: 'Templates' },
];

const MARKET_APPS: MarketplaceApp[] = [
  { id: 'pipeline-sync', name: 'Pipeline Sync Pro', author: 'Northstar Labs', description: 'Keep customer records, custom fields, and pipeline stages in sync.', installs: '438.4K', rating: '4.8 (118)', price: 'Free', initials: 'PS', accent: 'from-indigo-100 to-blue-200 text-indigo-700', whiteLabel: true },
  { id: 'flow-connect', name: 'Flow Connect', author: 'Magnet Works', description: 'Connect multiple applications and automate everyday account tasks.', installs: '263.9K', rating: '5.0 (42)', price: 'Free', initials: 'FC', accent: 'from-emerald-100 to-cyan-200 text-emerald-700', whiteLabel: true },
  { id: 'onboard-kit', name: 'Onboard Kit', author: 'Level Peak', description: 'Client onboarding, checklists, support, feedback, and custom assets.', installs: '197.5K', rating: '4.7 (60)', price: 'Paid', initials: 'OK', accent: 'from-teal-100 to-emerald-200 text-teal-700', whiteLabel: true },
  { id: 'assistable', name: 'Assistable AI', author: 'Assistable Studio', description: 'An AI teammate for intake, qualification, and customer follow-up.', installs: '128.2K', rating: '4.5 (22)', price: 'Free', initials: 'AI', accent: 'from-fuchsia-100 to-orange-100 text-fuchsia-700', whiteLabel: true },
  { id: 'canvas', name: 'Canvas Design', author: 'Lead Connector', description: 'Design polished social posts and publish them without leaving Kleegr.', installs: '91.4K', rating: '4.7 (59)', price: 'Free', initials: 'CD', accent: 'from-cyan-100 to-purple-200 text-purple-700' },
  { id: 'message-hub', name: 'Message Hub', author: 'Juniper Digital', description: 'Unified SMS, business messaging, and team routing for local teams.', installs: '89.4K', rating: '4.7 (12)', price: 'Paid', initials: 'MH', accent: 'from-violet-100 to-indigo-200 text-violet-700', whiteLabel: true },
  { id: 'books-bridge', name: 'Books Bridge', author: 'Harbor Systems', description: 'Send invoices, payments, and customer records to your accounting stack.', installs: '78.1K', rating: '4.6 (31)', price: 'Paid', initials: 'BB', accent: 'from-green-100 to-lime-100 text-green-700' },
  { id: 'review-loop', name: 'Review Loop', author: 'Brightside Apps', description: 'Build review campaigns and route unhappy customers to your team.', installs: '64.8K', rating: '4.9 (74)', price: 'Free', initials: 'RL', accent: 'from-amber-100 to-yellow-200 text-amber-700' },
  { id: 'calendar-router', name: 'Calendar Router', author: 'Routewell', description: 'Route appointments by service, territory, availability, or lead value.', installs: '51.2K', rating: '4.8 (37)', price: 'Paid', initials: 'CR', accent: 'from-sky-100 to-blue-200 text-sky-700', whiteLabel: true },
];

const FILTER_GROUPS = ['Collections', 'Categories', 'App Contains', 'Business Niche', 'Built By', 'Pricing', 'Who can install the app?'];

const MARKET_EMPTY_META: Record<Exclude<MarketTab, 'all' | 'installed'>, { title: string; body: string; icon: React.ReactNode }> = {
  reselling: { title: 'Apps ready for reselling', body: 'Package compatible apps into a branded offer for your customers.', icon: <ShoppingBag size={24} /> },
  agents: { title: 'AI Agent marketplace', body: 'Browse ready-to-use voice, support, and lead qualification agents.', icon: <Bot size={24} /> },
  earnings: { title: 'Marketplace earnings', body: 'Track illustrative installs, recurring revenue, and app commissions.', icon: <DollarSign size={24} /> },
  tickets: { title: 'Marketplace support', body: 'Review support requests related to installed apps and integrations.', icon: <LifeBuoy size={24} /> },
  templates: { title: 'Integration templates', body: 'Start from proven recipes for calendars, payments, and lead routing.', icon: <LayoutTemplate size={24} /> },
};

function MarketplaceAppCard({ app, onOpen }: { app: MarketplaceApp; onOpen: (app: MarketplaceApp) => void }) {
  return (
    <button type="button" onClick={() => onOpen(app)} className="flex min-h-[190px] flex-col rounded-[3px] border border-line bg-surface p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card">
      <div className="flex items-start gap-3">
        <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-xs font-extrabold', app.accent)}>{app.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold text-ink">{app.name}</p>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-subtle"><Download size={13} /> {app.installs}</span>
          </div>
          <p className="truncate text-[11px] text-ink-muted">By {app.author}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-muted">{app.description}</p>
      <div className="mt-auto pt-2">
        <div className="flex items-center gap-1 text-[#f4aa23]">
          <span className="tracking-[2px]">★★★★</span><span className="text-[#d7dce3]">★</span>
          <span className="ml-1 text-[11px] text-ink-muted">{app.rating}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={cx('rounded-full border px-2 py-0.5 text-[11px] font-medium', app.price === 'Free' ? 'border-line text-ink-muted' : 'border-blue-200 bg-blue-50 text-blue-600')}>{app.price}</span>
          {app.whiteLabel ? <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700">✓ WL</span> : null}
        </div>
      </div>
    </button>
  );
}

export function Integrations() {
  const pushToast = useStore((s) => s.pushToast);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [activeTab, setActiveTab] = useState<MarketTab>('all');
  const [search, setSearch] = useState('');
  const [showOAuth, setShowOAuth] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const outlookStatus = integrations.find((i) => i.id === 'outlook')?.status ?? 'not_connected';
  const visibleApps = MARKET_APPS.filter((app) => {
    const query = search.trim().toLowerCase();
    return !query || `${app.name} ${app.author} ${app.description}`.toLowerCase().includes(query);
  });

  function handleOutlookConnect() {
    setIntegrations((prev) => prev.map((i) => i.id === 'outlook' ? { ...i, status: 'connected' } : i));
    setShowOAuth(false);
    setShowInbox(true);
    pushToast({ title: 'Outlook connected', description: 'Demo inbox is ready.', variant: 'success' });
  }

  function openMarketplaceApp(app: MarketplaceApp) {
    pushToast({ title: app.name, description: 'App details are illustrative in this public demo.', variant: 'info' });
  }

  return (
    <div data-tour="integrations.page" className="flex h-full min-h-0 flex-col bg-surface">
      <div className="border-b border-line bg-surface px-8 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-ink">Marketplace Apps</h1>
              <label className="relative">
                <select className="h-10 min-w-[195px] appearance-none rounded-md border border-line bg-surface px-3 pr-9 text-sm text-ink outline-none" aria-label="Marketplace view">
                  <option>Agency View</option>
                  <option>Account View</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              </label>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Get more out of your CRM. Explore apps &amp; integrate them with your account seamlessly.</p>
          </div>
          <Button variant="ghost" className="mt-1 text-sm font-medium"><Settings size={20} /> Settings</Button>
        </div>

        <div role="tablist" aria-label="Marketplace sections" className="mt-8 flex items-end gap-8 overflow-x-auto">
          {MARKET_TABS.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={cx('border-b-2 pb-3 text-[13px] font-semibold whitespace-nowrap', activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-ink hover:text-brand')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'all' ? (
        <div className="flex min-h-0 flex-1">
          <aside className="w-[212px] shrink-0 border-r border-line bg-surface px-7 py-5">
            {FILTER_GROUPS.map((filter) => (
              <button key={filter} type="button" className="flex w-full items-start gap-2 border-b border-line py-4 text-left text-[13px] font-semibold text-ink">
                <ChevronRight size={14} className="mt-0.5 shrink-0" /> {filter}
              </button>
            ))}
          </aside>
          <section className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-[18px] font-semibold text-ink">2,056 Apps</h2>
              <label className="relative w-[196px] lg:w-[260px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search marketplace apps" placeholder="Search Apps" className="h-10 w-full rounded-md border border-line bg-surface pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand" />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {visibleApps.map((app) => <MarketplaceAppCard key={app.id} app={app} onOpen={openMarketplaceApp} />)}
            </div>
            <div className="mt-6 flex items-center justify-center gap-1 border-t border-line pt-4 text-xs">
              <Button variant="secondary" size="sm" disabled>Previous</Button>
              {[1, 2, 3, 4, 5, 6, 7].map((page) => <button type="button" key={page} className={cx('h-8 w-8 rounded border text-xs', page === 1 ? 'border-brand text-brand' : 'border-transparent text-ink-muted')}>{page}</button>)}
              <span className="px-1 text-ink-subtle">… 98</span>
              <Button variant="secondary" size="sm">Next</Button>
            </div>
          </section>
        </div>
      ) : activeTab === 'installed' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken px-7 py-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold text-ink">Installed Apps</h2><p className="text-xs text-ink-muted">Manage connected accounts and the apps available to this demo workspace.</p></div>
            <Button variant="secondary" size="sm"><SlidersHorizontal size={14} /> Manage permissions</Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-tour="integrations.cards">
            {integrations.map((intg) => (
              <Card key={intg.id} className="flex min-h-[190px] flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', intg.color)}>{intg.icon}</div>
                  <Badge tone={STATUS_TONE[intg.status]}>{STATUS_LABEL[intg.status]}</Badge>
                </div>
                <div><p className="text-sm font-bold text-ink">{intg.name}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{intg.description}</p></div>
                {intg.id === 'outlook' ? (
                  outlookStatus === 'connected' ? (
                    <div className="mt-auto flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowInbox(true)}><Mail size={13} /> View Inbox</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setIntegrations((current) => current.map((item) => item.id === 'outlook' ? { ...item, status: 'not_connected' } : item)); setShowInbox(false); }}>Disconnect</Button>
                    </div>
                  ) : <Button size="sm" className="mt-auto" data-tour="integrations.connectOutlook" onClick={() => setShowOAuth(true)}>Connect Outlook</Button>
                ) : (
                  <Button variant="secondary" size="sm" className="mt-auto" onClick={() => pushToast({ title: `${intg.name} — demo only`, variant: 'info' })}>{intg.status === 'connected' ? 'Manage' : 'Connect'} <ExternalLink size={13} /></Button>
                )}
              </Card>
            ))}
          </div>
          {showInbox && outlookStatus === 'connected' ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Mail size={16} className="text-blue-600" /><h2 className="text-sm font-bold text-ink">Outlook Inbox</h2><Badge tone="good">Connected</Badge></div><button type="button" aria-label="Close Outlook inbox" onClick={() => setShowInbox(false)} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface"><X size={15} /></button></div>
              <OutlookInbox />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-surface-sunken p-8">
          <Card className="w-full max-w-xl p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand-soft text-brand">{MARKET_EMPTY_META[activeTab].icon}</span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{MARKET_EMPTY_META[activeTab].title}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{MARKET_EMPTY_META[activeTab].body}</p>
            <Button className="mt-5" onClick={() => pushToast({ title: 'Demo preview', description: 'This marketplace area is illustrative.', variant: 'info' })}><Package size={15} /> Explore options</Button>
          </Card>
        </div>
      )}

      <OAuthModal open={showOAuth} onClose={() => setShowOAuth(false)} onConnect={handleOutlookConnect} />
    </div>
  );
}
