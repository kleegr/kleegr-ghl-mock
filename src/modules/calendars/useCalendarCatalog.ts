/**
 * useCalendarCatalog — session-only calendar catalog state.
 *
 * Seeds from CALENDAR_CATALOG and supports create/edit (upsert) plus an
 * active/inactive status toggle. Used by the Calendars page so the Calendar
 * View, Appointment List and Calendar Settings tabs all share one catalog, and
 * standalone by the Settings → Calendars section. No store mutation, no API.
 */
import { useCallback, useState } from 'react';
import { CALENDAR_CATALOG } from './data';
import type { CalendarMeta } from './types';

export interface CatalogApi {
  catalog: CalendarMeta[];
  upsert: (meta: CalendarMeta) => void;
  toggleStatus: (id: string) => void;
}

export function useCalendarCatalog(): CatalogApi {
  const [catalog, setCatalog] = useState<CalendarMeta[]>(() =>
    CALENDAR_CATALOG.map((c) => ({ ...c })),
  );

  const upsert = useCallback((meta: CalendarMeta) => {
    setCatalog((prev) => {
      const idx = prev.findIndex((c) => c.id === meta.id);
      if (idx === -1) return [meta, ...prev];
      const next = prev.slice();
      next[idx] = meta;
      return next;
    });
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setCatalog((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'active' ? 'inactive' : 'active',
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
  }, []);

  return { catalog, upsert, toggleStatus };
}
