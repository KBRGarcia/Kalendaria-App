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
