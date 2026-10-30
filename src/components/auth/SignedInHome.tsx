import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@components/ui/Button';
import { FormError } from '@components/ui/AuthScaffold';
import { IconButton } from '@components/ui/IconButton';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export function SignedInHome(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
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
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Volver al calendario" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[theme.typography.h1, { color: theme.colors.text }]}>
          Ajustes
        </Text>
      </View>
      <View style={styles.content}>
        {email ? <Text style={[theme.typography.body, { color: theme.colors.text }]}>{email}</Text> : null}
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Sesión iniciada</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  content: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
});
