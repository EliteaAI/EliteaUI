import { memo } from 'react';

import { Box } from '@mui/material';

const NodeBodyContainer = memo(props => {
  const { children, display = 'flex' } = props;
  const styles = nodeBodyContainerStyles();

  return <Box sx={styles.root(display)}>{children}</Box>;
});

NodeBodyContainer.displayName = 'NodeBodyContainer';

/** @type {MuiSx} */
const nodeBodyContainerStyles = () => ({
  root: display => ({
    display,
    flexDirection: 'column',
    padding: '1rem 1rem 1rem 1rem',
    gap: '.75rem',
    width: '100%',
    boxSizing: 'border-box',
  }),
});

export default NodeBodyContainer;
