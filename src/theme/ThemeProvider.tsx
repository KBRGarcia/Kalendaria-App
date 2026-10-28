import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useThemeStore, type ThemePreference } from '../store/themeStore';
import {
  categoryColors,
  darkTheme,
  lightTheme,
  type CategoryColors,
  type ColorScheme,
  type ThemeColors,
} from './colors';
import { darkShadows, lightShadows, type ShadowScale } from './shadows';
import { layout, radius, spacing, type Layout, type Radius, type Spacing } from './spacing';
import { typography, type Typography } from './typography';

export interface AppTheme {
  colors: ThemeColors;
  categories: CategoryColors;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
  layout: Layout;
  shadows: ShadowScale;
  colorScheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<AppTheme | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ColorScheme {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return preference;
}

function buildTheme(
  colorScheme: ColorScheme,
  preference: ThemePreference,
  setPreference: (preference: ThemePreference) => void,
): AppTheme {
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? darkTheme : lightTheme,
    categories: categoryColors,
    typography,
    spacing,
    radius,
    layout,
    shadows: isDark ? darkShadows : lightShadows,
    colorScheme,
    preference,
    setPreference,
  };
}

export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const colorScheme = resolveColorScheme(preference, useColorScheme());
  const theme = useMemo(
    () => buildTheme(colorScheme, preference, setPreference),
    [colorScheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);

  if (theme === null) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  }

  return theme;
}
