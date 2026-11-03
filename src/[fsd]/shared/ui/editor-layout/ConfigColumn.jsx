import { memo } from 'react';

import { Box } from '@mui/material';

/**
 * Vertical stack of configuration sections with the standard spacing between them.
 */
const ConfigColumn = memo(props => {
  const { children, sx } = props;

  const styles = configColumnStyles();

  return <Box sx={[styles.root, sx]}>{children}</Box>;
});

ConfigColumn.displayName = 'ConfigColumn';

/** @type {MuiSx} */
const configColumnStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
});

export default ConfigColumn;
