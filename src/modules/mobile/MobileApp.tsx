import { useState } from 'react';
import {
  Apple,
  Bell,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  MessageCircle,
  Palette,
  Play,
  Settings2,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { useStore } from '@/store/useStore';

const QR_BLOCKS = [
  0, 1, 2, 4, 6, 7, 8, 9, 12, 14, 16, 18, 19, 20, 22, 24, 25, 26,
  28, 29, 31, 33, 35, 37, 39, 40, 42, 43, 45, 47, 48, 49, 52, 54, 56,
  58, 60, 61, 62, 64, 66, 67, 69, 70, 72, 74, 76, 78, 80,
];

function StoreBadge({ platform, onClick }: { platform: 'ios' | 'android'; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Preview ${platform === 'ios' ? 'Apple App Store' : 'Google Play'} download`} className="flex h-12 min-w-[158px] items-center gap-3 rounded-lg bg-black px-4 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5">
      {platform === 'ios' ? <Apple size={25} fill="currentColor" /> : <Play size={23} fill="currentColor" />}
      <span><span className="block text-[9px] leading-none">{platform === 'ios' ? 'Download on the' : 'GET IT ON'}</span><span className="mt-0.5 block text-[15px] font-semibold leading-none">{platform === 'ios' ? 'App Store' : 'Google Play'}</span></span>
    </button>
  );
}

function FauxQrCode() {
  return (
    <div className="grid h-28 w-28 grid-cols-9 gap-[2px] rounded-xl border-[7px] border-white bg-white p-1 shadow-md" aria-label="Demo QR code">
      {Array.from({ length: 81 }, (_, index) => <span key={index} className={QR_BLOCKS.includes(index) ? 'bg-[#082d68]' : 'bg-white'} />)}
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="relative mx-auto h-[430px] w-[214px] rounded-[34px] border-[7px] border-[#17202c] bg-white p-2 shadow-2xl">
      <div className="absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-[#17202c]" />
      <div className="h-full overflow-hidden rounded-[23px] bg-[#f3f7fa]">
        <div className="bg-gradient-to-br from-[#073777] to-[#05b7d4] px-4 pb-5 pt-8 text-white">
          <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold tracking-wide">kleegr</span><Bell size={13} /></div>
          <p className="mt-5 text-[9px] text-white/70">Good afternoon</p>
          <p className="text-sm font-semibold">Demo Workspace</p>
        </div>
        <div className="-mt-2 grid grid-cols-2 gap-2 px-3">
          {[['24', 'New leads'], ['8', 'Appointments'], ['$18k', 'Pipeline'], ['4.9', 'Reputation']].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-white p-2 shadow-sm"><p className="text-sm font-bold text-[#0a3b77]">{value}</p><p className="text-[7px] text-slate-500">{label}</p></div>
          ))}
        </div>
        <div className="px-3 pt-4"><p className="text-[9px] font-semibold text-slate-700">Recent activity</p>{['New appointment booked', 'Opportunity moved to Won', 'Review request delivered'].map((item, index) => <div key={item} className="mt-2 flex gap-2 rounded-lg bg-white p-2 shadow-sm"><span className={`grid h-6 w-6 place-items-center rounded-full ${index === 0 ? 'bg-cyan-100 text-cyan-700' : index === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>{index === 0 ? <Users size={11} /> : index === 1 ? <Check size={11} /> : <MessageCircle size={11} />}</span><span className="text-[7px] font-medium text-slate-600">{item}</span></div>)}</div>
        <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-xl bg-white py-2 shadow-lg">{[Smartphone, MessageCircle, Users, Settings2].map((Icon, index) => <Icon key={index} size={13} className={index === 0 ? 'text-cyan-500' : 'text-slate-400'} />)}</div>
      </div>
    </div>
  );
}

