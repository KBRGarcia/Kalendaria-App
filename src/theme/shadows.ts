import { palette } from './colors';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowScale {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
}

const noShadow: ShadowStyle = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const lightShadows: ShadowScale = {
  sm: {
    shadowColor: palette.tinta,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: palette.tinta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: palette.tinta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const darkShadows: ShadowScale = {
  sm: noShadow,
  md: noShadow,
  lg: noShadow,
};
