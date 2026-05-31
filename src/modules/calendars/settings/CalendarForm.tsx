/**
 * CalendarForm — create / edit calendar flow.
 *
 * A two-step modal (Meeting details → Availability summary) that mirrors the
 * GoHighLevel "create calendar" experience. It edits a session-only
 * `CalendarMeta`; on save it hands the built record back to the parent, which
 * adds or updates it in the in-memory catalog. No store mutation, no real API.
 */
import { useMemo, useState } from 'react';
import { Check, CalendarClock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx, userById } from '@/utils';
import { Field, TextInput, Select, Textarea } from '../components/controls';
import {
  CALENDAR_GROUPS,
  CALENDAR_TYPE_LABEL,
  DEFAULT_SCHEDULE,
} from '../data';
import type { CalendarMeta, CalendarTypeId } from '../types';

const COLOR_SWATCHES = [
  '#1f6feb', '#12986a', '#d99111', '#7c3aed', '#0d9488',
  '#4f46e5', '#db2777', '#0891b2', '#ea580c', '#e11d48',
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

type Step = 'details' | 'availability';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Archetype chosen in the type chooser (for create). */
  typeId: CalendarTypeId | null;
  /** When set, the form is in edit mode and prefilled from this record. */
  editing?: CalendarMeta | null;
  onSave: (meta: CalendarMeta) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CalendarForm({ open, onClose, typeId, editing, onSave }: Props) {
  const users = useStore((s) => s.users);
  const pushToast = useStore((s) => s.pushToast);

  const isEdit = !!editing;
  const effectiveType: CalendarTypeId = editing?.type ?? typeId ?? 'event';

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [slug, setSlug] = useState(editing?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [groupId, setGroupId] = useState(editing?.groupId ?? CALENDAR_GROUPS[0].id);
  const [color, setColor] = useState(editing?.color ?? COLOR_SWATCHES[0]);
  const [durationMin, setDurationMin] = useState(editing?.durationMin ?? 30);
  const [inviteTitle, setInviteTitle] = useState(editing?.inviteTitle ?? '');
  const [ownerId, setOwnerId] = useState(editing?.ownerId ?? users[0]?.id ?? '');

  const effectiveSlug = slugTouched || isEdit ? slug : slugify(name);
  const nameValid = name.trim().length > 0;

  const enabledDays = useMemo(
    () => DEFAULT_SCHEDULE.filter((d) => d.enabled),
    [],
  );

  const reset = () => {
    setStep('details');
    if (!isEdit) {
      setName('');
      setDescription('');
      setSlug('');
      setSlugTouched(false);
      setGroupId(CALENDAR_GROUPS[0].id);
      setColor(COLOR_SWATCHES[0]);
      setDurationMin(30);
      setInviteTitle('');
      setOwnerId(users[0]?.id ?? '');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!nameValid) {
      setStep('details');
      return;
    }
    const now = new Date().toISOString();
    const finalSlug = (effectiveSlug || slugify(name) || 'calendar').slice(0, 60);
    const meta: CalendarMeta = {
      id: editing?.id ?? `cal_${finalSlug.replace(/-/g, '_')}_${Date.now().toString(36).slice(-4)}`,
      name: name.trim(),
      color,
      groupId,
      type: effectiveType,
      durationMin,
      status: editing?.status ?? 'active',
      slug: finalSlug,
      ownerId,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      description: description.trim() || undefined,
      inviteTitle: inviteTitle.trim() || undefined,
    };
    onSave(meta);
    pushToast({
      title: isEdit ? 'Calendar updated' : 'Calendar created',
      description: `“${meta.name}” has been ${isEdit ? 'saved' : 'added to your calendars'}.`,
      variant: 'success',
    });
    reset();
    onClose();
  };

  const ownerName = userById(users, ownerId)?.name ?? 'Unassigned';

  const footer =
    step === 'details' ? (
      <>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={() => setStep('availability')} disabled={!nameValid}>
          Continue
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setStep('details')}>
          Back
        </Button>
        <Button onClick={handleSave}>
          {isEdit ? 'Save changes' : 'Create calendar'}
        </Button>
      </>
    );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? `Edit ${editing?.name ?? 'calendar'}` : 'Create calendar'}
      size="lg"
      footer={footer}
    >
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
        <StepPill index={1} label="Meeting details" active={step === 'details'} done={step === 'availability'} />
        <span className="h-px w-6 bg-line" />
        <StepPill index={2} label="Availability" active={step === 'availability'} done={false} />
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] text-ink-muted">
          <CalendarClock size={12} /> {CALENDAR_TYPE_LABEL[effectiveType]}
        </span>
      </div>

      {step === 'details' ? (
        <div className="space-y-4">
          <Field label="Calendar name">
            <TextInput
              value={name}
              autoFocus
              placeholder="e.g. Discovery Call"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Description" hint="Shown to invitees on the booking page.">
            <Textarea
              value={description}
              placeholder="What is this calendar for?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Booking URL slug" hint="Used in the public booking link.">
              <div className="flex items-center rounded-lg border border-line bg-surface-sunken pl-2.5 text-sm text-ink-subtle focus-within:border-brand">
                <span className="select-none whitespace-nowrap">/book/</span>
                <input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="discovery-call"
                  className="w-full rounded-r-lg bg-surface px-2 py-2 text-ink placeholder:text-ink-subtle focus:outline-none"
                />
              </div>
            </Field>

            <Field label="Group">
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {CALENDAR_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Meeting duration">
              <Select
                value={String(durationMin)}
                onChange={(e) => setDurationMin(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </Select>
            </Field>

            <Field label="Owner / assigned staff">
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Invite title" hint="Title used on the calendar invite. Merge fields like {{contact.first_name}} are supported.">
            <TextInput
              value={inviteTitle}
              placeholder="e.g. Discovery Call with {{contact.first_name}}"
              onChange={(e) => setInviteTitle(e.target.value)}
            />
          </Field>

          <Field label="Calendar color">
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cx(
                    'flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                    color === c ? 'ring-ink/40' : 'ring-transparent hover:ring-line',
                  )}
                  style={{ background: c }}
                >
                  {color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </Field>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            New calendars start with your standard weekly availability. You can fine-tune
            hours, timezone, booking limits and date-specific overrides on the{' '}
            <span className="font-semibold text-ink">Availability</span> tab after saving.
          </p>

          <div className="rounded-xl border border-line">
            <div className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Weekly hours
            </div>
            <div className="divide-y divide-line/60">
              {DEFAULT_SCHEDULE.map((d) => (
                <div key={d.day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className={cx('font-medium', d.enabled ? 'text-ink' : 'text-ink-subtle')}>
                    {d.label}
                  </span>
                  <span className={cx(d.enabled ? 'text-ink-muted' : 'text-ink-subtle')}>
                    {d.enabled && d.ranges.length
                      ? d.ranges.map((r) => `${r.start} – ${r.end}`).join(', ')
                      : 'Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
            <p className="mb-1 font-semibold text-ink">Summary</p>
            {name.trim() || 'New calendar'} · {durationMin}-minute {CALENDAR_TYPE_LABEL[effectiveType]} ·
            {' '}{enabledDays.length} days/week · hosted by {ownerName}
          </div>
        </div>
      )}
    </Modal>
  );
}

function StepPill({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cx(
          'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
          active
            ? 'bg-brand text-brand-fg'
            : done
            ? 'bg-good/15 text-good'
            : 'bg-surface-sunken text-ink-subtle',
        )}
      >
        {done ? <Check size={12} /> : index}
      </span>
      <span className={cx(active ? 'text-ink' : 'text-ink-muted')}>{label}</span>
    </span>
  );
}
