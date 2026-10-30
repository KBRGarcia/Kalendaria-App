import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@components/ui/IconButton';
import { formatMonthTitle } from '@lib/dates';
import { useTheme } from '@theme/ThemeProvider';

interface MonthNavigatorProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthNavigator({ month, onPrevious, onNext }: MonthNavigatorProps): ReactElement {
  const theme = useTheme();
  const title = formatMonthTitle(month);

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" accessibilityLabel="Mes anterior" onPress={onPrevious} />
      <Text style={[theme.typography.h3, styles.title, { color: theme.colors.text }]}>{title}</Text>
      <IconButton icon="chevron-forward" accessibilityLabel="Mes siguiente" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
