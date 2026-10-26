import { useTheme } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const theme = useTheme();

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
