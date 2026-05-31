/**
 * CalendarSettings — the Calendar Settings hub.
 *
 * Sub-tabs (Calendars / Preferences / Availability / Connections) plus the
 * "create calendar" orchestration: the type chooser feeds the create/edit
 * form, which upserts into the catalog. The catalog can be supplied by a parent
 * (so the Calendars page shares one catalog across all its tabs); when omitted,
 * the hub manages its own session catalog for standalone use in Settings.
 */
import { useState } from 'react';
import { Tabs } from '@/components/ui/primitives';
import { cx } from '@/utils';
import { useCalendarCatalog } from '../useCalendarCatalog';
import { CalendarSettingsList } from './CalendarSettingsList';
import { CalendarPreferences } from './CalendarPreferences';
import { AvailabilitySchedules } from './AvailabilitySchedules';
import { Connections } from './Connections';
import { CalendarTypeChooser } from './CalendarTypeChooser';
import { CalendarForm } from './CalendarForm';
import type { CalendarMeta, CalendarTypeId } from '../types';

type SettingsTab = 'calendars' | 'preferences' | 'availability' | 'connections';

interface Props {
  /** Hide outer padding when rendered inside the Settings layout. */
  embedded?: boolean;
  /** Shared catalog (from the Calendars page). Omit for standalone state. */
  catalog?: CalendarMeta[];
  onUpsert?: (meta: CalendarMeta) => void;
  onToggleStatus?: (id: string) => void;
}

export function CalendarSettings({ embedded, catalog, onUpsert, onToggleStatus }: Props) {
  // Always created (hooks can't be conditional); used only as a fallback.
  const internal = useCalendarCatalog();
  const cals = catalog ?? internal.catalog;
  const upsert = onUpsert ?? internal.upsert;
  const toggleStatus = onToggleStatus ?? internal.toggleStatus;

  const [tab, setTab] = useState<SettingsTab>('calendars');

  // Create / edit flow state
  const [chooserOpen, setChooserOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<CalendarTypeId | null>(null);
  const [editing, setEditing] = useState<CalendarMeta | null>(null);

  const startCreate = () => {
    setEditing(null);
    setFormType(null);
    setChooserOpen(true);
  };

  const handleTypeSelected = (typeId: CalendarTypeId) => {
    setChooserOpen(false);
    setEditing(null);
    setFormType(typeId);
    setFormOpen(true);
  };

  const startEdit = (meta: CalendarMeta) => {
    setEditing(meta);
    setFormType(null);
    setFormOpen(true);
  };

  const TABS = [
    { id: 'calendars', label: 'Calendars', count: cals.length },
    { id: 'preferences', label: 'Preferences' },
    { id: 'availability', label: 'Availability' },
    { id: 'connections', label: 'Connections' },
  ];

  return (
    <div className={cx('flex flex-col', !embedded && 'px-5 py-4')} data-tour="calendars.settings">
      {/* Sub-tab bar */}
      <div className="mb-4 flex items-center gap-2 border-b border-line">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(id) => setTab(id as SettingsTab)}
          variant="underline"
        />
      </div>

      {/* Active sub-view */}
      <div className="min-w-0">
        {tab === 'calendars' && (
          <CalendarSettingsList
            calendars={cals}
            onCreate={startCreate}
            onEdit={startEdit}
            onToggleStatus={toggleStatus}
          />
        )}
        {tab === 'preferences' && <CalendarPreferences />}
        {tab === 'availability' && <AvailabilitySchedules />}
        {tab === 'connections' && <Connections />}
      </div>

      {/* Create / edit modals */}
      <CalendarTypeChooser
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onSelect={handleTypeSelected}
      />
      <CalendarForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        typeId={formType}
        editing={editing}
        onSave={(meta) => {
          upsert(meta);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
