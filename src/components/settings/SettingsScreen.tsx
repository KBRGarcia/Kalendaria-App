import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { FormError } from '@components/ui/AuthScaffold';
import { IconButton } from '@components/ui/IconButton';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { updateThemePreference } from '@services/authService';
import { useThemeStore, type ThemePreference } from '@store/themeStore';
import { layout, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

export function SettingsScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const { email, signOut, isLoading } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function handleTheme(next: ThemePreference): Promise<void> {
    setPreference(next);
    setErrorMessage(null);

    try {
      await updateThemePreference(next);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  async function handleSignOut(): Promise<void> {
    setErrorMessage(null);

    try {
      await signOut();
    } catch (error) {
      setConfirmingLogout(false);
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
        <Section title="Apariencia">
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Tema</Text>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={preference}
            onChange={(next) => {
              void handleTheme(next);
            }}
            accessibilityLabel="Tema"
          />
        </Section>
        <Section title="Cuenta">
          {email ? <Text style={[theme.typography.body, { color: theme.colors.text }]}>{email}</Text> : null}
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Sesión iniciada</Text>
          <Button label="Cerrar sesión" variant="danger" fullWidth onPress={() => setConfirmingLogout(true)} />
        </Section>
        <Section title="Acerca de">
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{`Versión ${version}`}</Text>
        </Section>
        <FormError message={errorMessage} />
      </View>
      <ConfirmDialog
        visible={confirmingLogout}
        title="¿Cerrar sesión?"
        message="Tendrás que volver a entrar con tu correo y contraseña."
        confirmLabel="Cerrar sesión"
        busy={isLoading}
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          void handleSignOut();
        }}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </View>
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
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
});
