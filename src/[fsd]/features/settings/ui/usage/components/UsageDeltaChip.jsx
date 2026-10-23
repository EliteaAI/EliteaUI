import { memo } from 'react';

import { Typography, useTheme } from '@mui/material';

const DIRECTION_GLYPH = { up: '▲', down: '▼', flat: '', new: '', none: '' };

const UsageDeltaChip = memo(props => {
  const { delta, testId } = props;
  const { palette } = useTheme();

  const styles = usageDeltaChipStyles();

  if (!delta || delta.direction === 'none') return null;

  const color =
    delta.direction === 'up'
      ? palette.warning.main
      : delta.direction === 'down'
        ? palette.success.main
        : delta.direction === 'new'
          ? palette.info?.main || palette.primary.main
          : palette.text.metrics || palette.text.disabled;

  const glyph = DIRECTION_GLYPH[delta.direction] || '';

  return (
    <Typography
      variant="bodySmall"
      sx={[styles.chip, { color }]}
      data-testid={testId}
      title={delta.tip}
    >
      {glyph ? `${glyph} ` : ''}
      {delta.label}
    </Typography>
  );
});

UsageDeltaChip.displayName = 'UsageDeltaChip';

/** @type {MuiSx} */
const usageDeltaChipStyles = () => ({
  chip: {
    fontWeight: 600,
  },
});

export default UsageDeltaChip;
