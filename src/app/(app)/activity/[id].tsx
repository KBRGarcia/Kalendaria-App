import { useLocalSearchParams } from 'expo-router';

import { EditActivityScreen } from '@components/activity/EditActivityScreen';

export default function EditActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = typeof id === 'string' ? id : '';

  return <EditActivityScreen activityId={activityId} />;
}
