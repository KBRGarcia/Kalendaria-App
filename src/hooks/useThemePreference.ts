import { useEffect } from 'react';

import { loadThemePreference } from '@services/authService';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';

export function useThemePreferenceSync(): void {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const setPreference = useThemeStore((state) => state.setPreference);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    void loadThemePreference()
      .then((preference) => {
        if (active && preference) {
          setPreference(preference);
        }
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.error(error);
        }
      });

    return () => {
      active = false;
    };
  }, [setPreference, userId]);
}
