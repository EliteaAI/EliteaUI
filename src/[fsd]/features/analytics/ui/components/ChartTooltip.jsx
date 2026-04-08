import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticCommonHelpers } from '@/[fsd]/features/analytics/lib/helpers';

const ChartTooltip = memo(props => {
  const { active, payload, label } = props;

  const styles = chartTooltipStyles();

  if (!active || !payload?.length) return null;

  return (
    <Box sx={styles.chartTooltip}>
      <Typography
        variant="labelSmall"
        sx={styles.tooltipLabel}
      >
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Typography
          key={i}
          variant="bodySmall"
          sx={{ color: entry.color }}
        >
          {entry.name}:{' '}
          {typeof entry.value === 'number' ? AnalyticCommonHelpers.fmtNum(entry.value) : entry.value}
        </Typography>
      ))}
    </Box>
  );
});

ChartTooltip.displayName = 'ChartTooltip';

/** @type {MuiSx} */
const chartTooltipStyles = () => ({
  chartTooltip: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.secondary,
    border: `1px solid ${palette.border.table}`,
  }),
  tooltipLabel: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem' }),
});

export default ChartTooltip;
