import { memo } from 'react';

import { Box } from '@mui/material';

const NodeBodyContainer = memo(props => {
  const { children, display = 'flex' } = props;
  return (
    <Box
      display={display}
      flexDirection="column"
      padding="1rem 1rem 1rem 1rem"
      gap=".75rem"
      width="100%"
      boxSizing="border-box"
    >
      {children}
    </Box>
  );
});

NodeBodyContainer.displayName = 'NodeBodyContainer';

export default NodeBodyContainer;
