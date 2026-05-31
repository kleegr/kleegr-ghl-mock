/**
 * CalendarTypeChooser — modal shown when creating a new calendar.
 *
 * Presents the GoHighLevel-style calendar archetypes as selectable cards with
 * an expandable "learn more" area. Selecting a type advances to the creation
 * form via onSelect().
 */
import { useState } from 'react';
import {
  Repeat, CalendarClock, ClipboardList, GraduationCap, Users, ChevronDown, Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { CALENDAR_TYPES } from '../data';
import type { CalendarTypeId } from '../types';

const TYPE_ICON: Record<CalendarTypeId, typeof Repeat> = {
  round_robin: Repeat,
  event: CalendarClock,
  service: ClipboardList,
  class: GraduationCap,
  collective: Users,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (typeId: CalendarTypeId) => void;
}

export function CalendarTypeChooser({ open, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<CalendarTypeId | null>(null);
  const [expanded, setExpanded] = useState<CalendarTypeId | null>(null);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose a calendar type"
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleContinue} disabled={!selected}>
            Continue
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-muted">
        Pick the type that matches how you want people to book. You can change most
        settings later.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CALENDAR_TYPES.map((t) => {
          const Icon = TYPE_ICON[t.id];
          const isSelected = selected === t.id;
          const isExpanded = expanded === t.id;
          return (
            <div
              key={t.id}
              className={cx(
                'rounded-xl border p-3.5 text-left transition-colors',
                isSelected ? 'border-brand bg-brand-soft/40 ring-1 ring-brand/40' : 'border-line hover:border-brand/50',
              )}
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 text-left"
                onClick={() => setSelected(t.id)}
                aria-pressed={isSelected}
              >
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-brand text-brand-fg' : 'bg-surface-sunken text-ink-muted',
                  )}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-ink">{t.name}</span>
                    {isSelected && <Check size={14} className="text-brand" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{t.description}</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : t.id)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
              >
                Learn more
                <ChevronDown size={12} className={cx('transition-transform', isExpanded && 'rotate-180')} />
              </button>

              {isExpanded && (
                <div className="mt-2 border-t border-line/60 pt-2">
                  <p className="text-xs text-ink-muted">{t.detail}</p>
                  <ul className="mt-2 space-y-1">
                    {t.bestFor.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-[11px] text-ink">
                        <Check size={11} className="shrink-0 text-good" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
