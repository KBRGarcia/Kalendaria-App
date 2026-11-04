import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryPicker } from '@components/activity/CategoryPicker';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '@constants/categories';
import { activityMessages } from '@constants/activities';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { parseActivityDraft, type ActivityDraft } from '@services/activityValidation';
import { toActivityMessage } from '@services/activitiesService';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export interface ActivityFormValues {
  title: string;
  category: ActivityCategory;
  note: string;
}

interface ActivityFormProps {
  heading: string;
  dateLabel: string;
  initial: ActivityFormValues;
  saving: boolean;
  error: string | null;
  onSubmit: (draft: ActivityDraft) => void;
  onDelete?: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function ActivityForm({
  heading,
  dateLabel,
  initial,
  saving,
  error,
  onSubmit,
  onDelete,
  onDirtyChange,
}: ActivityFormProps): ReactElement {
  const theme = useTheme();
  const isConnected = useNetworkStatus();
  const offline = isConnected === false;
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [note, setNote] = useState(initial.note);
  const [titleError, setTitleError] = useState<string | null>(null);

  function publish(nextTitle: string, nextCategory: ActivityCategory, nextNote: string): void {
    onDirtyChange(nextTitle !== initial.title || nextCategory !== initial.category || nextNote !== initial.note);
  }

  function handleSubmit(): void {
    if (offline) {
      return;
    }

    try {
      const draft = parseActivityDraft(title, category, note);
      setTitleError(null);
      onSubmit(draft);
    } catch (submitError) {
      const message = toActivityMessage(submitError);
      setTitleError(message);
    }
  }

  return (
    <View style={styles.form}>
      <Text accessibilityRole="header" style={[theme.typography.h2, { color: theme.colors.text }]}>
        {heading}
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{dateLabel}</Text>
      <Input
        label="Título"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setTitleError(null);
          publish(value, category, note);
        }}
        placeholder="Ej: Reunión con el equipo"
        autoCapitalize="sentences"
        maxLength={100}
        error={titleError ?? undefined}
      />
      <View style={styles.field}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Categoría</Text>
        <CategoryPicker
          value={category}
          onChange={(next) => {
            setCategory(next);
            publish(title, next, note);
          }}
        />
      </View>
      <Input
        label="Nota (opcional)"
        value={note}
        onChangeText={(value) => {
          setNote(value);
          publish(title, category, value);
        }}
        placeholder="Añade detalles si lo necesitas"
        autoCapitalize="sentences"
        autoCorrect
        multiline
        maxLength={500}
      />
      {offline || error ? (
        <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.error }]}>
          {offline ? activityMessages.offline : error}
        </Text>
      ) : null}
      <View style={styles.footer}>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar actividad"
            disabled={saving || offline}
            onPress={onDelete}
            style={[styles.delete, offline ? styles.inactive : null]}
          >
            <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
          </Pressable>
        ) : (
          <View style={styles.delete} />
        )}
        <View style={styles.save}>
          <Button label="Guardar" onPress={handleSubmit} loading={saving} disabled={offline} fullWidth />
        </View>
      </View>
    </View>
  );
}

export const EMPTY_ACTIVITY_FORM: ActivityFormValues = {
  title: '',
  category: ACTIVITY_CATEGORIES.REUNION,
  note: '',
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  delete: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    opacity: 0.4,
  },
  save: {
    flex: 1,
  },
});
