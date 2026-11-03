import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import ScheduleActiveToggle from './ScheduleActiveToggle';

// The title row above the form sections: "Settings" on the left, the Active switch on the right
const ScheduleSettingsHeader = memo(props => {
  const { schedule, enabled, readOnly, onEnabledChange } = props;

  const styles = scheduleSettingsHeaderStyles();

  return (
    <Box sx={styles.root}>
      <Typography
        component="h2"
        variant="headingSmall"
      >
        Settings
      </Typography>
      <ScheduleActiveToggle
        schedule={schedule}
        value={enabled}
        disabled={readOnly}
        onChange={onEnabledChange}
      />
    </Box>
  );
});

ScheduleSettingsHeader.displayName = 'ScheduleSettingsHeader';

/** @type {MuiSx} */
const scheduleSettingsHeaderStyles = () => ({
  root: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
});

export default ScheduleSettingsHeader;
