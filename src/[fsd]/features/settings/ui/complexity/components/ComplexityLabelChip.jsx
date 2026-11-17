import { memo } from 'react';

import { Chip, Tooltip, Typography } from '@mui/material';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';

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
        <Typography
          variant="bodySmall"
          sx={styles.pending}
          data-testid={`${testId}-pending`}
        >
          Not enough runs
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Chip
      size="small"
      variant="outlined"
      color={meta.color}
      label={meta.text}
      sx={styles.chip}
      data-testid={testId}
    />
  );
});

ComplexityLabelChip.displayName = 'ComplexityLabelChip';

/** @type {MuiSx} */
const complexityLabelChipStyles = () => ({
  chip: {
    height: '1.25rem',
    fontSize: '0.6875rem',
  },
  pending: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontStyle: 'italic',
  }),
});

export default ComplexityLabelChip;
