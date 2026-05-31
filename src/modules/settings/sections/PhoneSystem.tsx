import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Tabs } from '@/components/ui/primitives';
import { ManageNumbers } from './phone/ManageNumbers';
import { MessagingCompliance } from './phone/MessagingCompliance';
import { VoiceSettings, TrustCenter, AdditionalSettings } from './phone/OtherTabs';

/**
 * Settings → Phone Numbers (Phone System hub).
 *
 * GoHighLevel-style phone hub: a top tab bar (Phone Numbers · Messaging ·
 * Voice · Trust Center · Additional Settings), a persistent A2P/compliance
 * banner, and the active tab's content. Each tab is its own component under
 * ./phone. Everything is local state + demo-safe.
 */

const TABS = [
  { id: 'numbers', label: 'Phone Numbers' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'voice', label: 'Voice' },
  { id: 'trust', label: 'Trust Center' },
  { id: 'additional', label: 'Additional Settings' },
];

export function PhoneSection() {
  const [tab, setTab] = useState('numbers');

  return (
    <div data-tour="settings.configSection" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Phone System</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Manage numbers, messaging compliance, voice, and trust settings for your account.
          </p>
        </div>
      </div>

      {/* Compliance banner */}
      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft/40 px-4 py-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink">A2P 10DLC messaging is registered</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Your brand and campaign are approved for application-to-person SMS. Review messaging compliance under the
            Messaging tab. This is a demo account — no live carrier connection is active.
          </p>
        </div>
      </div>

      {/* Top tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Active tab */}
      {tab === 'numbers' && <ManageNumbers />}
      {tab === 'messaging' && <MessagingCompliance />}
      {tab === 'voice' && <VoiceSettings />}
      {tab === 'trust' && <TrustCenter />}
      {tab === 'additional' && <AdditionalSettings />}
    </div>
  );
}
