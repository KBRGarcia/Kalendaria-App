export const OTP_MODES = {
  signup: 'signup',
  login: 'login',
} as const;

export type OtpMode = (typeof OTP_MODES)[keyof typeof OTP_MODES];

export interface SignInResult {
  requiresOtp: boolean;
}

export function isOtpMode(value: string): value is OtpMode {
  return value === OTP_MODES.signup || value === OTP_MODES.login;
}
