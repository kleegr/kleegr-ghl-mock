import React, { useState } from 'react';
import {
  Mail, Calendar, CreditCard, Facebook, MessageCircle, Zap,
  Check, Inbox, Send, FileText, Archive, ChevronRight,
  Star, Paperclip, Reply, MoreHorizontal, X, RefreshCw,
} from 'lucide-react';
import { PageHeader, Button, Badge, Card } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx, relativeTime } from '@/utils';

/* ─── Local Fake Email Data ─────────────────────────────────────
   Per spec: no real Outlook/Microsoft API. All emails are local
   fake data created purely inside this module.
   ──────────────────────────────────────────────────────────── */

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
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Question about your consultation service',
    preview: 'Hi Jordan, I saw your ad online and I am interested in booking a free consultation…',
    body: 'Hi Jordan,\n\nI saw your ad online and I am interested in booking a free consultation. Could you let me know what times are available this week?\n\nLooking forward to hearing from you!\n\nAva',
    date: iso(now - 25 * 60000), read: false, starred: true, hasAttachment: false,
  },
  {
    id: 'em_2', folder: 'inbox',
    from: 'Liam Okafor', fromEmail: 'liam.okafor@example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Re: Your proposal — a few questions',
    preview: 'Thanks for sending over the proposal. Before we move forward, I had a couple of questions about pricing…',
    body: 'Hi Jordan,\n\nThanks for sending over the proposal. Before we move forward I had a couple of questions:\n\n1. Is the onboarding fee a one-time cost?\n2. What is the minimum contract term?\n\nPlease let me know at your earliest convenience.\n\nBest,\nLiam',
    date: iso(now - 2 * HOUR), read: false, starred: false, hasAttachment: false,
  },
  {
    id: 'em_3', folder: 'inbox',
    from: 'Maya Lindqvist', fromEmail: 'maya.lindqvist@example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Invoice INV-1014 — payment confirmation',
    preview: 'Please find attached the payment confirmation for invoice INV-1014 ($1,350)…',
    body: 'Hi Jordan,\n\nPlease find attached the payment confirmation for invoice INV-1014 ($1,350). Transaction processed on ' + new Date(now - 3 * HOUR).toLocaleDateString() + '.\n\nThank you!\nMaya',
    date: iso(now - 3 * HOUR), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_4', folder: 'inbox',
    from: 'Noah Marsh', fromEmail: 'noah.marsh@example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Appointment reschedule request',
    preview: 'Hey, something came up on Thursday. Would it be possible to move our 10am appointment to Friday at 2pm?',
    body: 'Hey Jordan,\n\nSomething came up on Thursday. Would it be possible to move our 10 am appointment to Friday at 2 pm?\n\nSorry for the short notice!\nNoah',
    date: iso(now - 5 * HOUR), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_5', folder: 'inbox',
    from: 'Sofia Delgado', fromEmail: 'sofia.delgado@example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'New 5-star Google review!',
    preview: 'We just received a 5-star Google review from Sofia Delgado. Read it now in your Reputation dashboard…',
    body: 'Great news!\n\nYou just received a new 5-star Google review:\n\n"Absolutely fantastic service, highly recommend! The team went above and beyond."\n— Sofia D.\n\nKeep up the great work!',
    date: iso(now - 1 * DAY), read: true, starred: true, hasAttachment: false,
  },
  {
    id: 'em_6', folder: 'inbox',
    from: 'Priya Raman', fromEmail: 'priya@kleegr-demo.example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Team update — Q2 targets',
    preview: 'Hi Jordan, just wanted to loop you in on the Q2 target review before Fridays call…',
    body: 'Hi Jordan,\n\nJust wanted to loop you in on the Q2 target review before Friday\'s call. We are currently at 87% of goal with 3 weeks left in the quarter. Strong finish is very achievable!\n\nMore details attached.\n\nPriya',
    date: iso(now - 2 * DAY), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_7', folder: 'sent',
    from: 'Jordan Avery', fromEmail: 'jordan@kleegr-demo.example.com',
    to: 'ava.hartwell@example.com',
    subject: 'Re: Question about your consultation service',
    preview: 'Hi Ava! Thanks for reaching out. We have openings Tuesday at 10am and Thursday at 2pm…',
    body: 'Hi Ava!\n\nThanks for reaching out. We have openings Tuesday at 10 am and Thursday at 2 pm — which works best for you?\n\nThe first consultation is completely free and takes about 30 minutes.\n\nLooking forward to connecting!\nJordan',
    date: iso(now - 20 * 60000), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_8', folder: 'sent',
    from: 'Jordan Avery', fromEmail: 'jordan@kleegr-demo.example.com',
    to: 'liam.okafor@example.com',
    subject: 'Proposal — Growth Retainer Package',
    preview: 'Hi Liam, please find the updated proposal attached. Happy to hop on a quick call to walk through it…',
    body: 'Hi Liam,\n\nPlease find the updated proposal attached. Happy to hop on a quick call to walk through it.\n\nKey terms:\n- Monthly retainer: $1,200/month\n- Setup fee (one-time): $750\n- Minimum term: 3 months\n\nLet me know if you have any questions!\nJordan',
    date: iso(now - 4 * HOUR), read: true, starred: false, hasAttachment: true,
  },
  {
    id: 'em_9', folder: 'drafts',
    from: 'Jordan Avery', fromEmail: 'jordan@kleegr-demo.example.com',
    to: 'noah.marsh@example.com',
    subject: 'Re: Appointment reschedule request',
    preview: 'Hi Noah, no problem at all! I have moved you to Friday at 2pm…',
    body: 'Hi Noah,\n\nNo problem at all! I have moved you to Friday at 2 pm. You should receive a calendar invite shortly.\n\nSee you then!\nJordan',
    date: iso(now - 30 * 60000), read: true, starred: false, hasAttachment: false,
  },
  {
    id: 'em_10', folder: 'archive',
    from: 'Ethan Whitfield', fromEmail: 'ethan.whitfield@example.com',
    to: 'jordan@kleegr-demo.example.com',
    subject: 'Thank you — great experience!',
    preview: 'Just wanted to drop a quick note to say how impressed I was with the whole process from start to finish…',
    body: 'Hi Jordan,\n\nJust wanted to drop a quick note to say how impressed I was with the whole process from start to finish. Everything was smooth, professional, and exactly what I needed.\n\nI will definitely be recommending you to my network.\n\nThanks again,\nEthan',
    date: iso(now - 5 * DAY), read: true, starred: false, hasAttachment: false,
  },
];

