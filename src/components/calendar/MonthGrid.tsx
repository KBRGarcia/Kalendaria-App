import { memo, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { DayCell } from '@components/calendar/DayCell';
import { buildMonthCells, isInCalendarMonth, isSameCalendarDay, toDateKey } from '@lib/dates';
import { spacing } from '@theme/spacing';
import type { Activity } from '@/types/activity';

const NO_ACTIVITIES: Activity[] = [];
const DAYS_PER_WEEK = 7;

interface MonthGridProps {
  month: Date;
  today: Date;
  selectedKey: string | null;
  activitiesByDate: Record<string, Activity[]>;
  onSelectDay: (dateKey: string) => void;
}

export const MonthGrid = memo(function MonthGrid({
  month,
  today,
  selectedKey,
  activitiesByDate,
  onSelectDay,
}: MonthGridProps): ReactElement {
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const rows = chunkWeeks(cells);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.setValue(0.45);
    const fade = Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true });
    fade.start();
    return () => fade.stop();
  }, [month, opacity]);

  return (
    <Animated.View style={[styles.grid, { opacity }]}>
      {rows.map((week) => (
        <View key={toDateKey(week[0] ?? month)} style={styles.row}>
          {week.map((date) => {
            const dateKey = toDateKey(date);

            return (
              <DayCell
                key={dateKey}
                date={date}
                dateKey={dateKey}
                activities={activitiesByDate[dateKey] ?? NO_ACTIVITIES}
                inMonth={isInCalendarMonth(date, month)}
                isToday={isSameCalendarDay(date, today)}
                isSelected={dateKey === selectedKey}
                onPress={onSelectDay}
              />
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
});

function chunkWeeks(days: Date[]): Date[][] {
  const rows: Date[][] = [];

  for (let index = 0; index < days.length; index += DAYS_PER_WEEK) {
    rows.push(days.slice(index, index + DAYS_PER_WEEK));
  }

  return rows;
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
