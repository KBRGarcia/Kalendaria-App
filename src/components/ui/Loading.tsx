import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@theme/ThemeProvider';

export function Loading(): ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
