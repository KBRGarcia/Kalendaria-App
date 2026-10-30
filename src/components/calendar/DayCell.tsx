import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { CategoryDots } from '@components/calendar/CategoryDots';
import { formatDaySpoken } from '@lib/dates';
import { palette } from '@theme/colors';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

interface DayCellProps {
  date: Date;
  dateKey: string;
  activities: Activity[];
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onPress: (dateKey: string) => void;
}

export const DayCell = memo(function DayCell({
  date,
  dateKey,
  activities,
  inMonth,
  isToday,
  isSelected,
  onPress,
}: DayCellProps): ReactElement {
  const theme = useTheme();
  const numberColor = dayNumberColor(theme.colors.text, theme.colors.textSecondary, theme.colors.primary, {
    inMonth,
    isToday,
    isSelected,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dayLabel(date, activities.length)}
      onPress={() => onPress(dateKey)}
      style={[styles.cell, { backgroundColor: cellBackground(theme.colors.primary, isToday, isSelected) }]}
    >
      <Text
        style={[
          isToday || isSelected ? theme.typography.bodyStrong : theme.typography.body,
          styles.number,
          { color: numberColor },
        ]}
      >
        {date.getDate()}
      </Text>
      <CategoryDots activities={activities} />
    </Pressable>
  );
});

function dayLabel(date: Date, count: number): string {
  const spoken = formatDaySpoken(date);
  if (count === 0) {
    return spoken;
  }

  return count === 1 ? `${spoken}, 1 actividad` : `${spoken}, ${count} actividades`;
}

function cellBackground(primary: string, isToday: boolean, isSelected: boolean): string {
  if (isSelected) {
    return primary;
  }

  if (isToday) {
    return `${primary}26`;
  }

  return 'transparent';
}

function dayNumberColor(
  text: string,
  textSecondary: string,
  primary: string,
  state: { inMonth: boolean; isToday: boolean; isSelected: boolean },
): string {
  if (state.isSelected) {
    return palette.blanco;
  }

  if (state.isToday) {
    return primary;
  }

  return state.inMonth ? text : textSecondary;
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.day,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  number: {
    textAlign: 'center',
  },
});
