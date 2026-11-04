import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { palette } from '@theme/colors';
import { useTheme } from '@theme/ThemeProvider';

interface FabProps {
  accessibilityLabel: string;
  onPress: () => void;
}

export function Fab({ accessibilityLabel, onPress }: FabProps): ReactElement {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    const entrance = Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    });
    entrance.start();
    return () => entrance.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          theme.shadows.md,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={palette.blanco} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
