import { useLocation, Link } from 'react-router-dom';
import {
  Rocket, Sparkles, Wand2, Bot, Award, Store, MessageCircle, Link2,
  Construction, ArrowLeft, type LucideIcon,
} from 'lucide-react';

/**
 * Demo-safe placeholder for shell nav entries that don't (yet) have a full
 * module. Keeps every sidebar link routable — no dead links, no silent
 * redirect to the dashboard. Module work for these belongs to the module dev.
 */
interface PlaceholderMeta {
  title: string;
  blurb: string;
  Icon: LucideIcon;
}

const META: Record<string, PlaceholderMeta> = {
  '/launchpad': { title: 'Launchpad', blurb: 'Your guided setup checklist and quick actions live here.', Icon: Rocket },
  '/ask-ai': { title: 'Ask AI', blurb: 'Ask questions about your account and let AI draft replies, summaries and tasks.', Icon: Sparkles },
  '/ai-studio': { title: 'AI Studio', blurb: 'Build and tune AI prompts, voices and content workflows.', Icon: Wand2 },
  '/ai-agents': { title: 'AI Agents', blurb: 'Configure conversational agents that handle calls and chats for you.', Icon: Bot },
  '/memberships': { title: 'Memberships', blurb: 'Courses, communities and member portals for your audience.', Icon: Award },
  '/kleegr-wa': { title: 'Kleegr WA', blurb: 'WhatsApp messaging, templates and broadcast tools.', Icon: MessageCircle },
  '/urls': { title: 'URLs', blurb: 'Branded short links and trigger links with click tracking.', Icon: Link2 },
  '/app-marketplace': { title: 'App Marketplace', blurb: 'Discover and install apps that extend your workspace.', Icon: Store },
};

export function Placeholder() {
  const { pathname } = useLocation();
  const meta = META[pathname] ?? {
    title: 'Coming soon',
    blurb: 'This area is part of the demo shell.',
    Icon: Construction,
  };
  const { title, blurb, Icon } = meta;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ai-soft text-ai">
          <Icon size={26} aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{blurb}</p>
        <span className="mt-4 inline-block rounded-full bg-surface-sunken px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          Demo placeholder
        </span>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-muted hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
