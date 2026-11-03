import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Switch } from '@/[fsd]/shared/ui';

import ScheduleEnabledSwitch from './ScheduleEnabledSwitch';

/**
 * The "Active" switch of the Settings header. A saved schedule pauses or resumes at once, as on its card;
 * a new one sets the value that Save sends.
 */
const ScheduleActiveToggle = memo(props => {
  const { schedule, value = true, disabled = false, onChange } = props;

  const styles = scheduleActiveToggleStyles();

  return (
    <Box
      data-testid="schedule-active-toggle"
      sx={styles.root}
    >
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Active
      </Typography>
      {schedule?.id ? (
        <ScheduleEnabledSwitch
          row={schedule}
          testId="schedule-active-switch"
        />
      ) : (
        <Switch.BaseSwitch
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(_, checked) => onChange?.(checked)}
          data-testid="schedule-active-switch"
          slotProps={{ switch: { slotProps: { input: { role: 'switch', 'aria-label': 'Active' } } } }}
        />
      )}
    </Box>
  );
});

ScheduleActiveToggle.displayName = 'ScheduleActiveToggle';

/** @type {MuiSx} */
const scheduleActiveToggleStyles = () => ({
  root: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
});

export default ScheduleActiveToggle;
