/**
 * TODO(Wave2): Full Integrations build — connected accounts hub with an
 * Outlook-style connect card, mock OAuth consent flow, Outlook inbox
 * (folders / message list / reading pane), other integration cards.
 * See plan §7.16 and Phase 2 in §22.
 */
import { Plug } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Integrations() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connected accounts — Outlook, calendar sync, and third-party apps"
      />
      <EmptyState
        icon={<Plug size={32} />}
        title="Integrations — coming in Wave 2"
        body="Full build: integration cards, mock Outlook OAuth connect flow, Outlook-style 3-pane inbox with fake emails."
      />
    </div>
  );
}
