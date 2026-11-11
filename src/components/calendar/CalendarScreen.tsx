import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthGrid } from '@components/calendar/MonthGrid';
import { MonthNavigator } from '@components/calendar/MonthNavigator';
import { WeekdayHeader } from '@components/calendar/WeekdayHeader';
import { IconButton } from '@components/ui/IconButton';
import { useMonthActivities } from '@hooks/useMonthActivities';
import { formatMonthTitle, isSameCalendarDay, shiftMonth } from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export function CalendarScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [today, setToday] = useState(() => new Date());
  const title = formatMonthTitle(month);
  const { isLoading, error } = useMonthActivities(month);
  const activitiesByDate = useActivitiesStore((state) => state.activitiesByDate);

  // Si la app queda abierta pasada la medianoche, "hoy" se actualiza al volver al primer plano.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday((current) => (isSameCalendarDay(current, new Date()) ? current : new Date()));
      }
    });

    return () => subscription.remove();
  }, []);

  const showPreviousMonth = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setMonth((current) => shiftMonth(current, -1));
  }, []);

  const showNextMonth = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
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
        <View style={styles.status}>
          {error ? (
            <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : null}
        </View>
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
  status: {
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
