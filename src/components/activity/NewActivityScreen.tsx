import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ReactElement } from 'react';
import { Alert, Text } from 'react-native';

import { ActivityForm, EMPTY_ACTIVITY_FORM } from '@components/activity/ActivityForm';
import { ActivitySheet } from '@components/activity/ActivitySheet';
import { activityMessages } from '@constants/activities';
import { formatDayHeading, parseDateKey } from '@lib/dates';
import type { ActivityDraft } from '@services/activityValidation';
import { toActivityMessage } from '@services/activitiesService';
import { useActivitiesStore } from '@store/activitiesStore';
import { useTheme } from '@theme/ThemeProvider';

export function NewActivityScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const dateKey = typeof date === 'string' ? date : '';
  const parsed = parseDateKey(dateKey);
  const createActivity = useActivitiesStore((state) => state.createActivity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);

  function requestClose(): void {
    if (saving) {
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
      await createActivity({
        date: dateKey,
        title: draft.title,
        category: draft.category,
        note: draft.note ?? undefined,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      router.back();
    } catch (submitError) {
      setError(toActivityMessage(submitError));
      setSaving(false);
    }
  }

  return (
    <ActivitySheet onDismiss={requestClose}>
      {parsed ? (
        <ActivityForm
          heading="Nueva actividad"
          dateLabel={formatDayHeading(parsed)}
          initial={EMPTY_ACTIVITY_FORM}
          saving={saving}
          error={error}
          onDirtyChange={(value) => {
            dirty.current = value;
          }}
          onSubmit={(draft) => {
            void handleSubmit(draft);
          }}
        />
      ) : (
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{activityMessages.invalidDate}</Text>
      )}
    </ActivitySheet>
  );
}

function confirmDiscard(onDiscard: () => void): void {
  Alert.alert(activityMessages.discardTitle, activityMessages.discardMessage, [
    { text: 'Seguir editando', style: 'cancel' },
    { text: 'Descartar', style: 'destructive', onPress: onDiscard },
  ]);
}
