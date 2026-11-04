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
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    minHeight: '3.3125rem',
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default ScheduleSettingsHeader;
