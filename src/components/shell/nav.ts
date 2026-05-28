import {
  LayoutDashboard, MessagesSquare, Users, Filter, Calendar, Megaphone,
  Workflow, LayoutTemplate, Star, BarChart3, CreditCard, Phone, CheckSquare,
  Plug, FolderOpen, Settings, GraduationCap, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  tour: string;
  group?: string;
}

// GHL-style grouped nav. `group` headers separate the rail into sections.
export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, tour: 'nav.dashboard' },
  { label: 'Conversations', path: '/conversations', icon: MessagesSquare, tour: 'nav.conversations' },
  { label: 'Contacts', path: '/contacts', icon: Users, tour: 'nav.contacts' },
  { label: 'Opportunities', path: '/opportunities', icon: Filter, tour: 'nav.opportunities' },
  { label: 'Calendars', path: '/calendars', icon: Calendar, tour: 'nav.calendars' },

  { label: 'Marketing', path: '/marketing/email', icon: Megaphone, tour: 'nav.marketing', group: 'Grow' },
  { label: 'Automations', path: '/automations', icon: Workflow, tour: 'nav.automations' },
  { label: 'Sites', path: '/sites', icon: LayoutTemplate, tour: 'nav.sites' },
  { label: 'Reputation', path: '/reputation', icon: Star, tour: 'nav.reputation' },

  { label: 'Reporting', path: '/reporting', icon: BarChart3, tour: 'nav.reporting', group: 'Operate' },
  { label: 'Payments', path: '/payments', icon: CreditCard, tour: 'nav.payments' },
  { label: 'Phone', path: '/phone', icon: Phone, tour: 'nav.phone' },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare, tour: 'nav.tasks' },

  { label: 'Integrations', path: '/integrations', icon: Plug, tour: 'nav.integrations', group: 'Setup' },
  { label: 'Media', path: '/media', icon: FolderOpen, tour: 'nav.media' },
  { label: 'Settings', path: '/settings', icon: Settings, tour: 'nav.settings' },
  { label: 'Guides', path: '/guides', icon: GraduationCap, tour: 'nav.guides' },
];
