import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useEvalRunQuery } from '../api';
import { EVAL_RUN_STATUS } from '../lib/constants';
import { formatRunStatus, formatScore, isRunActive, isRunTerminal, runProgressPercent } from '../lib/helpers';

const POLL_INTERVAL_MS = 1500;

// Progress screen (#6, §14.2): after a run is started it executes in the
// background and returns 202, so this dialog polls the single-run endpoint
// until the run reaches a terminal status, then shows the headline / error.
const RunProgressDialog = memo(props => {
  const { open, projectId, runId, onClose, onViewResults, onTerminal } = props;

  const shouldFetch = open && projectId != null && runId != null;

  // Fire onTerminal once per run: the single-run poll settling to a terminal
  // status is the only signal the runs-list query has to refetch (they share a
  // non-scoped tag, so the poll refreshes only its own cache — see SuiteConfigView).
  const terminalNotifiedRef = useRef(null);

  // Poll while the run is in flight; stop once it settles. Kept in state so the
  // interval can be driven by the fetched status without referencing the query
  // result inline (which RTK Query cannot do).
  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_MS);

  const { data: run, isError } = useEvalRunQuery(
    { projectId, runId },
    {
      skip: !shouldFetch,
      pollingInterval: shouldFetch ? pollingInterval : 0,
    },
  );

  // Reset polling whenever a new run is opened.
  useEffect(() => {
    if (shouldFetch) setPollingInterval(POLL_INTERVAL_MS);
  }, [shouldFetch, runId]);

  useEffect(() => {
    if (isRunTerminal(run?.status) || isError) setPollingInterval(0);
    if (isRunTerminal(run?.status) && terminalNotifiedRef.current !== runId) {
      terminalNotifiedRef.current = runId;
      onTerminal?.(run);
    }
  }, [run, run?.status, isError, runId, onTerminal]);

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

          {view.finished && (
            <Box sx={styles.scoreRow}>
              <Typography variant="headingSmall">{formatScore(view.headline)}</Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                Weighted score
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
          {view.finished && (
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
