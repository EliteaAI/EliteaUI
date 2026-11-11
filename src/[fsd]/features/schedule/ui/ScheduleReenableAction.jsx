import { memo, useCallback } from 'react';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';

import { useScheduleRowActions } from '../lib/hooks/useScheduleRowActions.hooks';

// Re-enable of a switched-off trigger; the server re-checks its connections and refuses while one fails
const ScheduleReenableAction = memo(props => {
  const { schedule, onRefused } = props;
  const { onResume, isBusy } = useScheduleRowActions(schedule);

  const handleReenable = useCallback(async () => {
    if (!(await onResume())) onRefused?.();
  }, [onResume, onRefused]);

  return (
    <BaseBtn
      onClick={handleReenable}
      disabled={isBusy}
      data-testid="schedule-reenable-button"
    >
      Re-enable
    </BaseBtn>
  );
});

ScheduleReenableAction.displayName = 'ScheduleReenableAction';

export default ScheduleReenableAction;
