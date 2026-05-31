/**
 * Conversations utilities — channel metadata, inbox filter tabs, composer
 * channel options, and thread date-grouping helpers.
 *
 * Screenshot-fidelity note: the left inbox uses GHL's "Team Inbox" tabs
 * (Unread · All · Recents · Starred) rather than per-channel tabs; channel is
 * surfaced as a small badge overlapping each avatar instead.
 */
import {
  MessageSquare,
  Mail,
  Globe,
  Phone,
  Facebook,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import type { Channel } from '@/types';

/** Human label per channel (kept exported for backwards-compat). */
export const CHANNEL_LABEL: Record<Channel, string> = {
  sms: 'SMS',
  email: 'Email',
  webchat: 'Live Chat',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  call: 'Call',
};

/** Rich per-channel metadata used to render the small avatar badge + headers. */
export interface ChannelMeta {
  label: string;
  Icon: React.ElementType;
  /** Tailwind classes for the small circular badge that overlaps the avatar. */
  badge: string;
}

export const CHANNEL_META: Record<Channel, ChannelMeta> = {
  sms: { label: 'SMS', Icon: MessageSquare, badge: 'bg-[#e0ecff] text-[#2563eb]' },
  email: { label: 'Email', Icon: Mail, badge: 'bg-[#eef2f6] text-[#5b6b7c]' },
  webchat: { label: 'Live Chat', Icon: Globe, badge: 'bg-[#e7f7ef] text-[#12986b]' },
  facebook: { label: 'Facebook', Icon: Facebook, badge: 'bg-[#e6efff] text-[#1877f2]' },
  instagram: { label: 'Instagram', Icon: Instagram, badge: 'bg-[#fdeaf3] text-[#c13584]' },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle, badge: 'bg-[#dcf8e8] text-[#1faf55]' },
  call: { label: 'Call', Icon: Phone, badge: 'bg-[#ede9fe] text-[#7c3aed]' },
};

// -- Inbox filter tabs (Team Inbox) -----------------------------------------

export type ConvFilter = 'unread' | 'all' | 'recents' | 'starred';

export const FILTER_TABS: { id: ConvFilter; label: string }[] = [
  { id: 'unread', label: 'Unread' },
  { id: 'all', label: 'All' },
  { id: 'recents', label: 'Recents' },
  { id: 'starred', label: 'Starred' },
];

// -- Module sub-navigation (visual GHL tabs) --------------------------------

export const SUBNAV_TABS = [
  'Conversations',
  'Manual Actions',
  'Snippets',
  'Trigger Links',
  'Analytics',
  'Settings',
] as const;
export type SubNavTab = (typeof SUBNAV_TABS)[number];

// -- Composer channel options (mirrors the channel dropdown) ----------------

export interface ComposerChannelOption {
  /** Stable identifier for the menu (the underlying `id` may repeat across
   *  cosmetic WhatsApp variants, so selection keys off this instead). */
  key: string;
  /** Underlying delivery channel the reply routes through. */
  id: Channel;
  label: string;
  Icon: React.ElementType;
  /** Email-style composer surfaces From / From Name / Subject / CC-BCC. */
  kind: 'sms' | 'email' | 'whatsapp';
  /** Render a thin separator above this option (mirrors the GHL menu). */
  dividerBefore?: boolean;
}

/**
 * Channel dropdown options mirroring GHL's composer menu (img 11):
 * `SMS · WhatsApp · Email · — · Whatsapp Send Only · Kleegr Whatsapp`.
 * The last two are demo-only WhatsApp variants (cosmetic); all replies still
 * route through the conversation's own channel via the store.
 */
export const COMPOSER_CHANNELS: ComposerChannelOption[] = [
  { key: 'sms', id: 'sms', label: 'SMS', Icon: MessageSquare, kind: 'sms' },
  { key: 'whatsapp', id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, kind: 'whatsapp' },
  { key: 'email', id: 'email', label: 'Email', Icon: Mail, kind: 'email' },
  { key: 'wa-send-only', id: 'whatsapp', label: 'Whatsapp Send Only', Icon: MessageCircle, kind: 'whatsapp', dividerBefore: true },
  { key: 'kleegr-wa', id: 'whatsapp', label: 'Kleegr Whatsapp', Icon: MessageCircle, kind: 'whatsapp' },
];

// -- Thread date grouping ---------------------------------------------------

/** A friendly day label used by the thread date-separator pills. */
export function threadDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/** Stable YYYY-MM-DD key for grouping messages by calendar day. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
