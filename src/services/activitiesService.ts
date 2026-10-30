import { activityMessages } from '@constants/activities';
import { monthRange } from '@lib/dates';
import { supabase } from '@lib/supabase';
import type { Activity } from '@/types/activity';

const ACTIVITY_COLUMNS = 'id, user_id, date, title, category, note, created_at, updated_at';

export class ActivityRequestError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = 'ActivityRequestError';
    this.userMessage = userMessage;
  }
}

export async function fetchByMonth(year: number, month: number): Promise<Activity[]> {
  const range = monthRange(year, month);
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .gte('date', range.start)
    .lte('date', range.end)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw toActivityError(error);
  }

  return data ?? [];
}

export function toActivityMessage(error: unknown): string {
  if (error instanceof ActivityRequestError) {
    return error.userMessage;
  }

  if (__DEV__) {
    console.error(error);
  }

  return activityMessages.loadFailed;
}

function toActivityError(error: unknown): ActivityRequestError {
  if (__DEV__) {
    console.error(error);
  }

  if (isOffline(error)) {
    return new ActivityRequestError(activityMessages.offline);
  }

  return new ActivityRequestError(activityMessages.loadFailed);
}

function isOffline(error: unknown): boolean {
  if (!isRecord(error) || typeof error.message !== 'string') {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('network') || message.includes('fetch');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
