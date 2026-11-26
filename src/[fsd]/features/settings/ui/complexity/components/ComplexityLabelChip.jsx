import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { StatusDot } from '@/[fsd]/shared/ui';

const { LABELS, PENDING_TOOLTIP } = ComplexityConstants;

const ComplexityLabelChip = memo(props => {
  const { label, pending = false, testId = 'complexity-label' } = props;

  const styles = complexityLabelChipStyles();
  const meta = LABELS[label];

  if (pending || !meta) {
    return (
      <Tooltip
        title={PENDING_TOOLTIP}
        placement="top"
      >
        <Box
          component="span"
          sx={styles.pendingRoot}
          data-testid={`${testId}-pending`}
        >
          <Box
            component="span"
            sx={styles.pendingDot}
          />
          <Typography
            variant="bodySmall"
            sx={styles.pending}
          >
            Not enough runs
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      component="span"
      sx={styles.root}
      data-testid={testId}
    >
      <StatusDot color={`${meta.color}.main`} />
      <Typography
        variant="bodySmall"
        component="span"
      >
        {meta.text}
      </Typography>
    </Box>
  );
});

ComplexityLabelChip.displayName = 'ComplexityLabelChip';

/** @type {MuiSx} */
const complexityLabelChipStyles = () => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pendingRoot: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pendingDot: ({ palette }) => ({
    display: 'inline-block',
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.text.metrics || palette.text.disabled}`,
  }),
  pending: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontStyle: 'italic',
  }),
});

export default ComplexityLabelChip;
