import { useState, useEffect, useRef } from 'react';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Phone as PhoneIcon,
  PhoneOff,
  X,
  Mic,
  MicOff,
  Search,
  Plus,
  RotateCcw,
  MoreVertical,
  ShieldCheck,
  MessageSquareText,
  Settings2,
  CheckCircle2,
  FileBadge,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { relativeTime, fullName, cx } from '@/utils';
import type { Call } from '@/types';

type Filter = 'all' | 'missed' | 'inbound' | 'outbound' | 'voicemail';
type DialState = 'idle' | 'calling' | 'connected' | 'ended';
type PhoneSection = 'numbers' | 'bundles' | 'messaging' | 'voice' | 'trust' | 'settings';

const PHONE_SECTIONS: Array<{ id: PhoneSection; label: string }> = [
  { id: 'numbers', label: 'Phone numbers' },
  { id: 'bundles', label: 'Regulatory Bundles' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'voice', label: 'Voice' },
  { id: 'trust', label: 'Trust Center' },
  { id: 'settings', label: 'Additional Settings' },
];

const DEMO_NUMBERS = [
  { number: '+1 (646) 555-0147', badges: ['Default Number', 'A2P Verified'], type: 'Local', friendly: 'Main Office', forwarding: 'Round robin', timeout: '30 s' },
  { number: '+1 (845) 555-0192', badges: ['A2P Verified'], type: 'Local', friendly: 'Sales Line', forwarding: 'Sales Team', timeout: '20 s' },
];

const DIR_META = {
  inbound: { icon: PhoneIncoming, color: 'text-good', label: 'Inbound' },
  outbound: { icon: PhoneOutgoing, color: 'text-brand', label: 'Outbound' },
  missed: { icon: PhoneMissed, color: 'text-bad', label: 'Missed' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'inbound', label: 'Inbound' },
  { id: 'outbound', label: 'Outbound' },
  { id: 'voicemail', label: 'Voicemail' },
];

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

function dur(sec: number) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function useTick(active: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return secs;
}

