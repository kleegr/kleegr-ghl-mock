import {
  Rocket, LayoutDashboard, MessagesSquare, Calendar, Users, Filter, CreditCard,
  CheckSquare, Megaphone, Workflow, LayoutTemplate, MonitorPlay, Star, BarChart3,
  Phone, FolderOpen, Plug, Bot, Wand2, Sparkles, Link as LinkIcon, GraduationCap,
  Settings, type LucideIcon,
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
 */
export const NAV: NavItem[] = [
  // Core CRM
  { label: 'Launchpad', path: '/launchpad', icon: Rocket, tour: 'nav.launchpad' },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, tour: 'nav.dashboard' },
  { label: 'Conversations', path: '/conversations', icon: MessagesSquare, tour: 'nav.conversations' },
  { label: 'Calendars', path: '/calendars', icon: Calendar, tour: 'nav.calendars' },
  { label: 'Contacts', path: '/contacts', icon: Users, tour: 'nav.contacts' },
  { label: 'Opportunities', path: '/opportunities', icon: Filter, tour: 'nav.opportunities' },
  { label: 'Payments', path: '/payments', icon: CreditCard, tour: 'nav.payments' },
  { label: 'Tasks / Projects', path: '/tasks', icon: CheckSquare, tour: 'nav.tasks' },

  // Marketing & growth
  { label: 'Marketing', path: '/marketing/email', icon: Megaphone, tour: 'nav.marketing', dividerBefore: true },
  { label: 'Automation', path: '/automations', icon: Workflow, tour: 'nav.automations' },
  { label: 'Sites', path: '/sites', icon: LayoutTemplate, tour: 'nav.sites' },
  { label: 'Memberships', path: '/memberships', icon: MonitorPlay, tour: 'nav.memberships' },
  { label: 'Reputation', path: '/reputation', icon: Star, tour: 'nav.reputation' },
  { label: 'Reporting', path: '/reporting', icon: BarChart3, tour: 'nav.reporting' },

  // Comms & storage
  { label: 'Phone', path: '/phone', icon: Phone, tour: 'nav.phone', dividerBefore: true },
  { label: 'Media Storage', path: '/media', icon: FolderOpen, tour: 'nav.media' },
  { label: 'App Marketplace', path: '/integrations', icon: Plug, tour: 'nav.integrations' },

  // AI suite (2026)
  { label: 'AI Agents', path: '/ai-agents', icon: Bot, tour: 'nav.aiAgents', dividerBefore: true },
  { label: 'AI Studio', path: '/ai-studio', icon: Wand2, tour: 'nav.aiStudio' },
  { label: 'Ask AI', path: '/ask-ai', icon: Sparkles, tour: 'nav.askAi' },
  { label: 'URLs', path: '/urls', icon: LinkIcon, tour: 'nav.urls' },

  // Learning
  { label: 'Guides', path: '/guides', icon: GraduationCap, tour: 'nav.guides', dividerBefore: true },
];

/** Pinned to the bottom of the sidebar (GHL keeps Settings docked there). */
export const SETTINGS_NAV: NavItem = {
  label: 'Settings', path: '/settings', icon: Settings, tour: 'nav.settings',
};
