import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const themePreferences = ['light', 'dark', 'system'] as const;

function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.some((preference) => preference === value);
}

function mergeThemeState(persistedState: unknown, currentState: ThemeState): ThemeState {
  if (typeof persistedState !== 'object' || persistedState === null || !('preference' in persistedState)) {
    return currentState;
  }

  if (!isThemePreference(persistedState.preference)) {
    return currentState;
  }

  return { ...currentState, preference: persistedState.preference };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: '@kalendaria:theme',
      storage: createJSONStorage(() => AsyncStorage),
      merge: mergeThemeState,
    },
  ),
);

export function useThemeHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useThemeStore.persist.hasHydrated());

  useEffect(() => {
    if (useThemeStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return useThemeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}
