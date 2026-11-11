import type { Session } from '@supabase/supabase-js';

import { authMessages } from '@constants/auth';
import { supabase } from '@lib/supabase';
import type { ThemePreference } from '@store/themeStore';

import { AuthRequestError, toAuthError } from './authErrors';
import { assertNewPassword, assertSignIn, normalizeEmail } from './authValidation';

export async function signUp(email: string, password: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  assertNewPassword(normalizedEmail, password);

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw toAuthError(error);
  }

  if (data.user?.identities?.length === 0) {
    throw new AuthRequestError(authMessages.duplicateEmail);
  }

  if (!data.user) {
    throw new AuthRequestError(authMessages.generic);
  }

  if (!data.session) {
    throw new AuthRequestError(authMessages.confirmationStillRequired);
  }

  await recordLastLogin();
}

export async function signIn(email: string, password: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  assertSignIn(normalizedEmail, password);
  await passwordSignIn(normalizedEmail, password);
  await recordLastLogin();
}

// last_login_at es informativo: si falla (red intermitente, RPC no disponible)
// no debe impedir el acceso de alguien que ya se autenticó correctamente.
async function recordLastLogin(): Promise<void> {
  try {
    await updateLastLogin();
  } catch (error: unknown) {
    if (__DEV__) {
      console.error(error);
    }
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (!error || error.code === 'session_not_found') {
    return;
  }

  throw toAuthError(error);
}

export async function updateLastLogin(): Promise<void> {
  const { error } = await supabase.rpc('update_last_login');
  if (error) {
    throw toAuthError(error);
  }
}

export async function updateThemePreference(preference: ThemePreference): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('profiles').update({ theme_preference: preference }).eq('id', userId);

  if (error) {
    throw toAuthError(error);
  }
}

export async function loadThemePreference(): Promise<ThemePreference | null> {
  const userId = await currentUserId();
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('theme_preference')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw toAuthError(error);
  }

  return isThemePreference(data?.theme_preference) ? data.theme_preference : null;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw toAuthError(error);
  }

  return data.session;
}

export function onAuthStateChange(onSession: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(session);
  });

  return () => data.subscription.unsubscribe();
}

async function passwordSignIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw toAuthError(error);
  }
}

const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

async function currentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw toAuthError(error);
  }

  return data.user?.id ?? null;
}

async function requireUserId(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) {
    throw new AuthRequestError(authMessages.generic);
  }

  return userId;
}
