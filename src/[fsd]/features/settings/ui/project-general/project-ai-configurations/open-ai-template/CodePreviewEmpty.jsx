import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const CodePreviewEmpty = memo(() => {
  const styles = getStyles();

  return (
    <Box sx={styles.emptyStateContainer}>
      <Box>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.emptyStateTitle}
        >
          Select a LLM Model to see Code examples
        </Typography>
        <Box sx={styles.emptyStateSubtitleContainer}>
          <Typography
            variant="bodySmall"
            color="text.disabled"
            sx={styles.emptyStateSubtitle}
          >
            Choose form the LLM Model dropdown list.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

CodePreviewEmpty.displayName = 'CodePreviewEmpty';

/** @type {MuiSx} */
const getStyles = () => ({
  emptyStateContainer: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.25rem',
    textAlign: 'center',
  },

  emptyStateTitle: {
    marginBottom: '1rem',
  },

  emptyStateSubtitleContainer: {
    marginTop: '1rem',
  },

  emptyStateSubtitle: {
    lineHeight: 1.8,
    display: 'block',
    whiteSpace: 'normal',
  },
});

export default CodePreviewEmpty;
