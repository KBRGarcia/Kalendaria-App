import { create } from 'zustand';

import { activityMessages } from '@constants/activities';
import { authMessages } from '@constants/auth';
import { loadMonthFromCache, saveMonthToCache } from '@lib/cache';
import { monthPrefix, parseDateKey } from '@lib/dates';
import { setSessionNotice } from '@lib/sessionNotice';
import * as activitiesService from '@services/activitiesService';
import { signOut } from '@services/authService';
import type { Activity, ActivityCreateInput, ActivityUpdateInput } from '@/types/activity';

interface ActivitiesState {
  activitiesByDate: Record<string, Activity[]>;
  isLoading: boolean;
  error: string | null;
  fetchMonth: (year: number, month: number) => Promise<void>;
  createActivity: (input: ActivityCreateInput) => Promise<void>;
  updateActivity: (id: string, input: ActivityUpdateInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  clearLocalActivities: () => void;
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

      const activitiesByDate = replaceMonth(get().activitiesByDate, year, month, activities);
      set({ activitiesByDate, isLoading: false, error: null });
      await rememberMonth(activitiesByDate, year, month);
    } catch (error) {
      if (token !== fetchToken) {
        return;
      }

      if (await leaveIfSessionExpired(error)) {
        return;
      }

      if (!activitiesService.isOfflineActivityError(error)) {
        set({ isLoading: false, error: activitiesService.toActivityMessage(error) });
        return;
      }

      const cached = await loadMonthFromCache(year, month).catch(() => null);
      if (token !== fetchToken) {
        return;
      }

      if (!cached) {
        set({ isLoading: false, error: activityMessages.offline });
        return;
      }

      set({
        activitiesByDate: replaceMonth(get().activitiesByDate, year, month, cached),
        isLoading: false,
        error: activityMessages.offline,
      });
    }
  },

  createActivity: async (input) => {
    try {
      const activity = await activitiesService.create(input);
      fetchToken += 1;
      const activitiesByDate = putActivity(get().activitiesByDate, activity);
      set({ activitiesByDate, isLoading: false });
      await rememberMonth(activitiesByDate, yearOf(activity.date), monthOf(activity.date));
    } catch (error) {
      if (await leaveIfSessionExpired(error)) {
        return;
      }

      throw error;
    }
  },

  updateActivity: async (id, input) => {
    try {
      const activity = await activitiesService.update(id, input);
      fetchToken += 1;
      const activitiesByDate = putActivity(get().activitiesByDate, activity);
      set({ activitiesByDate, isLoading: false });
      await rememberMonth(activitiesByDate, yearOf(activity.date), monthOf(activity.date));
    } catch (error) {
      if (await leaveIfSessionExpired(error)) {
        return;
      }

      throw error;
    }
  },

  deleteActivity: async (id) => {
    const existing = findActivity(get().activitiesByDate, id);

    try {
      await activitiesService.remove(id);
      fetchToken += 1;
      const activitiesByDate = dropActivity(get().activitiesByDate, id);
      set({ activitiesByDate, isLoading: false });
      if (existing) {
        await rememberMonth(activitiesByDate, yearOf(existing.date), monthOf(existing.date));
      }
    } catch (error) {
      if (await leaveIfSessionExpired(error)) {
        return;
      }

      throw error;
    }
  },

  clearLocalActivities: () => {
    fetchToken += 1;
    set({ activitiesByDate: {}, isLoading: false, error: null });
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

async function rememberMonth(
  activitiesByDate: Record<string, Activity[]>,
  year: number,
  month: number,
): Promise<void> {
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return;
  }

  try {
    await saveMonthToCache(year, month, listMonth(activitiesByDate, year, month));
  } catch (error: unknown) {
    if (__DEV__) {
      console.error(error);
    }
  }
}

function listMonth(activitiesByDate: Record<string, Activity[]>, year: number, month: number): Activity[] {
  const prefix = monthPrefix(year, month);
  const activities: Activity[] = [];

  for (const [date, items] of Object.entries(activitiesByDate)) {
    if (date.startsWith(prefix)) {
      activities.push(...items);
    }
  }

  activities.sort(compareActivities);
  return activities;
}

function compareActivities(left: Activity, right: Activity): number {
  if (left.date !== right.date) {
    return left.date < right.date ? -1 : 1;
  }

  if (left.created_at === right.created_at) {
    return 0;
  }

  return left.created_at < right.created_at ? -1 : 1;
}

function yearOf(date: string): number {
  return parseDateKey(date)?.getFullYear() ?? Number.NaN;
}

function monthOf(date: string): number {
  const parsed = parseDateKey(date);
  return parsed ? parsed.getMonth() + 1 : Number.NaN;
}

async function leaveIfSessionExpired(error: unknown): Promise<boolean> {
  if (!activitiesService.isSessionActivityError(error)) {
    return false;
  }

  fetchToken += 1;
  setSessionNotice(authMessages.sessionExpired);
  useActivitiesStore.setState({ isLoading: false, error: null });
  await signOut().catch((signOutError: unknown) => {
    if (__DEV__) {
      console.error(signOutError);
    }
  });
  return true;
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
