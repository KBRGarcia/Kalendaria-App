import { memo, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isActivityCategory, type ActivityCategory } from '@constants/categories';
import { palette } from '@theme/colors';
import { useTheme } from '@theme/ThemeProvider';
import type { Activity } from '@/types/activity';

const VISIBLE_DOTS = 3;

interface CategoryDotsProps {
  activities: Activity[];
}

export const CategoryDots = memo(function CategoryDots({ activities }: CategoryDotsProps): ReactElement | null {
  const theme = useTheme();

  if (activities.length === 0) {
    return null;
  }

  const visible = activities.slice(0, VISIBLE_DOTS);
  const extra = activities.length - VISIBLE_DOTS;
  const dotBorder = theme.colorScheme === 'dark' ? `${palette.blanco}1A` : 'transparent';

  return (
    <View style={styles.row}>
      {visible.map((activity) => (
        <View
          key={activity.id}
          style={[
            styles.dot,
            {
              backgroundColor: dotColor(theme.categories, activity.category),
              borderColor: dotBorder,
            },
          ]}
        />
      ))}
      {extra > 0 ? (
        <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>{`+${extra}`}</Text>
      ) : null}
    </View>
  );
});

function dotColor(
  categories: Record<ActivityCategory, string>,
  category: string,
): string {
  if (isActivityCategory(category)) {
    return categories[category];
  }

  return categories.otro;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
});
