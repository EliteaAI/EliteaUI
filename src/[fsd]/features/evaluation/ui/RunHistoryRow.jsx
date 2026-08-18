import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { formatRunStatus, formatScore, formatScoreDelta, isRunTerminal } from '../lib/helpers';

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const RunHistoryRow = memo(props => {
  const { run, onViewResults } = props;

  const handleClick = useCallback(() => {
    if (isRunTerminal(run.status)) onViewResults?.(run.id);
  }, [run.id, run.status, onViewResults]);

  const styles = runHistoryRowStyles(isRunTerminal(run.status), run.delta);
  const deltaLabel = formatScoreDelta(run.delta);

  return (
    <Box
      sx={styles.root}
      onClick={handleClick}
      data-testid={`evaluation-run-history-row-${run.id}`}
    >
      <Box sx={styles.left}>
        <Typography variant="bodySmall">#{run.id}</Typography>
        <Typography
          variant="bodySmall2"
          color="text.secondary"
        >
          {formatDate(run.finished_at || run.started_at || run.created_at)} · {formatRunStatus(run.status)}
        </Typography>
      </Box>

      <Box sx={styles.right}>
        <Typography variant="bodyMedium">{formatScore(run.headline_score)}</Typography>
        {!!deltaLabel && (
          <Typography
            variant="bodySmall2"
            sx={styles.delta}
            data-testid={`evaluation-run-history-delta-${run.id}`}
          >
            {deltaLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

RunHistoryRow.displayName = 'RunHistoryRow';

/** @type {MuiSx} */
const runHistoryRowStyles = (isClickable, delta) => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.5rem 0',
    cursor: isClickable ? 'pointer' : 'default',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:last-of-type': {
      borderBottom: 'none',
    },
    '&:hover': {
      backgroundColor: isClickable ? palette.background.tabButton.default : 'transparent',
    },
  }),
  left: {
    display: 'flex',
    flexDirection: 'column',
  },
  right: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.375rem',
  },
  delta: ({ palette }) => ({
    color: delta > 0 ? palette.success.main : delta < 0 ? palette.error.main : palette.text.secondary,
  }),
});

export default RunHistoryRow;
