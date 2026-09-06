import React, { useState, useMemo } from 'react';
import {
  Image, FileText, Film, UploadCloud, Search, X,
  Download, Link, FolderOpen, Eye, Sparkles, FolderPlus,
  MoreVertical, LayoutGrid, List, HardDrive, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cx } from '@/utils';

/* ─── Local fake media assets ─────────────────────────────
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

/* ─── Helpers ────────────────────────────────── */

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

/* ─── Thumbnail / Icon ───────────────────────── */

function AssetThumb({ asset }: { asset: MediaAsset }) {
  const iconClass = asset.type === 'image'
    ? 'bg-[#54c0e5] text-white'
    : asset.type === 'video'
      ? 'bg-[#8b73db] text-white'
      : 'bg-[#fff0db] text-[#df861b]';
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#f1f2f5] via-[#e3e5e8] to-[#202224]">
      <div className={cx('flex h-14 w-14 items-center justify-center rounded-xl shadow-sm', iconClass)}>
        {TYPE_ICON[asset.type]}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-2 pt-8">
        <p className="truncate text-[11px] font-semibold text-white">{asset.name}.{asset.ext}</p>
      </div>
    </div>
  );
}

/* ─── File Detail Modal ────────────────────── */

function FileDetailModal({ asset, onClose }: { asset: MediaAsset | null; onClose: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title="File Details"
      size="md"
      footer={
        <>
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
            <p className="mt-0.5 font-mono text-xs text-ink-muted">https://cdn.example.com/media/{asset.name}.{asset.ext}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Upload Modal ─────────────────────── */

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

/* ─── Main Media Page ────────────────────── */

type SortKey = 'recent' | 'name' | 'size';

export function Media() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selAsset, setSelAsset] = useState<MediaAsset | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = useMemo(() => {
    let list = MEDIA_ASSETS;
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.ext.toLowerCase().includes(q));
    }
    if (sort === 'recent') list = [...list].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'size') list = [...list].sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  }, [search, typeFilter, sort]);

  return (
    <div data-tour="media.page" className="flex h-full min-h-0 flex-col bg-surface">
      <div className="border-b border-line bg-surface px-6 pb-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-ink">Media Storage</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-11 px-4 text-sm font-medium">
              <span className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500" />
              Connect Canva
            </Button>
            <Button variant="secondary" className="h-11 px-4 text-sm font-medium">
              <HardDrive size={17} className="text-[#4285f4]" /> Connect Drive
            </Button>
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="AI media tools">
              <Sparkles size={18} className="text-ai" />
            </Button>
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="Create folder">
              <FolderPlus size={18} />
            </Button>
            <Button className="h-11 px-4 text-sm" data-tour="media.uploadButton" onClick={() => setShowUpload(true)}>
              <UploadCloud size={17} /> Upload <ChevronDown size={15} />
            </Button>
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="More media actions">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3" data-tour="media.filters">
          <label className="relative min-w-[220px] flex-1 max-w-[240px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | MediaType)}
              className="h-10 w-full appearance-none rounded-md border border-line bg-surface px-3 pr-9 text-[13px] text-ink outline-none focus:border-brand"
              aria-label="Media type"
            >
              <option value="all">My Media</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          </label>
          <label className="relative min-w-[250px] flex-1 max-w-[300px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search media library"
              placeholder="Search the entire media library"
              className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-9 text-[13px] text-ink outline-none placeholder:text-ink-subtle focus:border-brand"
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" aria-label="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </label>
          <label className="relative min-w-[185px]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full appearance-none rounded-md border border-line bg-surface px-3 pr-8 text-[13px] text-ink outline-none focus:border-brand"
              aria-label="Sort media"
            >
              <option value="recent">Modified: Newest First</option>
              <option value="name">Name: A–Z</option>
              <option value="size">Size: Largest First</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          </label>
          <label className="relative min-w-[130px]">
            <select className="h-10 w-full appearance-none rounded-md border border-line bg-surface px-3 pr-8 text-[13px] text-ink outline-none focus:border-brand" aria-label="File ownership filter">
              <option>All</option>
              <option>Created by me</option>
              <option>Shared with me</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          </label>
          <div className="flex h-10 overflow-hidden rounded-md border border-line bg-surface">
            <button type="button" onClick={() => setView('grid')} className={cx('grid w-12 place-items-center border-r border-line', view === 'grid' ? 'bg-surface-sunken text-ink' : 'text-ink-muted')} aria-label="Grid view">
              <LayoutGrid size={16} />
            </button>
            <button type="button" onClick={() => setView('list')} className={cx('grid w-12 place-items-center', view === 'list' ? 'bg-surface-sunken text-ink' : 'text-ink-muted')} aria-label="List view">
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-7">
        <button type="button" className="mb-12 inline-flex items-center gap-1 text-sm font-medium text-ink-muted">
          Folders <ChevronDown size={14} className="-rotate-90" />
        </button>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-muted">Files</h2>
          <span className="text-xs text-ink-subtle">{filtered.length} files</span>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <FolderOpen size={32} className="text-ink-subtle" />
            <p className="text-sm font-semibold text-ink">No files match your search</p>
            <p className="text-xs text-ink-muted">Try a different keyword or filter.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5" data-tour="media.grid">
            {filtered.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelAsset(asset)}
                data-tour="media.item"
                className="group relative aspect-square min-h-[160px] overflow-hidden rounded-md border border-line bg-surface text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-pop"
              >
                <AssetThumb asset={asset} />
                <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/10">
                  <Eye size={20} className="text-white opacity-0 drop-shadow group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-line" data-tour="media.list">
            <div className="grid grid-cols-[minmax(240px,2fr)_100px_100px_160px] bg-surface-sunken px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              <span>Name</span><span>Type</span><span>Size</span><span>Modified</span>
            </div>
            {filtered.map((asset) => (
              <button key={asset.id} type="button" onClick={() => setSelAsset(asset)} className="grid w-full grid-cols-[minmax(240px,2fr)_100px_100px_160px] items-center border-t border-line px-4 py-3 text-left text-xs hover:bg-surface-sunken">
                <span className="flex min-w-0 items-center gap-3 font-medium text-ink">
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-md', asset.type === 'image' ? 'bg-brand-soft text-brand' : asset.type === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600')}>
                    {TYPE_ICON[asset.type]}
                  </span>
                  <span className="truncate">{asset.name}.{asset.ext}</span>
                </span>
                <span className="capitalize text-ink-muted">{asset.type}</span>
                <span className="text-ink-muted">{fmtSize(asset.sizeKB)}</span>
                <span className="text-ink-muted">{fmtDate(asset.uploadedAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FileDetailModal asset={selAsset} onClose={() => setSelAsset(null)} />
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}
