import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';

import ComplexityBreakdownBar from './ComplexityBreakdownBar';
import ComplexityBreakdownLegend from './ComplexityBreakdownLegend';
import ComplexityLabelChip from './ComplexityLabelChip';

const { DIMENSIONS, RUN_UNAVAILABLE } = ComplexityConstants;

const RunComplexityTab = memo(props => {
  const { run, meta, loading, error } = props;

  const styles = runComplexityTabStyles();

  if (loading && !run)
    return (
      <Box sx={styles.centered}>
        <CircularProgress size={32} />
      </Box>
    );

  // A missing or unreadable score is never shown as zero or replaced by the agent's aggregate
  if (!run)
    return (
      <Box sx={styles.centered}>
        <Typography
          variant="bodyMedium"
          sx={styles.note}
          data-testid="run-complexity-unavailable"
        >
          {error ? 'Failed to load complexity data.' : RUN_UNAVAILABLE}
        </Typography>
      </Box>
    );

  return (
    <Box
      sx={styles.root}
      data-testid="run-complexity"
    >
      <Box sx={styles.card}>
        <Box sx={styles.scoreRow}>
          <Typography
            variant="headingSmall"
            data-testid="run-complexity-cu"
          >
            {ComplexityHelpers.formatCu(run.cu_total)} CU
          </Typography>
          <ComplexityLabelChip
            label={run.label}
            testId="run-complexity-label"
          />
          <Typography
            variant="bodyMedium"
            sx={styles.note}
            data-testid="run-complexity-percentile"
          >
            {run.percentile == null
              ? 'Percentile unavailable'
              : `${ComplexityHelpers.formatPercentile(run.percentile)}: more complex than ${run.percentile}% of runs`}
          </Typography>
        </Box>
        <Box sx={styles.bar}>
          <ComplexityBreakdownBar breakdown={run.breakdown} />
        </Box>
        <Typography
          variant="bodySmall"
          component="div"
          sx={styles.note}
        >
          <ComplexityBreakdownLegend />
        </Typography>
        <Box sx={styles.dimensions}>
          {DIMENSIONS.map(({ key, label }) => (
            <Box
              key={key}
              sx={styles.dimension}
              data-testid={`run-complexity-${key}`}
            >
              <Typography
                variant="bodySmall"
                sx={styles.note}
              >
                {label}
              </Typography>
              <Typography variant="bodyMedium">
                {ComplexityHelpers.formatCu(run.breakdown?.[key])} CU
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.note}
        >
          {run.llm_calls} LLM calls · {run.tool_calls} tool calls · peak prompt{' '}
          {Number(run.peak_input_tokens || 0).toLocaleString()} tokens
        </Typography>
      </Box>
      <Typography
        variant="bodySmall"
        sx={styles.note}
        data-testid="run-complexity-freshness"
      >
        {ComplexityHelpers.dataFreshnessNote(meta)}
      </Typography>
    </Box>
  );
});

RunComplexityTab.displayName = 'RunComplexityTab';

/** @type {MuiSx} */
const runComplexityTabStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  scoreRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  bar: { width: '100%', maxWidth: '24rem' },
  dimensions: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  dimension: { display: 'flex', flexDirection: 'column', gap: '0.125rem' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' },
  note: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
});

export default RunComplexityTab;
