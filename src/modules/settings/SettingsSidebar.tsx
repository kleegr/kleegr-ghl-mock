import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bell, Building2, Calendar, ChevronsUpDown, CircleDollarSign,
  Code2, Database, FileUp, GitBranch, Globe2, Mail, MessageCircle, Palette,
  Phone, Plug, Search, Settings as SettingsIcon, ShieldCheck, Sliders,
  Sparkles, Tag, UserCircle, Users, Webhook, type LucideIcon,
} from 'lucide-react';
import { cx } from '@/utils';

interface SectionLink {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SectionGroup {
  id: string;
  label: string;
  items: SectionLink[];
}

export const SETTINGS_GROUPS: SectionGroup[] = [
  {
    id: 'business',
    label: 'My Business',
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2 },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
      { id: 'billing', label: 'Billing', icon: CircleDollarSign },
      { id: 'staff', label: 'My Staff', icon: Users },
      { id: 'pipelines', label: 'Opportunities & Pipelines', icon: GitBranch },
    ],
  },
  {
    id: 'services',
    label: 'Business Services',
    items: [
      { id: 'calendars', label: 'Calendars', icon: Calendar },
      { id: 'email-services', label: 'Email Services', icon: Mail },
      { id: 'phones', label: 'Phone System', icon: Phone },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    ],
  },
  {
    id: 'other',
    label: 'Other Settings',
    items: [
      { id: 'objects', label: 'Objects', icon: Database },
      { id: 'custom-fields', label: 'Custom Fields', icon: Sliders },
      { id: 'custom-values', label: 'Custom Values', icon: Code2 },
      { id: 'import', label: 'Import Data', icon: FileUp },
      { id: 'scoring', label: 'Manage Scoring', icon: Sparkles },
      { id: 'domains', label: 'Domains & URL Redirects', icon: Globe2 },
      { id: 'tracking', label: 'External Tracking', icon: Webhook },
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'private-integrations', label: 'Private Integrations', icon: ShieldCheck },
      { id: 'providers', label: 'Conversation Providers', icon: MessageCircle },
      { id: 'tags', label: 'Tags', icon: Tag },
      { id: 'labs', label: 'Labs', icon: Sparkles, badge: 'New' },
      { id: 'audit', label: 'Audit Logs', icon: Bell },
      { id: 'brands', label: 'Brand Boards', icon: Palette },
    ],
  },
];

interface SettingsSidebarProps {
  onNavigate?: () => void;
}

export function SettingsSidebar({ onNavigate }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const params = useParams<{ section?: string }>();
  const active = params.section ?? 'business';
  const [query, setQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return SETTINGS_GROUPS;
    return SETTINGS_GROUPS
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(needle)) }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const go = (id: string) => {
    navigate(`/settings/${id}`);
    onNavigate?.();
  };

  return (
    <aside
      className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-sidebar bg-gradient-to-b from-[rgb(var(--sidebar-from))] via-[rgb(var(--sidebar-via))] to-[rgb(var(--sidebar-to))] text-white"
      aria-label="Settings navigation"
      data-tour="settings.nav"
    >
      <div className="flex h-16 shrink-0 items-center px-3.5">
        <img src="/kleegr-logo.svg" alt="Kleegr" className="h-[27px] w-auto max-w-[128px] select-none object-contain object-left" draggable={false}/>
      </div>

      <div className="shrink-0 space-y-1.5 px-2 pb-2.5">
        <div className="relative">
          <button onClick={() => setAccountOpen((open) => !open)} className="flex h-[43px] w-full items-center gap-2 rounded-[5px] border border-white/20 bg-[#0aafd0] px-2 text-left shadow-sm" aria-expanded={accountOpen}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/15"><Building2 size={14}/></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold leading-[15px]">Kleegr Demo Account</span><span className="block truncate text-[10px] leading-[13px] text-white/75">Demo Business</span></span>
            <ChevronsUpDown size={13} className="text-white/80"/>
          </button>
          {accountOpen ? <div className="absolute inset-x-0 top-full z-40 mt-1 rounded-lg border border-line bg-surface p-3 text-xs text-ink shadow-pop"><p className="font-semibold">Kleegr Demo Account</p><p className="mt-1 text-ink-muted">Fictional public demo data</p></div> : null}
        </div>
        <div className="flex gap-1.5">
          <label className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-[5px] border border-white/15 bg-[#069fc3]/80 px-2.5 text-white/90">
            <Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-white/70"/>
          </label>
          <button aria-label="Settings shortcuts" className="grid h-[34px] w-[34px] place-items-center rounded-[5px] border border-white/15 bg-[#069fc3]/80 text-white/90"><SettingsIcon size={14}/></button>
        </div>
      </div>

      <button onClick={() => { navigate('/'); onNavigate?.(); }} className="mx-2 flex h-9 shrink-0 items-center gap-2 rounded-[5px] bg-[#55c0e5] px-3 text-left text-[12px] font-semibold text-white" data-tour="settings.back"><ArrowLeft size={14}/> Go Back</button>
      <div className="flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-semibold"><SettingsIcon size={15}/> Settings</div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-5 [scrollbar-color:rgba(255,255,255,.3)_transparent] [scrollbar-width:thin]" aria-label="Settings sections">
        {groups.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="px-2.5 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-[0.11em] text-white/55">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <button key={item.id} onClick={() => go(item.id)} aria-current={selected ? 'page' : undefined} className={cx('flex min-h-[33px] w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] transition-colors', selected ? 'bg-[#55c0e5] font-semibold text-white' : 'text-white/82 hover:bg-white/10 hover:text-white')}>
                  <Icon size={14} className="shrink-0"/><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.badge ? <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[8px] font-bold text-amber-950">{item.badge}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
        {groups.length === 0 ? <p className="px-3 py-6 text-center text-xs text-white/60">No settings match “{query.trim()}”.</p> : null}
      </nav>
    </aside>
  );
}
