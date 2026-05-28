import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader, Card } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { relativeTime, fullName, cx } from '@/utils';

const DIR_META = {
  inbound: { icon: PhoneIncoming, color: 'text-good', label: 'Inbound' },
  outbound: { icon: PhoneOutgoing, color: 'text-brand', label: 'Outbound' },
  missed: { icon: PhoneMissed, color: 'text-bad', label: 'Missed' },
};

function dur(sec: number) { if (!sec) return '—'; const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }

export function Phone() {
  const calls = useStore((s) => s.calls);
  const contacts = useStore((s) => s.contacts);
  const contactName = (id: string) => { const c = contacts.find((x) => x.id === id); return c ? fullName(c) : 'Unknown'; };

  return (
    <div>
      <PageHeader title="Phone" subtitle="Call history and voicemails" />
      <div className="space-y-4 px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="Total calls" value={calls.length} />
          <MiniStat label="Missed" value={calls.filter((c) => c.direction === 'missed').length} />
          <MiniStat label="Voicemails" value={calls.filter((c) => c.voicemailTranscript).length} />
          <MiniStat label="Avg duration" value={dur(Math.round(calls.filter((c) => c.durationSec).reduce((s, c) => s + c.durationSec, 0) / (calls.filter((c) => c.durationSec).length || 1)))} />
        </div>

        <Card>
          <div className="border-b border-line px-4 py-3"><h3 className="text-sm font-bold text-ink">Recent calls</h3></div>
          <div className="divide-y divide-line">
            {calls.slice(0, 20).map((c) => {
              const meta = DIR_META[c.direction];
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <meta.icon size={18} className={cx('shrink-0', meta.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{contactName(c.contactId)}</p>
                    {c.voicemailTranscript ? (
                      <p className="flex items-center gap-1.5 truncate text-xs text-ink-muted"><Voicemail size={12} className="shrink-0" /> {c.voicemailTranscript}</p>
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
        </Card>
      </div>
    </div>
  );
}
