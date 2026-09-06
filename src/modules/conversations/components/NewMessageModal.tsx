import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { cx, fullName } from '@/utils';
import type { Channel, Contact } from '@/types';
import { CHANNEL_LABEL } from '../utils';

/**
 * NewMessageModal — GHL-style "New Message" composer launched from the inbox.
 *
 * Lets the user pick a recipient + channel and draft a message, mirroring the
 * real portal's new-conversation flow instead of firing a bare toast.
 *
 * DEMO-SAFE: submission creates a local, session-only thread. Nothing is sent
 * to a provider and refreshing/resetting restores the original seed.
 */

const CHANNELS: Channel[] = ['sms', 'email', 'whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'];

const inputCls =
  'h-10 w-full rounded-lg border border-line bg-surface-sunken px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand/30';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export function NewMessageModal({
  open,
  onClose,
  contacts,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  onCreated: (conversationId: string, channel: Channel, body: string) => void;
}) {
  const startConversation = useStore((s) => s.startConversation);
  const updateMessageStatus = useStore((s) => s.updateMessageStatus);
  const demoRevision = useStore((s) => s.demoRevision);

  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [channel, setChannel] = useState<Channel>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const deliveryTimersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    setContactId((currentId) =>
      contacts.some((contact) => contact.id === currentId)
        ? currentId
        : contacts[0]?.id ?? '',
    );
  }, [contacts, open]);

  useEffect(() => {
    const deliveryTimers = deliveryTimersRef.current;
    return () => {
      deliveryTimers.forEach((timer) => window.clearTimeout(timer));
      deliveryTimers.clear();
    };
  }, [demoRevision]);

  const isEmail = channel === 'email';
  const hasValidRecipient = contacts.some((contact) => contact.id === contactId);
  const isValid = Boolean(hasValidRecipient && body.trim() && (!isEmail || subject.trim()));

  const reset = () => {
    setSubject('');
    setBody('');
  };

  const handleSend = () => {
    if (!isValid) return;
    const currentContacts = useStore.getState().contacts;
    if (!currentContacts.some((contact) => contact.id === contactId)) {
      setContactId(currentContacts[0]?.id ?? '');
      return;
    }
    const trimmed = body.trim();
    const conversation = startConversation({
      contactId,
      channel,
      body: trimmed,
      subject: isEmail ? subject.trim() : undefined,
    });
    const initialMessageId = conversation.messageIds[0];
    if (initialMessageId) {
      const scheduleStatus = (status: 'delivered' | 'read', delay: number) => {
        const timer = window.setTimeout(() => {
          deliveryTimersRef.current.delete(timer);
          updateMessageStatus(initialMessageId, status);
        }, delay);
        deliveryTimersRef.current.add(timer);
      };
      scheduleStatus('delivered', 300);
      scheduleStatus('read', 900);
    }
    onCreated(conversation.id, channel, trimmed);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Message"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!isValid}>
            <Send size={15} /> Send
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="To">
          <div className="relative">
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={cx(inputCls, 'appearance-none pr-9')}
            >
              {contacts.length === 0 && <option value="">No contacts available</option>}
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)}{c.email ? ` · ${c.email}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          </div>
        </Field>

        <Field label="Channel">
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={cx(
                  'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                  channel === ch
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
                )}
              >
                {CHANNEL_LABEL[ch]}
              </button>
            ))}
          </div>
        </Field>

        {isEmail && (
          <Field label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className={inputCls} />
          </Field>
        )}

        <Field label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder={`Write your ${CHANNEL_LABEL[channel]} message…`}
            className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand/30"
          />
        </Field>

        <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
          Safe demo workspace — this message and any fictional reply exist only in this browser session.
        </p>
      </div>
    </Modal>
  );
}
