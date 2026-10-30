import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthGrid } from '@components/calendar/MonthGrid';
import { MonthNavigator } from '@components/calendar/MonthNavigator';
import { WeekdayHeader } from '@components/calendar/WeekdayHeader';
import { IconButton } from '@components/ui/IconButton';
import { useMonthActivities } from '@hooks/useMonthActivities';
import { formatMonthTitle, shiftMonth } from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export function CalendarScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const title = formatMonthTitle(month);
  const { isLoading, error } = useMonthActivities(month);
  const activitiesByDate = useActivitiesStore((state) => state.activitiesByDate);

  const showPreviousMonth = useCallback(() => {
    setMonth((current) => shiftMonth(current, -1));
  }, []);

  const showNextMonth = useCallback(() => {
    setMonth((current) => shiftMonth(current, 1));
  }, []);

  const openDay = useCallback(
    (dateKey: string) => {
      setSelectedKey(dateKey);
      router.push({ pathname: '/day/[date]', params: { date: dateKey } });
    },
    [router],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[theme.typography.h1, { color: theme.colors.text }]}>
          {title}
        </Text>
        <IconButton
          icon="settings-outline"
          accessibilityLabel="Abrir ajustes"
          onPress={() => router.push('/settings')}
        />
      </View>
      <View style={styles.body}>
        <MonthNavigator month={month} onPrevious={showPreviousMonth} onNext={showNextMonth} />
        <WeekdayHeader />
        {error ? (
          <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}
        {isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
        <MonthGrid
          month={month}
          today={today}
          selectedKey={selectedKey}
          activitiesByDate={activitiesByDate}
          onSelectDay={openDay}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
