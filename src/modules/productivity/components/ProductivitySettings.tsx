/**
 * Productivity Settings — adapts Ticketing's TeamSettings / CustomFieldSettings
 * and Meridian's workspace settings. Everything here is LOCAL component state
 * (not the shared store): notification preferences, editable ticket categories
 * / task types / project templates, demo toggles, plus a read-only reference of
 * the status + priority catalogs. Demonstrates working controls without a
 * backend.
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/primitives';
import { cx } from '@/utils';
import {
  PRIORITIES,
  PROJECT_TEMPLATES,
  TASK_STATUSES,
  TASK_TYPES_SETTING,
  TICKET_CATEGORIES,
  TICKET_STAGES,
} from '../data';
import { PriorityBadge, SectionLabel, inputCls } from './shared';

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 py-2 text-left">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[11px] text-ink-subtle">{hint}</span>}
      </span>
      <span className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

function EditableList({ title, hint, seed }: { title: string; hint?: string; seed: string[] }) {
  const pushToast = useStore((s) => s.pushToast);
  const [items, setItems] = useState<string[]>(seed);
  const [value, setValue] = useState('');

  const add = () => {
    const v = value.trim();
    if (!v || items.includes(v)) return;
    setItems((prev) => [...prev, v]);
    setValue('');
    pushToast({ title: `${title}: added`, description: `“${v}” (demo session)`, variant: 'success' });
  };
  const remove = (v: string) => setItems((prev) => prev.filter((x) => x !== v));

  return (
    <Card className="p-4">
      <SectionLabel>{title}</SectionLabel>
      {hint && <p className="mb-2 -mt-1 text-[11px] text-ink-subtle">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-sunken px-2.5 py-1 text-[12px] text-ink">
            {it}
            <button onClick={() => remove(it)} aria-label={`Remove ${it}`} className="text-ink-subtle hover:text-bad"><X size={12} /></button>
          </span>
        ))}
        {items.length === 0 && <span className="text-[12px] text-ink-subtle">None yet.</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}…`}
          className={inputCls}
        />
        <button onClick={add} disabled={!value.trim()} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-brand px-3 text-[13px] font-semibold text-brand-fg transition-colors hover:brightness-95 disabled:opacity-50">
          <Plus size={14} /> Add
        </button>
      </div>
    </Card>
  );
}

export function ProductivitySettings() {
  const [notify, setNotify] = useState({
    newTicket: true,
    taskDue: true,
    mentions: true,
    weeklyDigest: false,
  });
  const [demo, setDemo] = useState({
    compactCards: false,
    showWeekends: true,
    autoReadOnOpen: true,
  });

  const set = <K extends keyof typeof notify>(k: K) => (v: boolean) => setNotify((p) => ({ ...p, [k]: v }));
  const setD = <K extends keyof typeof demo>(k: K) => (v: boolean) => setDemo((p) => ({ ...p, [k]: v }));

  return (
    <div className="h-full overflow-y-auto" data-tour="productivity.settings">
      <div className="grid gap-3 md:grid-cols-2">
        {/* Notifications */}
        <Card className="p-4">
          <SectionLabel>Notification preferences</SectionLabel>
          <div className="divide-y divide-line">
            <Toggle checked={notify.newTicket} onChange={set('newTicket')} label="New ticket assigned" hint="Notify me when a ticket is routed to me" />
            <Toggle checked={notify.taskDue} onChange={set('taskDue')} label="Task due reminders" hint="Heads-up the morning a task is due" />
            <Toggle checked={notify.mentions} onChange={set('mentions')} label="Comment mentions" hint="When someone @mentions me in a task" />
            <Toggle checked={notify.weeklyDigest} onChange={set('weeklyDigest')} label="Weekly digest" hint="Monday summary of open work" />
          </div>
        </Card>

        {/* Demo toggles */}
        <Card className="p-4">
          <SectionLabel>Display &amp; demo options</SectionLabel>
          <div className="divide-y divide-line">
            <Toggle checked={demo.compactCards} onChange={setD('compactCards')} label="Compact cards" hint="Tighter board card spacing" />
            <Toggle checked={demo.showWeekends} onChange={setD('showWeekends')} label="Show weekends in calendar" />
            <Toggle checked={demo.autoReadOnOpen} onChange={setD('autoReadOnOpen')} label="Auto-mark tickets read on open" />
          </div>
          <p className="mt-2 rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">
            These are demo toggles — they update local UI state for the session and reset on reload.
          </p>
        </Card>

        {/* Editable catalogs */}
        <EditableList title="Ticket categories" hint="Used when triaging support tickets" seed={TICKET_CATEGORIES} />
        <EditableList title="Task types" hint="Classify work items" seed={TASK_TYPES_SETTING} />
        <EditableList title="Project templates" hint="Starting points for new projects" seed={PROJECT_TEMPLATES} />

        {/* Status + priority reference */}
        <Card className="p-4">
          <SectionLabel>Statuses &amp; priorities</SectionLabel>
          <div className="space-y-3 text-[12px]">
            <div>
              <p className="mb-1.5 font-semibold text-ink-muted">Ticket stages</p>
              <div className="flex flex-wrap gap-1.5">
                {TICKET_STAGES.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.accent }} /> {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-semibold text-ink-muted">Task statuses</p>
              <div className="flex flex-wrap gap-1.5">
                {TASK_STATUSES.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.accent }} /> {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-semibold text-ink-muted">Priorities</p>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => <PriorityBadge key={p.id} priority={p.id} size="md" />)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
