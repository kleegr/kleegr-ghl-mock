/**
 * Calendar module — local types.
 *
 * The shared `Calendar`/`Appointment` types in `src/types/index.ts` are kept
 * intentionally minimal (id/name/color). The richer GoHighLevel-style calendar
 * *settings* metadata (group, type, duration, slug, owner, timestamps, status)
 * is modelled here, locally, so the Calendars workstream can ship a full
 * settings experience without changing shared contracts or the seed.
 *
 * Everything here is demo/session-only. No real APIs, no real PII.
 */
import type { ID } from '@/types';

/** GoHighLevel-style calendar archetypes shown in the "create calendar" chooser. */
export type CalendarTypeId =
  | 'round_robin'
  | 'event'
  | 'service'
  | 'class'
  | 'collective';

export interface CalendarTypeDef {
  id: CalendarTypeId;
  name: string;
  /** One-line description shown on the type card. */
  description: string;
  /** Longer "what is this" copy for the comparison/learn-more area. */
  detail: string;
  /** Best-for bullets shown when the card is expanded. */
  bestFor: string[];
}

export type CalendarStatus = 'active' | 'draft' | 'inactive';

/** A fully-described calendar as it appears in Calendar Settings. */
export interface CalendarMeta {
  id: ID;
  name: string;
  color: string;
  /** Group/folder the calendar is filed under (GHL groups calendars). */
  groupId: ID;
  type: CalendarTypeId;
  /** Default meeting duration in minutes. */
  durationMin: number;
  status: CalendarStatus;
  /** URL slug used for the public booking link. */
  slug: string;
  /** Owning staff member (store user id). */
  ownerId: ID;
  createdAt: string;
  updatedAt: string;
  description?: string;
  /** Calendar-invite title template. */
  inviteTitle?: string;
}

export interface CalendarGroup {
  id: ID;
  name: string;
  description?: string;
}

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface TimeRange {
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM" 24h
}

export interface ScheduleDay {
  day: Weekday;
  label: string;
  enabled: boolean;
  ranges: TimeRange[];
}

export interface DateOverride {
  id: ID;
  date: string; // "YYYY-MM-DD"
  label: string;
  /** true = closed all day; false = custom hours in `ranges`. */
  unavailable: boolean;
  ranges?: TimeRange[];
}

export type ConnectionProvider =
  | 'google'
  | 'outlook'
  | 'ical'
  | 'zoom'
  | 'google_meet';

export interface ConnectionAccount {
  id: ID;
  provider: ConnectionProvider;
  label: string;
  email?: string;
  status: 'connected' | 'syncing' | 'error';
  primary?: boolean;
  /** Which connections tab the account belongs to. */
  kind: 'calendar' | 'video';
}
