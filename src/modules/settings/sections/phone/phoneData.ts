/* phone/phoneData.ts — demo-only catalogs for the Phone System hub.
 * Numbers mirror the seeded phoneNumbers but carry extra display-only fields
 * (forwarding, timeout, A2P status, owner) that the settings table/modal need.
 * Nothing here is persisted or sent anywhere. No real phone numbers. */

export type A2PStatus = 'registered' | 'pending' | 'not_registered';

export interface PhoneRow {
  id: string;
  number: string;
  friendlyName: string;
  type: 'local' | 'toll_free';
  status: 'active' | 'inactive' | 'porting';
  /** Human label for where inbound calls land. */
  forwardTo: string;
  /** Ring timeout in seconds before falling back to voicemail. */
  timeout: number;
  recordCalls: boolean;
  isDefault: boolean;
  a2p: A2PStatus;
  createdAt: string;
  owner: string;
}

export const INITIAL_NUMBERS: PhoneRow[] = [
  {
    id: 'ph_1',
    number: '+1 (555) 400-1100',
    friendlyName: 'Main Line',
    type: 'local',
    status: 'active',
    forwardTo: 'Demo User',
    timeout: 25,
    recordCalls: true,
    isDefault: true,
    a2p: 'registered',
    createdAt: '2025-01-12T00:00:00.000Z',
    owner: 'Demo User',
  },
  {
    id: 'ph_2',
    number: '+1 (555) 400-1101',
    friendlyName: 'Toll-Free Support',
    type: 'toll_free',
    status: 'active',
    forwardTo: 'Support Team',
    timeout: 30,
    recordCalls: true,
    isDefault: false,
    a2p: 'registered',
    createdAt: '2025-02-03T00:00:00.000Z',
    owner: 'Demo User',
  },
  {
    id: 'ph_3',
    number: '+1 (555) 400-1102',
    friendlyName: 'Sales Line',
    type: 'local',
    status: 'active',
    forwardTo: 'Sales IVR menu',
    timeout: 20,
    recordCalls: false,
    isDefault: false,
    a2p: 'pending',
    createdAt: '2025-03-21T00:00:00.000Z',
    owner: 'Priya Raman',
  },
];

/** Where inbound calls can be routed (Basic Details → "Calls go to"). */
export const ROUTE_TARGETS: { value: string; label: string }[] = [
  { value: 'ring_user', label: 'Ring a user' },
  { value: 'ring_team', label: 'Ring a team' },
  { value: 'ivr', label: 'IVR / call menu' },
  { value: 'voice_ai', label: 'Voice AI agent' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'external', label: 'External number' },
];

/** Demo users/teams a call can ring. */
export const RING_TARGETS = [
  'Demo User',
  'Priya Raman',
  'Marcus Bell',
  'Sales Team',
  'Support Team',
];

export const TIMEOUT_OPTIONS = [15, 20, 25, 30, 45, 60];

export const a2pLabel = (s: A2PStatus) =>
  s === 'registered' ? 'A2P Registered' : s === 'pending' ? 'A2P Pending' : 'A2P Not Registered';

export const a2pTone = (s: A2PStatus): 'good' | 'warn' | 'neutral' =>
  s === 'registered' ? 'good' : s === 'pending' ? 'warn' : 'neutral';
