import { memo, useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { resolveCategory } from '@constants/categories';
import { buildMonthWeeks, formatMonthName, isSameCalendarDay, toDateKey, yearMonths } from '@lib/dates';
import { yearColumns } from '@lib/responsive';
import { palette } from '@theme/colors';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

const MAX_FONT_SCALE = 1.2;
const NO_ACTIVITIES: Activity[] = [];


interface YearViewProps {
  year: number;
  today: Date;
  activitiesByDate: Record<string, Activity[]>;
  bottomInset: number;
  onSelectMonth: (month: Date) => void;
}

export function YearView({ year, today, activitiesByDate, bottomInset, onSelectMonth }: YearViewProps): ReactElement {
  const { width } = useWindowDimensions();
  const columns = yearColumns(width);
  const months = useMemo(() => yearMonths(year), [year]);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {months.map((month) => (
          <View key={month.getMonth()} style={{ width: `${100 / columns}%`, padding: spacing.xs }}>
            <MiniMonth month={month} today={today} activitiesByDate={activitiesByDate} onPress={onSelectMonth} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

interface MiniMonthProps {
  month: Date;
  today: Date;
  activitiesByDate: Record<string, Activity[]>;
  onPress: (month: Date) => void;
}

const MiniMonth = memo(function MiniMonth({ month, today, activitiesByDate, onPress }: MiniMonthProps): ReactElement {
  const theme = useTheme();
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
  const name = formatMonthName(month);

  let total = 0;
  for (const week of weeks) {
    for (const day of week) {
      total += day ? (activitiesByDate[toDateKey(day)]?.length ?? 0) : 0;
    }
  }

  const label = total === 0 ? name : total === 1 ? `${name}, 1 actividad` : `${name}, ${total} actividades`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${month.getFullYear()}`}
      onPress={() => onPress(month)}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isCurrentMonth ? theme.colors.primary : theme.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        numberOfLines={1}
        style={[theme.typography.small, styles.name, { color: isCurrentMonth ? theme.colors.primary : theme.colors.text }]}
      >
        {name}
      </Text>
      {weeks.map((week) => (
        <View key={toDateKey(week.find((day) => day !== null) ?? month)} style={styles.week}>
          {week.map((day, index) => {
            if (!day) {
              return <View key={`blank-${index}`} style={styles.day} />;
            }

            const activities = activitiesByDate[toDateKey(day)] ?? NO_ACTIVITIES;
            const first = activities[0];
            const isToday = isSameCalendarDay(day, today);

            return (
              <View key={day.getDate()} style={styles.day}>
                <View style={[styles.number, isToday ? { backgroundColor: theme.colors.primary } : null]}>
                  <Text
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.numberText, { color: isToday ? palette.blanco : theme.colors.text }]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                {first ? (
                  <View
                    style={[styles.dot, { backgroundColor: resolveCategory(first, theme.categories).color }]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  name: {
    textAlign: 'center',
    marginBottom: 2,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    width: `${100 / 7}%`,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  number: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ['tabular-nums'],
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
