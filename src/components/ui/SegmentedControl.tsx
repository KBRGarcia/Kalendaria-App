import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const SEGMENT_RADIUS = 10;

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): ReactElement {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: theme.colors.surfaceSecondary }]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected ? { backgroundColor: theme.colors.primary } : null]}
          >
            <Text
              style={[
                theme.typography.small,
                styles.label,
                { color: selected ? palette.blanco : theme.colors.text },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: SEGMENT_RADIUS,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: SEGMENT_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
});
