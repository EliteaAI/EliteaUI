import React, { memo } from 'react';

import { Box } from '@mui/material';

import { Handle, Position } from '@xyflow/react';

const GhostNode = memo(() => {
  const styles = ghostNodeStyles();

  return (
    <Box sx={styles.box}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={styles.handle}
      />
    </Box>
  );
});

GhostNode.displayName = 'GhostNode';

/** @type {MuiSx} */
const ghostNodeStyles = () => ({
  box: {
    width: '1.125rem',
    height: '1.125rem',
    borderRadius: '50%',
  },
  handle: {
    width: '1.125rem',
    height: '1.125rem',
    borderRadius: '50%',
    top: '.5625rem',
  },
});

export default GhostNode;
