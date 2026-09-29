import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * The one empty state every per-run Analytics tab shows, so the message sits in the same place whichever
 * tab is open.
 */
const RunAnalyticsEmptyState = memo(props => {
  const { message, testId } = props;

  const styles = runAnalyticsEmptyStateStyles();

  return (
    <Box sx={styles.root}>
      <Typography
        variant="bodyMedium"
        sx={styles.text}
        data-testid={testId}
      >
        {message}
      </Typography>
    </Box>
  );
});

RunAnalyticsEmptyState.displayName = 'RunAnalyticsEmptyState';

/** @type {MuiSx} */
const runAnalyticsEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
  },
  text: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
});

export default RunAnalyticsEmptyState;
