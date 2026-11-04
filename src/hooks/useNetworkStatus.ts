import { useNetInfo } from '@react-native-community/netinfo';

export function useNetworkStatus(): boolean | null {
  const { isConnected } = useNetInfo();
  return isConnected;
}
