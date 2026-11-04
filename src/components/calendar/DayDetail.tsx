import { useRouter } from 'expo-router';
import { useCallback, type ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@components/activity/ActivityCard';
import { EmptyState } from '@components/ui/EmptyState';
import { Fab } from '@components/ui/Fab';
import { IconButton } from '@components/ui/IconButton';
import { activityCountLabel, activityMessages } from '@constants/activities';
import { useMonthActivities } from '@hooks/useMonthActivities';
import { formatDayHeading } from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

interface DayDetailProps {
  date: Date;
  dateKey: string;
}

export function DayDetail({ date, dateKey }: DayDetailProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading, error } = useMonthActivities(date);
  const activities = useActivitiesStore((state) => state.activitiesByDate[dateKey] ?? EMPTY);
  const showEmpty = !isLoading && activities.length === 0 && !error;

  const openActivity = useCallback(
    (id: string) => {
      router.push({ pathname: '/activity/[id]', params: { id } });
    },
    [router],
  );

  const createActivity = useCallback(() => {
    router.push({ pathname: '/activity/new', params: { date: dateKey } });
  }, [dateKey, router]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Volver al calendario" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[theme.typography.h2, styles.title, { color: theme.colors.text }]}>
          {formatDayHeading(date)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={[theme.typography.caption, styles.count, { color: theme.colors.textSecondary }]}>
        {activityCountLabel(activities.length)}
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={[theme.typography.caption, styles.count, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
      <FlatList
        data={activities}
        keyExtractor={activityKey}
        renderItem={({ item }) => <ActivityCard activity={item} onPress={openActivity} />}
        style={styles.listFill}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing['3xl'] + spacing.lg }]}
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
      <View style={[styles.fab, { bottom: insets.bottom + spacing.lg, right: spacing.lg }]}>
        <Fab accessibilityLabel="Crear nueva actividad" onPress={createActivity} />
      </View>
    </SafeAreaView>
  );
}

const EMPTY: Activity[] = [];

function activityKey(activity: Activity): string {
  return activity.id;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  count: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  listFill: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.md,
  },
  fab: {
    position: 'absolute',
  },
});
