/**
 * Placeholder — a lightweight, on-brand demo surface for GoHighLevel sidebar
 * areas that exist in the real portal but are out of scope for the V1 mock
 * (Launchpad, Memberships, the AI suite, URLs).
 *
 * It exists so every nav item resolves to a real, branded route — no dead
 * links, no silent redirects to the Dashboard. It is purely cosmetic and
 * demo-safe: it renders fake/illustrative copy only, makes no network calls,
 * holds no state, and exposes no real PII. Content is keyed off the current
 * route so App.tsx can mount a single <Placeholder /> per path.
 */
import { useLocation, Link } from 'react-router-dom';
import {
  Rocket, MonitorPlay, Bot, Wand2, Sparkles, Link as LinkIcon, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/primitives';

interface PlaceholderDef {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  /** Short, illustrative "what this area does" bullets (demo copy only). */
  points: string[];
  /** A relevant, already-built module to point people toward. */
  cta: { label: string; to: string };
}

const DEFS: Record<string, PlaceholderDef> = {
  '/launchpad': {
    title: 'Launchpad',
    subtitle: 'Your guided setup hub — connect tools and finish onboarding tasks.',
    Icon: Rocket,
    points: [
      'Step-by-step setup checklist for a new sub-account.',
      'Quick links to connect a number, calendar, and payments.',
      'Recommended next actions based on what is left to configure.',
    ],
    cta: { label: 'Open the guided tutorials', to: '/guides' },
  },
  '/memberships': {
    title: 'Memberships',
    subtitle: 'Courses, communities, and client portals.',
    Icon: MonitorPlay,
    points: [
      'Build courses with lessons, drip schedules, and progress tracking.',
      'Host a branded community space for your clients.',
      'Sell access with offers tied to the Payments module.',
    ],
    cta: { label: 'See Payments', to: '/payments' },
  },
  '/ai-agents': {
    title: 'AI Agents',
    subtitle: 'Voice and conversation agents that handle calls and chats.',
    Icon: Bot,
    points: [
      'Voice AI answers missed calls and books appointments.',
      'Conversation AI drafts replies across SMS, email, and webchat.',
      'Hand-off rules route to a human when needed.',
    ],
    cta: { label: 'Go to Conversations', to: '/conversations' },
  },
  '/ai-studio': {
    title: 'AI Studio',
    subtitle: 'Design, test, and tune your AI prompts and workflows.',
    Icon: Wand2,
    points: [
      'Author prompt templates for replies, summaries, and content.',
      'Preview agent behaviour against sample conversations.',
      'Publish prompts into Automation workflows.',
    ],
    cta: { label: 'View Automation', to: '/automations' },
  },
  '/ask-ai': {
    title: 'Ask AI',
    subtitle: 'A workspace assistant for quick answers about your account.',
    Icon: Sparkles,
    points: [
      'Ask natural-language questions about contacts, pipelines, and reports.',
      'Summarize a conversation or draft a follow-up in one click.',
      'Surface the next best action for a lead.',
    ],
    cta: { label: 'Browse Reporting', to: '/reporting' },
  },
  '/urls': {
    title: 'URLs',
    subtitle: 'Branded short links and trigger links with click tracking.',
    Icon: LinkIcon,
    points: [
      'Create short, branded links for campaigns.',
      'Trigger links can fire automations when clicked.',
      'Track clicks and attribute them back to contacts.',
    ],
    cta: { label: 'Open Marketing', to: '/marketing/email' },
  },
};

const FALLBACK: PlaceholderDef = {
  title: 'Coming soon',
  subtitle: 'This area is part of the real portal and is illustrative in the demo.',
  Icon: Sparkles,
  points: ['This screen is a demo placeholder.'],
  cta: { label: 'Back to Dashboard', to: '/' },
};

export function Placeholder() {
  const { pathname } = useLocation();
  const def = DEFS[pathname] ?? FALLBACK;
  const { Icon } = def;

  return (
    <div data-tour="placeholder.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <PageHeader title={def.title} subtitle={def.subtitle} />

      <div className="flex-1 overflow-y-auto p-5">
        <Card className="mx-auto max-w-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon size={26} aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">{def.title}</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">{def.subtitle}</p>
            <span className="mt-3 inline-block rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle ring-1 ring-line">
              Demo placeholder
            </span>
          </div>

          <ul className="mx-auto mt-6 max-w-md space-y-2.5">
            {def.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex justify-center">
            <Link
              to={def.cta.to}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-brand/90"
            >
              {def.cta.label}
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
