import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useCancelEvalRunMutation, useEvalRunQuery } from '../../api';
import { EVAL_RUN_FALLBACK_POLL_MS, EVAL_RUN_STATUS } from '../../lib/constants';
import {
  formatRunStatus,
  formatScore,
  isRunActive,
  isRunTerminal,
  runProgressPercent,
} from '../../lib/helpers';
import { useEvalRunLiveProgress } from '../../lib/hooks';

// Progress screen (#6, §14.2): after a run is started it executes in the
// background and returns 202, so this dialog follows the run until it reaches a
// terminal status, then shows the headline / error. Progress arrives pushed over
// the socket; the initial GET seeds it and a slow poll covers a dead socket.
const RunProgressDialog = memo(props => {
  const { open, projectId, runId, onClose, onViewResults, onTerminal } = props;

  const shouldFetch = open && projectId != null && runId != null;

  // Fire onTerminal once per run: the single-run poll settling to a terminal
  // status is the only signal the runs-list query has to refetch (they share a
  // non-scoped tag, so the poll refreshes only its own cache — see SuiteConfigView).
  const terminalNotifiedRef = useRef(null);

  // Kept in state so the fallback can be switched off on a query error without
  // referencing the query result inline (which RTK Query cannot do).
  const [pollingInterval, setPollingInterval] = useState(0);

  const { data: run, isError } = useEvalRunQuery(
    { projectId, runId },
    {
      skip: !shouldFetch,
      pollingInterval,
    },
  );

  const settled = isRunTerminal(run?.status) || isError;

  // Follow the run's progress room while it is in flight. Terminal frames arrive
  // here too, so the dialog settles without another request.
  const { isLive } = useEvalRunLiveProgress({ projectId, runId, enabled: shouldFetch && !settled });

  // Degraded mode only: with a live socket the progress is pushed, so polling at
  // all would just re-read what was already delivered.
  useEffect(() => {
    setPollingInterval(shouldFetch && !settled && !isLive ? EVAL_RUN_FALLBACK_POLL_MS : 0);
  }, [shouldFetch, settled, isLive]);

  useEffect(() => {
    if (isRunTerminal(run?.status) && terminalNotifiedRef.current !== runId) {
      terminalNotifiedRef.current = runId;
      onTerminal?.(run);
    }
  }, [run, run?.status, isError, runId, onTerminal]);

  const [cancelRun, { isLoading: isCancelling }] = useCancelEvalRunMutation();

  // A running worker only observes the stop flag at its next case boundary, so the
  // status keeps reading `running` for a while after the request succeeds. Track the
  // request locally to explain that gap instead of leaving the button looking inert.
  const [cancelRequested, setCancelRequested] = useState(false);

  useEffect(() => {
    setCancelRequested(false);
  }, [runId]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelRun({ projectId, runId }).unwrap();
      setCancelRequested(true);
    } catch {
      // A 409 means the run reached a terminal state first; the poll shows the truth.
    }
  }, [cancelRun, projectId, runId]);

  const styles = runProgressDialogStyles();

  const view = useMemo(() => {
    const status = run?.status;
    const done = run?.progress?.done ?? 0;
    const total = run?.progress?.total ?? 0;
    return {
      status,
      done,
      total,
      percent: runProgressPercent(run?.progress),
      active: isRunActive(status) || (!status && !isError),
      finished: status === EVAL_RUN_STATUS.finished,
      errored: status === EVAL_RUN_STATUS.errored,
      cancelled: status === EVAL_RUN_STATUS.cancelled,
      headline: run?.headline_score,
      error: run?.error,
    };
  }, [run, isError]);

  const content = (
    <Box
      sx={styles.content}
      data-testid="evaluation-run-progress"
    >
      {isError ? (
        <Typography
          variant="bodySmall"
          sx={styles.error}
        >
          Failed to load run status. Please close and check the run history.
        </Typography>
      ) : (
        <>
          <Box sx={styles.statusRow}>
            {view.active && <CircularProgress size={18} />}
            <Typography variant="labelMedium">{formatRunStatus(view.status) || 'Starting…'}</Typography>
          </Box>

          <Box sx={styles.progressBlock}>
            <LinearProgress
              variant={view.total ? 'determinate' : 'indeterminate'}
              value={view.percent}
              data-testid="evaluation-run-progress-bar"
            />
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {view.total ? `Cases ${view.done}/${view.total}` : 'Preparing cases…'}
            </Typography>
          </Box>

          {cancelRequested && view.active && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid="evaluation-run-progress-cancel-pending"
            >
              Stop requested. The run finishes the case it is on, then stops and keeps the cases it already
              scored.
            </Typography>
          )}

          {(view.finished || view.cancelled) && (
            <Box sx={styles.scoreRow}>
              <Typography variant="headingSmall">{formatScore(view.headline)}</Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {view.cancelled ? 'Weighted score (partial)' : 'Weighted score'}
              </Typography>
            </Box>
          )}

          {view.errored && (
            <Typography
              variant="bodySmall"
              sx={styles.error}
              data-testid="evaluation-run-progress-error"
            >
              {view.error || 'The run failed. Please try again.'}
            </Typography>
          )}

          {/* A stopped run only carries a reason when nobody asked it to stop — currently the
              wall-clock cap. Without it a timed-out run is indistinguishable from a cancellation
              and the missing cases look like someone's choice. */}
          {view.cancelled && view.error && (
            <Typography
              variant="bodySmall"
              sx={styles.error}
              data-testid="evaluation-run-progress-stop-reason"
            >
              {view.error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={runId != null ? `Run #${runId}` : 'Evaluation run'}
      onClose={onClose}
      content={content}
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onClose}
            data-testid="evaluation-run-progress-close"
          >
            Close
          </Button.BaseBtn>
          {view.active && !isError && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              disabled={isCancelling || cancelRequested}
              onClick={handleCancel}
              data-testid="evaluation-run-progress-cancel"
            >
              {cancelRequested ? 'Stopping…' : 'Cancel run'}
            </Button.BaseBtn>
          )}
          {(view.finished || view.cancelled) && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              onClick={() => onViewResults?.(runId)}
              data-testid="evaluation-run-progress-view-results"
            >
              View results
            </Button.BaseBtn>
          )}
        </>
      }
      data-testid="evaluation-run-progress-dialog"
    />
  );
});

RunProgressDialog.displayName = 'RunProgressDialog';

/** @type {MuiSx} */
const runProgressDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '24rem',
    paddingTop: '0.5rem',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  progressBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
  }),
});

export default RunProgressDialog;
