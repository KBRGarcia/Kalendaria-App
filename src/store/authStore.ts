import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import * as authService from '@services/authService';
import type { OtpMode, SignInResult } from '@/types/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  pendingOtp: boolean;
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string, mode: OtpMode) => Promise<void>;
  resendOtp: (email: string, mode: OtpMode) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  pendingOtp: false,

  initialize: () => {
    let active = true;

    void authService
      .getSession()
      .then((session) => {
        if (!active) {
          return;
        }

        set({ session, user: session?.user ?? null, isInitialized: true });
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.error(error);
        }

        if (!active) {
          return;
        }

        set({ session: null, user: null, isInitialized: true });
      });

    const unsubscribe = authService.onAuthStateChange((session) => {
      if (!active || get().isLoading || get().pendingOtp) {
        return;
      }

      set({ session, user: session?.user ?? null, isInitialized: true });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  },

  signIn: async (email, password) => {
    set({ isLoading: true, pendingOtp: false });

    try {
      const result = await authService.signIn(email, password);
      if (result.requiresOtp) {
        set({ user: null, session: null, isLoading: false, pendingOtp: true });
        return result;
      }

      const session = await authService.getSession();
      set({ session, user: session?.user ?? null, isLoading: false, pendingOtp: false });
      return result;
    } catch (error) {
      await clearLeakedSession();
      set({ user: null, session: null, isLoading: false, pendingOtp: false });
      throw error;
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true, pendingOtp: false });

    try {
      await authService.signUp(email, password);
      const session = await authService.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });
    } catch (error) {
      await clearLeakedSession();
      set({ isLoading: false });
      throw error;
    }
  },

  verifyOtp: async (email, token, mode) => {
    set({ isLoading: true });

    try {
      await authService.verifyOtp(email, token, mode);
      const session = await authService.getSession();
      set({ session, user: session?.user ?? null, isLoading: false, pendingOtp: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resendOtp: async (email, mode) => {
    set({ isLoading: true });

    try {
      await authService.resendOtp(email, mode);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });

    try {
      await authService.signOut();
      set({ user: null, session: null, isLoading: false, pendingOtp: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

async function clearLeakedSession(): Promise<void> {
  const session = await authService.getSession().catch(() => null);
  if (!session) {
    return;
  }

  await authService.signOut().catch((error: unknown) => {
    if (__DEV__) {
      console.error(error);
    }
  });
}
