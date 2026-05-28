import { Modal } from '@/components/ui/Modal';
import { Badge, Avatar, Button } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';
import type { Opportunity, Contact, User } from '@/types';
import { money, dateLabel, fullName } from '@/utils';

type StatusTone = 'good' | 'bad' | 'warn' | 'neutral' | 'brand';

function statusTone(status: Opportunity['status']): StatusTone {
  const map: Record<Opportunity['status'], StatusTone> = {
    open: 'brand',
    won: 'good',
    lost: 'bad',
    abandoned: 'warn',
  };
  return map[status];
}

interface Props {
  opportunity: Opportunity;
  contacts: Contact[];
  users: User[];
  onClose: () => void;
}

export function OpportunityDetailModal({
  opportunity: opp,
  contacts,
  users,
  onClose,
}: Props) {
  const pipelines = useStore((s) => s.pipelines);
  const pushToast = useStore((s) => s.pushToast);

  const pipeline = pipelines.find((p) => p.id === opp.pipelineId);
  const stage = pipeline?.stages.find((s) => s.id === opp.stageId);
  const contact = contacts.find((c) => c.id === opp.contactId);
  const owner = users.find((u) => u.id === opp.ownerId);

  const handleCosmetic = (label: string) => {
    pushToast({
      title: `Demo: ${label}`,
      description: 'This action is simulated in the demo.',
      variant: 'info',
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={opp.name}
      size="md"
      footer={
        <div className="flex gap-2" data-tour="opportunities.detail">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCosmetic('Mark as Lost')}
          >
            Mark Lost
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCosmetic('Mark as Won')}
          >
            Mark Won
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status + Value hero */}
        <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Deal Value
            </p>
            <p className="font-display text-2xl font-extrabold text-ink">
              {money(opp.monetaryValue)}
            </p>
          </div>
          <Badge tone={statusTone(opp.status)} size="md">
            {opp.status}
          </Badge>
        </div>

        {/* Detail grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {pipeline && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Pipeline
              </dt>
              <dd className="mt-0.5 font-medium text-ink">{pipeline.name}</dd>
            </div>
          )}

          {stage && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Stage
              </dt>
              <dd className="mt-0.5 font-medium text-ink">{stage.name}</dd>
            </div>
          )}

          {contact && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Contact
              </dt>
              <dd className="mt-0.5 font-medium text-ink">{fullName(contact)}</dd>
            </div>
          )}

          {opp.source && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Source
              </dt>
              <dd className="mt-0.5 font-medium text-ink">{opp.source}</dd>
            </div>
          )}

          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Created
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{dateLabel(opp.createdAt)}</dd>
          </div>

          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Last Updated
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{dateLabel(opp.updatedAt)}</dd>
          </div>

          {owner && (
            <div className="col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Owner
              </dt>
              <dd className="mt-1 flex items-center gap-2">
                <Avatar name={owner.name} size="sm" />
                <span className="font-medium text-ink">{owner.name}</span>
              </dd>
            </div>
          )}
        </dl>

        {/* Cosmetic edit button */}
        <div className="border-t border-line pt-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={() => handleCosmetic('Edit Opportunity')}
          >
            Edit Opportunity
          </Button>
        </div>
      </div>
    </Modal>
  );
}
