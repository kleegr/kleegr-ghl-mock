/**
 * helpRoutes.ts — maps the current router path to the help area(s) it covers.
 *
 * The Help Panel (HelpPanel.tsx) needs to know which screen the user is on so it
 * can pull the right entries out of `helpByArea` (from the Developer 1 help
 * model). Keeping the mapping here — rather than inside the panel — means the
 * route→area knowledge lives in one small, testable place, and the panel stays
 * a pure renderer.
 *
 * Rules:
 *  - First matching rule wins (rules are ordered most-specific-first where it
 *    matters).
 *  - A route may map to MORE THAN ONE area. `/productivity` renders both
 *    `productivity.*` and `tasks.*` anchors today, and `/documents` reuses the
 *    Payments module, so those routes surface both areas' help.
 *  - Unknown routes (e.g. illustrative placeholders like `/launchpad`) resolve
 *    to an empty list; the panel then shows a polished empty state.
 *
 * This module imports only the area *type* from the help model and has no other
 * runtime dependencies.
 */

import type { HelpArea } from '@/help';

interface RouteRule {
  /** Returns true when this rule owns the given pathname. */
  match: (path: string) => boolean;
  /** Help areas (in display priority) whose entries describe this screen. */
  areas: HelpArea[];
}

const RULES: RouteRule[] = [
  { match: (p) => p === '/', areas: ['dashboard'] },
  { match: (p) => p.startsWith('/contacts'), areas: ['contacts'] },
  { match: (p) => p.startsWith('/conversations'), areas: ['conversations'] },
  { match: (p) => p.startsWith('/opportunities'), areas: ['opportunities'] },
  { match: (p) => p.startsWith('/calendars'), areas: ['calendars'] },
  { match: (p) => p.startsWith('/marketing'), areas: ['marketing'] },
  { match: (p) => p.startsWith('/automations'), areas: ['automations'] },
  { match: (p) => p.startsWith('/reputation'), areas: ['reputation'] },
  { match: (p) => p.startsWith('/reporting'), areas: ['reporting'] },
  // /documents reuses the Payments module, so show both areas' help.
  { match: (p) => p.startsWith('/documents'), areas: ['documents', 'payments'] },
  { match: (p) => p.startsWith('/payments'), areas: ['payments'] },
  { match: (p) => p.startsWith('/phone'), areas: ['phone'] },
  { match: (p) => p.startsWith('/integrations'), areas: ['integrations'] },
  // Tasks live inside the Productivity hub; both areas are instrumented there.
  { match: (p) => p.startsWith('/productivity') || p.startsWith('/tasks'), areas: ['productivity', 'tasks'] },
  { match: (p) => p.startsWith('/media'), areas: ['media'] },
  { match: (p) => p.startsWith('/sites'), areas: ['sites'] },
  { match: (p) => p.startsWith('/settings'), areas: ['settings'] },
  { match: (p) => p.startsWith('/guides'), areas: ['guides'] },
];

/**
 * Resolve the help area(s) for a router pathname. Returns an empty array for
 * routes that have no dedicated help area yet (the panel renders an empty state).
 */
export function resolveHelpAreas(pathname: string): HelpArea[] {
  const rule = RULES.find((r) => r.match(pathname));
  return rule ? rule.areas : [];
}

/**
 * Human-friendly fallback titles for areas. Only used when an area has no
 * `screen`-tier entry to borrow a label from (the help model is the primary
 * source of screen titles). This is presentation labelling, not help copy.
 */
export const AREA_LABEL: Partial<Record<HelpArea, string>> = {
  topbar: 'Top bar',
  sidebar: 'Navigation',
  dashboard: 'Dashboard',
  contacts: 'Contacts',
  conversations: 'Conversations',
  opportunities: 'Opportunities',
  calendars: 'Calendars',
  tasks: 'Tasks',
  automations: 'Automations',
  marketing: 'Marketing',
  reputation: 'Reputation',
  phone: 'Phone',
  payments: 'Payments',
  documents: 'Documents',
  integrations: 'Integrations',
  productivity: 'Productivity',
  media: 'Media',
  sites: 'Sites',
  reporting: 'Reporting',
  settings: 'Settings',
  guides: 'Guides',
};
