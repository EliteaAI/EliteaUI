import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const NodeEntrypointBadge = memo(() => {
  const styles = nodeEntrypointBadgeStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-entrypoint-badge"
    >
      <Typography
        variant="bodySmall"
        sx={styles.text}
        noWrap
      >
        Entrypoint
      </Typography>
    </Box>
  );
});

NodeEntrypointBadge.displayName = 'NodeEntrypointBadge';

/** @type {MuiSx} */
const nodeEntrypointBadgeStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    flex: '0 1 auto',
    minWidth: '3.5rem',
    height: '1.5rem',
    padding: '0 0.5rem',
    boxSizing: 'border-box',
    borderRadius: '1rem',
    backgroundColor: palette.components.flowEditor.card.badge.entrypoint.background,
  }),
  text: ({ palette }) => ({
    color: palette.components.flowEditor.card.badge.entrypoint.text,
  }),
});

export default NodeEntrypointBadge;
