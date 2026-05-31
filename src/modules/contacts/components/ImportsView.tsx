import { useMemo, useState } from 'react';
import { UploadCloud, FileText, Check, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/primitives';
import { useContactsModule } from '../context';
import { SAMPLE_IMPORT, IMPORT_TARGET_FIELDS } from '../data';

/**
 * Imports — a demo-safe four-step CSV import wizard (Upload → Map → Review →
 * Summary). No real file is read; "uploading" reveals a representative sample
 * file. Finishing logs an Import job on the Bulk Actions tab and adds the
 * preview rows to the session store so the imported contacts are real.
 */

const STEPS = ['Upload CSV', 'Map Fields', 'Review', 'Summary'];

const targetLabel = (id: string) => IMPORT_TARGET_FIELDS.find((f) => f.id === id)?.label ?? id;

export function ImportsView() {
  const addContact = useStore((s) => s.addContact);
  const { addJob, setView } = useContactsModule();

  const [step, setStep] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(SAMPLE_IMPORT.columns.map((c) => [c.csvHeader, c.suggested])),
  );
  const [importedCount, setImportedCount] = useState(0);

  const mappedFields = useMemo(
    () => Object.values(mapping).filter((id) => id && id !== '__skip').length,
    [mapping],
  );

  function finishImport() {
    // Add the preview rows as real session contacts.
    SAMPLE_IMPORT.preview.forEach((row) => {
      addContact({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        source: row.source,
        tags: ['lead', 'newsletter'],
      });
    });
    addJob({
      action: 'Import Contacts (CSV)',
      createdBy: 'Demo User',
      status: 'completed',
      total: SAMPLE_IMPORT.rowCount,
      completed: SAMPLE_IMPORT.rowCount,
    });
    setImportedCount(SAMPLE_IMPORT.preview.length);
    setStep(3);
  }

  const canAdvance = step === 0 ? uploaded : true;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-5 py-5">
      {/* Step indicator */}
      <ol className="mb-5 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'todo';
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div
                className={
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ' +
                  (state === 'done'
                    ? 'bg-brand text-brand-fg'
                    : state === 'active'
                      ? 'bg-brand-soft text-brand ring-2 ring-brand'
                      : 'bg-surface-sunken text-ink-subtle')
                }
              >
                {state === 'done' ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={
                  'hidden whitespace-nowrap text-xs font-semibold sm:inline ' +
                  (state === 'todo' ? 'text-ink-subtle' : 'text-ink')
                }
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
            </li>
          );
        })}
      </ol>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Step 1 — Upload */}
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setUploaded(true)}
              className={
                'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors ' +
                (uploaded
                  ? 'border-brand bg-brand-soft/40'
                  : 'border-line bg-surface-sunken/40 hover:border-brand hover:bg-surface-sunken')
              }
            >
              {uploaded ? (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-brand text-brand-fg">
                    <FileText size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-ink">{SAMPLE_IMPORT.fileName}</p>
                    <p className="text-xs text-ink-muted">
                      {SAMPLE_IMPORT.rowCount} rows · {SAMPLE_IMPORT.columns.length} columns detected
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-surface text-ink-subtle">
                    <UploadCloud size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-ink">Click to upload a CSV</p>
                    <p className="text-xs text-ink-muted">Demo only — a sample file is used. No upload required.</p>
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2 — Map */}
        {step === 1 && (
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 border-b border-line bg-surface-sunken px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              <span>CSV Column</span>
              <span>Sample</span>
              <span>Maps To</span>
            </div>
            {SAMPLE_IMPORT.columns.map((col) => (
              <div key={col.csvHeader} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 border-b border-line/60 px-4 py-2.5 last:border-0">
                <span className="truncate text-sm font-semibold text-ink">{col.csvHeader}</span>
                <span className="truncate text-xs text-ink-muted">{col.sample}</span>
                <select
                  value={mapping[col.csvHeader]}
                  onChange={(e) => setMapping((m) => ({ ...m, [col.csvHeader]: e.target.value }))}
                  className="w-full rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  {IMPORT_TARGET_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-surface-sunken/40 px-4 py-3 text-xs text-ink-muted">
              <span className="font-semibold text-ink">{SAMPLE_IMPORT.rowCount}</span> rows ready ·
              <span className="font-semibold text-ink">{mappedFields}</span> fields mapped ·
              file <span className="font-semibold text-ink">{SAMPLE_IMPORT.fileName}</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Preview (first 5 rows)</p>
            <div className="overflow-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    {['Name', 'Email', 'Phone', 'Source'].map((h) => (
                      <th key={h} className="whitespace-nowrap bg-surface-sunken px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_IMPORT.preview.map((row, i) => (
                    <tr key={i} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2 text-sm font-semibold text-ink">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-4 py-2 text-xs text-ink-muted">{row.email}</td>
                      <td className="px-4 py-2 text-xs text-ink-muted">{row.phone}</td>
                      <td className="px-4 py-2 text-xs text-ink-muted">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 4 — Summary */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-good/15 text-good">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-lg font-bold text-ink">Import complete</p>
            <p className="max-w-sm text-sm text-ink-muted">
              {importedCount} preview contacts were added to this session and the full job of {SAMPLE_IMPORT.rowCount}{' '}
              rows was logged to Bulk Actions.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => setView('contacts')}>
                View Contacts
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setView('bulk-actions')}>
                View Job History
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard footer */}
      {step < 3 && (
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={14} /> Back
          </Button>
          {step < 2 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={finishImport}>
              <Check size={14} /> Import {SAMPLE_IMPORT.rowCount} Contacts
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
