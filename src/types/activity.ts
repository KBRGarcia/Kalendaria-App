import type { ActivityCategory } from '@constants/categories';

import type { Tables } from './database';

export type Activity = Tables<'activities'>;

export interface ActivityCreateInput {
  date: string;
  title: string;
  category: ActivityCategory;
  note?: string;
  customName?: string | null;
  customColor?: string | null;
}

export interface ActivityUpdateInput {
  title: string;
  category: ActivityCategory;
  note: string | null;
  customName?: string | null;
  customColor?: string | null;
}
