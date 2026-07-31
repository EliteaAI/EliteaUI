import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const IndexStatItem = memo(props => {
  const { icon: Icon, label, value } = props;
  const styles = getStyles();
  return (
    <Box sx={styles.statItem}>
      <Box sx={styles.statLabel}>
        <Icon sx={styles.statIcon} />
        <Typography
          variant="bodyMedium"
          color="text.primary"
          noWrap
        >
          {label}:
        </Typography>
      </Box>
      <Box sx={styles.statValue}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          noWrap
        >
          {value ?? '—'}
        </Typography>
      </Box>
    </Box>
  );
});

IndexStatItem.displayName = 'IndexStatItem';

/** @type {MuiSx} */
const getStyles = () => ({
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
  },
  statLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    flexShrink: 0,
    color: ({ palette }) => palette.icon.fill.disabled,
  },
  statIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    color: palette.icon.fill.disabled,
  }),
  statValue: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    borderRadius: '1rem',
    minWidth: 0,
  },
});

export default IndexStatItem;
