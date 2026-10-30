import { authMessages } from '@constants/auth';

import { AuthRequestError } from './authErrors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d).{8,}$/u;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthRequestError(authMessages.invalidEmail);
  }
}

export function assertSignIn(email: string, password: string): void {
  if (email.length === 0 || password.length === 0) {
    throw new AuthRequestError(authMessages.missingFields);
  }

  assertEmail(email);
}

export function assertNewPassword(email: string, password: string): void {
  assertEmail(email);

  if (!PASSWORD_PATTERN.test(password)) {
    throw new AuthRequestError(authMessages.weakPassword);
  }
}

export function assertRegistration(email: string, password: string, confirmPassword: string): void {
  if (email.length === 0 || password.length === 0 || confirmPassword.length === 0) {
    throw new AuthRequestError(authMessages.incompleteSignUp);
  }

  assertNewPassword(email, password);

  if (password !== confirmPassword) {
    throw new AuthRequestError(authMessages.passwordMismatch);
  }
}
