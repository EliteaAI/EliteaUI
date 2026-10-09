import { memo, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useEvalSuiteEstimateQuery } from '../../api/evaluationApi';
import { buildRunEstimateSummary } from '../../lib/helpers';

/**
 * What a run of this suite would likely use, shown next to Evaluate (#6716, design Q-S6): the last
 * finished run on the selected version scaled to today's case count, the caller's remaining
 * budget, and an amber warning when the estimate is over it.
 */
const SuiteRunEstimate = memo(props => {
  const { suiteId, versionId } = props;
  const projectId = useSelectedProjectId();

  const { data } = useEvalSuiteEstimateQuery(
    { projectId, suiteId, versionId },
    { skip: !projectId || !suiteId || !versionId, refetchOnMountOrArgChange: true },
  );
  const summary = useMemo(() => buildRunEstimateSummary(data), [data]);

  const styles = suiteRunEstimateStyles();

  if (!summary) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-estimate"
    >
      <Tooltip
        title={summary.detail ?? ''}
        placement="top"
        arrow
      >
        <Typography
          variant="bodySmall"
          sx={[styles.text, !summary.available && styles.muted]}
          data-testid={summary.available ? 'evaluation-run-estimate-value' : 'evaluation-run-estimate-none'}
        >
          {summary.label}
          {summary.range && ` · ${summary.range}`}
        </Typography>
      </Tooltip>
      {summary.budget && (
        <Typography
          variant="bodySmall"
          sx={styles.text}
          data-testid="evaluation-run-estimate-budget"
        >
          {summary.budget}
        </Typography>
      )}
      {summary.warning && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid="evaluation-run-estimate-warning"
        >
          {summary.warning}
        </Typography>
      )}
    </Box>
  );
});

SuiteRunEstimate.displayName = 'SuiteRunEstimate';

/** @type {MuiSx} */
const suiteRunEstimateStyles = () => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0 1rem',
  },
  text: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  muted: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  warning: ({ palette }) => ({
    color: palette.text.attention,
    fontWeight: 600,
  }),
});

export default SuiteRunEstimate;
