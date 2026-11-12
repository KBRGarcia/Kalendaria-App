import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@components/ui/IconButton';
import { useTheme } from '@theme/ThemeProvider';

interface PeriodNavigatorProps {
  title: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function PeriodNavigator({
  title,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: PeriodNavigatorProps): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" accessibilityLabel={previousLabel} onPress={onPrevious} />
      <Text style={[theme.typography.h3, styles.title, { color: theme.colors.text }]}>{title}</Text>
      <IconButton icon="chevron-forward" accessibilityLabel={nextLabel} onPress={onNext} />
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
