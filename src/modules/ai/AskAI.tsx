import { useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  Clock3,
  Lightbulb,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ModuleHeader, type ModuleHeaderTab } from '@/components/shell/ModuleHeader';
import { Button, Card } from '@/components/ui/primitives';
import { cx } from '@/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  body: string;
}

const TABS: ModuleHeaderTab[] = [
  { id: 'assistant', label: 'Assistant' },
  { id: 'saved', label: 'Saved Insights', count: 3 },
];

const HISTORY = [
  { title: 'Pipeline summary', time: '12 min ago' },
  { title: 'Appointments this week', time: 'Yesterday' },
  { title: 'Campaign performance', time: 'Sep 3' },
  { title: 'Lead follow-up ideas', time: 'Aug 31' },
];

const PROMPTS = [
  { icon: TrendingUp, title: 'Summarize my pipeline', body: 'What changed this week and where should I focus?' },
  { icon: CalendarDays, title: 'Review appointments', body: 'Show confirmed appointments and likely gaps.' },
  { icon: Users, title: 'Find leads to follow up', body: 'Identify fictional demo contacts needing attention.' },
  { icon: BarChart3, title: 'Explain performance', body: 'Turn the dashboard numbers into clear next steps.' },
];

const SAVED = [
  { title: 'Weekly sales pulse', body: 'A reusable view of pipeline movement, wins, and stalled opportunities.', updated: 'Updated today' },
  { title: 'Appointment health check', body: 'Booking volume, show rates, cancellations, and calendar capacity.', updated: 'Updated yesterday' },
  { title: 'Lead response watchlist', body: 'New leads that have not received a follow-up within one business day.', updated: 'Updated Sep 3' },
];

