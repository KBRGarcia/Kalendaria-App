import { activityMessages } from '@constants/activities';
import {
  ACTIVITY_CATEGORIES,
  CUSTOM_CATEGORY_NAME_MAX,
  isCustomCategoryColor,
  type ActivityCategory,
} from '@constants/categories';

import { ActivityRequestError } from './activitiesService';

const TITLE_MAX = 100;
const NOTE_MAX = 500;

export interface ActivityDraft {
  title: string;
  category: ActivityCategory;
  note: string | null;
  customName: string | null;
  customColor: string | null;
}

export interface CustomCategoryInput {
  name: string;
  color: string | null;
}

export function parseActivityDraft(
  title: string,
  category: ActivityCategory,
  note: string,
  custom?: CustomCategoryInput,
): ActivityDraft {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    throw new ActivityRequestError(activityMessages.titleRequired);
  }

  if (trimmedTitle.length > TITLE_MAX) {
    throw new ActivityRequestError(activityMessages.titleTooLong);
  }

  const trimmedNote = note.trim();
  if (trimmedNote.length > NOTE_MAX) {
    throw new ActivityRequestError(activityMessages.noteTooLong);
  }

  const { customName, customColor } = parseCustomCategory(category, custom);

  return {
    title: trimmedTitle,
    category,
    note: trimmedNote.length === 0 ? null : trimmedNote,
    customName,
    customColor,
  };
}

// Solo "Otro" admite nombre y color propios. Sin nombre se comporta como el "Otro" de siempre;
// el color se descarta. Con cualquier otra categoría ambos campos se fuerzan a null.
function parseCustomCategory(
  category: ActivityCategory,
  custom: CustomCategoryInput | undefined,
): { customName: string | null; customColor: string | null } {
  const none = { customName: null, customColor: null };
  if (category !== ACTIVITY_CATEGORIES.OTRO || !custom) {
    return none;
  }

  const name = custom.name.trim();
  if (name.length === 0) {
    return none;
  }

  if (name.length > CUSTOM_CATEGORY_NAME_MAX) {
    throw new ActivityRequestError(activityMessages.customNameTooLong);
  }

  if (custom.color === null || !isCustomCategoryColor(custom.color)) {
    throw new ActivityRequestError(activityMessages.customColorRequired);
  }

  return { customName: name, customColor: custom.color };
}
