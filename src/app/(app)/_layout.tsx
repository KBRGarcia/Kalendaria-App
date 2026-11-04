import { Redirect, Stack } from 'expo-router';

import { Loading } from '@components/ui/Loading';
import { useAuthGate } from '@hooks/useAuth';

const sheetOptions = {
  presentation: 'transparentModal',
  animation: 'fade',
  contentStyle: { backgroundColor: 'transparent' },
} as const;

export default function AppLayout() {
  const { isInitialized, isLoading, canEnterApp } = useAuthGate();

  if (!isInitialized || isLoading) {
    return <Loading />;
  }

  if (!canEnterApp) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activity/new" options={sheetOptions} />
      <Stack.Screen name="activity/[id]" options={sheetOptions} />
    </Stack>
  );
}
