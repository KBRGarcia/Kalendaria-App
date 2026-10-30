import { create } from 'zustand';

import { monthPrefix } from '@lib/dates';
import { fetchByMonth, toActivityMessage } from '@services/activitiesService';
import type { Activity } from '@/types/activity';

interface ActivitiesState {
  activitiesByDate: Record<string, Activity[]>;
  isLoading: boolean;
  error: string | null;
  fetchMonth: (year: number, month: number) => Promise<void>;
  getActivitiesForDate: (date: string) => Activity[];
}

const NO_ACTIVITIES: Activity[] = [];

let fetchToken = 0;

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activitiesByDate: {},
  isLoading: false,
  error: null,

  fetchMonth: async (year, month) => {
    const token = ++fetchToken;
    set({ isLoading: true, error: null });

    try {
      const activities = await fetchByMonth(year, month);
      if (token !== fetchToken) {
        return;
      }

      set((state) => ({
        activitiesByDate: replaceMonth(state.activitiesByDate, year, month, activities),
        isLoading: false,
      }));
    } catch (error) {
      if (token !== fetchToken) {
        return;
      }

      set({ isLoading: false, error: toActivityMessage(error) });
    }
  },

  getActivitiesForDate: (date) => get().activitiesByDate[date] ?? NO_ACTIVITIES,
}));

function replaceMonth(
  current: Record<string, Activity[]>,
  year: number,
  month: number,
  activities: Activity[],
): Record<string, Activity[]> {
  const prefix = monthPrefix(year, month);
  const next: Record<string, Activity[]> = {};

  for (const [date, items] of Object.entries(current)) {
    if (!date.startsWith(prefix)) {
      next[date] = items;
    }
  }

  for (const activity of activities) {
    const items = next[activity.date] ?? [];
    next[activity.date] = [...items, activity];
  }

  return next;
}
