import {
  LayoutDashboard, MessagesSquare, Calendar, Users, Filter, CreditCard,
  KanbanSquare, Megaphone, Workflow, Star, BarChart3, Bot, GraduationCap,
  Settings, Rocket, PanelsTopLeft, UserRoundCheck, Store, FolderOpen,
  Link2, ClipboardList, TicketCheck, WandSparkles, Smartphone, Sparkles, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  tour: string;
  /** Render a subtle hairline separator above this item (replaces text group labels). */
  dividerBefore?: boolean;
}

/**
 * Flat, GoHighLevel-style sub-account navigation.
 *
 * Mirrors the real portal: a single flat list (no "Grow/Operate/Setup" text
 * group headers — those don't appear in the live sidebar) with subtle hairline
 * separators between logical clusters. Every `path` maps to a real route, so
 * there are no dead links or silent redirects. Settings is intentionally NOT in
 * this list — it is pinned to the bottom of the sidebar via SETTINGS_NAV.
 *
 * The public demo now exposes the same major workspaces as the live Kleegr rail.
 * Less-frequent tools remain reachable by scrolling, matching the compact live
 * navigation instead of grouping them under invented section labels.
 */
export const NAV: NavItem[] = [
  // Order follows the live Kleegr sub-account rail.
  { label: 'Ask AI', path: '/ask-ai', icon: Sparkles, tour: 'nav.askAi' },
  { label: 'Launchpad', path: '/launchpad', icon: Rocket, tour: 'nav.launchpad' },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, tour: 'nav.dashboard' },
  { label: 'Conversations', path: '/conversations', icon: MessagesSquare, tour: 'nav.conversations' },
  { label: 'Calendars', path: '/calendars', icon: Calendar, tour: 'nav.calendars' },
  { label: 'Contacts', path: '/contacts', icon: Users, tour: 'nav.contacts' },
  { label: 'Opportunities', path: '/opportunities', icon: Filter, tour: 'nav.opportunities' },
  { label: 'URLs', path: '/urls', icon: Link2, tour: 'nav.urls' },
  { label: 'Onboardings', path: '/onboardings', icon: ClipboardList, tour: 'nav.onboardings' },
  { label: 'Payments', path: '/payments', icon: CreditCard, tour: 'nav.payments' },
  { label: 'Tasks / Projects', path: '/productivity', icon: KanbanSquare, tour: 'productivity.nav' },
  { label: 'Tickets', path: '/tickets', icon: TicketCheck, tour: 'nav.tickets' },
  { label: 'AI Studio', path: '/ai-studio', icon: WandSparkles, tour: 'nav.aiStudio', dividerBefore: true },
  { label: 'AI Agents', path: '/ai-agents', icon: Bot, tour: 'nav.aiAgents' },
  { label: 'Marketing', path: '/marketing/email', icon: Megaphone, tour: 'nav.marketing' },
  { label: 'Automation', path: '/automations', icon: Workflow, tour: 'nav.automations' },
  { label: 'Sites', path: '/sites', icon: PanelsTopLeft, tour: 'nav.sites' },
  { label: 'Memberships', path: '/memberships', icon: UserRoundCheck, tour: 'nav.memberships' },
  { label: 'Media Storage', path: '/media', icon: FolderOpen, tour: 'nav.media' },
  { label: 'Reputation', path: '/reputation', icon: Star, tour: 'nav.reputation' },
  { label: 'Reporting', path: '/reporting', icon: BarChart3, tour: 'nav.reporting' },
  { label: 'App Marketplace', path: '/integrations', icon: Store, tour: 'nav.integrations' },
  { label: 'Mobile App', path: '/mobile-app', icon: Smartphone, tour: 'nav.mobileApp' },
  { label: 'Guides', path: '/guides', icon: GraduationCap, tour: 'nav.guides' },
];

/** Pinned to the bottom of the sidebar (GHL keeps Settings docked there). */
export const SETTINGS_NAV: NavItem = {
  label: 'Settings', path: '/settings', icon: Settings, tour: 'nav.settings',
};
