import { memo } from 'react';

import { format } from 'date-fns';

import { Box, Typography } from '@mui/material';

const TimeLineStepLabel = memo(props => {
  const { index, createdAt } = props;

  const styles = timeLineStepLabelStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.timeRow}>
        <Typography
          variant="bodySmall"
          data-testid={`pipeline-run-details-timeline-timestamp-${index}`}
        >
          {format(new Date(createdAt), 'HH:mm:ss')}
        </Typography>
      </Box>
    </Box>
  );
});

TimeLineStepLabel.displayName = 'TimeLineStepLabel';

/** @type {MuiSx} */
const timeLineStepLabelStyles = () => ({
  container: {
    position: 'absolute',
    top: 'calc(100% + 0.125rem)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    justifyContent: 'center',
    width: 'max-content',
    whiteSpace: 'nowrap',
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '1.25rem',
  },
});

export default TimeLineStepLabel;