export function MobileApp() {
  const pushToast = useStore((state) => state.pushToast);
  const [accent, setAccent] = useState('#14b8d4');

  function copyLink(platform: string) {
    pushToast({ title: `${platform} link copied`, description: 'This demo uses a fictional download link.', variant: 'success' });
  }

  return (
    <div data-tour="mobile-app.page" className="h-full min-h-0 overflow-y-auto bg-[#f4f7fa] px-8 pb-10 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Mobile App</h1><p className="mt-1 text-sm text-ink-muted">Give your team everything they need to work from anywhere.</p></div>
        <Button variant="secondary" onClick={() => pushToast({ title: 'Preview refreshed', description: 'Mobile app preview updated.', variant: 'success' })}><Sparkles size={16} className="text-ai" /> Refresh preview</Button>
      </div>

      <Card className="relative overflow-hidden border-[#dbe1e9] px-7 py-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-100/60 blur-2xl" />
        <div className="relative flex items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600"><MessageCircle size={14} /> Kleegr mobile</span>
            <h2 className="mt-4 text-[26px] font-semibold tracking-[-0.02em] text-ink">Your business, right in your pocket</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">Manage leads, appointments, opportunities, reviews, and team activity from the Kleegr app.</p>
            <div className="mt-6 flex flex-wrap gap-3"><StoreBadge platform="ios" onClick={() => pushToast({ title: 'Apple App Store', description: 'Store downloads are disabled in this public demo.', variant: 'info' })} /><StoreBadge platform="android" onClick={() => pushToast({ title: 'Google Play', description: 'Store downloads are disabled in this public demo.', variant: 'info' })} /></div>
          </div>
          <FauxQrCode />
        </div>
        <div className="relative mt-8 flex items-center gap-3 rounded-full border border-line bg-white px-3 py-2 shadow-sm">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500 text-white"><MessageCircle size={17} /></span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-orange-400 via-fuchsia-500 to-purple-500" /></div>
          <span className="text-xs font-semibold text-ink-muted">3 of 4 steps complete</span><Sparkles size={18} className="text-orange-500" />
        </div>
      </Card>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_1.05fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Share the mobile app</h2><p className="mt-1 text-sm text-ink-muted">Send the right download link to each team member.</p>
            <div className="mt-5 divide-y divide-line rounded-lg border border-line">
              {[{ label: 'Apple App Store', icon: Apple }, { label: 'Google Play Store', icon: Play }].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-4"><span className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white"><Icon size={20} fill="currentColor" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{label}</p><p className="truncate text-xs text-ink-subtle">kleegr.example/mobile/download</p></div><Button variant="secondary" size="sm" onClick={() => copyLink(label)}><LinkIcon size={14} /> Copy link</Button></div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Palette size={20} /></span><div><h2 className="text-lg font-semibold text-ink">App appearance</h2><p className="text-sm text-ink-muted">Preview your Kleegr colors and welcome message.</p></div></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-muted">App name<input value="Kleegr" readOnly className="mt-1.5 h-10 w-full rounded-md border border-line bg-surface px-3 text-sm font-normal text-ink" /></label><label className="text-xs font-semibold text-ink-muted">Accent color<div className="mt-1.5 flex h-10 items-center gap-2 rounded-md border border-line px-3"><input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-6 w-7 border-0 bg-transparent" /><span className="font-mono text-xs font-normal text-ink-muted">{accent.toUpperCase()}</span></div></label></div>
          </Card>
        </div>

        <Card className="overflow-hidden p-6">
          <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-ink">Live preview</h2><p className="mt-1 text-sm text-ink-muted">A fictional preview of the Kleegr team experience.</p></div><Button variant="ghost" size="sm" onClick={() => pushToast({ title: 'Mobile preview', description: 'The interactive preview is shown directly in this demo.', variant: 'info' })}><ExternalLink size={14} /> Open preview</Button></div>
          <div className="mt-5 grid min-h-[474px] place-items-center rounded-xl bg-gradient-to-br from-[#eef8fb] via-[#f5f2fb] to-[#f7f9fb] p-6"><PhonePreview /></div>
          <button type="button" onClick={() => pushToast({ title: 'Mobile app settings', description: 'Settings are read-only in the public demo.', variant: 'info' })} className="mt-4 flex w-full items-center justify-between rounded-lg border border-line px-4 py-3 text-left hover:bg-surface-sunken"><span><span className="block text-sm font-semibold text-ink">Mobile app settings</span><span className="block text-xs text-ink-muted">Notifications, permissions, and team access</span></span><ChevronRight size={17} className="text-ink-subtle" /></button>
        </Card>
      </div>
    </div>
  );
}
