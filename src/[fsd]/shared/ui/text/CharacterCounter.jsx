import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const CharacterCounter = memo(props => {
  const {
    value,
    maxLength,
    textVariant = 'bodySmall',
    hideMaxLimitMessage = false,
    sx,
    'data-testid': dataTestId,
  } = props;
  const remaining = maxLength - value.length;
  const isAtLimit = remaining === 0;
  const showMaxLimitMessage = isAtLimit && !hideMaxLimitMessage;

  return (
    <Box
      data-testid={dataTestId}
      sx={({ palette }) => ({
        display: 'contents',
        color: showMaxLimitMessage ? palette.error.main : palette.secondary.main,
      })}
    >
      <Typography
        variant={textVariant}
        sx={sx}
      >
        {`${remaining} characters left`}
        {showMaxLimitMessage && '. You have reached the MAXIMUM character limit'}
      </Typography>
    </Box>
  );
});

CharacterCounter.displayName = 'CharacterCounter';

export default CharacterCounter;
