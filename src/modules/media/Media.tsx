import React, { useState, useMemo } from 'react';
import {
  Image, FileText, Film, UploadCloud, Search, X,
  Download, Link, FolderOpen, Eye, Filter, SortAsc, Trash2,
} from 'lucide-react';
import { PageHeader, Button, Badge, Card } from '@/components/ui/primitives';
import { MiniStat } from '@/components/tables/SimpleTable';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

/* ─── Local fake media assets ─────────────────────────
   No real uploads or storage. All assets are defined here only.
   ─────────────────────────────────────── */

type MediaType = 'image' | 'document' | 'video';

interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  ext: string;
  sizeKB: number;
  uploadedAt: string;
  owner: string;
  thumbnail?: string;
  dimensions?: string;
}

const now = Date.now();
const DAY = 86400000;

const MEDIA_ASSETS: MediaAsset[] = [
  { id: 'ma_1',  name: 'hero-banner',          type: 'image',    ext: 'jpg', sizeKB: 284,  uploadedAt: new Date(now - 1  * DAY).toISOString(), owner: 'Jordan Avery',   dimensions: '1920×600' },
  { id: 'ma_2',  name: 'team-photo-2025',       type: 'image',    ext: 'jpg', sizeKB: 512,  uploadedAt: new Date(now - 2  * DAY).toISOString(), owner: 'Priya Raman',    dimensions: '2400×1600' },
  { id: 'ma_3',  name: 'logo-primary',          type: 'image',    ext: 'png', sizeKB: 48,   uploadedAt: new Date(now - 3  * DAY).toISOString(), owner: 'Jordan Avery',   dimensions: '400×200' },
  { id: 'ma_4',  name: 'logo-white',            type: 'image',    ext: 'png', sizeKB: 44,   uploadedAt: new Date(now - 3  * DAY).toISOString(), owner: 'Jordan Avery',   dimensions: '400×200' },
  { id: 'ma_5',  name: 'spring-promo-banner',   type: 'image',    ext: 'png', sizeKB: 192,  uploadedAt: new Date(now - 5  * DAY).toISOString(), owner: 'Marcus Bell',    dimensions: '1200×630' },
  { id: 'ma_6',  name: 'testimonial-ava',       type: 'image',    ext: 'jpg', sizeKB: 96,   uploadedAt: new Date(now - 7  * DAY).toISOString(), owner: 'Dana Cole',      dimensions: '800×800' },
  { id: 'ma_7',  name: 'before-after-1',        type: 'image',    ext: 'jpg', sizeKB: 340,  uploadedAt: new Date(now - 9  * DAY).toISOString(), owner: 'Priya Raman',    dimensions: '1200×800' },
  { id: 'ma_8',  name: 'office-exterior',       type: 'image',    ext: 'jpg', sizeKB: 408,  uploadedAt: new Date(now - 12 * DAY).toISOString(), owner: 'Jordan Avery',   dimensions: '1600×1066' },
  { id: 'ma_9',  name: 'service-guide-q2',      type: 'document', ext: 'pdf', sizeKB: 1240, uploadedAt: new Date(now - 4  * DAY).toISOString(), owner: 'Jordan Avery' },
  { id: 'ma_10', name: 'onboarding-checklist',  type: 'document', ext: 'pdf', sizeKB: 328,  uploadedAt: new Date(now - 6  * DAY).toISOString(), owner: 'Priya Raman' },
  { id: 'ma_11', name: 'pricing-sheet-2025',    type: 'document', ext: 'pdf', sizeKB: 580,  uploadedAt: new Date(now - 8  * DAY).toISOString(), owner: 'Marcus Bell' },
  { id: 'ma_12', name: 'proposal-template',     type: 'document', ext: 'docx', sizeKB: 84,  uploadedAt: new Date(now - 14 * DAY).toISOString(), owner: 'Jordan Avery' },
  { id: 'ma_13', name: 'brand-guidelines',      type: 'document', ext: 'pdf', sizeKB: 2100, uploadedAt: new Date(now - 20 * DAY).toISOString(), owner: 'Dana Cole' },
  { id: 'ma_14', name: 'intro-video-2025',      type: 'video',    ext: 'mp4', sizeKB: 24800, uploadedAt: new Date(now - 3  * DAY).toISOString(), owner: 'Jordan Avery',   dimensions: '1920×1080' },
  { id: 'ma_15', name: 'testimonial-video-liam', type: 'video',   ext: 'mp4', sizeKB: 16400, uploadedAt: new Date(now - 10 * DAY).toISOString(), owner: 'Priya Raman',    dimensions: '1280×720' },
  { id: 'ma_16', name: 'facebook-ad-spring',    type: 'image',    ext: 'jpg', sizeKB: 210,  uploadedAt: new Date(now - 2  * DAY).toISOString(), owner: 'Marcus Bell',    dimensions: '1200×628' },
];

