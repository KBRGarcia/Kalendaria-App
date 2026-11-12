import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ACTIVITY_CATEGORIES, ACTIVITY_CATEGORY_LIST, categoryLabel, type ActivityCategory } from '@constants/categories';
import { palette } from '@theme/colors';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface CategoryPickerProps {
  value: ActivityCategory;
  onChange: (category: ActivityCategory) => void;
  otherLabel?: string;
  otherColor?: string;
}

export function CategoryPicker({ value, onChange, otherLabel, otherColor }: CategoryPickerProps): ReactElement {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {ACTIVITY_CATEGORY_LIST.map((category) => {
        const selected = category === value;
        const isOther = category === ACTIVITY_CATEGORIES.OTRO;
        const color = (isOther ? otherColor : undefined) ?? theme.categories[category];
        const label = (isOther ? otherLabel : undefined) || categoryLabel(category);

        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onChange(category)}
            style={[styles.pill, { backgroundColor: selected ? color : theme.colors.surfaceSecondary }]}
          >
            <Text style={[theme.typography.small, { color: selected ? palette.blanco : theme.colors.text }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.badge,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
