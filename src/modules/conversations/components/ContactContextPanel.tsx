/**
 * ContactContextPanel — right pane of the Conversations inbox.
 *
 * Shows contact details, tags, related opportunities, upcoming appointments,
 * and open tasks for the contact in the selected conversation.
 * Hidden on screens below lg; visible from lg onwards.
 */
import { useMemo } from 'react';
import { User, Mail, Phone, Tag, Briefcase, Calendar, CheckSquare } from 'lucide-react';
import { Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import { fullName, relativeTime, dateLabel, clockTime } from '@/utils';
import type { Conversation } from '@/types';

// ── Props ────────────────────────────────────────────────────────────────────

interface ContactContextPanelProps {
  conversation: Conversation | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ContactContextPanel({ conversation }: ContactContextPanelProps) {
  const contacts      = useStore((s) => s.contacts);
  const opportunities = useStore((s) => s.opportunities);
  const pipelines     = useStore((s) => s.pipelines);
  const appointments  = useStore((s) => s.appointments);
  const tasks         = useStore((s) => s.tasks);

  const contact = useMemo(
    () => (conversation ? contacts.find((c) => c.id === conversation.contactId) ?? null : null),
    [conversation, contacts],
  );

  const contactOpps = useMemo(
    () => (contact ? opportunities.filter((o) => o.contactId === contact.id).slice(0, 3) : []),
    [contact, opportunities],
  );

  const contactAppts = useMemo(
    () =>
      contact
        ? [...appointments]
            .filter((a) => a.contactId === contact.id)
            .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime))
            .slice(0, 3)
        : [],
    [contact, appointments],
  );

  const contactTasks = useMemo(
    () =>
      contact
        ? tasks.filter((t) => t.contactId === contact.id && t.status === 'open').slice(0, 3)
        : [],
    [contact, tasks],
  );

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!contact) {
    return (
      <div
        className="flex h-full flex-col bg-surface"
        data-tour="conversations.contactContext"
      >
        <EmptyState
          icon={<User size={24} />}
          title="Contact details"
          body="Select a conversation to see contact information here."
        />
      </div>
    );
  }

  const name = fullName(contact);

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-surface"
      data-tour="conversations.contactContext"
    >
      {/* Header: avatar + name + source + tags */}
      <div className="flex flex-col items-center gap-2 border-b border-line px-4 py-5 text-center">
        <Avatar name={name} size="lg" />
        <div>
          <p className="text-sm font-bold text-ink">{name}</p>
          <p className="text-xs text-ink-muted">{contact.source}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {contact.tags.map((tag) => (
            <Badge key={tag} tone="neutral">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Contact details */}
      <div className="divide-y divide-line/60 border-b border-line">
        <div className="flex items-start gap-3 px-4 py-2.5">
          <Mail size={13} className="mt-0.5 shrink-0 text-ink-subtle" />
          <span className="min-w-0 break-all text-xs text-ink">{contact.email}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Phone size={13} className="shrink-0 text-ink-subtle" />
          <span className="text-xs text-ink">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Tag size={13} className="shrink-0 text-ink-subtle" />
          <span className="text-xs text-ink-muted">
            {contact.dnd ? '\uD83D\uDEAB Do not disturb' : 'Messaging enabled'}
          </span>
        </div>
      </div>

      {/* Related opportunities */}
      {contactOpps.length > 0 && (
        <section className="border-b border-line px-4 py-3">
          <header className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            <Briefcase size={11} /> Opportunities
          </header>
          <ul className="space-y-2">
            {contactOpps.map((opp) => {
              const pipe  = pipelines.find((p) => p.id === opp.pipelineId);
              const stage = pipe?.stages.find((s) => s.id === opp.stageId);
              return (
                <li key={opp.id} className="rounded-lg bg-surface-sunken px-3 py-2">
                  <p className="line-clamp-1 text-xs font-semibold text-ink">{opp.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {stage?.name ?? '\u2014'} &middot; ${opp.monetaryValue.toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Recent appointments */}
      {contactAppts.length > 0 && (
        <section className="border-b border-line px-4 py-3">
          <header className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            <Calendar size={11} /> Appointments
          </header>
          <ul className="space-y-1.5">
            {contactAppts.map((appt) => (
              <li key={appt.id} className="rounded-lg bg-surface-sunken px-3 py-2">
                <p className="line-clamp-1 text-xs font-semibold text-ink">{appt.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {dateLabel(appt.startTime)} {clockTime(appt.startTime)} &middot; {appt.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open tasks */}
      {contactTasks.length > 0 && (
        <section className="px-4 py-3">
          <header className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            <CheckSquare size={11} /> Open Tasks
          </header>
          <ul className="space-y-1.5">
            {contactTasks.map((task) => (
              <li key={task.id} className="rounded-lg bg-surface-sunken px-3 py-2">
                <p className="line-clamp-1 text-xs font-semibold text-ink">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Due {dateLabel(task.dueDate)} &middot;{' '}
                  <span
                    className={
                      task.priority === 'high'
                        ? 'text-bad'
                        : task.priority === 'medium'
                        ? 'text-warn'
                        : 'text-ink-subtle'
                    }
                  >
                    {task.priority}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Last activity footer */}
      <div className="mt-auto border-t border-line px-4 py-3">
        <p className="text-[11px] text-ink-subtle">
          Last activity {relativeTime(contact.lastActivityAt)}
        </p>
      </div>
    </div>
  );
}
