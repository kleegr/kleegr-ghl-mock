import type { CustomFieldDefinition } from '@/types';

/* Demo-only catalogs for the Settings sections. All cosmetic / session-only. */

export const CUSTOM_FIELDS: CustomFieldDefinition[] = [
  { id: 'cf_1', name: 'Lead Score', type: 'number', scope: 'contact', folder: 'Lead Details' },
  { id: 'cf_2', name: 'Preferred Channel', type: 'dropdown', scope: 'contact', folder: 'Lead Details', options: ['SMS', 'Email', 'Phone'] },
  { id: 'cf_3', name: 'Service Interest', type: 'text', scope: 'contact', folder: 'Lead Details' },
  { id: 'cf_4', name: 'Budget Range', type: 'dropdown', scope: 'opportunity', folder: 'Deal Details', options: ['< $1k', '$1k-$5k', '$5k+'] },
  { id: 'cf_5', name: 'Referral Source', type: 'text', scope: 'contact', folder: 'Lead Details' },
];

export const CUSTOM_VALUES = [
  { id: 'cv_1', key: 'business.name', value: 'Demo Business' },
  { id: 'cv_2', key: 'business.phone', value: '+1 (555) 010-0100' },
  { id: 'cv_3', key: 'offer.promo_code', value: 'WELCOME20' },
  { id: 'cv_4', key: 'booking.url', value: 'https://book.example.com' },
];

export const ALL_TAGS = [
  'lead', 'hot', 'vip', 'nurture', 'newsletter', 'past-client',
  'no-show', 'consult-booked', 'follow-up', 'new-client',
];
