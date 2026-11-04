import { create } from 'zustand';

import { monthPrefix } from '@lib/dates';
import * as activitiesService from '@services/activitiesService';
import type { Activity, ActivityCreateInput, ActivityUpdateInput } from '@/types/activity';

interface ActivitiesState {
  activitiesByDate: Record<string, Activity[]>;
  isLoading: boolean;
  error: string | null;
  fetchMonth: (year: number, month: number) => Promise<void>;
  createActivity: (input: ActivityCreateInput) => Promise<void>;
  updateActivity: (id: string, input: ActivityUpdateInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
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
      const activities = await activitiesService.fetchByMonth(year, month);
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

      set({ isLoading: false, error: activitiesService.toActivityMessage(error) });
    }
  },

  createActivity: async (input) => {
    const activity = await activitiesService.create(input);
    fetchToken += 1;
    set((state) => ({
      activitiesByDate: putActivity(state.activitiesByDate, activity),
      isLoading: false,
    }));
  },

  updateActivity: async (id, input) => {
    const activity = await activitiesService.update(id, input);
    fetchToken += 1;
    set((state) => ({
      activitiesByDate: putActivity(state.activitiesByDate, activity),
      isLoading: false,
    }));
  },

  deleteActivity: async (id) => {
    await activitiesService.remove(id);
    fetchToken += 1;
    set((state) => ({
      activitiesByDate: dropActivity(state.activitiesByDate, id),
      isLoading: false,
    }));
  },

  getActivitiesForDate: (date) => get().activitiesByDate[date] ?? NO_ACTIVITIES,
}));

export function findActivity(activitiesByDate: Record<string, Activity[]>, activityId: string): Activity | null {
  for (const activities of Object.values(activitiesByDate)) {
    const match = activities.find((activity) => activity.id === activityId);
    if (match) {
      return match;
    }
  }

  return null;
}

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

function putActivity(current: Record<string, Activity[]>, activity: Activity): Record<string, Activity[]> {
  const currentDate = dateOfActivity(current, activity.id);
  if (currentDate === activity.date) {
    return {
      ...current,
      [activity.date]: current[activity.date].map((item) => (item.id === activity.id ? activity : item)),
    };
  }

  const without = currentDate ? dropActivity(current, activity.id) : current;
  const list = without[activity.date] ?? [];
  return { ...without, [activity.date]: [...list, activity] };
}

function dateOfActivity(current: Record<string, Activity[]>, activityId: string): string | null {
  for (const [date, items] of Object.entries(current)) {
    if (items.some((item) => item.id === activityId)) {
      return date;
    }
  }

  return null;
}

function dropActivity(current: Record<string, Activity[]>, activityId: string): Record<string, Activity[]> {
  const next: Record<string, Activity[]> = {};

  for (const [date, items] of Object.entries(current)) {
    const remaining = items.filter((item) => item.id !== activityId);
    if (remaining.length > 0) {
      next[date] = remaining;
    }
  }

  return next;
}
