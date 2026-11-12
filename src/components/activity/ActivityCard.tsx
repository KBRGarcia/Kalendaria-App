import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { resolveCategory } from '@constants/categories';
import { radius, spacing } from '@theme/spacing';
import { useTheme, type AppTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  onPress: (id: string) => void;
}

export const ActivityCard = memo(function ActivityCard({ activity, onPress }: ActivityCardProps): ReactElement {
  const theme = useTheme();
  const { color, label } = resolveCategory(activity, theme.categories);
  const note = activity.note?.trim();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${label}`}
      onPress={() => onPress(activity.id)}
      style={({ pressed }) => [styles.card, cardSurface(theme), pressed ? styles.pressed : null]}
    >
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]}>{activity.title}</Text>
        {note ? (
          <Text numberOfLines={2} style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {note}
          </Text>
        ) : null}
        <View style={[styles.badge, { backgroundColor: `${color}26` }]}>
          <Text style={[theme.typography.small, { color }]}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
});

function cardSurface(theme: AppTheme): ViewStyle {
  const isDark = theme.colorScheme === 'dark';

  return {
    backgroundColor: theme.colors.surface,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.colors.border,
    ...(isDark ? null : theme.shadows.sm),
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  bar: {
    width: 4,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.badge,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
