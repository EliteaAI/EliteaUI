import { memo, useCallback, useId, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { SCHEDULE_RUNS_TAG, scheduleApi } from '@/[fsd]/entities/schedule';
import { getToolkitAuthorizationContext } from '@/[fsd]/features/chat';
import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BaseCheckbox } from '@/[fsd]/shared/ui/checkbox';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ArrowForwardIcon from '@/assets/icons/arrow-forward.svg?react';

import { OWNER_ONLY_NOTE, TEST_RUN_ONLY_NOTE, formatExpiresIn } from '../lib/helpers';
import { useActionButtonProps } from '../lib/hooks/useActionButtonProps.hooks';
import { useNow } from '../lib/hooks/useNow.hooks';
import { useWaitingRunDecision } from '../lib/hooks/useWaitingRunDecision.hooks';
import ScheduleRunApprovalActions from './ScheduleRunApprovalActions';
import ScheduleRunSignIn from './ScheduleRunSignIn';

const PAGE_BUTTON_PROPS = {
  primary: { variant: 'elitea', color: 'primary' },
  secondary: { variant: 'elitea', color: 'secondary' },
};

/**
 * Approve and Reject at the paused line of a waiting run.
 * The same decision call as the Runs table, for the user the run acts as; the server still checks the caller.
 * The user in `run.decider_id` decides: the schedule owner at the start of the run, or the starter of a Test run
 * (`run.isDraftRun`, no schedule). Any other viewer sees both buttons disabled and a note that says why. A viewer
 * of a run with a schedule also gets the actions of `ScheduleRunApprovalActions`.
 * `authAction` is the toolkit sign-in the run waits for: the user the run acts as signs in first (the chat
 * sign-in window), then Approve resumes the run with the fresh tokens. Reject skips the sign-in.
 * `blockedReason` keeps Approve off and names why. `compact` is the form for the Action needed card: no
 * left offset, no sign-in button and no expiry text, because the card shows them itself.
 * `plain` is the page button look (primary Approve, secondary Reject, no icons) of the short waiting notice.
 * Only the plain form of a sensitive-tool pause with a chat offers "Approve all tools for this run"; the tick
 * rides on Approve, Reject ignores it, and it is cleared when the decision went through. A failed request keeps
 * it, so a retry still approves all. `approveAllAllowed` is false when the
 * server refuses it (the project setting is off or the caller is not the run's actor): the box is then hidden.
 */
const ScheduleRunApproval = memo(props => {
  const {
    schedule,
    run,
    runId,
    hasChat = true,
    conversationUuid,
    pausedMessageId,
    pausedAt,
    authAction,
    blockedReason,
    compact = false,
    plain = false,
    approveAllAllowed = true,
  } = props;

  const dispatch = useDispatch();
  const signInNoteId = useId();
  const blockedNoteId = useId();
  const approveAllId = useId();
  const [deciding, setDeciding] = useState(false);
  // The card keys this component by run, so the tick resets for another run
  const [approveAllChecked, setApproveAllChecked] = useState(false);
  const authContext = useMemo(
    () => (authAction ? getToolkitAuthorizationContext(authAction) : null),
    [authAction],
  );
  const serverUrl = authAction?.toolOutputs?.server_url || authAction?.toolMeta?.server_url || '';
  // The token store answers for a sign-in done here or in another tab
  const { isLoggedIn: signedIn } = useMcpTokenChange({ serverUrl });
  const now = useNow();
  // A decision changes the run on the server, so the run and the list load again. The hook calls this only
  // when the run was decided or the server answered that it changed; a failed request leaves the tick as it is
  const onDecided = useCallback(() => {
    setApproveAllChecked(false);
    return dispatch(scheduleApi.util.invalidateTags([SCHEDULE_RUNS_TAG]));
  }, [dispatch]);
  const onHitlResume = useWaitingRunDecision({ schedule, run, onDecided });
  const canApproveAll = plain && hasChat && !authAction && approveAllAllowed;
  const approveAll = canApproveAll && approveAllChecked;

  const decide = useCallback(
    async action => {
      setDeciding(true);
      try {
        await onHitlResume({
          action,
          conversationUuid,
          runId,
          messageId: pausedMessageId,
          ...(action === 'approve' && approveAll && { approveAll: true }),
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
    [onHitlResume, conversationUuid, runId, pausedMessageId, authAction, serverUrl, approveAll],
  );
  const handleApproveAllChange = useCallback(event => setApproveAllChecked(event.target.checked), []);

  // A run with a chat waits until its chat has loaded; a run without one (it waits for credentials) is ready
  const disabled = !onHitlResume || (hasChat && !conversationUuid) || deciding;
  const needsSignIn = Boolean(authAction) && !signedIn;
  const approveNoteId = blockedReason ? blockedNoteId : signInNoteId;
  const approveDescribed = !disabled && (blockedReason || needsSignIn);
  const themeButtonProps = useActionButtonProps();
  const buttonProps = plain ? PAGE_BUTTON_PROPS : themeButtonProps;
  const styles = scheduleRunApprovalStyles();
  // The note for a viewer who may not decide: a Test run belongs to its starter, any other run to its owner
  const isTestRun = Boolean(run?.isDraftRun);
  const noteText = isTestRun ? TEST_RUN_ONLY_NOTE : OWNER_ONLY_NOTE;
  const showActions = !onHitlResume && !isTestRun && Boolean(schedule);

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
      {canApproveAll && (
        <Box sx={styles.approveAll}>
          <FormControlLabel
            control={
              <BaseCheckbox
                checked={approveAll}
                disabled={disabled}
                onChange={handleApproveAllChange}
                slotProps={{
                  input: { 'data-testid': 'schedule-approve-all', 'aria-describedby': approveAllId },
                }}
              />
            }
            label={<Typography variant="bodyMedium">Approve all tools for this run</Typography>}
          />
          <Typography
            id={approveAllId}
            variant="bodySmall"
            color="text.secondary"
            sx={styles.approveAllHint}
          >
            The run should not ask again until it ends, also for tools it has not called yet.
          </Typography>
        </Box>
      )}
      <BaseBtn
        {...(needsSignIn ? buttonProps.secondary : buttonProps.primary)}
        sx={styles.button}
        startIcon={plain ? undefined : <CheckedIcon />}
        disabled={disabled || needsSignIn || !!blockedReason}
        aria-describedby={approveDescribed ? approveNoteId : undefined}
        onClick={() => decide('approve')}
      >
        Approve
      </BaseBtn>
      <BaseBtn
        {...buttonProps.secondary}
        sx={styles.button}
        startIcon={plain ? undefined : <ArrowForwardIcon />}
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
      {showActions && (
        <ScheduleRunApprovalActions
          schedule={schedule}
          note={noteText}
        />
      )}
      {!onHitlResume && !showActions && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.note}
        >
          {noteText}
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
  approveAll: { flexBasis: '100%', display: 'flex', flexDirection: 'column' },
  approveAllHint: { paddingLeft: '2rem' },
  button: { width: 'auto !important' },
});

export default ScheduleRunApproval;
