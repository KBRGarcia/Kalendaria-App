import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Activity } from '@/types/activity';

const CACHE_PREFIX = '@kalendaria:cache:activities:';
const LAST_SYNC_KEY = '@kalendaria:lastSync';

interface CachedMonth {
  year: number;
  month: number;
  activities: Activity[];
  cachedAt: string;
}

export async function saveMonthToCache(year: number, month: number, activities: Activity[]): Promise<void> {
  const payload: CachedMonth = {
    year,
    month,
    activities,
    cachedAt: new Date().toISOString(),
  };

  await AsyncStorage.multiSet([
    [cacheKey(year, month), JSON.stringify(payload)],
    [LAST_SYNC_KEY, payload.cachedAt],
  ]);
}

export async function loadMonthFromCache(year: number, month: number): Promise<Activity[] | null> {
  const raw = await AsyncStorage.getItem(cacheKey(year, month));
  if (!raw) {
    return null;
  }

  const cached = parseCachedMonth(raw, year, month);
  return cached ? cached.activities : null;
}

export async function clearAllCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove([...cacheKeys, LAST_SYNC_KEY]);
}

function cacheKey(year: number, month: number): string {
  return `${CACHE_PREFIX}${year}-${String(month).padStart(2, '0')}`;
}

function parseCachedMonth(raw: string, year: number, month: number): CachedMonth | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isCachedMonth(parsed, year, month)) {
      return null;
    }

    return parsed;
  } catch (error: unknown) {
    if (__DEV__) {
      console.error(error);
    }

    return null;
  }
}

function isCachedMonth(value: unknown, year: number, month: number): value is CachedMonth {
  if (!isRecord(value) || value.year !== year || value.month !== month) {
    return false;
  }

  if (typeof value.cachedAt !== 'string' || !Array.isArray(value.activities)) {
    return false;
  }

  return value.activities.every(isActivity);
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.user_id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.title === 'string' &&
    typeof value.category === 'string' &&
    (value.note === null || typeof value.note === 'string') &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
