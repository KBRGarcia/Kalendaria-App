import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { clearAllCache } from '@lib/cache';
import * as authService from '@services/authService';
import { useActivitiesStore } from '@store/activitiesStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

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
      if (!active || get().isLoading) {
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
    set({ isLoading: true });

    try {
      await authService.signIn(email, password);
      await forgetActivities();
      const session = await authService.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });
    } catch (error) {
      await clearLeakedSession();
      set({ user: null, session: null, isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });

    try {
      await authService.signUp(email, password);
      await forgetActivities();
      const session = await authService.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });
    } catch (error) {
      await clearLeakedSession();
      set({ user: null, session: null, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });

    try {
      await authService.signOut();
      await forgetActivities();
      set({ user: null, session: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

async function forgetActivities(): Promise<void> {
  useActivitiesStore.getState().clearLocalActivities();

  try {
    await clearAllCache();
  } catch (error: unknown) {
    if (__DEV__) {
      console.error(error);
    }
  }
}

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
