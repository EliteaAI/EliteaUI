import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const RunIndexScheduleContent = memo(props => {
  const { enabled, scheduleSummary, credentialsTitle } = props;
  const styles = runIndexScheduleContentStyles();

  if (!enabled)
    return (
      <Box sx={styles.placeholderBlock}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          No schedule configured
        </Typography>
      </Box>
    );

  return (
    <Box sx={styles.scheduleSummaryBlock}>
      <Typography variant="bodyMedium">{scheduleSummary}</Typography>
      {credentialsTitle && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Credentials: {credentialsTitle}
        </Typography>
      )}
    </Box>
  );
});

RunIndexScheduleContent.displayName = 'RunIndexScheduleContent';

/** @type {MuiSx} */
const runIndexScheduleContentStyles = () => ({
  placeholderBlock: {
    padding: '0.5rem 0',
  },
  scheduleSummaryBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.25rem 0',
  },
});

export default RunIndexScheduleContent;
