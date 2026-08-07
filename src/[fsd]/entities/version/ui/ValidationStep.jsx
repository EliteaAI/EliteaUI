import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import ValidationResult from '@/[fsd]/entities/version/ui/ValidationResult';

const ValidationStep = memo(props => {
  const { isValidating, validationResult, entityLabel = 'agent' } = props;
  if (isValidating) {
    return (
      <Box sx={styles.loadingRoot}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Reviewing your {entityLabel} version to ensure it meets publication rules.
        </Typography>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!validationResult) {
    return null;
  }

  return (
    <ValidationResult
      result={validationResult}
      entityLabel={entityLabel}
    />
  );
});

ValidationStep.displayName = 'ValidationStep';

/** @type {MuiSx} */
const styles = {
  loadingRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 1rem',
    gap: '8.5rem',
  },
};

export default ValidationStep;
