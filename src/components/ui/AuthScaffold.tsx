import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface AuthScaffoldProps {
  children: ReactNode;
}

interface FormErrorProps {
  message: string | null;
}

export function AuthScaffold({ children }: AuthScaffoldProps): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function FormError({ message }: FormErrorProps): ReactElement | null {
  const theme = useTheme();

  if (!message) {
    return null;
  }

  return (
    <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.error }]}>
      {message}
    </Text>
  );
}

export function FormBlock({ children, style }: { children: ReactNode; style?: ViewStyle }): ReactElement {
  return <View style={[styles.block, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  block: {
    gap: spacing.md,
  },
});
