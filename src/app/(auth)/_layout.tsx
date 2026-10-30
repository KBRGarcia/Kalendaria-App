import { Redirect, Stack } from 'expo-router';

import { Loading } from '@components/ui/Loading';
import { useAuthGate } from '@hooks/useAuth';

export default function AuthLayout() {
  const { isInitialized, canEnterApp } = useAuthGate();

  if (!isInitialized) {
    return null;
  }

  if (canEnterApp) {
    return <Redirect href="/calendar" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
