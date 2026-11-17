import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';

const { COMPLEXITY_TOOLTIP, INFO_LABELS_FALLBACK, INFO_LINES } = ComplexityConstants;

const ComplexityInfo = memo(props => {
  const { meta } = props;

  const styles = complexityInfoStyles();
  const labels = ComplexityHelpers.thresholdsLine(meta) ?? INFO_LABELS_FALLBACK;

  return (
    <Box
      sx={styles.root}
      data-testid="complexity-info"
    >
      <Typography variant="bodySmall">{COMPLEXITY_TOOLTIP}</Typography>
      {[...INFO_LINES, { term: 'Labels', text: labels }].map(({ term, text }) => (
        <Typography
          key={term}
          variant="bodySmall"
          component="div"
          data-testid={`complexity-info-${term.toLowerCase()}`}
        >
          <Box
            component="span"
            sx={styles.term}
          >
            {term}:
          </Box>{' '}
          {text}
        </Typography>
      ))}
    </Box>
  );
});

ComplexityInfo.displayName = 'ComplexityInfo';

/** @type {MuiSx} */
const complexityInfoStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.375rem', maxWidth: '22rem' },
  term: { fontWeight: 600 },
});

export default ComplexityInfo;
