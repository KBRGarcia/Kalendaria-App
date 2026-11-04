import type { ComponentProps, ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={theme.colors.textSecondary} style={styles.icon} />
      <Text style={[theme.typography.h3, styles.center, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[theme.typography.body, styles.center, { color: theme.colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
  },
  icon: {
    opacity: 0.5,
  },
  center: {
    textAlign: 'center',
  },
});
