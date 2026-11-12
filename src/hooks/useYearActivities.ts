import { useEffect, useRef } from 'react';

import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useActivitiesStore } from '@store/activitiesStore';

interface YearActivities {
  isLoading: boolean;
  error: string | null;
}

// Carga las actividades de los 12 meses mientras la vista anual está activa.
export function useYearActivities(year: number, enabled: boolean): YearActivities {
  const isConnected = useNetworkStatus();
  const wasOffline = useRef(false);
  const fetchYear = useActivitiesStore((state) => state.fetchYear);
  const isLoading = useActivitiesStore((state) => state.isLoading);
  const error = useActivitiesStore((state) => state.error);

  useEffect(() => {
    if (enabled) {
      void fetchYear(year);
    }
  }, [enabled, fetchYear, year]);

  useEffect(() => {
    if (isConnected === false) {
      wasOffline.current = true;
      return;
    }

    if (!enabled || isConnected !== true || !wasOffline.current) {
      return;
    }

    wasOffline.current = false;
    void fetchYear(year);
  }, [enabled, fetchYear, isConnected, year]);

  return { isLoading, error };
}
