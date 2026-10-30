import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WEEKDAY_LABELS } from '@lib/dates';
import { useTheme } from '@theme/ThemeProvider';

export function WeekdayHeader(): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {WEEKDAY_LABELS.map((label) => (
        <Text key={label} style={[theme.typography.small, styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
