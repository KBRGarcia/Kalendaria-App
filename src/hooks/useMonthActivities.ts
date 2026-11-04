import { useEffect, useRef } from 'react';

import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useActivitiesStore } from '@store/activitiesStore';

interface MonthActivities {
  isLoading: boolean;
  error: string | null;
}

export function useMonthActivities(cursor: Date): MonthActivities {
  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const isConnected = useNetworkStatus();
  const wasOffline = useRef(false);
  const fetchMonth = useActivitiesStore((state) => state.fetchMonth);
  const isLoading = useActivitiesStore((state) => state.isLoading);
  const error = useActivitiesStore((state) => state.error);

  useEffect(() => {
    void fetchMonth(year, month);
  }, [fetchMonth, year, month]);

  useEffect(() => {
    if (isConnected === false) {
      wasOffline.current = true;
      return;
    }

    if (isConnected !== true || !wasOffline.current) {
      return;
    }

    wasOffline.current = false;
    void fetchMonth(year, month);
  }, [fetchMonth, isConnected, month, year]);

  return { isLoading, error };
}
