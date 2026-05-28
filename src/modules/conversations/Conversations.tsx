/**
 * TODO(Wave1): Full Conversations / Unified Inbox build — 3-pane inbox
 * (list · thread · contact context), channel tabs (SMS/Email/Chat/FB/IG/WhatsApp/Call),
 * reply composer, starred/unread, AI suggest reply.
 * See plan §7.2 and Phase 1 in §22.
 */
import { MessagesSquare } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';

export function Conversations() {
  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle="Unified inbox — SMS, Email, Chat, Social, Calls"
      />
      <EmptyState
        icon={<MessagesSquare size={32} />}
        title="Conversations — coming in Wave 1"
        body="Full build: 3-pane inbox, channel filters, reply composer, unread badges, and contact context panel."
      />
    </div>
  );
}
