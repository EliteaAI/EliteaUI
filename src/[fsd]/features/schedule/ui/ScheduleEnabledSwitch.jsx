import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Switch } from '@/[fsd]/shared/ui';

import { DISABLED_REASON_LABELS } from '../lib/constants';
import { useScheduleRowActions } from '../lib/hooks/useScheduleRowActions.hooks';

// The Enabled switch of a schedule row or card: pause or resume, by allowed_actions
const ScheduleEnabledSwitch = memo(props => {
  const { row, testId } = props;
  const { onPause, onResume, isBusy } = useScheduleRowActions(row);
  const action = row.enabled ? 'pause' : 'resume';
  // Why the system paused it, when the row has a label for that (#7254)
  const pausedBecause = !row.enabled ? DISABLED_REASON_LABELS[row.disabled_reason] : undefined;

  const control = (
    <Switch.BaseSwitch
      checked={Boolean(row.enabled)}
      disabled={isBusy || !row.allowed_actions?.includes(action)}
      onChange={row.enabled ? onPause : onResume}
      data-testid={testId}
      slotProps={{ switch: { slotProps: { input: { role: 'switch', 'aria-label': `Enable ${row.name}` } } } }}
    />
  );
  if (!pausedBecause) return control;
  return (
    <Tooltip
      title={pausedBecause}
      placement="top"
    >
      <Box component="span">{control}</Box>
    </Tooltip>
  );
});

ScheduleEnabledSwitch.displayName = 'ScheduleEnabledSwitch';

export default ScheduleEnabledSwitch;
