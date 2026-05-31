/**
 * Calendar Settings → Availability / Schedules.
 *
 * Weekly availability grid (per-day enable + multiple time ranges), timezone
 * selector, and date-specific overrides. All edits are local/session state.
 */
import { useState } from 'react';
import { Clock, Plus, Trash2, CalendarOff, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button, Card, Badge } from '@/components/ui/primitives';
import { Field, Select, TextInput, Switch } from '../components/controls';
import { DEFAULT_SCHEDULE, DEFAULT_OVERRIDES, TIMEZONES } from '../data';
import type { DateOverride, ScheduleDay, TimeRange } from '../types';

let overrideSeq = 100;

export function AvailabilitySchedules() {
  const pushToast = useStore((s) => s.pushToast);

  const [tz, setTz] = useState(TIMEZONES[3]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() =>
    DEFAULT_SCHEDULE.map((d) => ({ ...d, ranges: d.ranges.map((r) => ({ ...r })) })),
  );
  const [overrides, setOverrides] = useState<DateOverride[]>(() =>
    DEFAULT_OVERRIDES.map((o) => ({ ...o })),
  );
  const [minNotice, setMinNotice] = useState('4');
  const [slotInterval, setSlotInterval] = useState('30');

  // ──── Weekly grid mutations
  const setDay = (day: ScheduleDay['day'], patch: Partial<ScheduleDay>) =>
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));

  const toggleDay = (day: ScheduleDay['day'], enabled: boolean) =>
    setDay(day, {
      enabled,
      ranges:
        enabled && schedule.find((d) => d.day === day)?.ranges.length === 0
          ? [{ start: '09:00', end: '17:00' }]
          : schedule.find((d) => d.day === day)?.ranges ?? [],
    });

  const addRange = (day: ScheduleDay['day']) => {
    const d = schedule.find((x) => x.day === day);
    if (!d) return;
    const last = d.ranges[d.ranges.length - 1];
    const next: TimeRange = last
      ? { start: last.end, end: bumpHour(last.end, 1) }
      : { start: '09:00', end: '17:00' };
    setDay(day, { enabled: true, ranges: [...d.ranges, next] });
  };

  const removeRange = (day: ScheduleDay['day'], idx: number) => {
    const d = schedule.find((x) => x.day === day);
    if (!d) return;
    const ranges = d.ranges.filter((_, i) => i !== idx);
    setDay(day, { ranges, enabled: ranges.length > 0 ? d.enabled : false });
  };

  const editRange = (day: ScheduleDay['day'], idx: number, patch: Partial<TimeRange>) => {
    const d = schedule.find((x) => x.day === day);
    if (!d) return;
    setDay(day, { ranges: d.ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  };

  const copyMondayToAll = () => {
    const mon = schedule.find((d) => d.day === 'mon');
    if (!mon) return;
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === 'sun' || d.day === 'sat'
          ? d
          : { ...d, enabled: mon.enabled, ranges: mon.ranges.map((r) => ({ ...r })) },
      ),
    );
    pushToast({ title: 'Copied Monday hours to weekdays', variant: 'success' });
  };

  // ──── Overrides
  const addOverride = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const date = d.toISOString().slice(0, 10);
    setOverrides((prev) => [
      ...prev,
      { id: `ovr_${++overrideSeq}`, date, label: 'New date override', unavailable: true },
    ]);
  };
  const removeOverride = (id: string) =>
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  const editOverride = (id: string, patch: Partial<DateOverride>) =>
    setOverrides((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const enabledDays = schedule.filter((d) => d.enabled).length;

  return (
    <div className="space-y-5" data-tour="calendars.availability">
      {/* Header + timezone */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Weekly availability</h3>
          <p className="text-xs text-ink-muted">
            {enabledDays} day{enabledDays !== 1 ? 's' : ''} open · times shown in your calendar timezone
          </p>
        </div>
        <Field label="Timezone" className="w-full sm:w-80">
          <div className="relative">
            <Globe size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <Select value={tz} onChange={(e) => setTz(e.target.value)} className="pl-8">
              {TIMEZONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </Field>
      </div>

      {/* Weekly grid */}
      <Card className="p-0">
        {schedule.map((d) => (
          <div
            key={d.day}
            className="flex flex-col gap-3 border-b border-line/60 px-4 py-3.5 last:border-0 sm:flex-row sm:items-start"
          >
            <div className="flex w-40 shrink-0 items-center gap-2.5">
              <Switch checked={d.enabled} onChange={(v) => toggleDay(d.day, v)} label={d.label} />
              <span className="text-sm font-semibold text-ink">{d.label}</span>
            </div>

            <div className="flex-1">
              {!d.enabled || d.ranges.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-subtle">
                  <CalendarOff size={14} /> Unavailable
                </span>
              ) : (
                <div className="space-y-2">
                  {d.ranges.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0 text-ink-subtle" />
                      <input
                        type="time"
                        value={r.start}
                        onChange={(e) => editRange(d.day, idx, { start: e.target.value })}
                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                      />
                      <span className="text-xs text-ink-subtle">to</span>
                      <input
                        type="time"
                        value={r.end}
                        onChange={(e) => editRange(d.day, idx, { end: e.target.value })}
                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                      />
                      <button
                        onClick={() => removeRange(d.day, idx)}
                        className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-bad"
                        aria-label="Remove hours"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => addRange(d.day)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken"
            >
              <Plus size={13} /> Add hours
            </button>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={copyMondayToAll}>
          Copy Monday to weekdays
        </Button>
      </div>

      {/* Booking buffers */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Booking limits</h3>
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum scheduling notice (hours)">
              <TextInput
                type="number"
                min={0}
                value={minNotice}
                onChange={(e) => setMinNotice(e.target.value)}
              />
            </Field>
            <Field label="Slot interval (minutes)">
              <Select value={slotInterval} onChange={(e) => setSlotInterval(e.target.value)}>
                {['15', '20', '30', '45', '60'].map((v) => (
                  <option key={v} value={v}>{v} minutes</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      {/* Date-specific overrides */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Date-specific hours</h3>
          <button
            onClick={addOverride}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken"
          >
            <Plus size={13} /> Add override
          </button>
        </div>
        <Card className="p-0">
          {overrides.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              No date-specific overrides. Add one for a holiday or a half day.
            </p>
          ) : (
            overrides.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-3 border-b border-line/60 px-4 py-3.5 last:border-0 sm:flex-row sm:items-center"
              >
                <input
                  type="date"
                  value={o.date}
                  onChange={(e) => editOverride(o.id, { date: e.target.value })}
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
                <input
                  type="text"
                  value={o.label}
                  onChange={(e) => editOverride(o.id, { label: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  placeholder="Label (e.g. Holiday)"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={o.unavailable}
                    onChange={(v) => editOverride(o.id, { unavailable: v })}
                    label="Unavailable"
                  />
                  <Badge tone={o.unavailable ? 'bad' : 'good'}>
                    {o.unavailable ? 'Closed' : 'Custom hours'}
                  </Badge>
                  <button
                    onClick={() => removeOverride(o.id)}
                    className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-bad"
                    aria-label="Remove override"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button
          onClick={() =>
            pushToast({
              title: 'Availability saved',
              description: 'Schedule changes applied for this session (demo).',
              variant: 'success',
            })
          }
        >
          Save availability
        </Button>
      </div>
    </div>
  );
}

/** Add `h` hours to a "HH:MM" string, clamped to 23:00. */
function bumpHour(time: string, h: number): string {
  const [hh, mm] = time.split(':').map(Number);
  const next = Math.min(23, (hh || 0) + h);
  return `${String(next).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}`;
}
