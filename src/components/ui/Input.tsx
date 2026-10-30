import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ComponentProps, ReactElement } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface InputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  icon?: IoniconName;
  isPassword?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  icon,
  isPassword = false,
  keyboardType,
  autoComplete,
  textContentType,
  autoCapitalize = 'none',
}: InputProps): ReactElement {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const message = error ?? helperText;
  const fieldBackground = theme.colorScheme === 'dark' ? theme.colors.surfaceSecondary : theme.colors.surface;

  return (
    <View style={styles.wrap}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: fieldBackground,
            borderColor: error ? theme.colors.error : focused ? theme.colors.primary : theme.colors.border,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={theme.colors.textSecondary} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={isPassword && !passwordVisible}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, theme.typography.body, { color: theme.colors.text }]}
          accessibilityLabel={label}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.toggle}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <Text style={[theme.typography.caption, { color: error ? theme.colors.error : theme.colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  field: {
    minHeight: 52,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
  },
  toggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
