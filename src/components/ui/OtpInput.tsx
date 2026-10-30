import { useState, type ReactElement } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { OTP_LENGTH } from '@constants/auth';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function OtpInput({ value, onChange, hasError = false }: OtpInputProps): ReactElement {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);
  const fieldBackground = theme.colorScheme === 'dark' ? theme.colors.surfaceSecondary : theme.colors.surface;

  function handleChange(text: string): void {
    onChange(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
  }

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.row}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const isActive = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: fieldBackground,
                  borderColor: hasError ? theme.colors.error : isActive ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text style={[theme.typography.h2, { color: theme.colors.text }]}>{value[index] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        underlineColorAndroid="transparent"
        accessibilityLabel="Código de 6 dígitos"
        style={[styles.capture, StyleSheet.absoluteFill]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capture: {
    color: 'transparent',
    backgroundColor: 'transparent',
  },
});