/* ─── Integration Card Data ───────────────────────────────────── */

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

/* ─── OAuth Mock Modal ────────────────────────────────────────── */

function OAuthModal({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: () => void }) {
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form');
  React.useEffect(() => { if (!open) setStep('form'); }, [open]);

  function handleConnect() {
    setStep('loading');
    setTimeout(() => setStep('done'), 1400);
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
              defaultValue="jordan@kleegr-demo.example.com"
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

/* ─── Outlook Inbox ───────────────────────────────────────────── */

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
          <p className="text-[10px] text-ink-muted">jordan@kleegr-demo.example.com</p>
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
                  <button className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><Star size={15} className={selEmail.starred ? 'fill-warn text-warn' : ''} /></button>
                  <button className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><MoreHorizontal size={15} /></button>
                  <button onClick={() => setSelEmail(null)} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"><X size={15} /></button>
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

/* ─── Main Integrations Page ─────────────────────────────────── */

export function Integrations() {
  const pushToast = useStore((s) => s.pushToast);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [showOAuth, setShowOAuth] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const outlookStatus = integrations.find((i) => i.id === 'outlook')?.status ?? 'not_connected';

  function handleOutlookConnect() {
    setIntegrations((prev) => prev.map((i) => i.id === 'outlook' ? { ...i, status: 'connected' } : i));
    setShowOAuth(false);
    setShowInbox(true);
    pushToast({ title: 'Outlook connected', description: 'Demo inbox is ready.', variant: 'success' });
  }

  return (
    <div data-tour="integrations.page">
      <PageHeader
        title="Integrations"
        subtitle="Connected accounts — Outlook, calendar sync, and third-party apps"
      />

      <div className="px-5 py-5 space-y-6 pb-8">
        {/* Integration cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="integrations.cards">
          {integrations.map((intg) => (
            <Card key={intg.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', intg.color)}>
                  {intg.icon}
                </div>
                <Badge tone={STATUS_TONE[intg.status]}>{STATUS_LABEL[intg.status]}</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{intg.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{intg.description}</p>
              </div>
              {intg.id === 'outlook' ? (
                <div className="flex gap-2 mt-auto">
                  {outlookStatus === 'connected' ? (
                    <>
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowInbox(true)} data-tour="integrations.connectOutlook">
                        <Mail size={13} /> View Inbox
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setIntegrations((p) => p.map((i) => i.id === 'outlook' ? { ...i, status: 'not_connected' } : i)); setShowInbox(false); pushToast({ title: 'Outlook disconnected (demo)', variant: 'info' }); }}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1" data-tour="integrations.connectOutlook" onClick={() => setShowOAuth(true)}>
                      Connect Outlook
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-auto"
                  onClick={() => pushToast({ title: `${intg.name} — demo only`, description: 'Real integration not implemented in this demo.', variant: 'info' })}
                >
                  {intg.status === 'connected' ? 'Manage' : 'Connect'} <ChevronRight size={13} />
                </Button>
              )}
            </Card>
          ))}
        </div>

        {/* Outlook inbox section */}
        {showInbox && outlookStatus === 'connected' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                <h2 className="text-sm font-bold text-ink">Outlook Inbox</h2>
                <Badge tone="good">Connected</Badge>
              </div>
              <button onClick={() => setShowInbox(false)} className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink">
                <X size={15} />
              </button>
            </div>
            <OutlookInbox />
          </div>
        )}
      </div>

      <OAuthModal open={showOAuth} onClose={() => setShowOAuth(false)} onConnect={handleOutlookConnect} />
    </div>
  );
}
