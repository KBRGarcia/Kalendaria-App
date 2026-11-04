import { activityMessages } from '@constants/activities';
import { authMessages } from '@constants/auth';
import { monthRange } from '@lib/dates';
import { supabase } from '@lib/supabase';
import { isSessionExpiredError } from '@services/authErrors';
import type { Activity, ActivityCreateInput, ActivityUpdateInput } from '@/types/activity';

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

export async function create(input: ActivityCreateInput): Promise<Activity> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      date: input.date,
      title: input.title.trim(),
      category: input.category,
      note: emptyToNull(input.note),
    })
    .select(ACTIVITY_COLUMNS)
    .single();

  if (error) {
    throw toActivityError(error, activityMessages.saveFailed);
  }

  return data;
}

export async function update(id: string, input: ActivityUpdateInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .update({
      title: input.title.trim(),
      category: input.category,
      note: input.note,
    })
    .eq('id', id)
    .select(ACTIVITY_COLUMNS)
    .single();

  if (error) {
    throw toActivityError(error, activityMessages.saveFailed);
  }

  return data;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) {
    throw toActivityError(error, activityMessages.deleteFailed);
  }
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

export function isOfflineActivityError(error: unknown): boolean {
  return error instanceof ActivityRequestError && error.userMessage === activityMessages.offline;
}

export function isSessionActivityError(error: unknown): boolean {
  return error instanceof ActivityRequestError && error.userMessage === authMessages.sessionExpired;
}

function toActivityError(error: unknown, fallback: string = activityMessages.loadFailed): ActivityRequestError {
  if (__DEV__) {
    console.error(error);
  }

  if (isOffline(error)) {
    return new ActivityRequestError(activityMessages.offline);
  }

  if (isSessionExpiredError(error)) {
    return new ActivityRequestError(authMessages.sessionExpired);
  }

  return new ActivityRequestError(fallback);
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

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw toActivityError(error, activityMessages.saveFailed);
  }

  if (!data.user) {
    throw new ActivityRequestError(activityMessages.saveFailed);
  }

  return data.user.id;
}

function emptyToNull(note: string | undefined): string | null {
  const trimmed = note?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
}
