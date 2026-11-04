import { activityMessages } from '@constants/activities';
import type { ActivityCategory } from '@constants/categories';

import { ActivityRequestError } from './activitiesService';

const TITLE_MAX = 100;
const NOTE_MAX = 500;

export interface ActivityDraft {
  title: string;
  category: ActivityCategory;
  note: string | null;
}

export function parseActivityDraft(title: string, category: ActivityCategory, note: string): ActivityDraft {
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

  return {
    title: trimmedTitle,
    category,
    note: trimmedNote.length === 0 ? null : trimmedNote,
  };
}
