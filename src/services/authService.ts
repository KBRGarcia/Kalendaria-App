import type { Session } from '@supabase/supabase-js';

import { authMessages } from '@constants/auth';
import { supabase } from '@lib/supabase';

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

  await updateLastLogin();
}

export async function signIn(email: string, password: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  assertSignIn(normalizedEmail, password);
  await passwordSignIn(normalizedEmail, password);
  await updateLastLogin();
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
