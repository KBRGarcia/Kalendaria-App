import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

import { Button } from './Button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

// React solo permite error boundaries como clase. El resto de la UI usa funciones.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error(error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Algo salió mal</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Vuelve a intentarlo. Si sigue pasando, cierra y abre Kalendaria.
        </Text>
        <Button label="Reintentar" onPress={onRetry} fullWidth />
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
