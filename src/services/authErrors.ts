import { isAuthError } from '@supabase/supabase-js';

import { authMessages } from '@constants/auth';

const messagesByCode: Record<string, string> = {
  invalid_credentials: authMessages.invalidCredentials,
  email_not_confirmed: authMessages.emailNotConfirmed,
  user_already_exists: authMessages.duplicateEmail,
  email_exists: authMessages.duplicateEmail,
  otp_expired: authMessages.invalidOtp,
  weak_password: authMessages.weakPassword,
  over_request_rate_limit: authMessages.rateLimit,
  over_email_send_rate_limit: authMessages.rateLimit,
};

export class AuthRequestError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = 'AuthRequestError';
    this.userMessage = userMessage;
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AuthRequestError) {
    return error.userMessage;
  }

  if (__DEV__) {
    console.error(error);
  }

  return authMessages.generic;
}

export function toAuthError(error: unknown): AuthRequestError {
  if (error instanceof AuthRequestError) {
    return error;
  }

  if (__DEV__) {
    console.error(error);
  }

  if (isOfflineError(error)) {
    return new AuthRequestError(authMessages.offline);
  }

  if (isAlreadyRegistered(error)) {
    return new AuthRequestError(authMessages.duplicateEmail);
  }

  const code = isAuthError(error) ? error.code : readCode(error);
  return new AuthRequestError(messageForCode(code));
}

function messageForCode(code: string | undefined): string {
  if (!code) {
    return authMessages.generic;
  }

  return messagesByCode[code] ?? authMessages.generic;
}

function isOfflineError(error: unknown): boolean {
  if (isAuthError(error) && error.status === 0) {
    return true;
  }

  if (!isRecord(error) || typeof error.message !== 'string') {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('network') || message.includes('fetch');
}

function readCode(error: unknown): string | undefined {
  if (!isRecord(error) || typeof error.code !== 'string') {
    return undefined;
  }

  return error.code;
}

function isAlreadyRegistered(error: unknown): boolean {
  if (!isRecord(error) || typeof error.message !== 'string') {
    return false;
  }

  return /already registered|already exists/i.test(error.message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
