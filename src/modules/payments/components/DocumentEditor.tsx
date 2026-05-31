/**
 * DocumentEditor — a full-screen document/contract authoring surface modeled on
 * GoHighLevel's Documents & Contracts editor. Three panes inside the shared
 * Overlay: an element library (blocks + fillable fields), a center "paper"
 * canvas that renders placed elements and supports selection, and a
 * recipients/signers panel. Toggling Preview hides the side panels.
 *
 * Demo-only: nothing is saved or sent; Save/Send raise demo toasts.
 */

import { useState } from 'react';
import {
  Type, AlignLeft, Image as ImageIcon, Table, Minus, SeparatorHorizontal,
  PenLine, TextCursorInput, Calendar, CheckSquare,
  Plus, Save, Send, Eye, Pencil, Trash2, UserPlus, GripVertical,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';
import { Overlay } from './ui';
import { DOC_BLOCKS, DOC_FIELDS, DEFAULT_SIGNERS, STARTER_CANVAS, type SignerRole } from '../data';

const ICONS: Record<string, LucideIcon> = {
  heading: Type,
  text: AlignLeft,
  image: ImageIcon,
  table: Table,
  divider: Minus,
  pagebreak: SeparatorHorizontal,
  signature: PenLine,
  initials: Type,
  textfield: TextCursorInput,
  date: Calendar,
  checkbox: CheckSquare,
};

interface PlacedEl {
  id: string;
  kind: string;
  label: string;
}

let elSeq = 100;

const DEFAULT_LABEL: Record<string, string> = {
  heading: 'Section heading',
  text: 'Add your paragraph text here. Click to edit this block in the demo editor.',
  image: 'Image / logo',
  table: 'Pricing table',
  divider: 'Divider',
  pagebreak: 'Page break',
  signature: 'Signature',
  initials: 'Initials',
  textfield: 'Text field',
  date: 'Date signed',
  checkbox: 'I agree to the terms above',
};

export function DocumentEditor({
  open,
  onClose,
  initialTitle = 'Untitled Document',
}: {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
}) {
  const pushToast = useStore((s) => s.pushToast);
  const [title, setTitle] = useState(initialTitle);
  const [els, setEls] = useState<PlacedEl[]>(() => STARTER_CANVAS.map((s) => ({ ...s })));
  const [selected, setSelected] = useState<string | null>(null);
  const [signers, setSigners] = useState<SignerRole[]>(() => DEFAULT_SIGNERS.map((s) => ({ ...s })));
  const [preview, setPreview] = useState(false);

  // keep title in sync when reopened for a different document
  // (cheap: only resets when the incoming title actually changes)
  const [lastInit, setLastInit] = useState(initialTitle);
  if (initialTitle !== lastInit) {
    setLastInit(initialTitle);
    setTitle(initialTitle);
    setEls(STARTER_CANVAS.map((s) => ({ ...s })));
    setSelected(null);
    setSigners(DEFAULT_SIGNERS.map((s) => ({ ...s })));
    setPreview(false);
  }

  function addEl(kind: string) {
    const el: PlacedEl = { id: `el_${++elSeq}`, kind, label: DEFAULT_LABEL[kind] ?? kind };
    setEls((p) => [...p, el]);
    setSelected(el.id);
  }
  function removeEl(id: string) {
    setEls((p) => p.filter((e) => e.id !== id));
    setSelected((s) => (s === id ? null : s));
  }
  function addSigner() {
    const palette = ['#1f6feb', '#12986a', '#b7791f', '#9333ea', '#dc2626'];
    const next: SignerRole = {
      id: `sgn_${signers.length + 1}_${Date.now()}`,
      name: `Signer ${signers.length + 1}`,
      email: `signer${signers.length + 1}@example.com`,
      role: 'Signer',
      color: palette[signers.length % palette.length],
    };
    setSigners((p) => [...p, next]);
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      data-tour="payments.documentEditor"
      title={
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-[min(60vw,420px)] rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-base font-bold text-ink outline-none hover:border-line focus:border-brand focus:bg-surface"
          aria-label="Document title"
        />
      }
      subtitle="Document · Demo Business"
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => setPreview((v) => !v)}>
            {preview ? <><Pencil size={15} /> Edit</> : <><Eye size={15} /> Preview</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Draft saved', description: `“${title}” saved to this demo session.`, variant: 'success' })}>
            <Save size={15} /> Save
          </Button>
          <Button size="sm" onClick={() => { pushToast({ title: 'Document sent', description: `“${title}” sent to ${signers.length} recipient${signers.length === 1 ? '' : 's'} (demo).`, variant: 'success' }); onClose(); }}>
            <Send size={15} /> Send
          </Button>
        </>
      }
    >
      <div className={cx('grid h-full min-h-0', preview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px]')}>
        {/* element library */}
        {!preview && (
          <div className="hidden min-h-0 overflow-y-auto border-r border-line bg-surface px-3 py-4 lg:block">
            <Palette title="Content blocks" items={DOC_BLOCKS} onAdd={addEl} />
            <Palette title="Fillable fields" items={DOC_FIELDS} onAdd={addEl} className="mt-5" />
          </div>
        )}

        {/* canvas */}
        <div className="min-h-0 overflow-y-auto bg-surface-sunken px-4 py-6">
          <div className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-8 shadow-card">
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-fg"><PenLine size={18} /></span>
                <div>
                  <p className="font-display text-base font-bold text-ink">Demo Business</p>
                  <p className="text-[11px] text-ink-muted">contact@example.com</p>
                </div>
              </div>
              <p className="font-display text-sm font-extrabold uppercase tracking-wide text-ink-subtle">{title}</p>
            </div>

            {els.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-subtle">
                {preview ? 'This document is empty.' : 'Add blocks and fields from the left to build your document.'}
              </p>
            ) : (
              <div className="space-y-3">
                {els.map((el) => (
                  <CanvasElement
                    key={el.id}
                    el={el}
                    selected={!preview && selected === el.id}
                    preview={preview}
                    onSelect={() => !preview && setSelected(el.id)}
                    onRemove={() => removeEl(el.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* recipients / signers */}
        {!preview && (
          <div className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface px-4 py-4 lg:block">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Recipients</h3>
              <button onClick={addSigner} className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface-sunken hover:text-ink" aria-label="Add signer">
                <UserPlus size={15} />
              </button>
            </div>
            <div className="space-y-2">
              {signers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: s.color }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                    <p className="truncate text-[11px] text-ink-muted">{s.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-ink-muted">{s.role}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={addSigner}>
              <Plus size={14} /> Add recipient
            </Button>

            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Signing order</h3>
            <p className="rounded-lg border border-line bg-surface-sunken p-3 text-xs text-ink-muted">
              Recipients sign in the order listed above. Drag handles are shown in the full product.
            </p>
          </div>
        )}
      </div>
    </Overlay>
  );
}

function Palette({
  title,
  items,
  onAdd,
  className,
}: {
  title: string;
  items: { id: string; label: string; hint: string }[];
  onAdd: (kind: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => {
          const Icon = ICONS[it.id] ?? Type;
          return (
            <button
              key={it.id}
              onClick={() => onAdd(it.id)}
              title={it.hint}
              className="flex flex-col items-start gap-1.5 rounded-lg border border-line bg-surface p-2.5 text-left transition-colors hover:border-brand/50 hover:bg-surface-sunken"
            >
              <span className="text-ink-subtle"><Icon size={16} /></span>
              <span className="text-xs font-semibold text-ink">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CanvasElement({
  el,
  selected,
  preview,
  onSelect,
  onRemove,
}: {
  el: PlacedEl;
  selected: boolean;
  preview: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cx(
        'group relative rounded-lg border px-3 py-2 transition-colors',
        preview ? 'border-transparent' : 'cursor-pointer',
        selected ? 'border-brand ring-1 ring-brand/30 bg-brand-soft/40' : 'border-transparent hover:border-line',
      )}
    >
      {!preview && (
        <div className={cx('absolute -left-6 top-1/2 -translate-y-1/2 text-ink-subtle opacity-0 transition-opacity', selected && 'opacity-100', 'group-hover:opacity-100')}>
          <GripVertical size={15} />
        </div>
      )}
      <ElementBody el={el} />
      {!preview && selected && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-subtle shadow-card hover:text-bad"
          aria-label="Remove element"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function ElementBody({ el }: { el: PlacedEl }) {
  switch (el.kind) {
    case 'heading':
      return <h2 className="font-display text-lg font-bold text-ink">{el.label}</h2>;
    case 'text':
      return <p className="text-sm leading-relaxed text-ink-muted">{el.label}</p>;
    case 'image':
      return (
        <div className="grid h-24 place-items-center rounded-lg border border-dashed border-line bg-surface-sunken text-ink-subtle">
          <ImageIcon size={22} />
        </div>
      );
    case 'table':
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-[10px] uppercase tracking-wide text-ink-subtle">
              <th className="py-1.5">Item</th><th className="py-1.5 text-right">Qty</th><th className="py-1.5 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/50"><td className="py-1.5 text-ink">Service package</td><td className="py-1.5 text-right text-ink-muted">1</td><td className="py-1.5 text-right text-ink">$1,200</td></tr>
            <tr><td className="py-1.5 text-ink">Onboarding</td><td className="py-1.5 text-right text-ink-muted">1</td><td className="py-1.5 text-right text-ink">$300</td></tr>
          </tbody>
        </table>
      );
    case 'divider':
      return <hr className="border-line" />;
    case 'pagebreak':
      return <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle"><span className="h-px flex-1 bg-line" />Page break<span className="h-px flex-1 bg-line" /></div>;
    case 'signature':
      return (
        <div className="rounded-lg border border-dashed border-brand/50 bg-brand-soft/30 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">Signature</p>
          <div className="mt-3 border-b border-ink/30" />
          <p className="mt-1 text-[11px] text-ink-subtle">Sign here</p>
        </div>
      );
    case 'initials':
      return (
        <div className="inline-block rounded-lg border border-dashed border-brand/50 bg-brand-soft/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">Initials</p>
          <div className="mt-2 h-6 w-16 border-b border-ink/30" />
        </div>
      );
    case 'textfield':
      return (
        <div>
          <p className="mb-1 text-[11px] font-semibold text-ink-muted">{el.label}</p>
          <div className="h-8 rounded-md border border-line bg-surface-sunken" />
        </div>
      );
    case 'date':
      return (
        <div className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-sunken px-3 py-1.5 text-sm text-ink-muted">
          <Calendar size={14} /> Date signed
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm text-ink">
          <span className="grid h-4 w-4 place-items-center rounded border border-ink-subtle text-transparent">✓</span>
          {el.label}
        </label>
      );
    default:
      return <p className="text-sm text-ink-muted">{el.label}</p>;
  }
}
