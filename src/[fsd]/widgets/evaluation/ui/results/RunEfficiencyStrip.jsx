import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { buildRunEfficiencyStrip } from '../../lib/helpers';

/**
 * The run header's "Efficiency" strip (tokenomics design §6, performance design §3.2): latency
 * p50/p95, timeouts, the agent's tokens and cost, tool calls and the tool-error rate. The judge's
 * cost is a separate, muted line and is never added to the agent's. Renders nothing for a run
 * that predates the rollups.
 */
const RunEfficiencyStrip = memo(props => {
  const { meta } = props;

  const strip = useMemo(() => buildRunEfficiencyStrip(meta), [meta]);

  const styles = runEfficiencyStripStyles();

  if (!strip?.items.length) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-efficiency"
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodySmall2"
          sx={styles.title}
        >
          Efficiency
        </Typography>
        {strip.isEstimate && (
          <Box
            component="span"
            sx={styles.chip}
            data-testid="evaluation-efficiency-estimate"
          >
            Estimated
          </Box>
        )}
      </Box>

      <Box sx={styles.items}>
        {strip.items.map(item => (
          <Box
            key={item.label}
            sx={styles.item}
          >
            <Typography
              variant="labelSmall"
              sx={styles.label}
            >
              {item.label}
            </Typography>
            <Typography
              variant="bodySmall"
              sx={[styles.value, item.isAttention && styles.attention]}
            >
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {strip.judgeOverhead && (
        <Typography
          variant="bodySmall"
          sx={styles.muted}
          data-testid="evaluation-efficiency-judge"
        >
          {strip.judgeOverhead}
        </Typography>
      )}
    </Box>
  );
});

RunEfficiencyStrip.displayName = 'RunEfficiencyStrip';

/** @type {MuiSx} */
const runEfficiencyStripStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '0.75rem 1.5rem 0',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: palette.text.primary,
  }),
  chip: ({ palette }) => ({
    padding: '0 0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: palette.text.primary,
  }),
  items: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 2rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  value: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  attention: ({ palette }) => ({
    color: palette.alert.warning.text,
  }),
  muted: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default RunEfficiencyStrip;
