import { memo } from 'react';

import { Box } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';

const { DIMENSIONS } = ComplexityConstants;

// Inline spans only: the table renders its subtitle inside a paragraph
const ComplexityBreakdownLegend = memo(() => {
  const styles = complexityBreakdownLegendStyles();

  return (
    <Box
      component="span"
      sx={styles.legend}
      data-testid="complexity-breakdown-legend"
    >
      Breakdown:
      {DIMENSIONS.map(({ key, label }, index) => (
        <Box
          key={key}
          component="span"
          sx={styles.item}
        >
          <Box
            component="span"
            sx={styles.swatch(index)}
          />
          {label}
        </Box>
      ))}
    </Box>
  );
});

ComplexityBreakdownLegend.displayName = 'ComplexityBreakdownLegend';

/** @type {MuiSx} */
const complexityBreakdownLegendStyles = () => ({
  legend: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  item: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  swatch:
    index =>
    ({ palette }) => ({
      display: 'inline-block',
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '0.125rem',
      backgroundColor: ComplexityHelpers.dimensionColor(palette, index),
    }),
});

export default ComplexityBreakdownLegend;
