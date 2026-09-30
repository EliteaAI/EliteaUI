import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const CountBadge = memo(props => {
  const { count, total, text, ariaLabel, sx, testId } = props;

  const baseText = total === undefined ? `${count}` : `${count} / ${total}`;
  const displayText = text ? `${baseText} ${text}` : baseText;

  const styles = countBadgeStyles();

  return (
    <Box sx={[styles.badge, sx]}>
      <Typography
        variant="bodySmall"
        color="text.primary"
        aria-label={ariaLabel}
        data-testid={testId}
      >
        {displayText}
      </Typography>
    </Box>
  );
});

CountBadge.displayName = 'CountBadge';

/** @type {MuiSx} */
const countBadgeStyles = () => ({
  badge: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    border: `0.0625rem solid ${palette.border.default}`,
  }),
});

export default CountBadge;
