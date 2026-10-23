import { memo } from 'react';

import { Box } from '@mui/material';

import { RESIZE_GRIP_IMAGE } from '../lib/constants/testPanel.constants';

const TestPanelResizeHandle = memo(props => {
  const { onResizeStart } = props;

  const styles = testPanelResizeHandleStyles();

  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize test panel"
      sx={styles.root}
      onMouseDown={onResizeStart}
      data-testid="pipeline-test-panel-resize-handle"
    />
  );
});

TestPanelResizeHandle.displayName = 'TestPanelResizeHandle';

/** @type {MuiSx} */
const testPanelResizeHandleStyles = () => ({
  // Sits over the 1.5rem gap between the canvas and the panel
  root: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '-1.5rem',
    width: '1.5rem',
    zIndex: 1,
    cursor: 'col-resize',
    backgroundImage: RESIZE_GRIP_IMAGE,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '50%',
  },
});

export default TestPanelResizeHandle;
