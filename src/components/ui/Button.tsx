import { type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import { palette } from '@theme/colors';
import { radius, spacing } from '@theme/spacing';
import { useTheme, type AppTheme } from '@theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

interface ButtonAppearance {
  container: ViewStyle;
  label: TextStyle;
  spinner: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps): ReactElement {
  const theme = useTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'text' ? styles.textHit : styles.filledHit,
        fullWidth ? styles.fullWidth : null,
        resolveAppearance(theme, variant, pressed, inactive).container,
      ]}
    >
      {({ pressed }) =>
        loading ? (
          <ActivityIndicator color={resolveAppearance(theme, variant, pressed, inactive).spinner} />
        ) : (
          <Text style={[theme.typography.bodyStrong, resolveAppearance(theme, variant, pressed, inactive).label]}>
            {label}
          </Text>
        )
      }
    </Pressable>
  );
}

function resolveAppearance(
  theme: AppTheme,
  variant: ButtonVariant,
  pressed: boolean,
  inactive: boolean,
): ButtonAppearance {
  if (variant === 'secondary') {
    return outlineAppearance(theme, pressed, inactive);
  }

  if (variant === 'text') {
    return textAppearance(theme, pressed, inactive);
  }

  const background = variant === 'destructive' ? theme.colors.error : theme.colors.primary;
  const pressedBackground = variant === 'destructive' ? theme.colors.accentPressed : theme.colors.primaryPressed;

  return {
    container: {
      backgroundColor: inactive ? background : pressed ? pressedBackground : background,
      opacity: inactive ? 0.4 : pressed ? 0.9 : 1,
    },
    label: { color: palette.blanco },
    spinner: palette.blanco,
  };
}

function outlineAppearance(theme: AppTheme, pressed: boolean, inactive: boolean): ButtonAppearance {
  return {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      opacity: inactive ? 0.4 : pressed ? 0.9 : 1,
    },
    label: { color: theme.colors.primary },
    spinner: theme.colors.primary,
  };
}

function textAppearance(theme: AppTheme, pressed: boolean, inactive: boolean): ButtonAppearance {
  return {
    container: {
      backgroundColor: 'transparent',
      opacity: inactive ? 0.4 : 1,
    },
    label: {
      color: theme.colors.primary,
      textDecorationLine: pressed ? 'underline' : 'none',
    },
    spinner: theme.colors.primary,
  };
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
  },
  filledHit: {
    minHeight: 52,
  },
  textHit: {
    minHeight: 44,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