function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-8">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ai to-brand text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,.55)]"><Sparkles size={22} /></span>
        <h2 className="mt-4 text-[27px] font-bold tracking-[-0.04em] text-ink">How can I help today?</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-ink-muted">Ask about your fictional demo contacts, appointments, opportunities, and reporting. Ask AI keeps the answer focused and actionable.</p>
      </div>
      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
        {PROMPTS.map(({ icon: Icon, title, body }) => (
          <button key={title} type="button" onClick={() => onPrompt(title)} className="group rounded-xl border border-line bg-surface p-3.5 text-left shadow-card transition hover:border-ai/35 hover:shadow-pop">
            <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai"><Icon size={15} /></span><span><span className="block text-xs font-semibold text-ink group-hover:text-ai">{title}</span><span className="mt-0.5 block text-[10px] leading-relaxed text-ink-muted">{body}</span></span></div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Chat({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-6 py-7">
      {messages.map((message) => (
        <div key={message.id} className={cx('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
          {message.role === 'assistant' ? <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-ai to-brand text-white"><Sparkles size={15} /></span> : null}
          <div className={cx('max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed', message.role === 'user' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-line bg-surface text-ink shadow-card')}>{message.body}</div>
        </div>
      ))}
      <Card className="ml-11 overflow-hidden border-ai/15">
        <div className="border-b border-line px-4 py-2.5"><p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><Lightbulb size={14} className="text-warn" /> Suggested next actions</p></div>
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {['Open stalled opportunities', 'Review today’s calendar', 'Draft a follow-up plan'].map((action) => <button key={action} type="button" className="bg-surface px-3 py-3 text-left text-[10px] font-medium text-brand hover:bg-brand-soft/45">{action}</button>)}
        </div>
      </Card>
    </div>
  );
}

function SavedInsights() {
  return (
    <div className="mx-auto max-w-5xl p-5">
      <div className="mb-4"><h2 className="text-xl font-bold text-ink">Saved Insights</h2><p className="text-xs text-ink-muted">Return to questions and summaries you check regularly.</p></div>
      <div className="grid gap-3 md:grid-cols-3">
        {SAVED.map((item, index) => <Card key={item.title} className="p-4"><span className={cx('grid h-9 w-9 place-items-center rounded-lg', index === 0 ? 'bg-ai-soft text-ai' : 'bg-brand-soft text-brand')}>{index === 0 ? <TrendingUp size={17} /> : index === 1 ? <CalendarDays size={17} /> : <Users size={17} />}</span><p className="mt-4 text-sm font-bold text-ink">{item.title}</p><p className="mt-1 min-h-12 text-[11px] leading-relaxed text-ink-muted">{item.body}</p><div className="mt-4 flex items-center justify-between border-t border-line pt-3"><span className="flex items-center gap-1 text-[10px] text-ink-subtle"><Clock3 size={11} />{item.updated}</span><button type="button" className="text-[11px] font-semibold text-brand">Open</button></div></Card>)}
      </div>
    </div>
  );
}

export function AskAI() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const submit = (preset?: string) => {
    const prompt = (preset ?? input).trim();
    if (!prompt) return;
    const submittedAt = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${submittedAt}`, role: 'user', body: prompt },
      {
        id: `assistant-${submittedAt}`,
        role: 'assistant',
        body: 'Your fictional demo pipeline has 12 open opportunities worth $84,600. Three opportunities have had no activity in seven days, while four are positioned to close this week. I would focus first on the two high-value proposals awaiting a response, then follow up with the new leads assigned yesterday.',
      },
    ]);
    setInput('');
  };

  const newChat = () => {
    setMessages([]);
    setActiveTab('assistant');
  };

  return (
    <div data-tour="askAi.page" className="flex h-full min-h-0 flex-col bg-surface-sunken">
      <ModuleHeader title="Ask AI" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} actions={<span className="hidden text-[10px] font-medium text-white/65 lg:block">Answers use demo data only</span>} />
      {activeTab === 'assistant' ? (
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface lg:flex">
            <div className="border-b border-line p-3"><Button size="sm" className="w-full" onClick={newChat}><Plus size={14} /> New chat</Button></div>
            <div className="px-3 py-2"><label className="flex h-8 items-center gap-2 rounded-lg border border-line px-2.5 text-xs text-ink-muted focus-within:border-brand"><Search size={13} /><input className="min-w-0 flex-1 outline-none" aria-label="Search Ask AI history" placeholder="Search history" /></label></div>
            <div className="px-2 pb-3"><p className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-ink-subtle">Recent</p>{HISTORY.map((item, index) => <button key={item.title} type="button" className={cx('mb-0.5 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left', index === 0 && messages.length ? 'bg-ai-soft/65' : 'hover:bg-surface-sunken')}><MessageSquareText size={13} className="mt-0.5 shrink-0 text-ink-subtle" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium text-ink">{item.title}</span><span className="block text-[9px] text-ink-subtle">{item.time}</span></span><MoreHorizontal size={13} className="text-ink-subtle" /></button>)}</div>
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">{messages.length === 0 ? <Welcome onPrompt={submit} /> : <Chat messages={messages} />}</div>
            <div className="shrink-0 bg-gradient-to-t from-surface-sunken via-surface-sunken to-transparent px-4 pb-4 pt-5">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-line bg-surface p-2 shadow-[0_8px_28px_-16px_rgba(16,24,40,.35)] focus-within:border-ai/45">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit(); }} rows={1} placeholder="Ask anything about your demo account..." aria-label="Ask AI" className="max-h-24 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-subtle" />
                <button type="button" onClick={() => submit()} disabled={!input.trim()} aria-label="Send to Ask AI" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ai text-white disabled:opacity-35"><ArrowUp size={15} /></button>
              </div>
              <p className="mt-1.5 text-center text-[9px] text-ink-subtle">Ask AI can make mistakes. Verify important details.</p>
            </div>
          </main>
        </div>
      ) : <div className="min-h-0 flex-1 overflow-auto"><SavedInsights /></div>}
    </div>
  );
}
