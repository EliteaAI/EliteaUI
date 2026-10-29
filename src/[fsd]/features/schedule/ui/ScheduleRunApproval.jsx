import { memo, useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { SCHEDULE_RUNS_TAG, scheduleApi } from '@/[fsd]/entities/schedule';
import { BaseBtn } from '@/[fsd]/shared/ui/button';

import { formatExpiresIn } from '../lib/helpers';
import { useWaitingRunDecision } from '../lib/hooks/useWaitingRunDecision.hooks';

const EXPIRY_TICK_MS = 60_000;

/**
 * Approve and Reject at the paused line of a waiting run.
 * The same owner-only decision call as the Runs table; the server still checks the owner.
 */
const ScheduleRunApproval = memo(props => {
  const { schedule, conversationUuid, pausedMessageId, pausedAt } = props;

  const dispatch = useDispatch();
  const [deciding, setDeciding] = useState(false);
  // The expiry text moves on every minute, not only when the run is read again
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), EXPIRY_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  // A decision changes the run on the server, so the run and the list load again
  const onDecided = useCallback(
    () => dispatch(scheduleApi.util.invalidateTags([SCHEDULE_RUNS_TAG])),
    [dispatch],
  );
  const onHitlResume = useWaitingRunDecision({ schedule, onDecided });

  const decide = useCallback(
    async action => {
      setDeciding(true);
      try {
        await onHitlResume({ action, conversationUuid, messageId: pausedMessageId });
      } finally {
        setDeciding(false);
      }
    },
    [onHitlResume, conversationUuid, pausedMessageId],
  );

  const disabled = !onHitlResume || !conversationUuid || deciding;
  const styles = scheduleRunApprovalStyles();

  return (
    <Box
      data-testid="schedule-run-approval"
      sx={styles.root}
    >
      <BaseBtn
        variant="elitea"
        color="primary"
        disabled={disabled}
        onClick={() => decide('approve')}
      >
        Approve
      </BaseBtn>
      <BaseBtn
        variant="elitea"
        color="secondary"
        disabled={disabled}
        onClick={() => decide('reject')}
      >
        Reject
      </BaseBtn>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        {formatExpiresIn(pausedAt, now)}
      </Typography>
      {!onHitlResume && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.note}
        >
          Only the owner can approve or reject this run
        </Typography>
      )}
    </Box>
  );
});

ScheduleRunApproval.displayName = 'ScheduleRunApproval';

/** @type {MuiSx} */
const scheduleRunApprovalStyles = () => ({
  // Lined up with the log text, right of the 5.5 rem time column
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0.5rem 0 0.5rem 5.5rem',
  },
  note: { flexBasis: '100%' },
});

export default ScheduleRunApproval;
