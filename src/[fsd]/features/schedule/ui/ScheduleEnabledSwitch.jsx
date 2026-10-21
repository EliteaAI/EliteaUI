import { memo } from 'react';

import { Switch } from '@/[fsd]/shared/ui';

import { useScheduleRowActions } from '../lib/hooks/useScheduleRowActions.hooks';

// The Enabled switch of a schedule row or card: pause or resume, by allowed_actions
const ScheduleEnabledSwitch = memo(props => {
  const { row, testId } = props;
  const { onPause, onResume, isBusy } = useScheduleRowActions(row);
  const action = row.enabled ? 'pause' : 'resume';

  return (
    <Switch.BaseSwitch
      checked={Boolean(row.enabled)}
      disabled={isBusy || !row.allowed_actions?.includes(action)}
      onChange={row.enabled ? onPause : onResume}
      data-testid={testId}
      slotProps={{ switch: { slotProps: { input: { 'aria-label': `Enable ${row.name}` } } } }}
    />
  );
});

ScheduleEnabledSwitch.displayName = 'ScheduleEnabledSwitch';

export default ScheduleEnabledSwitch;
