import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

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

  return (
    <View style={styles.grid}>
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
    </View>
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
