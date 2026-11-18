import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * Error state of an import/fork entity card: lists the backend messages explaining
 * why the entity could not be imported (e.g. the project's skill limit was exceeded).
 */
const IWModalEntityErrors = memo(props => {
  const { errorMessages = [] } = props;

  const styles = iWModalEntityErrorsStyles();

  if (!errorMessages.length) return null;

  return (
    <Box
      sx={styles.root}
      role="alert"
      data-testid="agent-import-entity-errors"
    >
      {errorMessages.map(message => (
        <Typography
          key={message}
          variant="bodySmall"
          sx={styles.message}
        >
          {message}
        </Typography>
      ))}
    </Box>
  );
});

IWModalEntityErrors.displayName = 'IWModalEntityErrors';

/** @type {MuiSx} */
const iWModalEntityErrorsStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    margin: '0 0 0.75rem',
    padding: '0.5rem 0.75rem',
    border: `0.0625rem solid ${palette.border.error}`,
    background: palette.background.error,
    borderRadius: '0.5rem',
  }),
  message: ({ palette }) => ({
    color: palette.text.error,
    wordBreak: 'break-word',
  }),
});

export default IWModalEntityErrors;
