import { memo, useCallback } from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, IconButton, Typography } from '@mui/material';

const formatRelative = isoString => {
  if (!isoString) return null;

  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

const UsageLastUpdated = memo(props => {
  const { lastUpdatedAt, onRefresh, isRefreshing = false } = props;

  const styles = usageLastUpdatedStyles();

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  if (!lastUpdatedAt) return null;

  const label = formatRelative(lastUpdatedAt);

  return (
    <Box
      sx={styles.root}
      data-testid="usage-last-updated"
    >
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        Updated {label}
      </Typography>
      {onRefresh && (
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh usage data"
          sx={styles.iconBtn}
        >
          <RefreshIcon
            sx={[styles.icon, isRefreshing ? styles.spinning : {}]}
            fontSize="inherit"
          />
        </IconButton>
      )}
    </Box>
  );
});

UsageLastUpdated.displayName = 'UsageLastUpdated';

/** @type {MuiSx} */
const usageLastUpdatedStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
    justifyContent: 'flex-end',
  },
  text: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
  iconBtn: {
    padding: '0.125rem',
  },
  icon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.text.metrics || palette.text.disabled,
  }),
  spinning: {
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    animation: 'spin 1s linear infinite',
  },
});

export default UsageLastUpdated;
