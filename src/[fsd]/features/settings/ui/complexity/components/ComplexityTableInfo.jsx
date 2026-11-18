import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

const ComplexityTableInfo = memo(props => {
  const { meta, text = ComplexityConstants.TABLE_MEDIAN_INFO, testId = 'complexity-table-info' } = props;

  const styles = complexityTableInfoStyles();

  return (
    <Box sx={styles.root}>
      <InfoTooltip
        pinnable
        label="About this table"
        infoTooltip={{
          title: (
            <Box
              sx={styles.content}
              data-testid={`${testId}-content`}
            >
              <Typography variant="bodySmall">{text}</Typography>
              <Typography variant="bodySmall">{ComplexityHelpers.dataFreshnessNote(meta)}</Typography>
            </Box>
          ),
          icon: { width: 14, height: 14 },
        }}
        testId={testId}
      />
      <Typography
        variant="bodySmall"
        sx={styles.label}
      >
        About this table
      </Typography>
    </Box>
  );
});

ComplexityTableInfo.displayName = 'ComplexityTableInfo';

/** @type {MuiSx} */
const complexityTableInfoStyles = () => ({
  root: { display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: '0.5rem' },
  content: { display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '22rem' },
  label: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
});

export default ComplexityTableInfo;
