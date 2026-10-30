import { useLocalSearchParams } from 'expo-router';

import { DayScreen } from '@components/calendar/DayScreen';

export default function DayRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateKey = typeof date === 'string' ? date : '';

  return <DayScreen dateKey={dateKey} />;
}
