import { useCallback, type ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from 'react-native';

import { ActivityCard } from '@components/activity/ActivityCard';
import { EmptyState } from '@components/ui/EmptyState';
import { activityCountLabel, activityMessages } from '@constants/activities';
import { formatDayHeading } from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

const EMPTY: Activity[] = [];

interface DayActivitiesProps {
  date: Date;
  dateKey: string;
  isLoading: boolean;
  hasError: boolean;
  bottomInset: number;
  onOpenActivity: (id: string) => void;
}

// Panel inferior del calendario: actividades del día seleccionado, sin cambiar de pantalla.
export function DayActivities({
  date,
  dateKey,
  isLoading,
  hasError,
  bottomInset,
  onOpenActivity,
}: DayActivitiesProps): ReactElement {
  const theme = useTheme();
  const activities = useActivitiesStore((state) => state.activitiesByDate[dateKey] ?? EMPTY);
  const showEmpty = !isLoading && !hasError && activities.length === 0;

  const renderActivity = useCallback<ListRenderItem<Activity>>(
    ({ item }) => <ActivityCard activity={item} onPress={onOpenActivity} />,
    [onOpenActivity],
  );

  return (
    <View style={styles.panel}>
      <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[theme.typography.h3, { color: theme.colors.text }]}>
          {formatDayHeading(date)}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          {activityCountLabel(activities.length)}
        </Text>
      </View>
      <FlatList
        data={activities}
        keyExtractor={activityKey}
        renderItem={renderActivity}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
        ListEmptyComponent={
          showEmpty ? (
            <EmptyState
              icon="calendar-outline"
              title={activityMessages.emptyTitle}
              description={activityMessages.emptyDescription}
            />
          ) : undefined
        }
      />
    </View>
  );
}

function activityKey(activity: Activity): string {
  return activity.id;
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    marginTop: spacing.xs,
  },
  heading: {
    gap: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
