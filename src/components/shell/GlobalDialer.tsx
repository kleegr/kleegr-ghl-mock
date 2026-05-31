import { useEffect, useRef, useState } from 'react';
import {
  Phone as PhoneIcon, PhoneOff, X, Delete, Mic, MicOff, Clock, User as UserIcon,
  PhoneIncoming, PhoneOutgoing, PhoneMissed,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { cx, fullName, relativeTime } from '@/utils';

/**
 * GlobalDialer - a polished, demo-safe phone dialer that opens from the topbar
 * phone button (and from anywhere via `openDialer(prefill?)` in the store).
 *
 * Foundation only: it never places a real call and makes no network requests -
 * the "call" simply runs a cosmetic calling -> connected -> ended state machine
 * and a toast, mirroring the per-page dialer in /phone. The /phone module keeps
 * its own dialer; this is the always-available, account-level surface a future
 * developer can extend (transfer, hold, number selection, etc.).
 */

const KEYPAD: ReadonlyArray<{ k: string; sub?: string }> = [
  { k: '1' }, { k: '2', sub: 'ABC' }, { k: '3', sub: 'DEF' },
  { k: '4', sub: 'GHI' }, { k: '5', sub: 'JKL' }, { k: '6', sub: 'MNO' },
  { k: '7', sub: 'PQRS' }, { k: '8', sub: 'TUV' }, { k: '9', sub: 'WXYZ' },
  { k: '*' }, { k: '0', sub: '+' }, { k: '#' },
];

const DIR_ICON = {
  inbound: PhoneIncoming,
  outbound: PhoneOutgoing,
  missed: PhoneMissed,
} as const;

type DialState = 'idle' | 'calling' | 'connected' | 'ended';

function dur(sec: number) {
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

export function GlobalDialer() {
  const open = useStore((s) => s.dialerOpen);
  const prefill = useStore((s) => s.dialerPrefill);
  const closeDialer = useStore((s) => s.closeDialer);
  const pushToast = useStore((s) => s.pushToast);
  const calls = useStore((s) => s.calls);
  const contacts = useStore((s) => s.contacts);
  const phoneNumbers = useStore((s) => s.phoneNumbers);

  const [tab, setTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad');
  const [number, setNumber] = useState('');
  const [dialState, setDialState] = useState<DialState>('idle');
  const [muted, setMuted] = useState(false);
  const connectedSecs = useTick(dialState === 'connected');
  const callTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync the prefill whenever the dialer is (re)opened.
  useEffect(() => {
    if (open) {
      setNumber(prefill);
      setDialState('idle');
      setMuted(false);
      setTab('keypad');
    }
  }, [open, prefill]);

  const contactName = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    return c ? fullName(c) : 'Unknown';
  };

  const recents = calls.slice(0, 8);
  const callableContacts = contacts.slice(0, 8);

  function append(k: string) {
    if (dialState !== 'idle') return;
    setNumber((n) => (n.length < 18 ? n + k : n));
  }

  function startCall() {
    if (!number.trim()) return;
    setDialState('calling');
    callTimeout.current = setTimeout(() => setDialState('connected'), 1600);
  }

  function hangUp() {
    if (callTimeout.current) clearTimeout(callTimeout.current);
    setDialState('ended');
    setTimeout(() => {
      pushToast({ title: 'Call ended', description: 'Demo only - no real call was placed.', variant: 'default' });
      closeDialer();
    }, 800);
  }

  function handleClose() {
    if (dialState === 'calling' || dialState === 'connected') { hangUp(); return; }
    if (callTimeout.current) clearTimeout(callTimeout.current);
    closeDialer();
  }

  const activeNumber = phoneNumbers.find((p) => p.status === 'active') ?? phoneNumbers[0];

  return (
    <Modal open={open} onClose={handleClose} title="Dialer" size="sm">
      <div data-tour="topbar.dialer" className="space-y-4">
        {/* Caller-ID line (which provisioned number this call goes out on) */}
        {activeNumber && (
          <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-1.5 text-[11px] text-ink-muted">
            <span>Calling from</span>
            <span className="font-semibold text-ink">{activeNumber.label} {'\u00b7'} {activeNumber.number}</span>
          </div>
        )}

        {/* Number display */}
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-xl font-bold tracking-widest text-ink">
            {number || <span className="text-base font-normal text-ink-subtle">Enter a number...</span>}
          </span>
          {number && dialState === 'idle' && (
            <button onClick={() => setNumber((n) => n.slice(0, -1))} className="text-ink-subtle hover:text-ink" aria-label="Delete last digit">
              <Delete size={18} />
            </button>
          )}
        </div>

        {/* Call-state banner */}
        {dialState === 'calling' && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-warn/10 py-2 text-sm font-semibold text-warn">
            <span className="h-2 w-2 animate-pulse rounded-full bg-warn" /> Calling...
          </div>
        )}
        {dialState === 'connected' && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-good/10 py-2 text-sm font-semibold text-good">
            <span className="h-2 w-2 rounded-full bg-good" /> Connected {'\u00b7'} {dur(connectedSecs)}
          </div>
        )}
        {dialState === 'ended' && (
          <div className="flex items-center justify-center rounded-lg bg-surface-sunken py-2 text-sm text-ink-muted">Call ended</div>
        )}

        {/* Tabs (only while idle) */}
        {dialState === 'idle' && (
          <div className="flex items-center gap-1 rounded-lg bg-surface-sunken p-0.5 text-xs font-semibold">
            {([
              { id: 'keypad', label: 'Keypad' },
              { id: 'recents', label: 'Recents' },
              { id: 'contacts', label: 'Contacts' },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx('flex-1 rounded-md px-2 py-1.5 transition-colors', tab === t.id ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-ink-subtle hover:text-ink-muted')}
                aria-pressed={tab === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Keypad */}
        {dialState === 'idle' && tab === 'keypad' && (
          <div className="grid grid-cols-3 gap-2">
            {KEYPAD.map(({ k, sub }) => (
              <button
                key={k}
                onClick={() => append(k)}
                className="flex h-12 flex-col items-center justify-center rounded-xl border border-line bg-surface text-base font-bold text-ink transition-colors hover:bg-surface-sunken active:bg-line/40"
              >
                {k}
                {sub && <span className="text-[9px] font-medium tracking-wider text-ink-subtle">{sub}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Recents */}
        {dialState === 'idle' && tab === 'recents' && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-line">
            {recents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-subtle">No recent calls.</p>
            ) : recents.map((c) => {
              const Icon = DIR_ICON[c.direction];
              return (
                <button
                  key={c.id}
                  onClick={() => { setNumber(contactName(c.contactId)); setTab('keypad'); }}
                  className="flex w-full items-center gap-3 border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-surface-sunken"
                >
                  <Icon size={15} className={cx('shrink-0', c.direction === 'missed' ? 'text-bad' : c.direction === 'inbound' ? 'text-good' : 'text-brand')} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{contactName(c.contactId)}</span>
                  <span className="flex items-center gap-1 text-[11px] text-ink-subtle"><Clock size={11} />{relativeTime(c.createdAt)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Contacts */}
        {dialState === 'idle' && tab === 'contacts' && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-line">
            {callableContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => { setNumber(c.phone); setTab('keypad'); }}
                className="flex w-full items-center gap-3 border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-surface-sunken"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><UserIcon size={13} /></span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{fullName(c)}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-subtle">{c.phone}</span>
              </button>
            ))}
          </div>
        )}

        {/* In-call mute */}
        {dialState === 'connected' && (
          <div className="flex justify-center">
            <button
              onClick={() => setMuted((m) => !m)}
              className={cx('flex h-12 w-12 items-center justify-center rounded-full border transition-colors', muted ? 'border-bad/40 bg-bad/10 text-bad' : 'border-line bg-surface text-ink hover:bg-surface-sunken')}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
        )}

        {/* Call / hang-up */}
        <div className="flex justify-center pt-1">
          {(dialState === 'idle' || dialState === 'ended') ? (
            <button
              onClick={startCall}
              disabled={!number.trim() || dialState === 'ended'}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-good text-white shadow-md transition-colors hover:bg-good/90 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Call"
            >
              <PhoneIcon size={22} />
            </button>
          ) : (
            <button
              onClick={hangUp}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-bad text-white shadow-md transition-colors hover:bg-bad/90"
              aria-label="End call"
            >
              <PhoneOff size={22} />
            </button>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-subtle">
          <X size={11} /> Demo dialer - no real calls are placed.
        </p>
      </div>
    </Modal>
  );
}
