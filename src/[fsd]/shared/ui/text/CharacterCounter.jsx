import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const CharacterCounter = memo(props => {
  const { value, maxLength, textVariant = 'bodySmall' } = props;
  const remaining = maxLength - value.length;
  const isAtLimit = remaining === 0;

  return (
    <Box sx={({ palette }) => ({ color: isAtLimit ? palette.error.main : palette.secondary.main })}>
      <Typography variant={textVariant}>
        {`${remaining} characters left`}
        {isAtLimit && '. You have reached the MAXIMUM character limit'}
      </Typography>
    </Box>
  );
});

CharacterCounter.displayName = 'CharacterCounter';

export default CharacterCounter;
