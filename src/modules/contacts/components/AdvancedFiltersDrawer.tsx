import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { Drawer, INPUT_CLS } from './Drawer';
import {
  FILTER_FIELDS,
  OPERATORS,
  fieldDef,
  CONTACT_SOURCES,
  type FilterCondition,
  type FilterMatch,
} from '../data';

/**
 * Advanced Filters slide-over. A real condition builder: each row picks a field,
 * an operator scoped to that field's type, and a value (text / number / date /
 * select). Owner, source and tag fields pull their options from live store data.
 * Conditions are combined with an all/any (AND/OR) toggle and applied to the
 * visible contact list by the parent via `applyAdvancedFilters`.
 */

let condSeq = 0;
const newCondition = (): FilterCondition => {
  const first = FILTER_FIELDS[0];
  const op = OPERATORS[first.type][0];
  return { id: `cond_${++condSeq}_${Date.now()}`, field: first.id, operator: op.id, value: '' };
};

/** Operators where no value input is needed. */
const VALUELESS = new Set(['empty', 'last7', 'last30', 'true', 'false']);

export function AdvancedFiltersDrawer({
  open,
  onClose,
  initialConditions,
  initialMatch,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  initialConditions: FilterCondition[];
  initialMatch: FilterMatch;
  onApply: (conditions: FilterCondition[], match: FilterMatch) => void;
  onClear: () => void;
}) {
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);

  const [rows, setRows] = useState<FilterCondition[]>([]);
  const [match, setMatch] = useState<FilterMatch>('all');

  // Seed the draft from the applied state each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    setRows(initialConditions.length ? initialConditions.map((c) => ({ ...c })) : [newCondition()]);
    setMatch(initialMatch);
  }, [open, initialConditions, initialMatch]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [contacts]);

  function dynamicOptions(field: string): string[] {
    const def = fieldDef(field);
    if (def?.dynamic === 'owner') return users.map((u) => u.id);
    if (def?.dynamic === 'source') return CONTACT_SOURCES;
    if (def?.dynamic === 'tag') return tagOptions;
    return def?.options ?? [];
  }

  function ownerLabel(id: string) {
    return users.find((u) => u.id === id)?.name ?? id;
  }

  function patch(id: string, next: Partial<FilterCondition>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }

  // Changing the field resets the operator to the first valid one for the new type
  // and clears the value (which may no longer make sense).
  function changeField(id: string, field: string) {
    const def = fieldDef(field);
    const op = def ? OPERATORS[def.type][0].id : 'contains';
    patch(id, { field, operator: op, value: '' });
  }

  function addRow() {
    setRows((prev) => [...prev, newCondition()]);
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function apply() {
    const clean = rows.filter((r) => r.field && r.operator);
    onApply(clean, match);
    onClose();
  }

  function clearAll() {
    onClear();
    setRows([newCondition()]);
    setMatch('all');
    onClose();
  }

  function valueInput(cond: FilterCondition) {
    const def = fieldDef(cond.field);
    if (!def || VALUELESS.has(cond.operator)) return null;

    if (def.type === 'select') {
      const opts = dynamicOptions(cond.field);
      return (
        <select className={INPUT_CLS} value={cond.value} onChange={(e) => patch(cond.id, { value: e.target.value })}>
          <option value="">Select…</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {def.dynamic === 'owner' ? ownerLabel(o) : o}
            </option>
          ))}
        </select>
      );
    }
    if (def.type === 'number') {
      return (
        <input
          className={INPUT_CLS}
          type="number"
          value={cond.value}
          onChange={(e) => patch(cond.id, { value: e.target.value })}
          placeholder="Value"
        />
      );
    }
    if (def.type === 'date') {
      return (
        <input
          className={INPUT_CLS}
          type="date"
          value={cond.value}
          onChange={(e) => patch(cond.id, { value: e.target.value })}
        />
      );
    }
    return (
      <input
        className={INPUT_CLS}
        value={cond.value}
        onChange={(e) => patch(cond.id, { value: e.target.value })}
        placeholder="Value"
      />
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Advanced Filters"
      subtitle="Build conditions to narrow the contact list"
      width="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear Filters
          </Button>
          <Button size="sm" onClick={apply}>
            <Filter size={14} /> Apply Filters
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Match toggle */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Match</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {(['all', 'any'] as FilterMatch[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMatch(m)}
                className={
                  'px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (match === m ? 'bg-brand text-brand-fg' : 'bg-surface text-ink-muted hover:bg-surface-sunken')
                }
              >
                {m === 'all' ? 'All' : 'Any'}
              </button>
            ))}
          </div>
          <span>of the following conditions</span>
        </div>

        {/* Conditions */}
        <div className="flex flex-col gap-2">
          {rows.map((cond) => {
            const def = fieldDef(cond.field);
            const ops = def ? OPERATORS[def.type] : OPERATORS.text;
            return (
              <div key={cond.id} className="rounded-xl border border-line bg-surface-sunken/40 p-2.5">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select
                    className={INPUT_CLS}
                    value={cond.field}
                    onChange={(e) => changeField(cond.id, e.target.value)}
                    aria-label="Field"
                  >
                    {FILTER_FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={INPUT_CLS}
                    value={cond.operator}
                    onChange={(e) => patch(cond.id, { operator: e.target.value })}
                    aria-label="Operator"
                  >
                    {ops.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(cond.id)}
                    aria-label="Remove condition"
                    className="grid w-9 place-items-center rounded-lg border border-line bg-surface text-ink-subtle hover:bg-bad/5 hover:text-bad"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {!VALUELESS.has(cond.operator) && <div className="mt-2">{valueInput(cond)}</div>}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-semibold text-ink-muted hover:border-brand hover:text-brand"
        >
          <Plus size={14} /> Add condition
        </button>
      </div>
    </Drawer>
  );
}
