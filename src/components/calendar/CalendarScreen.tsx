import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayActivities } from '@components/calendar/DayActivities';
import { MonthGrid } from '@components/calendar/MonthGrid';
import { MonthNavigator } from '@components/calendar/MonthNavigator';
import { PeriodNavigator } from '@components/calendar/PeriodNavigator';
import { WeekdayHeader } from '@components/calendar/WeekdayHeader';
import { YearView } from '@components/calendar/YearView';
import { Fab } from '@components/ui/Fab';
import { IconButton } from '@components/ui/IconButton';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { useMonthActivities } from '@hooks/useMonthActivities';
import { useYearActivities } from '@hooks/useYearActivities';
import {
  formatMonthTitle,
  formatYearTitle,
  isSameCalendarDay,
  parseDateKey,
  shiftMonth,
  shiftYear,
  toDateKey,
} from '@lib/dates';
import { useActivitiesStore } from '@store/activitiesStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const FAB_SIZE = 56;

export type CalendarView = 'month' | 'year';

const VIEW_OPTIONS = [
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
] as const;

export function CalendarScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => new Date());
  const [today, setToday] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const [view, setView] = useState<CalendarView>('month');
  const isYearView = view === 'year';
  const title = isYearView ? formatYearTitle(month) : formatMonthTitle(month);
  const monthState = useMonthActivities(month, !isYearView);
  const yearState = useYearActivities(month.getFullYear(), isYearView);
  const { isLoading, error } = isYearView ? yearState : monthState;
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

  const showPreviousYear = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    goToMonth(shiftYear(month, -1));
  }, [goToMonth, month]);

  const showNextYear = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    goToMonth(shiftYear(month, 1));
  }, [goToMonth, month]);

  // Tocar un mes de la vista anual abre ese mes en la vista mensual.
  const openMonth = useCallback(
    (next: Date) => {
      goToMonth(next);
      setView('month');
    },
    [goToMonth],
  );

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
        <SegmentedControl
          accessibilityLabel="Vista del calendario"
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
        {isYearView ? (
          <PeriodNavigator
            title={title}
            previousLabel="Año anterior"
            nextLabel="Año siguiente"
            onPrevious={showPreviousYear}
            onNext={showNextYear}
          />
        ) : (
          <MonthNavigator month={month} onPrevious={showPreviousMonth} onNext={showNextMonth} />
        )}
        {isYearView ? null : <WeekdayHeader />}
        <View style={styles.status}>
          {error ? (
            <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : null}
        </View>
        {isYearView ? (
          <YearView
            year={month.getFullYear()}
            today={today}
            activitiesByDate={activitiesByDate}
            bottomInset={insets.bottom + spacing.lg}
            onSelectMonth={openMonth}
          />
        ) : (
          <>
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
          </>
        )}
      </View>
      {isYearView ? null : (
        <View style={[styles.fab, { bottom: insets.bottom + spacing.lg, right: spacing.lg }]}>
          <Fab accessibilityLabel="Crear nueva actividad" onPress={createActivity} />
        </View>
      )}
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
