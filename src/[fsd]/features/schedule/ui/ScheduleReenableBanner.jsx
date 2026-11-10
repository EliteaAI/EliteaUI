import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';

import { DISABLED_REASON_LABELS } from '../lib/constants';
import ScheduleReenableAction from './ScheduleReenableAction';

// Switch-offs that are lifted only when the Connections check passes again (#7401)
const RECHECK_REASONS = ['credential_expired', 'connections_changed', 'owner_changed'];

/**
 * A trigger switched off because a connection stopped working: sign in on the rows of the Connections panel,
 * then Re-enable. `onRefused` refreshes the panel when the server still finds a failing row.
 */
const ScheduleReenableBanner = memo(props => {
  const { schedule, onRefused } = props;
  const styles = scheduleReenableBannerStyles();

  if (!schedule?.id || schedule.enabled || !RECHECK_REASONS.includes(schedule.disabled_reason)) return null;

  return (
    <BannerMessage variant="warning">
      <Box
        sx={styles.body}
        data-testid="schedule-reenable-banner"
      >
        <Typography variant="bodySmall">
          {DISABLED_REASON_LABELS[schedule.disabled_reason] ?? 'Paused'}
        </Typography>
        {schedule.allowed_actions?.includes('resume') && (
          <ScheduleReenableAction
            schedule={schedule}
            onRefused={onRefused}
          />
        )}
      </Box>
    </BannerMessage>
  );
});

ScheduleReenableBanner.displayName = 'ScheduleReenableBanner';

/** @type {MuiSx} */
const scheduleReenableBannerStyles = () => ({
  body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
});

export default ScheduleReenableBanner;
