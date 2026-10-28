import { memo } from 'react';

import { Typography } from '@mui/material';

const FieldError = memo(({ message }) =>
  message ? (
    <Typography
      role="alert"
      variant="labelSmall"
      color="error"
    >
      {message}
    </Typography>
  ) : null,
);

FieldError.displayName = 'FieldError';

export default FieldError;
