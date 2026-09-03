import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { formatScore, isRunTerminal } from '../../../lib/helpers';

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const LastRunSummary = memo(props => {
  const { run, onViewResults } = props;

  const styles = lastRunSummaryStyles();

  const meta = useMemo(() => {
    if (!run) return null;
    const when = formatDate(run.finished_at || run.started_at || run.created_at);
    const done = run.progress?.done ?? 0;
    const total = run.progress?.total ?? 0;
    return { when, done, total };
  }, [run]);

  if (!run) {
    return (
      <Box
        sx={styles.empty}
        data-testid="evaluation-last-run-summary"
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No evaluation runs yet. Configure the suite, then run an evaluation to see results here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-last-run-summary"
    >
      <Typography variant="labelMedium">
        Last run #{run.id}
        {meta.when ? ` · ${meta.when}` : ''}
      </Typography>

      <Box sx={styles.scoreRow}>
        <Typography variant="headingSmall">{formatScore(run.headline_score)}</Typography>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Weighted score
        </Typography>
      </Box>

      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Status: {run.status}
        {meta.total ? ` · Cases ${meta.done}/${meta.total}` : ''}
      </Typography>

      {run.error && (
        <Typography
          variant="bodySmall"
          sx={styles.error}
        >
          {run.error}
        </Typography>
      )}

      {isRunTerminal(run.status) && (
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={() => onViewResults?.(run.id)}
            data-testid="evaluation-last-run-view-results"
          >
            View results
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

LastRunSummary.displayName = 'LastRunSummary';

/** @type {MuiSx} */
const lastRunSummaryStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  empty: {
    display: 'flex',
    padding: '1rem',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
  }),
});

export default LastRunSummary;
