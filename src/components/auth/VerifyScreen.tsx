import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScaffold, FormBlock, FormError } from '@components/ui/AuthScaffold';
import { Button } from '@components/ui/Button';
import { IconButton } from '@components/ui/IconButton';
import { OtpInput } from '@components/ui/OtpInput';
import { RESEND_COOLDOWN_SECONDS } from '@constants/auth';
import { useAuth } from '@hooks/useAuth';
import { toUserMessage } from '@services/authErrors';
import { isOtpMode, OTP_MODES, type OtpMode } from '@/types/auth';
import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

export function VerifyScreen(): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[]; mode?: string | string[] }>();
  const email = readParam(params.email);
  const mode = readMode(readParam(params.mode));
  const { verifyOtp, resendOtp, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { secondsLeft, restart } = useResendCooldown(RESEND_COOLDOWN_SECONDS);
  const formError = email.length === 0 ? 'Falta el correo para verificar.' : errorMessage;

  async function handleVerify(): Promise<void> {
    setErrorMessage(null);

    try {
      await verifyOtp(email, code, mode);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  async function handleResend(): Promise<void> {
    setErrorMessage(null);

    try {
      await resendOtp(email, mode);
      restart();
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    }
  }

  const resendLabel = secondsLeft > 0 ? `Reenviar código (${secondsLeft}s)` : 'Reenviar código';

  return (
    <AuthScaffold>
      <IconButton icon="chevron-back" accessibilityLabel="Volver" onPress={() => router.back()} />
      <View style={styles.iconWrap}>
        <Ionicons name="mail-open-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text accessibilityRole="header" style={[theme.typography.h1, styles.center, { color: theme.colors.text }]}>
        Verifica tu correo
      </Text>
      <Text style={[theme.typography.body, styles.center, { color: theme.colors.textSecondary }]}>
        {`Enviamos un código de 6 dígitos a ${email || 'tu correo'}`}
      </Text>
      <FormBlock>
        <OtpInput value={code} onChange={setCode} hasError={errorMessage !== null} />
        <FormError message={formError} />
        <Button
          label="Verificar"
          onPress={() => void handleVerify()}
          loading={isLoading}
          disabled={email.length === 0}
          fullWidth
        />
        <Button
          label={resendLabel}
          variant="text"
          onPress={() => void handleResend()}
          disabled={secondsLeft > 0 || isLoading || email.length === 0}
          fullWidth
        />
      </FormBlock>
    </AuthScaffold>
  );
}

function useResendCooldown(seconds: number): { secondsLeft: number; restart: () => void } {
  const [deadline, setDeadline] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    secondsLeft: Math.max(0, Math.ceil((deadline - now) / 1000)),
    restart: () => setDeadline(Date.now() + seconds * 1000),
  };
}

function readParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0] ?? '';
}

function readMode(value: string): OtpMode {
  return isOtpMode(value) ? value : OTP_MODES.signup;
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
});
