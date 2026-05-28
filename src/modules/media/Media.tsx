/**
 * TODO(Wave2): Full Media / File Storage build — image and PDF file library
 * grid, upload UI (cosmetic), preview, folder navigation.
 * See plan §7.18 and Phase 2 in §22.
 */
import { FolderOpen } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Media() {
  return (
    <div>
      <PageHeader
        title="Media"
        subtitle="File storage — images, PDFs, and uploaded assets"
      />
      <EmptyState
        icon={<FolderOpen size={32} />}
        title="Media — coming in Wave 2"
        body="Full build: asset grid with images and PDFs, upload modal (cosmetic), folder navigation, file preview."
      />
    </div>
  );
}
