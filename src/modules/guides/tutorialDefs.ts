/**
 * Tutorial definitions — a derived compatibility layer.
 *
 * Historically this file hand-maintained a second copy of every tutorial
 * (title, area, route, step outline, completion note). That duplicate drifted
 * out of sync with the runtime flows and accumulated stale copy — for example
 * step outlines that told users to "open X from the sidebar" for nav items the
 * shell now hides. Per the architecture plan (Option A), it is now a thin
 * projection of the single source of truth in `@/tutorials/flows`, so there is
 * exactly one place to author a tutorial.
 *
 * The public surface is unchanged: the `TutorialDef` type and the `TUTORIALS`
 * array are still exported, so the Guides launcher and its card / preview
 * components keep working without edits (Developer 4 will rebuild /guides to
 * consume the flows and learning paths directly, at which point this shim can
 * be removed).
 *
 * Field mapping (flow -> def):
 *   id, title, area, estMinutes  -> copied as-is
 *   module                       -> the flow's first routed step (its entry route)
 *   description                  -> the flow's business-value summary
 *   plannedSteps                 -> each flow step's title, in order
 *   completionNote               -> the flow's completion body
 */

import { TUTORIAL_FLOWS, type TutorialFlow } from '@/tutorials/flows';

export interface TutorialDef {
  /** Stable kebab-case identifier. Matches the runtime flow id. */
  id: string;
  /** Human-readable title shown on the card and modal. */
  title: string;
  /** Module area label (e.g. "Contacts", "Payments"). */
  area: string;
  /** Route the tutorial begins at (for navigation and the route hint check). */
  module: string;
  /** One-sentence, business-value description for the card. */
  description: string;
  /** Estimated completion time in minutes. */
  estMinutes: number;
  /** Ordered step outline — shown in the preview modal as "What you'll do". */
  plannedSteps: string[];
  /** Message shown on the completion screen. */
  completionNote: string;
}

/** Project a runtime TutorialFlow into the catalog-facing TutorialDef shape. */
function toTutorialDef(flow: TutorialFlow): TutorialDef {
  const entryRoute = flow.steps.find((s) => s.route)?.route ?? '/';
  return {
    id: flow.id,
    title: flow.title,
    area: flow.area,
    module: entryRoute,
    description: flow.description,
    estMinutes: flow.estMinutes,
    plannedSteps: flow.steps.map((s) => s.title),
    completionNote: flow.completionBody,
  };
}

/**
 * The guide catalog, derived 1:1 from the runtime flows. Order follows
 * TUTORIAL_FLOWS so the catalog and the engine present tutorials identically.
 */
export const TUTORIALS: TutorialDef[] = TUTORIAL_FLOWS.map(toTutorialDef);
