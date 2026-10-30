import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ComponentProps, ReactElement } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  icon: IoniconName;
  accessibilityLabel: string;
  onPress: () => void;
}

export function IconButton({ icon, accessibilityLabel, onPress }: IconButtonProps): ReactElement {
  const theme = useTheme();
  const isDark = theme.colorScheme === 'dark';

  const surface: ViewStyle = {
    backgroundColor: isDark ? theme.colors.surfaceSecondary : theme.colors.surface,
    ...(isDark ? null : theme.shadows.sm),
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.hit, surface, pressed ? styles.pressed : null]}
    >
      <Ionicons name={icon} size={22} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
