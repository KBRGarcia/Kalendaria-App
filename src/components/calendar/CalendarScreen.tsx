import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayActivities } from '@components/calendar/DayActivities';
import { MonthGrid } from '@components/calendar/MonthGrid';
import { MonthNavigator } from '@components/calendar/MonthNavigator';
import { WeekdayHeader } from '@components/calendar/WeekdayHeader';
import { Fab } from '@components/ui/Fab';
import { IconButton } from '@components/ui/IconButton';
import { useMonthActivities } from '@hooks/useMonthActivities';
import { formatMonthTitle, isSameCalendarDay, parseDateKey, shiftMonth, toDateKey } from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const FAB_SIZE = 56;

export function CalendarScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => new Date());
  const [today, setToday] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const title = formatMonthTitle(month);
  const { isLoading, error } = useMonthActivities(month);
  const activitiesByDate = useActivitiesStore((state) => state.activitiesByDate);
  const selectedDate = useMemo(() => parseDateKey(selectedKey) ?? new Date(), [selectedKey]);

  // Si la app queda abierta pasada la medianoche, "hoy" se actualiza al volver al primer plano.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday((current) => (isSameCalendarDay(current, new Date()) ? current : new Date()));
      }
    });

    return () => subscription.remove();
  }, []);

  // Al cambiar de mes se selecciona hoy (si es ese mes) o el día 1, para que el panel siempre muestre un día.
  const goToMonth = useCallback((next: Date) => {
    setMonth(next);
    const now = new Date();
    setSelectedKey(toDateKey(sameMonth(now, next) ? now : next));
  }, []);

  const showPreviousMonth = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    goToMonth(shiftMonth(month, -1));
  }, [goToMonth, month]);

  const showNextMonth = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    goToMonth(shiftMonth(month, 1));
  }, [goToMonth, month]);

  // Tocar un día lo selecciona aquí mismo. Si es de otro mes, el calendario salta a ese mes.
  const selectDay = useCallback(
    (dateKey: string) => {
      setSelectedKey(dateKey);
      const date = parseDateKey(dateKey);
      if (date && !sameMonth(date, month)) {
        setMonth(shiftMonth(date, 0));
      }
    },
    [month],
  );

  const openActivity = useCallback(
    (id: string) => {
      router.push({ pathname: '/activity/[id]', params: { id } });
    },
    [router],
  );

  const createActivity = useCallback(() => {
    router.push({ pathname: '/activity/new', params: { date: selectedKey } });
  }, [router, selectedKey]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
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
          onSelectDay={selectDay}
        />
        <DayActivities
          date={selectedDate}
          dateKey={selectedKey}
          isLoading={isLoading}
          hasError={error !== null}
          bottomInset={insets.bottom + FAB_SIZE + spacing.lg * 2}
          onOpenActivity={openActivity}
        />
      </View>
      <View style={[styles.fab, { bottom: insets.bottom + spacing.lg, right: spacing.lg }]}>
        <Fab accessibilityLabel="Crear nueva actividad" onPress={createActivity} />
      </View>
    </SafeAreaView>
  );
}

function sameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
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
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
  },
});
