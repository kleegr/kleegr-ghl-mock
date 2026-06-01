/**
 * Tutorial selector registry — compatibility layer.
 *
 * Historically this file hand-maintained ~1600 lines of tour-key metadata that
 * drifted out of sync with what the app actually rendered. It is now a thin
 * projection of the single source of truth in `@/help/helpContent`, so there is
 * exactly one place to add or edit explainable keys. Every public export below
 * is preserved so existing imports keep working unchanged — most importantly
 * `TourKey`, which `flows.ts` imports for step-target autocomplete.
 *
 * Nothing here is hand-edited per key anymore: change `helpContent.ts` and this
 * registry follows automatically.
 */

import {
  HELP_CONTENT,
  HELP_AREAS,
  type HelpArea,
  type HelpEntry,
} from '@/help/helpContent';

/** Functional area that can own a tour key. Aliased to the help model's areas. */
export type TourArea = HelpArea;

/** Canonical area list, re-exported for callers that enumerate areas. */
export { HELP_AREAS };

/**
 * A tour-key string. The live `data-tour` attribute in the DOM is the runtime
 * source of truth, so this is intentionally an open string type rather than a
 * frozen union that would inevitably lag behind what modules render. Authoring
 * tools should validate against `tourKeyMap` / `isKnownTourKey` at runtime.
 */
export type TourKey = string & {};

export interface TourRegistryItem {
  /** Exact string used in `data-tour` attributes. */
  key: TourKey;
  area: TourArea;
  /** Human-readable label for documentation and authoring tools. */
  label: string;
  /** Short description of the element this key targets (reuses the help copy). */
  description: string;
  /** Whether this key must be placed before V1 ships. */
  requiredForV1: boolean;
  /** Runtime tutorial flow id(s) that walk through this element, if any. */
  tutorials: string[];
}

// ─── Required V1 tutorial IDs ────────────────────────────────────────
//
// The canonical list of onboarding tutorials, kept in sync with the runtime
// flows in `@/tutorials/flows` (the tutorial checker asserts this set equals
// the flow ids). These now use the runtime flow ids directly — the descriptive
// legacy aliases (reply-to-conversation, move-pipeline-lead, view-outlook-inbox)
// are gone, so LEGACY_REGISTRY_ALIASES in scripts/check-tutorials.mjs is a
// harmless no-op kept only for backward compatibility. Keep this literal intact
// and first so the text-based checker can parse it.
export const REQUIRED_TUTORIAL_IDS = [
  'tour-dashboard',
  'add-contact',
  'reply-conversation',
  'check-missed-calls',
  'move-pipeline',
  'book-appointment',
  'create-invoice',
  'review-document',
  'send-review-request',
  'create-workflow',
  'view-campaign-performance',
  'explore-reporting',
  'productivity-tickets',
  'configure-business-profile',
  'invite-team-member',
  'outlook-inbox',
] as const;

export type RequiredTutorialId = (typeof REQUIRED_TUTORIAL_IDS)[number];

/**
 * The tour registry, projected from the help catalog:
 *   - `description` reuses the plain-language help copy,
 *   - `requiredForV1` falls back to primary-importance entries when an entry
 *     does not set it explicitly,
 *   - `tutorials` lists the runtime flow id that targets the element, if any.
 */
export const TOUR_REGISTRY: TourRegistryItem[] = HELP_CONTENT.map(
  (entry: HelpEntry): TourRegistryItem => ({
    key: entry.key,
    area: entry.area,
    label: entry.label,
    description: entry.help,
    requiredForV1: entry.requiredForV1 ?? (entry.importance === 'primary'),
    tutorials: entry.tutorialId ? [entry.tutorialId] : [],
  }),
);

/** All registry items keyed by their tour key. O(1) lookup. */
export const tourKeyMap: Readonly<Record<string, TourRegistryItem>> = Object.fromEntries(
  TOUR_REGISTRY.map((item) => [item.key, item]),
);

/** All items grouped by area, in catalog order. */
export const tourKeysByArea: Readonly<Record<TourArea, TourRegistryItem[]>> = (
  TOUR_REGISTRY.reduce(
    (acc, item) => {
      acc[item.area] = acc[item.area] ?? [];
      acc[item.area].push(item);
      return acc;
    },
    {} as Record<TourArea, TourRegistryItem[]>,
  )
) as Readonly<Record<TourArea, TourRegistryItem[]>>;

/** Items that must have their `data-tour` attribute placed before V1 ships. */
export const requiredTourKeys: readonly TourRegistryItem[] = TOUR_REGISTRY.filter(
  (item) => item.requiredForV1,
);

/**
 * Type guard — confirms a string is a known tour key (present in the catalog).
 * Use in the Tutorial engine when consuming step `targetSelector` values.
 */
export function isKnownTourKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(tourKeyMap, key);
}
