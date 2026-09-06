/**
 * Calendars — GoHighLevel-style Calendars & Appointments module.
 *
 * Module sub-navigation switches between three areas:
 *   • Calendar View      — month / week / agenda grid with calendar filters
 *   • Appointments       — searchable, filterable appointment table
 *   • Calendar Settings  — calendars list, preferences, availability, connections
 *
 * The calendar catalog (10 calendars) and an appointment status/override layer
 * are lifted here so every tab shares the same data. Booking still flows through
 * the store's bookAppointment() action; everything else is session-only local
 * state. No real API calls, no real PII.
 *
 * Tutorial Mode anchors (data-tour): calendars.page, calendars.bookButton are
 * rendered here; calendars.bookModal / calendars.bookSubmit live in BookModal.
 */
import {
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  Button,
  EmptyState,
} from '@/components/ui/primitives';
import { cx } from '@/utils';
import type { Appointment, Calendar } from '@/types';
import { MonthView }          from './components/MonthView';
import { WeekView }           from './components/WeekView';
import { AgendaView }         from './components/AgendaView';
import { AppointmentDetail }  from './components/AppointmentDetail';
import { AppointmentList }    from './components/AppointmentList';
import { BookModal }          from './components/BookModal';
import { CalendarSettings }   from './settings/CalendarSettings';
import { useCalendarCatalog } from './useCalendarCatalog';
import { buildExtraAppointments } from './data';
import {
  buildWeekDays,
  formatMonthYear,
  formatWeekRange,
  toDateInputValue,
} from './utils';

type CalView = 'month' | 'week' | 'day' | 'list';
type ModuleTab = 'calendar' | 'appointments' | 'settings';

const VIEW_TABS = [
  { id: 'month',  label: 'Month'  },
  { id: 'week',   label: 'Week'   },
  { id: 'day',    label: 'Day'    },
  { id: 'list',   label: 'List'   },
];

const MODULE_TABS = [
  { id: 'calendar',     label: 'Calendar view' },
  { id: 'appointments', label: 'Appointment list view' },
  { id: 'settings',     label: 'Calendar settings' },
];

