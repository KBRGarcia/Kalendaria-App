import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Text } from 'react-native';

import { AuthScaffold, FormBlock, FormError } from '@components/ui/AuthScaffold';
import { Button } from '@components/ui/Button';
import { IconButton } from '@components/ui/IconButton';
import { Input } from '@components/ui/Input';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { assertRegistration, normalizeEmail } from '@services/authValidation';
import { useTheme } from '@theme/ThemeProvider';

const PASSWORD_HINT = 'Mínimo 8 caracteres, una letra y un número.';

export function RegisterScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    setErrorMessage(null);

    try {
      assertRegistration(normalizeEmail(email), password, confirmPassword);
      const needsVerification = await signUp(email, password);
      if (needsVerification) {
        router.push({ pathname: '/verify', params: { email: normalizeEmail(email), mode: 'signup' } });
      }
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  return (
    <AuthScaffold>
      <IconButton icon="chevron-back" accessibilityLabel="Volver" onPress={() => router.back()} />
      <Text accessibilityRole="header" style={[theme.typography.h1, { color: theme.colors.text }]}>
        Crear cuenta
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
        Solo necesitas un correo y una contraseña
      </Text>
      <FormBlock>
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
          placeholder="Crea una contraseña"
          icon="lock-closed-outline"
          isPassword
          helperText={PASSWORD_HINT}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Input
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repite la contraseña"
          icon="lock-closed-outline"
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <FormError message={errorMessage} />
        <Button label="Crear cuenta" onPress={() => void handleSubmit()} loading={isLoading} fullWidth />
        <Button
          label="¿Ya tienes cuenta? Inicia sesión"
          variant="text"
          onPress={() => router.replace('/login')}
          fullWidth
        />
      </FormBlock>
    </AuthScaffold>
  );
}
