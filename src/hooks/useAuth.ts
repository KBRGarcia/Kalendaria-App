import { useEffect } from 'react';

import { useAuthStore } from '@store/authStore';
import type { OtpMode, SignInResult } from '@/types/auth';

interface AuthActions {
  email: string | undefined;
  isLoading: boolean;
  hasSession: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string, mode: OtpMode) => Promise<void>;
  resendOtp: (email: string, mode: OtpMode) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthGate {
  isInitialized: boolean;
  isLoading: boolean;
  canEnterApp: boolean;
}

export function useAuthLifecycle(): void {
  useEffect(() => useAuthStore.getState().initialize(), []);
}

export function useAuthInitialized(): boolean {
  return useAuthStore((state) => state.isInitialized);
}

export function useAuth(): AuthActions {
  const email = useAuthStore((state) => state.user?.email);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasSession = useAuthStore((state) => state.session !== null);
  const signIn = useAuthStore((state) => state.signIn);
  const signUpStore = useAuthStore((state) => state.signUp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const signOut = useAuthStore((state) => state.signOut);

  return {
    email,
    isLoading,
    signIn,
    signUp: async (emailAddress, password) => {
      await signUpStore(emailAddress, password);
      return useAuthStore.getState().session === null;
    },
    verifyOtp,
    resendOtp,
    signOut,
    hasSession,
  };
}

export function useAuthGate(): AuthGate {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const pendingOtp = useAuthStore((state) => state.pendingOtp);
  const hasSession = useAuthStore((state) => state.session !== null);

  return {
    isInitialized,
    isLoading,
    canEnterApp: isInitialized && !isLoading && hasSession && !pendingOtp,
  };
}
