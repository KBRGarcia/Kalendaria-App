import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { AuthScaffold, FormBlock, FormError } from '@components/ui/AuthScaffold';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useAuth } from '@hooks/useAuth';
import { consumeSessionNotice } from '@lib/sessionNotice';
import { toUserMessage } from '@services/authErrors';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const logo = require('../../../assets/logo-name-kalendaria.png') as number;
const LOGO_ASPECT = 690 / 612;
const LOGO_MAX_WIDTH = 220;

export function LoginScreen(): ReactElement {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const logoWidth = Math.min(LOGO_MAX_WIDTH, Math.round(screenWidth * 0.58));
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(() => consumeSessionNotice());

  async function handleSubmit(): Promise<void> {
    setErrorMessage(null);

    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  return (
    <AuthScaffold>
      <Image
        accessibilityLabel="Kalendaria"
        resizeMode="contain"
        source={logo}
        style={[styles.logo, { width: logoWidth, height: Math.round(logoWidth / LOGO_ASPECT) }]}
      />
      <Text accessibilityRole="header" style={[theme.typography.h1, styles.center, { color: theme.colors.text }]}>
        Bienvenido a Kalendaria
      </Text>
      <Text style={[theme.typography.body, styles.center, { color: theme.colors.textSecondary }]}>
        Tu agenda personal, simple y clara
      </Text>
      <FormBlock style={styles.form}>
        <Input
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          icon="mail-outline"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          icon="lock-closed-outline"
          isPassword
          autoComplete="password"
          textContentType="password"
        />
        <FormError message={errorMessage} />
        <Button label="Iniciar sesión" onPress={() => void handleSubmit()} loading={isLoading} fullWidth />
        <Button
          label="¿No tienes cuenta? Regístrate"
          variant="text"
          onPress={() => router.push('/register')}
          fullWidth
        />
      </FormBlock>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
    marginTop: spacing['2xl'],
  },
  form: {
    marginTop: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
