/**
 * Calendars — Wave 1 full implementation.
 *
 * GoHighLevel-style Calendars & Appointments module. Reads entirely from the
 * Zustand store (fake seed data). No real API calls, no real PII.
 *
 * Features:
 *  - Calendar type selector (All / Discovery Call / Demo / Consultation)
 *  - Month / Week / Agenda view toggle
 *  - Date navigation (prev/next month or week, Today button)
 *  - Appointment chips in month grid with +X overflow
 *  - Day columns with appointment cards in week view
 *  - Date-grouped agenda list
 *  - Appointment detail modal (read-mostly with cosmetic actions)
 *  - Book Appointment modal wired to bookAppointment() store action
 *  - All data-tour attributes for Tutorial Mode
 */

import { useState, useCallback } from 'react';
import { CalendarDays, Settings2, X, Plus } from 'lucide-react';
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
import type { Appointment } from '@/types';
import { MonthView }          from './components/MonthView';
import { WeekView }           from './components/WeekView';
import { AgendaView }         from './components/AgendaView';
import { AppointmentDetail }  from './components/AppointmentDetail';
import { BookModal }          from './components/BookModal';
import { toDateInputValue }   from './utils';

type CalView = 'month' | 'week' | 'agenda';

const VIEW_TABS = [
  { id: 'month',  label: 'Month'  },
  { id: 'week',   label: 'Week'   },
  { id: 'agenda', label: 'Agenda' },
];

