import { memo } from 'react';

import { Box } from '@mui/material';

/**
 * The machine-readable code of a refusal or an API error, shown as an outlined chip
 * next to its readable message (chat error card, credential form).
 */
const ErrorCodeChip = memo(props => {
  const { code, testId } = props;

  const styles = errorCodeChipStyles();

  return (
    <Box
      component="span"
      data-testid={testId}
      sx={styles.chip}
    >
      {code}
    </Box>
  );
});

ErrorCodeChip.displayName = 'ErrorCodeChip';

/** @type {MuiSx} */
const errorCodeChipStyles = () => ({
  chip: ({ palette }) => ({
    display: 'inline-block',
    marginLeft: '.75rem',
    padding: '.125rem .5rem',
    border: `0.0625rem solid ${palette.border.error}`,
    borderRadius: '1rem',
    fontSize: '.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
});

export default ErrorCodeChip;
