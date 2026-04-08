import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const BucketFooter = memo(props => {
  const { bucketCount = 0, totalSize = '0B' } = props;
  const styles = bucketFooterStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.statItem}>
        <Typography
          component="span"
          variant="bodySmall2"
          color="text.primary"
        >
          Buckets:
        </Typography>
        <Typography
          component="span"
          variant="bodySmall2"
          color="text.secondary"
        >
          {bucketCount}
        </Typography>
      </Box>
      <Box sx={styles.statItem}>
        <Typography
          component="span"
          color="text.primary"
          variant="bodySmall2"
        >
          Size:
        </Typography>
        <Typography
          component="span"
          variant="bodySmall2"
          color="text.secondary"
        >
          {totalSize}
        </Typography>
      </Box>
    </Box>
  );
});

BucketFooter.displayName = 'BucketFooter';

/** @type {MuiSx} */
const bucketFooterStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '1rem',
    padding: '0.75rem 1.5rem',
    borderTop: '1px solid',
    borderColor: 'divider',
    backgroundColor: ({ palette }) => palette.background.tabPanel,
    marginTop: 'auto',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
});

export default BucketFooter;
