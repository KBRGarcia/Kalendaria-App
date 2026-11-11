import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@theme/colors';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';

const DISMISS_DISTANCE = 120;
// Espacio mínimo que se deja libre sobre la hoja (barra de estado + respiro) cuando hay teclado.
const TOP_GAP = 56;

function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboardHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardHeight;
}

interface ActivitySheetProps {
  children: ReactNode;
  onDismiss: () => void;
}

export function ActivitySheet({ children, onDismiss }: ActivitySheetProps): ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  // Con el teclado abierto la hoja solo puede ocupar el espacio que queda encima de él.
  const contentMaxHeight =
    keyboardHeight > 0 ? Math.max(160, height - keyboardHeight - insets.top - TOP_GAP) : height * 0.75;
  const translateY = useRef(new Animated.Value(280)).current;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8,
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE) {
          dismissRef.current();
          return;
        }

        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  useEffect(() => {
    const entrance = Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true });
    entrance.start();
    return () => entrance.stop();
  }, [translateY]);

  return (
    // Con edge-to-edge (SDK 58) Android ya no redimensiona la ventana: 'padding' es necesario en ambas plataformas.
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={() => dismissRef.current()}
        style={[styles.backdrop, { backgroundColor: `${palette.tinta}66` }]}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            // El teclado ya cubre la barra de navegación: no se suma el inset inferior.
            paddingBottom: (keyboardHeight > 0 ? 0 : insets.bottom) + spacing.lg,
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...pan.panHandlers} style={styles.handleHit}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: contentMaxHeight }}
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
  },
  handleHit: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.badge,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
