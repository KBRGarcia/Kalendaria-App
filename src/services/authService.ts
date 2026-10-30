import type { Session } from '@supabase/supabase-js';

import { authMessages } from '@constants/auth';
import { supabase } from '@lib/supabase';
import type { OtpMode, SignInResult } from '@/types/auth';

import { AuthRequestError, toAuthError } from './authErrors';
import {
  assertEmail,
  assertNewPassword,
  assertOtp,
  assertSignIn,
  isStaleLogin,
  normalizeEmail,
} from './authValidation';

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
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const normalizedEmail = normalizeEmail(email);
  assertSignIn(normalizedEmail, password);
  await passwordSignIn(normalizedEmail, password);

  // RLS solo permite leer el perfil propio, así que la regla de 30 días
  // se evalúa después de validar la contraseña.
  if (!(await loginNeedsOtp())) {
    await updateLastLogin();
    return { requiresOtp: false };
  }

  // Esa sesión no debe abrir la app: se cierra antes de pedir el código.
  await signOut();
  await sendLoginOtp(normalizedEmail);
  return { requiresOtp: true };
}

export async function verifyOtp(email: string, token: string, mode: OtpMode): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  assertOtp(token);

  const { error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: token.trim(),
    type: mode === 'login' ? 'email' : 'signup',
  });

  if (error) {
    throw toAuthError(error);
  }

  try {
    await updateLastLogin();
  } catch (updateError) {
    await signOut().catch(() => undefined);
    throw updateError instanceof AuthRequestError ? updateError : toAuthError(updateError);
  }
}

export async function resendOtp(email: string, mode: OtpMode): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  assertEmail(normalizedEmail);

  if (mode === 'signup') {
    const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
    if (error) {
      throw toAuthError(error);
    }
    return;
  }

  await sendLoginOtp(normalizedEmail);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (!error || error.code === 'session_not_found') {
    return;
  }

  throw toAuthError(error);
}

export async function getLastLogin(): Promise<string | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw toAuthError(userError);
  }

  if (!userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('last_login_at')
    .eq('id', userData.user.id)
    .single();

  if (error) {
    throw toAuthError(error);
  }

  return data.last_login_at;
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

async function loginNeedsOtp(): Promise<boolean> {
  const lastLoginAt = await getLastLogin();
  return isStaleLogin(lastLoginAt);
}

async function sendLoginOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    throw toAuthError(error);
  }
}
