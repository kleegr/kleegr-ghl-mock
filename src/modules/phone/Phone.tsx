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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Badge, Card, Tabs } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { relativeTime, fullName, cx } from '@/utils';
import type { Call } from '@/types';

type Filter = 'all' | 'missed' | 'inbound' | 'outbound' | 'voicemail';
type DialState = 'idle' | 'calling' | 'connected' | 'ended';

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
    <div data-tour="phone.page">
      <PageHeader
        title="Phone"
        subtitle="Call history, missed calls, voicemails, and dialer"
        actions={
          <Button data-tour="phone.dialerButton" onClick={() => setDialerOpen(true)}>
            <PhoneIcon size={15} />
            Open Dialer
          </Button>
        }
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="phone.summary">
          <MiniStat label="Total calls" value={calls.length} sub="all time" />
          <MiniStat
            label="Missed calls"
            value={missed.length}
            sub={`${Math.round((missed.length / (calls.length || 1)) * 100)}% miss rate`}
          />
          <MiniStat label="Voicemails" value={voicemails.length} sub="unreviewed" />
          <MiniStat
            label="Avg duration"
            value={dur(
              Math.round(
                calls.filter((c) => c.durationSec > 0).reduce((s, c) => s + c.durationSec, 0) /
                  (calls.filter((c) => c.durationSec > 0).length || 1),
              ),
            )}
            sub="per answered call"
          />
        </div>

        {/* Filter tabs */}
        <div data-tour="phone.filters">
          <Tabs
            tabs={FILTER_TABS.map((t) => ({ ...t, count: filterCounts[t.id as Filter] }))}
            active={filter}
            onChange={(id) => setFilter(id as Filter)}
            variant="pill"
          />
        </div>

        {/* Call log */}
        <Card data-tour="phone.callLog">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-bold text-ink">
              {filter === 'all' ? 'All calls' : filter.charAt(0).toUpperCase() + filter.slice(1) + ' calls'}
              <span className="ml-2 text-xs font-normal text-ink-subtle">{filtered.length} records</span>
            </h3>
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-subtle">No calls match this filter</p>
          ) : (
            <div className="divide-y divide-line">
              {filtered.map((c) => {
                const meta = DIR_META[c.direction];
                const Icon = meta.icon;
                return (
                  <div
                    key={c.id}
                    data-tour="phone.callRow"
                    onClick={() => setDetail(c)}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
                  >
                    <span
                      className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                        c.direction === 'missed'
                          ? 'bg-bad/10'
                          : c.direction === 'inbound'
                          ? 'bg-good/10'
                          : 'bg-brand-soft',
                      )}
                    >
                      <Icon size={16} className={meta.color} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{contactName(c.contactId)}</p>
                      {c.voicemailTranscript ? (
                        <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
                          <Voicemail size={11} className="shrink-0" />
                          {c.voicemailTranscript}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-subtle">{meta.label}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-ink-muted">{dur(c.durationSec)}</p>
                      <p className="text-[11px] text-ink-subtle">{relativeTime(c.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
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
