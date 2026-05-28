/**
 * Conversations utilities — channel labels, filter types, tab config.
 * Shared between Conversations.tsx and future tutorial configs.
 */
import type { Channel } from '@/types';

export const CHANNEL_LABEL: Record<Channel, string> = {
  sms: 'SMS',
  email: 'Email',
  webchat: 'Chat',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  call: 'Call',
};

export type ConvFilter = 'all' | 'unread' | Channel;

export const FILTER_TABS: { id: ConvFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
  { id: 'webchat', label: 'Chat' },
  { id: 'call', label: 'Calls' },
];
