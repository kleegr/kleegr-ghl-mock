/**
 * Learning paths — curated, ordered groupings of tutorials.
 *
 * A path is a guided sequence (e.g. “convert a lead”) rather than a single
 * walkthrough, so a new user can follow an end-to-end outcome instead of
 * hunting through the tutorial list. The visible UI that runs these is future
 * work; this file just defines the data so Developer 2/3 can build on it.
 *
 * `tutorialIds` reference runtime flow ids from `flows.ts` wherever a tutorial
 * exists today. Tutorials that are intended but not built yet are listed in
 * `PLANNED_TUTORIAL_IDS` and clearly marked — Developer 3 will author them and
 * the tutorial checker treats them as planned (allowed) rather than broken.
 *
 * Apostrophes in prose use the typographic form (U+2019) so the dependency-free
 * checker can parse single-quoted fields without a stray ASCII apostrophe
 * terminating a string early.
 *
 * This module has zero runtime dependencies.
 */

export interface LearningPath {
  /** Stable path id, kebab-case. */
  id: string;
  /** Short human title shown at the top of the path. */
  title: string;
  /** One-sentence description of the outcome the path teaches. */
  description: string;
  /**
   * Ordered tutorial ids. Existing runtime flow ids run today; ids listed in
   * PLANNED_TUTORIAL_IDS are future tutorials and will activate once built.
   */
  tutorialIds: string[];
}

// ─── Planned (not-yet-built) tutorials ─────────────────────────────────────
//
// These are referenced by paths below but do not exist as runtime flows yet.
// Developer 3 owns authoring them. Listing them here (a) documents intended
// scope and (b) lets the tutorial checker distinguish "planned" from "broken"
// when validating path references. Keep this literal first so the text-based
// checker can parse it.
export const PLANNED_TUTORIAL_IDS = [
  'configure-business-profile',
  'invite-team-member',
  'upload-brand-assets',
  'build-first-funnel',
] as const;

export type PlannedTutorialId = (typeof PLANNED_TUTORIAL_IDS)[number];

// ─── Paths ─────────────────────────────────────────────────────────────────
//
// The first four paths are composed entirely of tutorials that exist today, so
// they are fully runnable. "admin-setup" is intentionally forward-looking: it
// stitches together one-time account setup, most of which Developer 3 still
// needs to build (see PLANNED_TUTORIAL_IDS).
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'first-session',
    title: 'Get started in Kleegr',
    description: 'Your first few minutes: add a lead, reply to an incoming message, and clear today’s missed calls so nothing slips through.',
    tutorialIds: ['add-contact', 'reply-conversation', 'check-missed-calls'],
  },
  {
    id: 'lead-conversion',
    title: 'Convert a lead',
    description: 'Take a new lead from first touch to closed: capture the contact, advance them through your pipeline, book the meeting, and send the invoice.',
    tutorialIds: ['add-contact', 'move-pipeline', 'book-appointment', 'create-invoice'],
  },
  {
    id: 'appointments-payments',
    title: 'Appointments and payments',
    description: 'Run the booking-to-paid loop: schedule an appointment, collect payment with an invoice, then ask the happy customer for a review.',
    tutorialIds: ['book-appointment', 'create-invoice', 'send-review-request'],
  },
  {
    id: 'automation-setup',
    title: 'Automate your follow-up',
    description: 'Stop doing repetitive work by hand: build a workflow that follows up automatically, then check how your campaigns are performing.',
    tutorialIds: ['create-workflow', 'view-campaign-performance'],
  },
  {
    id: 'admin-setup',
    title: 'Set up your workspace',
    description: 'One-time account setup for a new workspace: configure your business profile, invite your team, connect your inbox, upload your branding, and stand up your first funnel. Several of these tutorials are planned and will activate as they are built.',
    tutorialIds: ['configure-business-profile', 'invite-team-member', 'outlook-inbox', 'upload-brand-assets', 'build-first-funnel'],
  },
];

// ─── Derived lookups ───────────────────────────────────────────────────────

/** All learning paths keyed by id. */
export const learningPathById: Readonly<Record<string, LearningPath>> = Object.fromEntries(
  LEARNING_PATHS.map((p) => [p.id, p]),
);

/** Convenience list of every path id, in display order. */
export const LEARNING_PATH_IDS: readonly string[] = LEARNING_PATHS.map((p) => p.id);