/* ─── Helpers ──────────────────────────────────── */

function fmtSize(kb: number) {
  if (kb < 1000) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_ICON: Record<MediaType, React.ReactNode> = {
  image:    <Image size={20} />,
  document: <FileText size={20} />,
  video:    <Film size={20} />,
};

const TYPE_COLOR: Record<MediaType, string> = {
  image:    'bg-blue-50 text-blue-600',
  document: 'bg-orange-50 text-orange-600',
  video:    'bg-purple-50 text-purple-600',
};

const TYPE_TONE: Record<MediaType, 'brand' | 'warn' | 'neutral'> = {
  image:    'brand',
  document: 'warn',
  video:    'neutral',
};

/* ─── Thumbnail / Icon ────────────────────────────── */

function AssetThumb({ asset }: { asset: MediaAsset }) {
  const BG_COLORS = ['#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#ffedd5', '#e0f2fe', '#fef9c3'];
  const FG_COLORS = ['#1e40af', '#166534', '#9d174d', '#5b21b6', '#9a3412', '#075985', '#854d0e'];
  const idx = asset.id.charCodeAt(3) % BG_COLORS.length;
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg"
      style={{ background: BG_COLORS[idx], color: FG_COLORS[idx] }}
    >
      {TYPE_ICON[asset.type]}
      <span className="ml-1 text-[10px] font-bold uppercase">.{asset.ext}</span>
    </div>
  );
}

/* ─── File Detail Modal ──────────────────────────── */

