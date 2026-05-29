import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/primitives';
import { fullName, cx } from '@/utils';
import type { Channel, Contact } from '@/types';
import { CHANNEL_LABEL } from '../utils';

/**
 * NewMessageModal — GHL-style "New Message" composer launched from the inbox.
 *
 * Lets the user pick a recipient + channel and draft a message, mirroring the
 * real portal's new-conversation flow instead of firing a bare toast.
 *
 * DEMO-SAFE: per the demo guardrails there is no real messaging. The store's
 * `sendMessage` only appends to an *existing* conversation thread, and there is
 * no `startConversation` action, so submit is simulated with a toast and
 * nothing is sent or persisted.
 *
 * NEEDS FROM DEVELOPER #38 (shared store): a `startConversation(contactId,
 * channel, body)` action to create a new in-memory thread — at which point this
 * modal can open the new thread instead of toasting.
 */

const CHANNELS: Channel[] = ['sms', 'email', 'webchat', 'whatsapp'];

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
}: {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
}) {
  const pushToast = useStore((s) => s.pushToast);

  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [channel, setChannel] = useState<Channel>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const recipient = useMemo(() => contacts.find((c) => c.id === contactId) ?? null, [contacts, contactId]);
  const isEmail = channel === 'email';
  const isValid = Boolean(contactId && body.trim() && (!isEmail || subject.trim()));

  const reset = () => {
    setSubject('');
    setBody('');
  };

  const handleSend = () => {
    if (!isValid) return;
    pushToast({
      title: 'Demo: Message queued',
      description: `A ${CHANNEL_LABEL[channel]} message to ${recipient ? fullName(recipient) : 'the contact'} would be sent. (Demo only — no real messages are delivered.)`,
      variant: 'info',
    });
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
          Demo only — no real messages are delivered.
        </p>
      </div>
    </Modal>
  );
}
