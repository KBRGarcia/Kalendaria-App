import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';

import { useThemeHydrated } from '@store/themeStore';
import type { ColorScheme, ThemeColors } from '@theme/colors';
import { ThemeProvider, useTheme } from '@theme/ThemeProvider';
import { fontFamily } from '@theme/typography';

void SplashScreen.preventAutoHideAsync();

const interFonts = {
  [fontFamily.regular]: Inter_400Regular,
  [fontFamily.medium]: Inter_500Medium,
  [fontFamily.semiBold]: Inter_600SemiBold,
  [fontFamily.bold]: Inter_700Bold,
};

function useAppReady(): boolean {
  const [fontsLoaded, fontError] = useFonts(interFonts);
  const themeHydrated = useThemeHydrated();
  const ready = (fontsLoaded || fontError !== null) && themeHydrated;

  useEffect(() => {
    if (!fontError || !__DEV__) {
      return;
    }

    console.error(fontError);
  }, [fontError]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [ready]);

  return ready;
}

function createNavigationTheme(colorScheme: ColorScheme, colors: ThemeColors): Theme {
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };
}

function ThemedNavigation() {
  const { colorScheme, colors } = useTheme();
  const navigationTheme = useMemo(
    () => createNavigationTheme(colorScheme, colors),
    [colorScheme, colors],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const ready = useAppReady();

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedNavigation />
    </ThemeProvider>
  );
}
