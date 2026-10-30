import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@components/ui/IconButton';
import { activityMessages } from '@constants/activities';
import { formatDayHeading, parseDateKey } from '@lib/dates';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface DayScreenProps {
  dateKey: string;
}

export function DayScreen({ dateKey }: DayScreenProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const date = parseDateKey(dateKey);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Volver al calendario" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[theme.typography.h2, styles.title, { color: theme.colors.text }]}>
          {date ? formatDayHeading(date) : activityMessages.invalidDate}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  title: {
    flex: 1,
  },
});
