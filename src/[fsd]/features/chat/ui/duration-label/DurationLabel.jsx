import { memo } from 'react';

import { Tooltip, Typography } from '@mui/material';

import { DurationHelpers } from '@/[fsd]/shared/lib/helpers';

// "· 2.4s" after a chat chip or sub-agent title; the tooltip has millisecond precision.
const DurationLabel = memo(props => {
  const { durationMs, includesApprovalWait = false, testId } = props;

  if (durationMs == null) return null;

  return (
    <Tooltip
      title={DurationHelpers.formatDurationTooltip(durationMs, includesApprovalWait)}
      placement="top"
    >
      <Typography
        variant="bodySmall2"
        sx={durationLabelStyles.label}
        data-testid={testId}
      >
        · {DurationHelpers.formatDurationMs(durationMs)}
      </Typography>
    </Tooltip>
  );
});

DurationLabel.displayName = 'DurationLabel';

/** @type {MuiSx} */
const durationLabelStyles = {
  label: ({ palette }) => ({
    color: palette.text.metrics,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
};

export default DurationLabel;
