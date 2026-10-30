export const ACTIVITY_CATEGORIES = {
  REUNION: 'reunion',
  PENDIENTE: 'pendiente',
  TRABAJO: 'trabajo',
  PERSONAL: 'personal',
  OTRO: 'otro',
} as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[keyof typeof ACTIVITY_CATEGORIES];

const CATEGORY_VALUES: ReadonlySet<string> = new Set(Object.values(ACTIVITY_CATEGORIES));

export function isActivityCategory(value: string): value is ActivityCategory {
  return CATEGORY_VALUES.has(value);
}
