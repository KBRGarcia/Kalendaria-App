import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryPicker } from '@components/activity/CategoryPicker';
import { CustomCategoryFields } from '@components/activity/CustomCategoryFields';
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
  customName: string;
  customColor: string | null;
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
  const [customName, setCustomName] = useState(initial.customName);
  const [customColor, setCustomColor] = useState(initial.customColor);
  const [titleError, setTitleError] = useState<string | null>(null);

  function publish(next: Partial<ActivityFormValues>): void {
    const current: ActivityFormValues = { title, category, note, customName, customColor, ...next };
    onDirtyChange(
      current.title !== initial.title ||
        current.category !== initial.category ||
        current.note !== initial.note ||
        current.customName !== initial.customName ||
        current.customColor !== initial.customColor,
    );
  }

  function handleSubmit(): void {
    if (offline) {
      return;
    }

    try {
      const draft = parseActivityDraft(title, category, note, { name: customName, color: customColor });
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
          publish({ title: value });
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
          otherLabel={customName.trim()}
          otherColor={customColor ?? undefined}
          onChange={(next) => {
            setCategory(next);
            publish({ category: next });
          }}
        />
      </View>
      {category === ACTIVITY_CATEGORIES.OTRO ? (
        <CustomCategoryFields
          name={customName}
          color={customColor}
          onNameChange={(value) => {
            setCustomName(value);
            publish({ customName: value });
          }}
          onColorChange={(value) => {
            setCustomColor(value);
            publish({ customColor: value });
          }}
        />
      ) : null}
      <Input
        label="Nota (opcional)"
        value={note}
        onChangeText={(value) => {
          setNote(value);
          publish({ note: value });
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
            accessibilityState={{ disabled: saving || offline }}
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
  customName: '',
  customColor: null,
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
