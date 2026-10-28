export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const satisfies Spacing;

export interface Radius {
  button: number;
  input: number;
  card: number;
  modal: number;
  badge: number;
  day: number;
}

export const radius = {
  button: 12,
  input: 12,
  card: 16,
  modal: 20,
  badge: 100,
  day: 12,
} as const satisfies Radius;

export interface Layout {
  screenPaddingHorizontal: number;
  screenPaddingTop: number;
}

export const layout = {
  screenPaddingHorizontal: spacing.lg,
  screenPaddingTop: spacing.xl,
} as const satisfies Layout;
