import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Image, StyleSheet, Text } from 'react-native';

import { AuthScaffold, FormBlock, FormError } from '@components/ui/AuthScaffold';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const logo = require('../../../assets/icon.png') as number;

export function LoginScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      <Image accessibilityLabel="Kalendaria" source={logo} style={styles.logo} />
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
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: 80,
  },
  form: {
    marginTop: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