export function Calendars() {
  // ── Store ────
  const appointments    = useStore((s) => s.appointments);
  const contacts        = useStore((s) => s.contacts);
  const users           = useStore((s) => s.users);
  const bookAppointment = useStore((s) => s.bookAppointment);
  const pushToast       = useStore((s) => s.pushToast);

  // ── Shared calendar catalog (used by every tab) ────
  const { catalog, upsert, toggleStatus } = useCalendarCatalog();
  const catalogCalendars: Calendar[] = useMemo(
    () => catalog.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    [catalog],
  );

  // ── Appointment override layer (status + reschedule), session-only ────
  const [overrides, setOverrides] = useState<Record<string, Partial<Appointment>>>({});

  const extraAppts = useMemo(() => {
    return buildExtraAppointments(contacts);
  }, [contacts]);

  const allAppointments = useMemo(() => {
    const merged = [...appointments, ...extraAppts];
    return merged.map((a) => (overrides[a.id] ? { ...a, ...overrides[a.id] } : a));
  }, [appointments, extraAppts, overrides]);

  const setApptStatus = useCallback((id: string, status: Appointment['status']) => {
    setOverrides((p) => ({ ...p, [id]: { ...p[id], status } }));
  }, []);

  const cancelAppt = useCallback((id: string) => {
    setOverrides((p) => ({ ...p, [id]: { ...p[id], status: 'cancelled' } }));
    pushToast({ title: 'Appointment cancelled', variant: 'info' });
  }, [pushToast]);

  const rescheduleAppt = useCallback((id: string, startTime: string, endTime: string) => {
    setOverrides((p) => ({ ...p, [id]: { ...p[id], startTime, endTime } }));
    pushToast({ title: 'Appointment rescheduled', variant: 'success' });
  }, [pushToast]);

  // ── Local UI state ────
  const [moduleTab, setModuleTab]               = useState<ModuleTab>('calendar');
  const [view, setView]                         = useState<CalView>('week');
  const [anchor, setAnchor]                     = useState(() => new Date());
  const [manageOpen, setManageOpen]             = useState(false);
  const [manageType, setManageType]             = useState<'all' | 'appointments' | 'blocked'>('all');
  const [showBuffers, setShowBuffers]           = useState(true);
  const [manageQuery, setManageQuery]           = useState('');
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(() => new Set());
  const [hiddenUserIds, setHiddenUserIds]       = useState<Set<string>>(() => new Set());
  const [selectedApptId, setSelectedApptId]     = useState<string | null>(null);
  const [showDetail, setShowDetail]             = useState(false);
  const [showBook, setShowBook]                 = useState(false);
  const [bookDefaultDate, setBookDefaultDate]   = useState<string>('');

  // The selected appointment is resolved live so overrides flow into the modal.
  const selectedAppt = useMemo(
    () => allAppointments.find((a) => a.id === selectedApptId) ?? null,
    [allAppointments, selectedApptId],
  );

  // ── Derived ────
  const visibleAppts = allAppointments.filter((a) => {
    if (manageType === 'blocked') return false;
    if (hiddenCalendarIds.has(a.calendarId)) return false;
    const calendar = catalog.find((c) => c.id === a.calendarId);
    return !calendar?.ownerId || !hiddenUserIds.has(calendar.ownerId);
  });

  const year  = anchor.getFullYear();
  const month = anchor.getMonth();

  // Calendars that actually have appointments → filter pills (keeps it tidy)
  const filterCalendars = useMemo(() => {
    const withAppts = new Set(allAppointments.map((a) => a.calendarId));
    return catalog.filter((c) => withAppts.has(c.id));
  }, [catalog, allAppointments]);

  const calApptCount = (id: string) =>
    allAppointments.filter((a) => a.calendarId === id).length;

  // ── Handlers ────
  const navigateMonth = useCallback((dir: -1 | 1) => {
    setAnchor((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, []);

  const navigateWeek = useCallback((dir: -1 | 1) => {
    setAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }, []);

  const goToday = () => setAnchor(new Date());

  const navigateDay = useCallback((dir: -1 | 1) => {
    setAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir);
      return d;
    });
  }, []);

  const navigatePeriod = (dir: -1 | 1) => {
    if (view === 'month') navigateMonth(dir);
    else if (view === 'week') navigateWeek(dir);
    else navigateDay(dir);
  };

  const periodLabel = view === 'month'
    ? formatMonthYear(year, month)
    : view === 'week'
      ? formatWeekRange(buildWeekDays(anchor))
      : anchor.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });

  const toggleHidden = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearManageFilters = () => {
    setHiddenCalendarIds(new Set());
    setHiddenUserIds(new Set());
    setManageQuery('');
    setManageType('all');
  };

  const openDetail = (appt: Appointment) => {
    setSelectedApptId(appt.id);
    setShowDetail(true);
  };

  const openBook = (date?: Date) => {
    setBookDefaultDate(date ? toDateInputValue(date) : toDateInputValue(new Date()));
    setShowBook(true);
  };

  const handleBook = useCallback(
    (input: Parameters<typeof bookAppointment>[0]) => {
      bookAppointment(input);
    },
    [bookAppointment],
  );

  const manageSearch = manageQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(manageSearch));
  const filteredManageCalendars = filterCalendars.filter((cal) => cal.name.toLowerCase().includes(manageSearch));

  return (
    <div className="flex h-full flex-col" data-tour="calendars.page">
      {/* Dark Kleegr module band: title and sub-navigation share one surface. */}
      <div className="flex h-10 shrink-0 items-center gap-7 bg-banner px-5 text-white">
        <h1 className="shrink-0 font-display text-[18px] font-semibold tracking-[-0.01em]">Calendars</h1>
        <nav className="flex h-10 items-end gap-6" aria-label="Calendar sections">
          {MODULE_TABS.map((tab, index) => (
            <span key={tab.id} className="flex h-10 items-end gap-6">
              {index === 2 && <span aria-hidden className="mb-2.5 h-5 w-px bg-white/20" />}
              <button
                onClick={() => setModuleTab(tab.id as ModuleTab)}
                className={cx(
                  'relative flex h-10 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium transition-colors',
                  moduleTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white/90',
                )}
              >
                {tab.id === 'settings' && <Settings size={14} />}
                {tab.label}
                {moduleTab === tab.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-banner-accent" />
                )}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {/* ── Calendar View tab ── */}
      {moduleTab === 'calendar' && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Live-style 72px secondary toolbar. */}
          <div className="flex min-h-[72px] flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
            <Button variant="secondary" size="sm" className="rounded-[5px] px-3 text-[12px]" onClick={goToday}>Today</Button>
            <div className="flex items-center">
              <button onClick={() => navigatePeriod(-1)} className="grid h-8 w-8 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Previous period">
                <ChevronLeft size={16} />
              </button>
              <p className="min-w-[158px] px-1 text-center text-[13px] font-semibold text-ink">{periodLabel}</p>
              <button onClick={() => navigatePeriod(1)} className="grid h-8 w-8 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Next period">
                <ChevronRight size={16} />
              </button>
            </div>
            <label data-tour="calendars.viewToggle">
              <span className="sr-only">Calendar view</span>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as CalView)}
                className="h-8 rounded-[5px] border border-line bg-surface px-2.5 text-[12px] font-medium text-ink outline-none focus:border-brand"
              >
                {VIEW_TABS.map((tab) => <option key={tab.id} value={tab.id}>{tab.label} view</option>)}
              </select>
            </label>
            <button
              onClick={() => pushToast({ title: 'Availability view', description: 'Team availability is shown alongside appointments.', variant: 'info' })}
              className="grid h-8 w-8 place-items-center rounded-[5px] border border-line text-ink-muted hover:bg-surface-sunken"
              aria-label="Availability display"
            >
              <Sun size={15} />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setManageOpen((open) => !open)}
                className={cx(
                  'flex h-8 items-center gap-1.5 rounded-[5px] border px-3 text-[12px] font-semibold',
                  manageOpen ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink hover:bg-surface-sunken',
                )}
              >
                <SlidersHorizontal size={14} /> Manage view
              </button>
              <Button onClick={() => openBook()} size="sm" className="rounded-[5px] px-3 text-[12px]" data-tour="calendars.bookButton">
                <Plus size={14} /> New
              </Button>
            </div>
          </div>

          {/* Grid area + manage-view drawer */}
          <div className="relative min-h-0 flex-1 overflow-hidden bg-surface">
            <div className="h-full overflow-auto">
              {visibleAppts.length === 0 && view !== 'list' ? (
                <EmptyState
                  icon={<CalendarDays size={32} />}
                  title="No appointments"
                  body="No appointments match the current view filters."
                  action={<Button size="sm" onClick={() => openBook()}>Book Appointment</Button>}
                  className="py-24"
                />
              ) : (
                <>
                  {view === 'month' && (
                    <MonthView
                      year={year}
                      month={month}
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      onSelectAppt={openDetail}
                      onClickDay={(date) => openBook(date)}
                    />
                  )}
                  {view === 'week' && (
                    <WeekView
                      anchor={anchor}
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      onSelectAppt={openDetail}
                    />
                  )}
                  {view === 'day' && (
                    <WeekView
                      anchor={anchor}
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      onSelectAppt={openDetail}
                      dayOnly
                    />
                  )}
                  {view === 'list' && (
                    <AgendaView
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      contacts={contacts}
                      onSelectAppt={openDetail}
                    />
                  )}
                </>
              )}
            </div>

            {manageOpen && (
              <aside className="absolute inset-y-0 right-0 z-20 flex w-[320px] flex-col border-l border-line bg-surface shadow-pop" data-tour="calendars.selector">
                <div className="flex h-14 items-center justify-between border-b border-line px-4">
                  <h2 className="text-sm font-semibold text-ink">Manage view</h2>
                  <button onClick={() => setManageOpen(false)} className="grid h-8 w-8 place-items-center rounded-[5px] text-ink-muted hover:bg-surface-sunken" aria-label="Close manage view">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="rounded-lg border border-brand/20 bg-brand-soft/60 p-3">
                    <p className="text-[12px] font-semibold text-ink">View by type</p>
                    <div className="mt-2 space-y-2">
                      {([
                        ['all', 'All'],
                        ['appointments', 'Appointments'],
                        ['blocked', 'Blocked slots'],
                      ] as const).map(([id, label]) => (
                        <label key={id} className="flex items-center gap-2 text-[12px] text-ink-muted">
                          <input type="radio" name="calendar-view-type" checked={manageType === id} onChange={() => setManageType(id)} className="h-3.5 w-3.5 accent-brand" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-line py-3">
                    <div>
                      <p className="text-[12px] font-semibold text-ink">Show buffer time</p>
                      <p className="text-[11px] text-ink-subtle">Display time reserved around bookings</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={showBuffers}
                      onClick={() => setShowBuffers((shown) => !shown)}
                      className={cx('relative h-5 w-9 rounded-full transition-colors', showBuffers ? 'bg-brand' : 'bg-line')}
                    >
                      <span className={cx('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', showBuffers && 'translate-x-4')} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-[13px] font-semibold text-ink">Filters</p>
                    <button onClick={clearManageFilters} className="text-[11px] font-semibold text-brand hover:underline">Clear all</button>
                  </div>
                  <label className="relative mt-3 block">
                    <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                    <input
                      value={manageQuery}
                      onChange={(e) => setManageQuery(e.target.value)}
                      placeholder="Search"
                      className="h-8 w-full rounded-[5px] border border-line bg-surface pl-8 pr-2 text-[12px] text-ink outline-none focus:border-brand"
                    />
                  </label>
                  <FilterChecklist
                    title="Users"
                    icon={<UserRound size={14} />}
                    items={filteredUsers.map((user) => ({ id: user.id, label: user.name }))}
                    hidden={hiddenUserIds}
                    onToggle={(id) => toggleHidden(setHiddenUserIds, id)}
                  />
                  <FilterChecklist
                    title="Calendars"
                    icon={<CalendarDays size={14} />}
                    items={filteredManageCalendars.map((cal) => ({ id: cal.id, label: cal.name, color: cal.color }))}
                    hidden={hiddenCalendarIds}
                    onToggle={(id) => toggleHidden(setHiddenCalendarIds, id)}
                  />
                </div>
                <div className="flex h-11 items-center border-t border-line px-4 text-[11px] text-ink-muted">
                  {visibleAppts.length} appointments visible
                </div>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* ── Appointments tab ── */}
      {moduleTab === 'appointments' && (
        <div className="flex-1 overflow-auto bg-surface-sunken">
          <AppointmentList
            appointments={allAppointments}
            catalog={catalog}
            contacts={contacts}
            users={users}
            onOpen={openDetail}
            onStatusChange={setApptStatus}
            onCancel={cancelAppt}
            onBook={() => openBook()}
          />
        </div>
      )}

      {/* ── Calendar Settings tab ── */}
      {moduleTab === 'settings' && (
        <div className="flex-1 overflow-auto bg-surface-sunken p-4">
          <div className="min-h-full rounded-xl border border-line bg-surface p-4 shadow-card">
            <CalendarSettings
              embedded
              catalog={catalog}
              onUpsert={upsert}
              onToggleStatus={toggleStatus}
            />
          </div>
        </div>
      )}

      {/* ── Appointment detail modal (shared) ── */}
      {selectedAppt && (
        <AppointmentDetail
          open={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedApptId(null);
          }}
          appt={selectedAppt}
          calendars={catalogCalendars}
          contacts={contacts}
          onStatusChange={setApptStatus}
          onCancel={cancelAppt}
          onReschedule={rescheduleAppt}
        />
      )}

      {/* ── Book appointment modal ── */}
      <BookModal
        open={showBook}
        onClose={() => setShowBook(false)}
        defaultDate={bookDefaultDate}
        calendars={catalogCalendars}
        contacts={contacts}
        onBook={handleBook}
      />
    </div>
  );
}

function FilterChecklist({
  title,
  icon,
  items,
  hidden,
  onToggle,
}: {
  title: string;
  icon: ReactNode;
  items: { id: string; label: string; color?: string }[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="border-b border-line py-4 last:border-0">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
          <span className="text-ink-subtle">{icon}</span>
          {title}
        </p>
        <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">{items.length}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-muted">
            <input
              type="checkbox"
              checked={!hidden.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="h-3.5 w-3.5 rounded-[3px] border-line accent-brand"
            />
            {item.color && <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </label>
        ))}
        {items.length === 0 && <p className="text-[11px] text-ink-subtle">No matches</p>}
      </div>
    </section>
  );
}
