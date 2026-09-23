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
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '1rem',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.background.default.tertiary,
    marginTop: 'auto',
    minHeight: '3.25rem',
  }),
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
});

export default BucketFooter;
