import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * A chip-shaped label used as a visual section heading.
 * Displays text in uppercase subtitle style with a semi-transparent
 * background and a border, adapting to the current theme (light/dark).
 */
const HeadingChip = memo(props => {
  const { label, sx } = props;

  return (
    <Box sx={[styles.chip, sx]}>
      <Typography
        variant="subtitle"
        color="text.secondary"
      >
        {label}
      </Typography>
    </Box>
  );
});

HeadingChip.displayName = 'HeadingChip';

/** @type {MuiSx} */
const styles = {
  chip: ({ palette }) => ({
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '0.25rem 0.625rem',
    gap: '0.625rem',
    background: palette.background.userInputBackgroundActive,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.25rem',
    boxSizing: 'border-box',
    flexShrink: 0,
  }),
};

export default HeadingChip;
