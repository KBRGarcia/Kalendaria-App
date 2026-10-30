import { Redirect, Stack } from 'expo-router';

import { Loading } from '@components/ui/Loading';
import { useAuthGate } from '@hooks/useAuth';

export default function AppLayout() {
  const { isInitialized, isLoading, canEnterApp } = useAuthGate();

  if (!isInitialized || isLoading) {
    return <Loading />;
  }

  if (!canEnterApp) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
