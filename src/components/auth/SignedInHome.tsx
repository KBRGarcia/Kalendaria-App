import { useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@components/ui/Button';
import { FormError } from '@components/ui/AuthScaffold';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export function SignedInHome(): ReactElement {
  const theme = useTheme();
  const { email, signOut, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut(): Promise<void> {
    setErrorMessage(null);

    try {
      await signOut();
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[theme.typography.h1, { color: theme.colors.text }]}>
          Kalendaria
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Sesión iniciada</Text>
        {email ? <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]}>{email}</Text> : null}
        <FormError message={errorMessage} />
        <Button label="Cerrar sesión" variant="secondary" onPress={() => void handleSignOut()} loading={isLoading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
