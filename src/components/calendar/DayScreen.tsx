import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayDetail } from '@components/calendar/DayDetail';
import { IconButton } from '@components/ui/IconButton';
import { activityMessages } from '@constants/activities';
import { parseDateKey } from '@lib/dates';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface DayScreenProps {
  dateKey: string;
}

export function DayScreen({ dateKey }: DayScreenProps): ReactElement {
  const date = parseDateKey(dateKey);

  if (!date) {
    return <InvalidDay />;
  }

  return <DayDetail date={date} dateKey={dateKey} />;
}

function InvalidDay(): ReactElement {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Volver al calendario" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[theme.typography.h2, { color: theme.colors.text }]}>
          {activityMessages.invalidDate}
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
});
