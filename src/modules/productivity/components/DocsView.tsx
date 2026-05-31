/**
 * Docs / Wiki tab — adapts Meridian's SOP/Pages views. Two-pane layout: a
 * category-filtered doc list on the left, a preview/edit pane on the right with
 * a lightweight markdown-ish renderer and an in-place editor. Create-doc opens
 * a small modal. All edits are in-memory for the session.
 */

import { useMemo, useState } from 'react';
import { FileText, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/primitives';
import { cx, relativeTime } from '@/utils';
import { useProductivity } from '../state';
import type { Doc, DocCategory } from '../types';
import { DOC_CATEGORY_LABEL, personName } from '../data';
import { Field, SelectInput, TagChip, inputCls } from './shared';

/** Tiny markdown-ish renderer: # / ## headings, - bullets, blank lines. Demo-only. */
function DocBody({ body }: { body: string }) {
  const lines = body.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-muted">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="pt-1 text-[15px] font-bold text-ink">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="pt-1 text-lg font-bold text-ink">{line.slice(2)}</h2>;
        if (line.startsWith('- ')) return <div key={i} className="flex gap-2 pl-1"><span className="text-ink-subtle">•</span><span>{line.slice(2)}</span></div>;
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export function DocsView() {
  const { docs, createDoc, updateDoc } = useProductivity();
  const [cat, setCat] = useState<DocCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<DocCategory>('process');

  const filtered = useMemo(() => (cat === 'all' ? docs : docs.filter((d) => d.category === cat)), [docs, cat]);
  const selected: Doc | undefined = docs.find((d) => d.id === selectedId) ?? filtered[0];

  const startEdit = () => { if (selected) { setDraft(selected.body); setEditing(true); } };
  const saveEdit = () => { if (selected) { updateDoc(selected.id, { body: draft }); setEditing(false); } };

  const submitCreate = () => {
    if (!newTitle.trim()) return;
    const d = createDoc({ title: newTitle, category: newCat });
    setSelectedId(d.id);
    setNewTitle('');
    setNewCat('process');
    setCreateOpen(false);
    setEditing(false);
  };

  const categories: (DocCategory | 'all')[] = ['all', 'support', 'onboarding', 'process', 'project'];

  return (
    <div className="flex h-full min-h-0 flex-col" data-tour="productivity.docs">
      {/* Category chips + create */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cx('rounded-full border px-3 py-1 text-[12px] font-medium transition-colors', cat === c ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink-muted hover:bg-surface-sunken')}
          >
            {c === 'all' ? 'All' : DOC_CATEGORY_LABEL[c]}
          </button>
        ))}
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> New Doc
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[260px_1fr]">
        {/* List */}
        <div className="min-h-0 overflow-y-auto rounded-xl border border-line">
          <ul className="divide-y divide-line">
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => { setSelectedId(d.id); setEditing(false); }}
                  className={cx('flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken/60', selected?.id === d.id && 'bg-brand/5')}
                >
                  <FileText size={15} className="mt-0.5 shrink-0 text-ink-subtle" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{d.title}</span>
                    <span className="block text-[11px] text-ink-subtle">{DOC_CATEGORY_LABEL[d.category]} · {relativeTime(d.updatedAt)}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-ink-subtle">No docs in this category.</li>}
          </ul>
        </div>

        {/* Preview / editor */}
        <div className="min-h-0 overflow-y-auto rounded-xl border border-line bg-surface">
          {!selected ? (
            <EmptyState icon={<FileText size={22} />} title="No document selected" body="Pick a doc from the list or create a new one." />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-ink">{selected.title}</h2>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    {DOC_CATEGORY_LABEL[selected.category]} · by {personName(selected.authorId)} · updated {relativeTime(selected.updatedAt)}
                  </p>
                </div>
                {editing ? (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={startEdit}><Pencil size={14} /> Edit</Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {editing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-full min-h-[320px] w-full resize-none rounded-lg border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                    placeholder="Write in plain text. Use # and ## for headings, - for bullets."
                  />
                ) : (
                  <>
                    <DocBody body={selected.body} />
                    {selected.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3">
                        {selected.tags.map((t) => <TagChip key={t}>{t}</TagChip>)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Document"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button size="sm" disabled={!newTitle.trim()} onClick={submitCreate}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Title" required>
            <input className={inputCls} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Refund Policy" autoFocus />
          </Field>
          <Field label="Category">
            <SelectInput value={newCat} onChange={(v) => setNewCat(v as DocCategory)}>
              {(Object.keys(DOC_CATEGORY_LABEL) as DocCategory[]).map((c) => <option key={c} value={c}>{DOC_CATEGORY_LABEL[c]}</option>)}
            </SelectInput>
          </Field>
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-subtle">Demo doc — starts with a template body you can edit. Stored in memory only.</p>
        </div>
      </Modal>
    </div>
  );
}
