import { memo, useCallback, useId, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { SCHEDULE_RUNS_TAG, scheduleApi } from '@/[fsd]/entities/schedule';
import { getToolkitAuthorizationContext } from '@/[fsd]/features/chat';
import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ArrowForwardIcon from '@/assets/icons/arrow-forward.svg?react';

import { formatExpiresIn } from '../lib/helpers';
import { useActionButtonProps } from '../lib/hooks/useActionButtonProps.hooks';
import { useNow } from '../lib/hooks/useNow.hooks';
import { useWaitingRunDecision } from '../lib/hooks/useWaitingRunDecision.hooks';
import ScheduleRunSignIn from './ScheduleRunSignIn';

/**
 * Approve and Reject at the paused line of a waiting run.
 * The same owner-only decision call as the Runs table; the server still checks the owner.
 * `authAction` is the toolkit sign-in the run waits for: the owner signs in first (the chat sign-in window),
 * then Approve resumes the run with the fresh tokens. Reject skips the sign-in.
 * `blockedReason` keeps Approve off and names why. `compact` is the form for the Action needed card: no
 * left offset, no sign-in button and no expiry text, because the card shows them itself.
 */
const ScheduleRunApproval = memo(props => {
  const {
    schedule,
    runId,
    hasChat = true,
    conversationUuid,
    pausedMessageId,
    pausedAt,
    authAction,
    blockedReason,
    compact = false,
  } = props;

  const dispatch = useDispatch();
  const signInNoteId = useId();
  const blockedNoteId = useId();
  const [deciding, setDeciding] = useState(false);
  const authContext = useMemo(
    () => (authAction ? getToolkitAuthorizationContext(authAction) : null),
    [authAction],
  );
  const serverUrl = authAction?.toolOutputs?.server_url || authAction?.toolMeta?.server_url || '';
  // The token store answers for a sign-in done here or in another tab
  const { isLoggedIn: signedIn } = useMcpTokenChange({ serverUrl });
  const now = useNow();
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
              serverUrl,
            },
          }),
        });
      } finally {
        setDeciding(false);
      }
    },
    [onHitlResume, conversationUuid, runId, pausedMessageId, authAction, serverUrl],
  );

  // A run with a chat waits until its chat has loaded; a run without one (it waits for credentials) is ready
  const disabled = !onHitlResume || (hasChat && !conversationUuid) || deciding;
  const needsSignIn = Boolean(authAction) && !signedIn;
  const approveNoteId = blockedReason ? blockedNoteId : signInNoteId;
  const approveDescribed = !disabled && (blockedReason || needsSignIn);
  const buttonProps = useActionButtonProps();
  const styles = scheduleRunApprovalStyles();

  return (
    <Box
      data-testid="schedule-run-approval"
      sx={[styles.root, compact && styles.compact]}
    >
      {authAction && !compact && (
        <ScheduleRunSignIn
          authAction={authAction}
          primary={needsSignIn}
          disabled={disabled}
        />
      )}
      <BaseBtn
        {...(needsSignIn ? buttonProps.secondary : buttonProps.primary)}
        sx={styles.button}
        startIcon={<CheckedIcon />}
        disabled={disabled || needsSignIn || !!blockedReason}
        aria-describedby={approveDescribed ? approveNoteId : undefined}
        onClick={() => decide('approve')}
      >
        Approve
      </BaseBtn>
      <BaseBtn
        {...buttonProps.secondary}
        sx={styles.button}
        startIcon={<ArrowForwardIcon />}
        disabled={disabled}
        onClick={() => decide('reject')}
      >
        Reject
      </BaseBtn>
      {!compact && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {formatExpiresIn(pausedAt, now)}
        </Typography>
      )}
      {blockedReason && onHitlResume && (
        <Typography
          id={blockedNoteId}
          variant="bodySmall"
          color="text.secondary"
          sx={styles.note}
        >
          {blockedReason}
        </Typography>
      )}
      {needsSignIn && !blockedReason && onHitlResume && (
        <Box
          role="status"
          sx={styles.note}
        >
          <Typography
            id={signInNoteId}
            variant="bodySmall"
            color="text.secondary"
          >
            {`Sign in to ${authContext?.toolkitName || 'the toolkit'}, then approve. The run continues after you approve.`}
          </Typography>
        </Box>
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
  compact: { padding: 0 },
  note: { flexBasis: '100%' },
  button: { width: 'auto !important' },
});

export default ScheduleRunApproval;
