import {
  LayoutDashboard, MessagesSquare, Users, Filter, Calendar, Megaphone,
  Workflow, LayoutTemplate, Star, BarChart3, CreditCard, Phone, CheckSquare,
  Plug, FolderOpen, Settings, GraduationCap, Rocket, Sparkles, Wand2, Bot,
  Award, Store, MessageCircle, Link2, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  tour: string;
  /** Subtle separator rendered above this item (no text label). */
  dividerBefore?: boolean;
}

// Kleegr-style flat nav (no text group labels, mirroring the real portal).
// Every `path` maps to a real route in App.tsx — primary modules or a
// lightweight demo placeholder — so there are never dead links.
export const NAV: NavItem[] = [
  { label: 'Launchpad', path: '/launchpad', icon: Rocket, tour: 'nav.launchpad' },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, tour: 'nav.dashboard' },
  { label: 'Conversations', path: '/conversations', icon: MessagesSquare, tour: 'nav.conversations' },
  { label: 'Calendars', path: '/calendars', icon: Calendar, tour: 'nav.calendars' },
  { label: 'Contacts', path: '/contacts', icon: Users, tour: 'nav.contacts' },
  { label: 'Opportunities', path: '/opportunities', icon: Filter, tour: 'nav.opportunities' },
  { label: 'Payments', path: '/payments', icon: CreditCard, tour: 'nav.payments' },
  { label: 'Tasks / Projects', path: '/tasks', icon: CheckSquare, tour: 'nav.tasks' },
  { label: 'Ask AI', path: '/ask-ai', icon: Sparkles, tour: 'nav.askAi', dividerBefore: true },

  { label: 'Marketing', path: '/marketing/email', icon: Megaphone, tour: 'nav.marketing', dividerBefore: true },
  { label: 'Automation', path: '/automations', icon: Workflow, tour: 'nav.automations' },
  { label: 'AI Studio', path: '/ai-studio', icon: Wand2, tour: 'nav.aiStudio' },
  { label: 'AI Agents', path: '/ai-agents', icon: Bot, tour: 'nav.aiAgents' },
  { label: 'Sites', path: '/sites', icon: LayoutTemplate, tour: 'nav.sites' },
  { label: 'Memberships', path: '/memberships', icon: Award, tour: 'nav.memberships' },
  { label: 'Reputation', path: '/reputation', icon: Star, tour: 'nav.reputation' },
  { label: 'Kleegr WA', path: '/kleegr-wa', icon: MessageCircle, tour: 'nav.kleegrWa' },

  { label: 'Reporting', path: '/reporting', icon: BarChart3, tour: 'nav.reporting', dividerBefore: true },
  { label: 'Phone', path: '/phone', icon: Phone, tour: 'nav.phone' },
  { label: 'Media Storage', path: '/media', icon: FolderOpen, tour: 'nav.media' },
  { label: 'URLs', path: '/urls', icon: Link2, tour: 'nav.urls' },
  { label: 'App Marketplace', path: '/app-marketplace', icon: Store, tour: 'nav.marketplace' },

  { label: 'Integrations', path: '/integrations', icon: Plug, tour: 'nav.integrations', dividerBefore: true },
  { label: 'Settings', path: '/settings', icon: Settings, tour: 'nav.settings' },
  { label: 'Guides', path: '/guides', icon: GraduationCap, tour: 'nav.guides' },
];
