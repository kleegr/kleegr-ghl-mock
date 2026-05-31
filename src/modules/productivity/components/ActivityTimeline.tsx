/**
 * Shared activity timeline used in ticket + task detail drawers.
 *
 * Adapts the threaded activity feed from Ticketing (ThreadAwareTimeline) and
 * Meridian (task activity history) into one compact, icon-led vertical list.
 * Purely presentational — renders the in-memory activity array.
 */

import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Pencil,
  Plus,
  Settings2,
  UserPlus,
} from 'lucide-react';
import { relativeTime } from '@/utils';
import type { ActivityItem } from '../types';
import { personName } from '../data';

const ICONS: Record<ActivityItem['kind'], typeof Plus> = {
  created: Plus,
  status: CheckCircle2,
  comment: MessageSquare,
  assign: UserPlus,
  note: Pencil,
  due: Clock,
  system: Settings2,
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-ink-subtle">No activity yet.</p>;
  }

  return (
    <ol className="relative space-y-3 pl-1">
      {items.map((a, i) => {
        const Icon = ICONS[a.kind] ?? Settings2;
        return (
          <li key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-subtle">
                <Icon size={12} />
              </span>
              {i < items.length - 1 && <span className="mt-0.5 w-px flex-1 bg-line" aria-hidden="true" />}
            </div>
            <div className="-mt-0.5 pb-1">
              <p className="text-[13px] leading-snug text-ink">{a.text}</p>
              <p className="mt-0.5 text-[11px] text-ink-subtle">
                {a.actorId ? `${personName(a.actorId)} · ` : ''}
                {relativeTime(a.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
