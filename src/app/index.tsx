import { Redirect } from 'expo-router';

import { useAuthGate } from '@hooks/useAuth';

export default function Index() {
  const { isInitialized, canEnterApp } = useAuthGate();

  if (!isInitialized) {
    return null;
  }

  if (canEnterApp) {
    return <Redirect href="/calendar" />;
  }

  return <Redirect href="/login" />;
}