export function Phone() {
  const calls = useStore((s) => s.calls);
  const contacts = useStore((s) => s.contacts);
  const pushToast = useStore((s) => s.pushToast);

  const [section, setSection] = useState<PhoneSection>('numbers');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<Call | null>(null);
  const [dialerOpen, setDialerOpen] = useState(false);

  // Dialer state
  const [dialNumber, setDialNumber] = useState('');
  const [dialState, setDialState] = useState<DialState>('idle');
  const [muted, setMuted] = useState(false);
  const callTimerActive = dialState === 'connected';
  const connectedSecs = useTick(callTimerActive);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? fullName(c) : 'Unknown';
  };

  const missed = calls.filter((c) => c.direction === 'missed');
  const voicemails = calls.filter((c) => !!c.voicemailTranscript);

  const filtered = calls.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'voicemail') return !!c.voicemailTranscript;
    return c.direction === filter;
  });

  function handleDial() {
    if (!dialNumber.trim()) return;
    setDialState('calling');
    callTimeoutRef.current = setTimeout(() => {
      setDialState('connected');
    }, 1800);
  }

  function handleHangUp() {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    setDialState('ended');
    setTimeout(() => {
      setDialerOpen(false);
      setDialState('idle');
      setDialNumber('');
      setMuted(false);
      pushToast({ title: 'Call ended', description: 'Demo only — no real call was placed.', variant: 'default' });
    }, 900);
  }

  function handleDialerClose() {
    if (dialState === 'calling' || dialState === 'connected') {
      handleHangUp();
      return;
    }
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    setDialerOpen(false);
    setDialState('idle');
    setDialNumber('');
    setMuted(false);
  }

  function appendKey(k: string) {
    if (dialState !== 'idle') return;
    setDialNumber((n) => (n.length < 14 ? n + k : n));
  }

  const filterCounts: Record<Filter, number> = {
    all: calls.length,
    missed: missed.length,
    inbound: calls.filter((c) => c.direction === 'inbound').length,
    outbound: calls.filter((c) => c.direction === 'outbound').length,
    voicemail: voicemails.length,
  };

  return (
    <div data-tour="phone.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <div className="flex h-10 shrink-0 items-end border-b border-line bg-surface px-5">
        <h1 className="mb-2 mr-5 text-[20px] font-medium text-ink">Phone System</h1>
        <div role="tablist" aria-label="Phone System sections" className="flex h-full items-end gap-7 overflow-x-auto">
          {PHONE_SECTIONS.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={section === tab.id} onClick={() => setSection(tab.id)} className={cx('h-full whitespace-nowrap border-b-2 px-0 pt-1 text-[13px] font-medium', section === tab.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {section === 'numbers' ? (
          <Card className="overflow-hidden rounded-xl">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <div className="flex items-center gap-2"><h2 className="text-[18px] font-semibold text-ink">Manage Numbers</h2><Badge tone="brand">2 Phone Numbers</Badge></div>
                <p className="mt-1 text-[13px] text-ink-muted">Manage your Phone Numbers and their configuration here</p>
              </div>
              <Button className="h-10 px-4" onClick={() => pushToast({ title: 'Add number', description: 'Purchasing numbers is disabled in this public demo.', variant: 'info' })}><Plus size={17} /> Add Number</Button>
            </div>
            <div className="flex items-center justify-between border-b border-line px-6 py-3">
              <div className="flex h-10 overflow-hidden rounded-md border border-line">
                {['Phone Numbers', 'Number Pools', 'Verified Caller IDs', 'Port-In Numbers'].map((label, index) => (
                  <button type="button" key={label} className={cx('border-r border-line px-4 text-[13px] font-medium last:border-r-0', index === 0 ? 'bg-surface-sunken text-ink' : 'bg-surface text-ink-muted')}>{label}</button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="relative w-[240px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" /><input aria-label="Search phone numbers" placeholder="Search" className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand" /></label>
                <Button variant="secondary" className="h-10 w-10 px-0" aria-label="Refresh numbers"><RotateCcw size={17} /></Button>
              </div>
            </div>
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[2fr_.8fr_1fr_1fr_.75fr_36px] bg-surface-sunken px-6 py-3 text-[11px] font-medium text-ink-muted">
                <span>Numbers</span><span>Type</span><span>Friendly Name</span><span>Forwarding Number</span><span>Call Timeout</span><span />
              </div>
              {DEMO_NUMBERS.map((item) => (
                <div key={item.number} className="grid grid-cols-[2fr_.8fr_1fr_1fr_.75fr_36px] items-center border-t border-line px-6 py-4 text-[12px]">
                  <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-base">🇺🇸</span><div><p className="font-semibold text-ink">{item.number}</p><div className="mt-1 flex gap-1.5">{item.badges.map((badge) => <span key={badge} className={cx('rounded px-2 py-0.5 text-[10px] font-medium', badge === 'Default Number' ? 'bg-brand-soft text-brand' : 'bg-emerald-50 text-emerald-600')}>{badge}</span>)}</div></div></div>
                  <span className="w-fit rounded bg-surface-sunken px-2 py-1 text-ink-muted">{item.type}</span>
                  <span className="font-medium text-ink">{item.friendly}</span>
                  <span className="text-ink-muted">{item.forwarding}</span>
                  <span className="text-ink-muted">↓ {item.timeout}</span>
                  <button type="button" className="grid h-8 w-8 place-items-center rounded text-ink-muted hover:bg-surface-sunken" aria-label={`More actions for ${item.friendly}`}><MoreVertical size={16} /></button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-6 py-3 text-xs text-ink-muted"><span>Page 1 of 1</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled>Previous</Button><Button variant="secondary" size="sm" className="border-brand text-brand">1</Button><Button variant="secondary" size="sm" disabled>Next</Button></div></div>
          </Card>
        ) : section === 'voice' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-ink">Voice</h2><p className="text-sm text-ink-muted">Call activity and voicemail for your workspace.</p></div><Button data-tour="phone.dialerButton" onClick={() => setDialerOpen(true)}><PhoneIcon size={15} /> Open Dialer</Button></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="phone.summary">
              <MiniStat label="Total calls" value={calls.length} sub="all time" />
              <MiniStat label="Missed calls" value={missed.length} sub={`${Math.round((missed.length / (calls.length || 1)) * 100)}% miss rate`} />
              <MiniStat label="Voicemails" value={voicemails.length} sub="unreviewed" />
              <MiniStat label="Avg duration" value={dur(Math.round(calls.filter((c) => c.durationSec > 0).reduce((sum, call) => sum + call.durationSec, 0) / (calls.filter((c) => c.durationSec > 0).length || 1)))} sub="per answered call" />
            </div>
            <div role="tablist" aria-label="Call filters" className="flex w-fit items-center gap-1 rounded-lg bg-white p-1 shadow-sm" data-tour="phone.filters">
              {FILTER_TABS.map((tab) => <button type="button" role="tab" aria-selected={filter === tab.id} key={tab.id} onClick={() => setFilter(tab.id as Filter)} className={cx('rounded-md px-3 py-1.5 text-xs font-semibold', filter === tab.id ? 'bg-brand text-white' : 'text-ink-muted hover:bg-surface-sunken')}>{tab.label}<span className="ml-1 opacity-70">{filterCounts[tab.id as Filter]}</span></button>)}
            </div>
            <Card data-tour="phone.callLog">
              <div className="border-b border-line px-4 py-3"><h3 className="text-sm font-bold text-ink">{filter === 'all' ? 'All calls' : `${filter.charAt(0).toUpperCase()}${filter.slice(1)} calls`}<span className="ml-2 text-xs font-normal text-ink-subtle">{filtered.length} records</span></h3></div>
              {filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-ink-subtle">No calls match this filter</p> : (
                <div className="divide-y divide-line">{filtered.map((call) => { const meta = DIR_META[call.direction]; const Icon = meta.icon; return (
                  <button type="button" key={call.id} data-tour="phone.callRow" onClick={() => setDetail(call)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken">
                    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', call.direction === 'missed' ? 'bg-bad/10' : call.direction === 'inbound' ? 'bg-good/10' : 'bg-brand-soft')}><Icon size={16} className={meta.color} /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{contactName(call.contactId)}</p>{call.voicemailTranscript ? <p className="flex items-center gap-1 truncate text-xs text-ink-muted"><Voicemail size={11} />{call.voicemailTranscript}</p> : <p className="text-xs text-ink-subtle">{meta.label}</p>}</div>
                    <div className="shrink-0 text-right"><p className="text-xs font-medium text-ink-muted">{dur(call.durationSec)}</p><p className="text-[11px] text-ink-subtle">{relativeTime(call.createdAt)}</p></div>
                  </button>
                ); })}</div>
              )}
            </Card>
          </div>
        ) : section === 'bundles' ? (
          <Card className="overflow-hidden"><div className="border-b border-line px-6 py-5"><h2 className="text-lg font-semibold text-ink">Regulatory Bundles</h2><p className="mt-1 text-sm text-ink-muted">Business identity documents used for compliant phone service.</p></div><div className="grid grid-cols-[1.5fr_1fr_1fr_120px] bg-surface-sunken px-6 py-3 text-[11px] font-semibold text-ink-muted"><span>Bundle</span><span>Country</span><span>Created</span><span>Status</span></div><div className="grid grid-cols-[1.5fr_1fr_1fr_120px] items-center border-t border-line px-6 py-5 text-sm"><span className="flex items-center gap-3 font-medium"><FileBadge size={20} className="text-brand" /> Demo Business Bundle</span><span>United States</span><span className="text-ink-muted">Aug 18, 2026</span><Badge tone="good"><CheckCircle2 size={11} className="mr-1" /> Approved</Badge></div></Card>
        ) : section === 'messaging' ? (
          <div className="grid gap-4 lg:grid-cols-2"><Card className="p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><MessageSquareText size={20} /></span><div><h2 className="font-semibold text-ink">Messaging Services</h2><p className="mt-1 text-sm text-ink-muted">SMS and MMS are enabled for both demo numbers.</p><Badge tone="good" className="mt-4">A2P verified</Badge></div></div></Card><Card className="p-6"><h2 className="font-semibold text-ink">Usage limits</h2><div className="mt-5 h-2 rounded-full bg-surface-sunken"><div className="h-2 w-[38%] rounded-full bg-brand" /></div><div className="mt-2 flex justify-between text-xs text-ink-muted"><span>3,812 messages</span><span>10,000 monthly</span></div></Card></div>
        ) : section === 'trust' ? (
          <Card className="p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><ShieldCheck size={23} /></span><div><h2 className="text-lg font-semibold text-ink">Trust Center</h2><p className="text-sm text-ink-muted">Your demo phone setup meets the recommended messaging requirements.</p></div></div><div className="mt-6 grid gap-3 md:grid-cols-3">{['Business profile verified', 'A2P campaign approved', 'Caller identity configured'].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-sm font-medium text-ink"><CheckCircle2 size={17} className="text-good" />{item}</div>)}</div></Card>
        ) : (
          <Card className="max-w-3xl p-6"><div className="flex items-center gap-3"><Settings2 size={22} className="text-brand" /><div><h2 className="text-lg font-semibold text-ink">Additional Settings</h2><p className="text-sm text-ink-muted">Default behavior for calls across this workspace.</p></div></div><div className="mt-6 divide-y divide-line rounded-lg border border-line">{['Missed call text back', 'Call recording notice', 'Voicemail transcription'].map((setting, index) => <div key={setting} className="flex items-center justify-between px-4 py-4 text-sm"><span className="font-medium text-ink">{setting}</span><button type="button" className={cx('relative h-5 w-9 rounded-full transition-colors', index === 1 ? 'bg-line' : 'bg-brand')} aria-label={`Toggle ${setting}`}><span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm', index === 1 ? 'left-0.5' : 'right-0.5')} /></button></div>)}</div></Card>
        )}
      </div>

      {/* Call detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Call details"
        size="sm"
      >
        {detail && (
          <div data-tour="phone.callDetail" className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                  detail.direction === 'missed'
                    ? 'bg-bad/10'
                    : detail.direction === 'inbound'
                    ? 'bg-good/10'
                    : 'bg-brand-soft',
                )}
              >
                {(() => {
                  const Icon = DIR_META[detail.direction].icon;
                  return <Icon size={20} className={DIR_META[detail.direction].color} />;
                })()}
              </span>
              <div>
                <p className="font-semibold text-ink">{contactName(detail.contactId)}</p>
                <p className="text-xs text-ink-muted">
                  {DIR_META[detail.direction].label} · {relativeTime(detail.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-sunken p-3 text-sm">
              <div>
                <p className="text-xs text-ink-subtle">Duration</p>
                <p className="font-semibold text-ink">{dur(detail.durationSec)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Status</p>
                <Badge
                  tone={detail.direction === 'missed' ? 'bad' : detail.direction === 'inbound' ? 'good' : 'brand'}
                >
                  {detail.direction}
                </Badge>
              </div>
            </div>

            {detail.voicemailTranscript && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                  <Voicemail size={13} /> Voicemail transcript
                </p>
                <div className="rounded-lg border border-line bg-surface-sunken p-3 text-sm text-ink-muted">
                  {detail.voicemailTranscript}
                </div>
              </div>
            )}

            {detail.direction === 'missed' && (
              <div className="rounded-lg border border-warn/30 bg-warn/5 p-3">
                <p className="text-xs font-semibold text-warn">Missed call</p>
                <p className="mt-0.5 text-xs text-ink-muted">This caller did not reach anyone. Consider following up.</p>
              </div>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                pushToast({ title: 'Callback queued', description: 'Demo only — no real call was initiated.', variant: 'success' });
                setDetail(null);
              }}
            >
              <PhoneIcon size={14} /> Call back
            </Button>
          </div>
        )}
      </Modal>

      {/* Dialer modal */}
      <Modal
        open={dialerOpen}
        onClose={handleDialerClose}
        title="Dialer"
        size="sm"
      >
        <div data-tour="phone.dialer" className="space-y-4">
          {/* Number display */}
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-3 py-2">
            <span className="min-w-0 flex-1 font-mono text-xl font-bold tracking-widest text-ink">
              {dialNumber || <span className="text-ink-subtle text-base font-normal">Enter number…</span>}
            </span>
            {dialNumber && dialState === 'idle' && (
              <button
                onClick={() => setDialNumber((n) => n.slice(0, -1))}
                className="text-ink-subtle hover:text-ink"
                aria-label="Delete digit"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Call state indicator */}
          {dialState === 'calling' && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-warn/10 py-2 text-sm font-semibold text-warn">
              <span className="h-2 w-2 animate-pulse rounded-full bg-warn" />
              Calling…
            </div>
          )}
          {dialState === 'connected' && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-good/10 py-2 text-sm font-semibold text-good">
              <span className="h-2 w-2 rounded-full bg-good" />
              Connected · {dur(connectedSecs)}
            </div>
          )}
          {dialState === 'ended' && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-surface-sunken py-2 text-sm text-ink-muted">
              Call ended
            </div>
          )}

          {/* Keypad */}
          {dialState === 'idle' && (
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD.map((k) => (
                <button
                  key={k}
                  onClick={() => appendKey(k)}
                  className="flex h-12 items-center justify-center rounded-xl border border-line bg-surface text-base font-bold text-ink transition-colors hover:bg-surface-sunken active:bg-line/40"
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* In-call controls */}
          {dialState === 'connected' && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMuted((m) => !m)}
                className={cx(
                  'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
                  muted
                    ? 'border-bad/40 bg-bad/10 text-bad'
                    : 'border-line bg-surface text-ink hover:bg-surface-sunken',
                )}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          )}

          {/* Call / Hang up button */}
          <div className="flex justify-center">
            {(dialState === 'idle' || dialState === 'ended') ? (
              <button
                data-tour="phone.callButton"
                onClick={handleDial}
                disabled={!dialNumber.trim() || dialState === 'ended'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-good text-white shadow-md transition-colors hover:bg-good/90 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Call"
              >
                <PhoneIcon size={22} />
              </button>
            ) : (
              <button
                onClick={handleHangUp}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-bad text-white shadow-md transition-colors hover:bg-bad/90"
                aria-label="End call"
              >
                <PhoneOff size={22} />
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
