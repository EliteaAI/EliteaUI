import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';

import ScheduleRunConversation from './ScheduleRunConversation';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// Test run and the result of the newest test run (R3); onTestRun saves a changed form first
const ScheduleTestRun = memo(props => {
  const { run, onTestRun, testRunPending, testRunError } = props;

  const styles = scheduleTestRunStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.actions}>
        <BaseBtn
          data-testid="schedule-test-run"
          variant="elitea"
          color="primary"
          disabled={testRunPending}
          onClick={onTestRun}
        >
          Test run
        </BaseBtn>
        {run && <ScheduleRunStatusChip status={run.status} />}
      </Box>
      {testRunError && (
        <BannerMessage
          message={testRunError}
          variant="error"
        />
      )}
      {run?.reason && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {run.reason}
        </Typography>
      )}
      {!run && (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          No test runs yet.
        </Typography>
      )}
      {run?.conversation_id != null && <ScheduleRunConversation run={run} />}
    </Box>
  );
});

ScheduleTestRun.displayName = 'ScheduleTestRun';

/** @type {MuiSx} */
const scheduleTestRunStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
});

export default ScheduleTestRun;