export function Calendars() {
  // ── Store ────────────────────────────────────────────────────────────────
  const appointments   = useStore((s) => s.appointments);
  const calendars      = useStore((s) => s.calendars);
  const contacts       = useStore((s) => s.contacts);
  const bookAppointment = useStore((s) => s.bookAppointment);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [view, setView]                         = useState<CalView>('month');
  const [anchor, setAnchor]                     = useState(() => new Date());
  const [selectedCalId, setSelectedCalId]       = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt]         = useState<Appointment | null>(null);
  const [showDetail, setShowDetail]             = useState(false);
  const [showBook, setShowBook]                 = useState(false);
  const [bookDefaultDate, setBookDefaultDate]   = useState<string>('');
  const [showManage, setShowManage]             = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleAppts = selectedCalId
    ? appointments.filter((a) => a.calendarId === selectedCalId)
    : appointments;

  const year  = anchor.getFullYear();
  const month = anchor.getMonth();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const navigateMonth = useCallback(
    (dir: -1 | 1) => {
      setAnchor((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + dir);
        return d;
      });
    },
    [],
  );

  const navigateWeek = useCallback(
    (dir: -1 | 1) => {
      setAnchor((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + dir * 7);
        return d;
      });
    },
    [],
  );

  const goToday = () => setAnchor(new Date());

  const openDetail = (appt: Appointment) => {
    setSelectedAppt(appt);
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

  // Appointment count per calendar (for the selector)
  const calApptCount = (id: string) =>
    appointments.filter((a) => a.calendarId === id).length;

  return (
    <div className="flex h-full flex-col" data-tour="calendars.page">
      {/* ── Page header ── */}
      <PageHeader
        title="Calendars"
        subtitle="View and manage appointments across all booking types"
        actions={
          <Button
            onClick={() => openBook()}
            data-tour="calendars.bookButton"
          >
            + Book Appointment
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
        {/* Calendar selector */}
        <div
          className="flex items-center gap-1.5"
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
            <span className="ml-1 opacity-70">{appointments.length}</span>
          </button>
          {calendars.map((cal) => (
            <button
              key={cal.id}
              className={cx(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                selectedCalId === cal.id
                  ? 'text-white'
                  : 'bg-surface-sunken text-ink-muted hover:text-ink',
              )}
              style={
                selectedCalId === cal.id
                  ? { background: cal.color }
                  : undefined
              }
              onClick={() =>
                setSelectedCalId((prev) => (prev === cal.id ? null : cal.id))
              }
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: cal.color }}
              />
              {cal.name}
              <span className="opacity-70">{calApptCount(cal.id)}</span>
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Date navigation + Today */}
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={goToday}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowManage(true)}
            data-tour="calendars.manage"
          >
            <Settings2 size={14} /> Manage
          </Button>
        </div>

        {/* View toggle */}
        <div data-tour="calendars.viewToggle">
          <Tabs
            tabs={VIEW_TABS}
            active={view}
            onChange={(id) => setView(id as CalView)}
            variant="pill"
          />
        </div>
      </div>

      {/* ── Main calendar area ── */}
      <div className="flex-1 overflow-auto">
        <Card className="min-h-full rounded-none border-0 shadow-none">
          {visibleAppts.length === 0 && view !== 'agenda' && (
            <EmptyState
              icon={<CalendarDays size={32} />}
              title="No appointments"
              body='No appointments match the current filter. Try selecting "All" or book one.'
              action={
                <Button size="sm" onClick={() => openBook()}>
                  Book Appointment
                </Button>
              }
              className="py-24"
            />
          )}

          {(visibleAppts.length > 0 || view === 'agenda') && (
            <>
              {view === 'month' && (
                <MonthView
                  year={year}
                  month={month}
                  appointments={visibleAppts}
                  calendars={calendars}
                  onSelectAppt={openDetail}
                  onNavigate={navigateMonth}
                  onClickDay={(date) => openBook(date)}
                />
              )}

              {view === 'week' && (
                <WeekView
                  anchor={anchor}
                  appointments={visibleAppts}
                  calendars={calendars}
                  onSelectAppt={openDetail}
                  onNavigate={navigateWeek}
                />
              )}

              {view === 'agenda' && (
                <AgendaView
                  appointments={visibleAppts}
                  calendars={calendars}
                  contacts={contacts}
                  onSelectAppt={openDetail}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Appointment count footer ── */}
      <div className="flex items-center gap-2 border-t border-line bg-surface-sunken px-5 py-2">
        <Badge tone="neutral">{visibleAppts.length} appointments</Badge>
        {selectedCalId && (
          <span className="text-xs text-ink-muted">
            Filtered by: {calendars.find((c) => c.id === selectedCalId)?.name}
          </span>
        )}
      </div>

      {/* ── Appointment detail modal ── */}
      {selectedAppt && (
        <AppointmentDetail
          open={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedAppt(null);
          }}
          appt={selectedAppt}
          calendars={calendars}
          contacts={contacts}
        />
      )}

      {/* ── Manage calendars drawer (cosmetic) ── */}
      {showManage && (
        <div className="fixed inset-0 z-50" data-tour="calendars.manageDrawer">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setShowManage(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-surface shadow-pop animate-in">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-base font-bold text-ink">Manage Calendars</h2>
              <button
                onClick={() => setShowManage(false)}
                className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Calendar Types
                </p>
                <button
                  onClick={() =>
                    useStore.getState().pushToast({
                      title: 'New calendar (demo)',
                      description: 'Creating calendars is not available in demo mode.',
                      variant: 'info',
                    })
                  }
                  className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-sunken"
                >
                  <Plus size={12} /> New
                </button>
              </div>

              <div className="space-y-2">
                {calendars.map((cal) => (
                  <div
                    key={cal.id}
                    className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: cal.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{cal.name}</p>
                      <p className="text-xs text-ink-muted">
                        {calApptCount(cal.id)} appointment{calApptCount(cal.id) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {/* Cosmetic enabled toggle */}
                    <span
                      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-brand"
                      aria-hidden="true"
                    >
                      <span className="ml-auto mr-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
                Calendar visibility and settings are cosmetic in demo mode.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Book appointment modal ── */}
      <BookModal
        open={showBook}
        onClose={() => setShowBook(false)}
        defaultDate={bookDefaultDate}
        calendars={calendars}
        contacts={contacts}
        onBook={handleBook}
      />
    </div>
  );
}
