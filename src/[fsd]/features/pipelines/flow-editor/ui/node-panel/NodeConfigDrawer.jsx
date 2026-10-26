import { memo } from 'react';

import { Box, Slide } from '@mui/material';

/**
 * Overlays the node panel on the canvas's right edge, so the canvas and its controls don't move.
 * It slides in from that edge (`container`) and back out on close.
 */
const NodeConfigDrawer = memo(props => {
  const { open, onExited, container, children } = props;
  const styles = nodeConfigDrawerStyles();

  return (
    <Slide
      in={open}
      direction="left"
      container={container}
      onExited={onExited}
      mountOnEnter
      unmountOnExit
    >
      <Box
        sx={styles.root}
        data-testid="pipeline-node-panel-drawer"
      >
        {children}
      </Box>
    </Slide>
  );
});

NodeConfigDrawer.displayName = 'NodeConfigDrawer';

/** @type {MuiSx} */
const nodeConfigDrawerStyles = () => ({
  // -1px lays the panel's top, right and bottom borders over the canvas frame's border
  root: {
    position: 'absolute',
    top: '-0.0625rem',
    right: '-0.0625rem',
    bottom: '-0.0625rem',
    // Above the canvas overlays (State button and run bar use 100)
    zIndex: 110,
  },
});

export default NodeConfigDrawer;
