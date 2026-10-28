export type ColorScheme = 'light' | 'dark';

export const palette = {
  coral: '#E8723E',
  durazno: '#F7A769',
  arena: '#F2ECEA',
  celestePastel: '#A8D1E2',
  turquesa: '#00A4CC',
  turquesaOscuro: '#007A99',
  coralOscuro: '#C25A2C',
  tinta: '#1F2A2E',
  tintaSecundaria: '#5A6A70',
  grisBorde: '#D9D2CF',
  blanco: '#FFFFFF',
  nocheProfunda: '#0E1C22',
  nocheMedia: '#162A32',
  nocheBorde: '#223A44',
  arenaSuave: '#E6DFDB',
  arenaAtenuada: '#9B938F',
  verdeSalvia: '#6EAF8C',
  grisCalido: '#8C8279',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  accent: string;
  accentPressed: string;
  border: string;
  divider: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  background: palette.arena,
  surface: palette.blanco,
  surfaceSecondary: '#F8F4F2',
  text: palette.tinta,
  textSecondary: palette.tintaSecundaria,
  textInverse: palette.blanco,
  primary: palette.turquesa,
  primaryPressed: palette.turquesaOscuro,
  accent: palette.coral,
  accentPressed: palette.coralOscuro,
  border: palette.grisBorde,
  divider: '#E8E2DF',
  success: palette.verdeSalvia,
  error: palette.coral,
  warning: palette.durazno,
  info: palette.celestePastel,
  shadow: 'rgba(31, 42, 46, 0.08)',
};

export const darkTheme: ThemeColors = {
  background: palette.nocheProfunda,
  surface: palette.nocheMedia,
  surfaceSecondary: '#1B333C',
  text: palette.arenaSuave,
  textSecondary: palette.arenaAtenuada,
  textInverse: palette.nocheProfunda,
  primary: palette.turquesa,
  primaryPressed: '#33B8DB',
  accent: palette.coral,
  accentPressed: '#F08A5B',
  border: palette.nocheBorde,
  divider: '#1B333C',
  success: palette.verdeSalvia,
  error: palette.coral,
  warning: palette.durazno,
  info: palette.celestePastel,
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export interface CategoryColors {
  reunion: string;
  pendiente: string;
  trabajo: string;
  personal: string;
  otro: string;
}

export const categoryColors: CategoryColors = {
  reunion: palette.turquesa,
  pendiente: palette.coral,
  trabajo: palette.durazno,
  personal: palette.verdeSalvia,
  otro: palette.grisCalido,
};
