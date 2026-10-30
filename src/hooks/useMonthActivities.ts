import { useEffect } from 'react';

import { useActivitiesStore } from '@store/activitiesStore';

interface MonthActivities {
  isLoading: boolean;
  error: string | null;
}

export function useMonthActivities(cursor: Date): MonthActivities {
  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const fetchMonth = useActivitiesStore((state) => state.fetchMonth);
  const isLoading = useActivitiesStore((state) => state.isLoading);
  const error = useActivitiesStore((state) => state.error);

  useEffect(() => {
    void fetchMonth(year, month);
  }, [fetchMonth, year, month]);

  return { isLoading, error };
}
