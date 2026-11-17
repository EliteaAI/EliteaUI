import { memo, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';

const { DIMENSIONS } = ComplexityConstants;

export const dimensionColor = (palette, index) =>
  [palette.status.draft, palette.status.onModeration, palette.status.published][index];

const ComplexityBreakdownBar = memo(props => {
  const { breakdown, testId = 'complexity-breakdown' } = props;

  const shares = useMemo(() => ComplexityHelpers.breakdownShares(breakdown), [breakdown]);
  const styles = complexityBreakdownBarStyles();

  const title = (
    <Box>
      {DIMENSIONS.map(({ key, label }) => (
        <Typography
          key={key}
          variant="bodySmall"
          component="div"
        >
          {label}: {ComplexityHelpers.formatCu(breakdown?.[key])} CU
        </Typography>
      ))}
    </Box>
  );

  return (
    <Tooltip
      title={title}
      placement="top"
    >
      <Box
        sx={styles.bar}
        data-testid={testId}
      >
        {DIMENSIONS.map(({ key }, index) => (
          <Box
            key={key}
            sx={[styles.segment(index), { width: `${shares[index]}%` }]}
            data-testid={`${testId}-${key}`}
          />
        ))}
      </Box>
    </Tooltip>
  );
});

ComplexityBreakdownBar.displayName = 'ComplexityBreakdownBar';

/** @type {MuiSx} */
const complexityBreakdownBarStyles = () => ({
  bar: ({ palette }) => ({
    display: 'flex',
    width: '100%',
    minWidth: '5rem',
    height: '0.5rem',
    borderRadius: '0.25rem',
    overflow: 'hidden',
    backgroundColor: palette.background.badge,
  }),
  segment:
    index =>
    ({ palette }) => ({
      height: '100%',
      backgroundColor: dimensionColor(palette, index),
    }),
});

export default ComplexityBreakdownBar;
