/**
 * Public entry point for the contextual help UI layer.
 *
 * AppShell mounts <HelpProvider /> and that pulls in everything else. The
 * individual surfaces and the route→area helper are re-exported for reuse and
 * testing, but app code should generally only need HelpProvider.
 */
export { HelpProvider } from './HelpProvider';
export { HelpBadgeLayer } from './HelpBadgeLayer';
export { HelpPopover } from './HelpPopover';
export { HelpPanel } from './HelpPanel';
export { resolveHelpAreas, AREA_LABEL } from './helpRoutes';
