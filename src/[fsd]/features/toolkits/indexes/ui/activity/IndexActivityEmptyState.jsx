import { memo, useMemo } from 'react';

import { Box, Link, Typography } from '@mui/material';

import IndexingIcon from '@/assets/indexing.svg?react';

const IndexActivityEmptyState = memo(props => {
  const { statusShownAbove = false, onOpenConfiguration } = props;

  const styles = useMemo(() => indexActivityEmptyStateStyles(), []);

  return (
    <Box
      sx={styles.root}
      data-testid="index-activity-empty-state"
    >
      <IndexingIcon
        width="2rem"
        height="2rem"
      />
      <Box sx={styles.textContainer}>
        {!statusShownAbove && (
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            No indexing activity
          </Typography>
        )}
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          You may start reindexing with the current settings.
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          To modify them, open{' '}
          <Link
            component="button"
            variant="bodyMedium"
            underline="always"
            data-testid="index-activity-configuration-link"
            onClick={onOpenConfiguration}
          >
            Configuration
          </Link>{' '}
          first.
        </Typography>
      </Box>
    </Box>
  );
});

IndexActivityEmptyState.displayName = 'IndexActivityEmptyState';

/** @type {MuiSx} */
const indexActivityEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '1.5rem',
    textAlign: 'center',
    color: ({ palette }) => palette.icon.fill.disabled,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    maxWidth: '25rem',
  },
});

export default IndexActivityEmptyState;
