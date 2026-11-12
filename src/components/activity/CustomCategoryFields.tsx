import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Input } from '@components/ui/Input';
import { CUSTOM_CATEGORY_COLORS, CUSTOM_CATEGORY_NAME_MAX } from '@constants/categories';
import { palette } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface CustomCategoryFieldsProps {
  name: string;
  color: string | null;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}

const SWATCH = 40;

export function CustomCategoryFields({
  name,
  color,
  onNameChange,
  onColorChange,
}: CustomCategoryFieldsProps): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <Input
        label="Nombre de la categoría (opcional)"
        value={name}
        onChangeText={onNameChange}
        placeholder="Ej: Gimnasio"
        autoCapitalize="sentences"
        maxLength={CUSTOM_CATEGORY_NAME_MAX}
      />
      <View style={styles.field}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Color</Text>
        <View style={styles.swatches}>
          {CUSTOM_CATEGORY_COLORS.map((option) => {
            const selected = option.value === color;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Color ${option.name}`}
                accessibilityState={{ selected }}
                onPress={() => onColorChange(option.value)}
                style={[
                  styles.swatch,
                  { backgroundColor: option.value, borderColor: selected ? theme.colors.text : 'transparent' },
                ]}
              >
                {selected ? <Ionicons name="checkmark" size={22} color={palette.blanco} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
