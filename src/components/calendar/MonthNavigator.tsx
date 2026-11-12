import type { ReactElement } from 'react';

import { PeriodNavigator } from '@components/calendar/PeriodNavigator';
import { formatMonthTitle } from '@lib/dates';

interface MonthNavigatorProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthNavigator({ month, onPrevious, onNext }: MonthNavigatorProps): ReactElement {
  return (
    <PeriodNavigator
      title={formatMonthTitle(month)}
      previousLabel="Mes anterior"
      nextLabel="Mes siguiente"
      onPrevious={onPrevious}
      onNext={onNext}
    />
  );
}
