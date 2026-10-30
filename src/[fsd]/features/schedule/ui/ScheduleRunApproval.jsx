import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { SCHEDULE_RUNS_TAG, scheduleApi } from '@/[fsd]/entities/schedule';
import { getToolkitAuthorizationContext } from '@/[fsd]/features/chat/lib/helpers/mcpAuthorization.helpers';
import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { BaseBtn } from '@/[fsd]/shared/ui/button';

import { formatExpiresIn } from '../lib/helpers';
import { useWaitingRunDecision } from '../lib/hooks/useWaitingRunDecision.hooks';
import ScheduleRunSignIn from './ScheduleRunSignIn';

const EXPIRY_TICK_MS = 60_000;

/**
 * Approve and Reject at the paused line of a waiting run.
 * The same owner-only decision call as the Runs table; the server still checks the owner.
 * `authAction` is the toolkit sign-in the run waits for: the owner signs in first (the chat sign-in window),
 * then Approve resumes the run with the fresh tokens. Reject skips the sign-in.
 */
const ScheduleRunApproval = memo(props => {
  const { schedule, runId, hasChat = true, conversationUuid, pausedMessageId, pausedAt, authAction } = props;

  const dispatch = useDispatch();
  const [deciding, setDeciding] = useState(false);
  const authContext = useMemo(
    () => (authAction ? getToolkitAuthorizationContext(authAction) : null),
    [authAction],
  );
  const serverUrl = authAction?.toolOutputs?.server_url || authAction?.toolMeta?.server_url || '';
  // The token store answers for a sign-in done here or in another tab
  const { isLoggedIn: signedIn } = useMcpTokenChange({ serverUrl });
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
        await onHitlResume({
          action,
          conversationUuid,
          runId,
          messageId: pausedMessageId,
          ...(authAction && {
            authRequest: {
              authorizationRequestId: authAction.authorizationRequestId,
              toolCallId: authAction.toolMeta?.tool_call_id,
              childThreadId: authAction.toolMeta?.child_thread_id,
            },
          }),
        });
      } finally {
        setDeciding(false);
      }
    },
    [onHitlResume, conversationUuid, runId, pausedMessageId, authAction],
  );

  // A run with a chat waits until its chat has loaded; a run without one (it waits for credentials) is ready
  const disabled = !onHitlResume || (hasChat && !conversationUuid) || deciding;
  const needsSignIn = Boolean(authAction) && !signedIn;
  const styles = scheduleRunApprovalStyles();

  return (
    <Box
      data-testid="schedule-run-approval"
      sx={styles.root}
    >
      {authAction && (
        <ScheduleRunSignIn
          authAction={authAction}
          primary={needsSignIn}
          disabled={disabled}
        />
      )}
      <BaseBtn
        variant="elitea"
        color={needsSignIn ? 'secondary' : 'primary'}
        disabled={disabled || needsSignIn}
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
      {needsSignIn && onHitlResume && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.note}
        >
          {`Sign in to ${authContext?.toolkitName || 'the toolkit'}, then approve. The run continues after you approve.`}
        </Typography>
      )}
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
