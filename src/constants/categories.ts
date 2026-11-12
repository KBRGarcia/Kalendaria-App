export const ACTIVITY_CATEGORIES = {
  REUNION: 'reunion',
  PENDIENTE: 'pendiente',
  TRABAJO: 'trabajo',
  PERSONAL: 'personal',
  OTRO: 'otro',
} as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[keyof typeof ACTIVITY_CATEGORIES];

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  reunion: 'Reunión',
  pendiente: 'Pendiente',
  trabajo: 'Trabajo',
  personal: 'Personal',
  otro: 'Otro',
};

export const ACTIVITY_CATEGORY_LIST: readonly ActivityCategory[] = [
  ACTIVITY_CATEGORIES.REUNION,
  ACTIVITY_CATEGORIES.PENDIENTE,
  ACTIVITY_CATEGORIES.TRABAJO,
  ACTIVITY_CATEGORIES.PERSONAL,
  ACTIVITY_CATEGORIES.OTRO,
];

const CATEGORY_VALUES: ReadonlySet<string> = new Set(Object.values(ACTIVITY_CATEGORIES));

export function isActivityCategory(value: string): value is ActivityCategory {
  return CATEGORY_VALUES.has(value);
}

export function categoryLabel(category: string): string {
  if (isActivityCategory(category)) {
    return CATEGORY_LABELS[category];
  }

  return CATEGORY_LABELS.otro;
}

export const CUSTOM_CATEGORY_NAME_MAX = 30;

export interface CustomCategoryColor {
  value: string;
  name: string;
}

// Paleta cerrada: el servidor solo valida el formato hex; la app solo ofrece estos colores.
export const CUSTOM_CATEGORY_COLORS: readonly CustomCategoryColor[] = [
  { value: '#D64550', name: 'Rojo' },
  { value: '#E8723E', name: 'Naranja' },
  { value: '#C98A12', name: 'Ámbar' },
  { value: '#7A9A2E', name: 'Oliva' },
  { value: '#3E9E6B', name: 'Verde' },
  { value: '#00A4CC', name: 'Turquesa' },
  { value: '#2F80D1', name: 'Azul' },
  { value: '#4F6BD8', name: 'Índigo' },
  { value: '#7C5CD6', name: 'Violeta' },
  { value: '#D6559B', name: 'Rosa' },
  { value: '#8D6A4F', name: 'Marrón' },
  { value: '#6B7B84', name: 'Pizarra' },
];

export function isCustomCategoryColor(value: string): boolean {
  return CUSTOM_CATEGORY_COLORS.some((color) => color.value === value);
}

interface CategorizedActivity {
  category: string;
  custom_category_name?: string | null;
  custom_category_color?: string | null;
}

export interface ResolvedCategory {
  label: string;
  color: string;
}

// Nombre y color con los que se muestra una actividad. Las filas antiguas (o de la caché
// anterior a esta versión) no traen los campos personalizados y se ven como siempre.
export function resolveCategory(
  activity: CategorizedActivity,
  baseColors: Record<ActivityCategory, string>,
): ResolvedCategory {
  const base: ActivityCategory = isActivityCategory(activity.category) ? activity.category : ACTIVITY_CATEGORIES.OTRO;
  const name = activity.custom_category_name?.trim();
  const color = activity.custom_category_color;

  if (base === ACTIVITY_CATEGORIES.OTRO && name && color && isCustomCategoryColor(color)) {
    return { label: name, color };
  }

  return { label: CATEGORY_LABELS[base], color: baseColors[base] };
}
