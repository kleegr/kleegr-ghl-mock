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
import { useState, useCallback, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  EmptyState,
  Tabs,
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
import { toDateInputValue }   from './utils';

type CalView = 'month' | 'week' | 'agenda';
type ModuleTab = 'calendar' | 'appointments' | 'settings';

const VIEW_TABS = [
  { id: 'month',  label: 'Month'  },
  { id: 'week',   label: 'Week'   },
  { id: 'agenda', label: 'Agenda' },
];

const MODULE_TABS = [
  { id: 'calendar',     label: 'Calendar View' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'settings',     label: 'Calendar Settings' },
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
  const [view, setView]                         = useState<CalView>('month');
  const [anchor, setAnchor]                     = useState(() => new Date());
  const [selectedCalId, setSelectedCalId]       = useState<string | null>(null);
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
  const visibleAppts = selectedCalId
    ? allAppointments.filter((a) => a.calendarId === selectedCalId)
    : allAppointments;

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

  return (
    <div className="flex h-full flex-col" data-tour="calendars.page">
      {/* ── Page header ── */}
      <PageHeader
        title="Calendars"
        subtitle="View and manage appointments, calendars and booking settings"
        actions={
          moduleTab !== 'settings' ? (
            <Button onClick={() => openBook()} data-tour="calendars.bookButton">
              + Book Appointment
            </Button>
          ) : undefined
        }
      />

      {/* ── Module sub-navigation ── */}
      <div className="border-b border-line bg-surface px-5">
        <Tabs
          tabs={MODULE_TABS}
          active={moduleTab}
          onChange={(id) => setModuleTab(id as ModuleTab)}
          variant="underline"
        />
      </div>

      {/* ── Calendar View tab ── */}
      {moduleTab === 'calendar' && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
            <div
              className="flex flex-wrap items-center gap-1.5"
              data-tour="calendars.selector"
              aria-label="Calendar filter"
            >
              <button
                className={cx(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  selectedCalId === null
                    ? 'bg-brand text-brand-fg'
                    : 'bg-surface-sunken text-ink-muted hover:text-ink',
                )}
                onClick={() => setSelectedCalId(null)}
              >
                All
                <span className="ml-1 opacity-70">{allAppointments.length}</span>
              </button>
              {filterCalendars.map((cal) => (
                <button
                  key={cal.id}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    selectedCalId === cal.id ? 'text-white' : 'bg-surface-sunken text-ink-muted hover:text-ink',
                  )}
                  style={selectedCalId === cal.id ? { background: cal.color } : undefined}
                  onClick={() => setSelectedCalId((prev) => (prev === cal.id ? null : cal.id))}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cal.color }} />
                  {cal.name}
                  <span className="opacity-70">{calApptCount(cal.id)}</span>
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>

            <div data-tour="calendars.viewToggle">
              <Tabs
                tabs={VIEW_TABS}
                active={view}
                onChange={(id) => setView(id as CalView)}
                variant="pill"
              />
            </div>
          </div>

          {/* Grid area */}
          <div className="flex-1 overflow-auto">
            <Card className="min-h-full rounded-none border-0 shadow-none">
              {visibleAppts.length === 0 && view !== 'agenda' ? (
                <EmptyState
                  icon={<CalendarDays size={32} />}
                  title="No appointments"
                  body='No appointments match the current filter. Try selecting "All" or book one.'
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
                      onNavigate={navigateMonth}
                      onClickDay={(date) => openBook(date)}
                    />
                  )}
                  {view === 'week' && (
                    <WeekView
                      anchor={anchor}
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      onSelectAppt={openDetail}
                      onNavigate={navigateWeek}
                    />
                  )}
                  {view === 'agenda' && (
                    <AgendaView
                      appointments={visibleAppts}
                      calendars={catalogCalendars}
                      contacts={contacts}
                      onSelectAppt={openDetail}
                    />
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Footer count */}
          <div className="flex items-center gap-2 border-t border-line bg-surface-sunken px-5 py-2">
            <Badge tone="neutral">{visibleAppts.length} appointments</Badge>
            {selectedCalId && (
              <span className="text-xs text-ink-muted">
                Filtered by: {catalog.find((c) => c.id === selectedCalId)?.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Appointments tab ── */}
      {moduleTab === 'appointments' && (
        <div className="flex-1 overflow-auto">
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
        <div className="flex-1 overflow-auto">
          <CalendarSettings
            catalog={catalog}
            onUpsert={upsert}
            onToggleStatus={toggleStatus}
          />
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
