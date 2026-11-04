import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState, type ReactElement } from 'react';
import { Alert, Text } from 'react-native';

import { ActivityForm, type ActivityFormValues } from '@components/activity/ActivityForm';
import { ActivitySheet } from '@components/activity/ActivitySheet';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { activityMessages } from '@constants/activities';
import { ACTIVITY_CATEGORIES, isActivityCategory } from '@constants/categories';
import { formatDayHeading, parseDateKey } from '@lib/dates';
import type { ActivityDraft } from '@services/activityValidation';
import { toActivityMessage } from '@services/activitiesService';
import { findActivity, useActivitiesStore } from '@store/activitiesStore';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

interface EditActivityScreenProps {
  activityId: string;
}

export function EditActivityScreen({ activityId }: EditActivityScreenProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const activity = useActivitiesStore((state) => findActivity(state.activitiesByDate, activityId));
  const updateActivity = useActivitiesStore((state) => state.updateActivity);
  const deleteActivity = useActivitiesStore((state) => state.deleteActivity);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const parsed = activity ? parseDateKey(activity.date) : null;

  function requestClose(): void {
    if (saving || deleting) {
      return;
    }

    if (!dirty.current) {
      router.back();
      return;
    }

    confirmDiscard(() => router.back());
  }

  async function handleSubmit(draft: ActivityDraft): Promise<void> {
    setSaving(true);
    setError(null);

    try {
      await updateActivity(activityId, draft);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      router.back();
    } catch (submitError) {
      setError(toActivityMessage(submitError));
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setDeleting(true);

    try {
      await deleteActivity(activityId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      router.back();
    } catch (deleteError) {
      setError(toActivityMessage(deleteError));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <ActivitySheet onDismiss={requestClose}>
      {activity && parsed ? (
        <ActivityForm
          heading="Editar actividad"
          dateLabel={formatDayHeading(parsed)}
          initial={toFormValues(activity)}
          saving={saving || deleting}
          error={error}
          onDirtyChange={(value) => {
            dirty.current = value;
          }}
          onDelete={() => setConfirming(true)}
          onSubmit={(draft) => {
            void handleSubmit(draft);
          }}
        />
      ) : (
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{activityMessages.missingActivity}</Text>
      )}
      <ConfirmDialog
        visible={confirming}
        title={activityMessages.deleteTitle}
        message={activityMessages.deleteMessage}
        busy={deleting}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </ActivitySheet>
  );
}

function toFormValues(activity: Activity): ActivityFormValues {
  return {
    title: activity.title,
    category: isActivityCategory(activity.category) ? activity.category : ACTIVITY_CATEGORIES.REUNION,
    note: activity.note ?? '',
  };
}

function confirmDiscard(onDiscard: () => void): void {
  Alert.alert(activityMessages.discardTitle, activityMessages.discardMessage, [
    { text: 'Seguir editando', style: 'cancel' },
    { text: 'Descartar', style: 'destructive', onPress: onDiscard },
  ]);
}