function FileDetailModal({ asset, onClose, onDelete }: { asset: MediaAsset | null; onClose: () => void; onDelete: (id: string) => void }) {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title="File Details"
      size="md"
      footer={
        <>
          <Button
            variant="danger"
            size="sm"
            className="mr-auto"
            onClick={() => {
              if (asset) {
                onDelete(asset.id);
                pushToast({ title: `Deleted ${asset.name}.${asset.ext}`, description: 'Removed for this session (demo only).', variant: 'info' });
              }
            }}
          >
            <Trash2 size={12} /> Delete
          </Button>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Link copied (demo)', variant: 'success' })}>
            <Link size={12} /> Copy Link
          </Button>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Download started (demo)', variant: 'info' })}>
            <Download size={12} /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </>
      }
    >
      {asset && (
        <div className="space-y-4" data-tour="media.detail">
          <div className="flex h-40 items-center justify-center rounded-xl border border-line bg-surface-sunken">
            <AssetThumb asset={asset} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'File Name', value: `${asset.name}.${asset.ext}` },
              { label: 'Type', value: asset.type },
              { label: 'Size', value: fmtSize(asset.sizeKB) },
              { label: 'Uploaded', value: fmtDate(asset.uploadedAt) },
              { label: 'Owner', value: asset.owner },
              ...(asset.dimensions ? [{ label: 'Dimensions', value: asset.dimensions }] : []),
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-line px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{f.label}</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-line bg-surface-sunken px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Demo URL</p>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">https://cdn.kleegr-demo.example.com/media/{asset.name}.{asset.ext}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Upload Modal ──────────────────────────────── */

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const [dragging, setDragging] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload File"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { pushToast({ title: 'Upload started (demo)', description: 'Files are not actually stored in demo mode.', variant: 'info' }); onClose(); }}>
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-tour="media.uploadModal">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pushToast({ title: 'Drop detected (demo)', description: 'No real upload in demo mode.', variant: 'info' }); }}
          className={cx(
            'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-12 text-center transition-colors',
            dragging ? 'border-brand bg-brand-soft' : 'border-line bg-surface-sunken hover:border-brand/40',
          )}
        >
          <UploadCloud size={32} className={dragging ? 'text-brand' : 'text-ink-subtle'} />
          <div>
            <p className="text-sm font-semibold text-ink">Drag &amp; drop files here</p>
            <p className="mt-0.5 text-xs text-ink-muted">or click below to browse your computer</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => pushToast({ title: 'Browse (demo only)', variant: 'info' })}>Browse Files</Button>
        </div>
        <div className="rounded-xl border border-line bg-surface-sunken px-4 py-3">
          <p className="text-xs font-semibold text-ink-subtle mb-1">Accepted file types</p>
          <div className="flex flex-wrap gap-1.5">
            {['JPG', 'PNG', 'GIF', 'WebP', 'SVG', 'PDF', 'DOCX', 'XLSX', 'MP4', 'MOV'].map((t) => (
              <span key={t} className="rounded bg-line/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-muted">{t}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-subtle">Max file size: 50 MB per file. This is a demo — no files will be stored.</p>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Main Media Page ────────────────────────────── */

type SortKey = 'recent' | 'name' | 'size';

export function Media() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selAsset, setSelAsset] = useState<MediaAsset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>(MEDIA_ASSETS);

  const images    = assets.filter((a) => a.type === 'image');
  const documents = assets.filter((a) => a.type === 'document');
  const videos    = assets.filter((a) => a.type === 'video');
  const totalKB   = assets.reduce((s, a) => s + a.sizeKB, 0);

  const filtered = useMemo(() => {
    let list = assets;
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.ext.toLowerCase().includes(q));
    }
    if (sort === 'recent') list = [...list].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'size') list = [...list].sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  }, [assets, search, typeFilter, sort]);

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelAsset(null);
  };

  return (
    <div data-tour="media.page">
      <PageHeader
        title="Media"
        subtitle="File storage — images, PDFs, videos, and uploaded assets"
        actions={
          <Button size="sm" data-tour="media.uploadButton" onClick={() => setShowUpload(true)}>
            <UploadCloud size={14} /> Upload File
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 px-5 pt-5 lg:grid-cols-5" data-tour="media.summary">
        <MiniStat label="Total Files" value={MEDIA_ASSETS.length} />
        <MiniStat label="Images" value={images.length} sub={`${fmtSize(images.reduce((s, a) => s + a.sizeKB, 0))}`} />
        <MiniStat label="Documents" value={documents.length} sub={`${fmtSize(documents.reduce((s, a) => s + a.sizeKB, 0))}`} />
        <MiniStat label="Videos" value={videos.length} sub={`${fmtSize(videos.reduce((s, a) => s + a.sizeKB, 0))}`} />
        <MiniStat label="Storage Used" value={fmtSize(totalKB)} sub="of 10 GB plan" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4" data-tour="media.filters">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder-ink-subtle focus:border-brand focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          <Filter size={12} className="ml-1.5 text-ink-subtle" />
          {(['all', 'image', 'document', 'video'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cx(
                'rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
                typeFilter === t ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <SortAsc size={14} className="text-ink-subtle" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name A–Z</option>
            <option value="size">Largest first</option>
          </select>
        </div>

        <p className="text-xs text-ink-muted">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Media grid */}
      <div className="px-5 pb-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <FolderOpen size={32} className="text-ink-subtle" />
            <p className="text-sm font-semibold text-ink">No files match your search</p>
            <p className="text-xs text-ink-muted">Try a different keyword or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" data-tour="media.grid">
            {filtered.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelAsset(asset)}
                data-tour="media.item"
                className="group flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 text-left shadow-card transition-all hover:border-brand/40 hover:shadow-pop"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-lg">
                  <AssetThumb asset={asset} />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-ink/0 transition-colors group-hover:bg-ink/10">
                    <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{asset.name}.{asset.ext}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge tone={TYPE_TONE[asset.type]} size="sm">{asset.type}</Badge>
                    <span className="text-[10px] text-ink-subtle">{fmtSize(asset.sizeKB)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-ink-subtle">{fmtDate(asset.uploadedAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FileDetailModal asset={selAsset} onClose={() => setSelAsset(null)} onDelete={handleDelete} />
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}
