export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

export interface Typography {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  body: TypographyStyle;
  bodyStrong: TypographyStyle;
  caption: TypographyStyle;
  small: TypographyStyle;
}

export const typography: Typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  h1: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontFamily: fontFamily.semiBold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fontFamily.semiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
};
