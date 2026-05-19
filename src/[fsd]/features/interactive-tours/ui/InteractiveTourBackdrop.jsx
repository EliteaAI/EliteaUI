import { memo } from 'react';

import { Box } from '@mui/material';

const InteractiveTourBackdrop = memo(props => {
  const { children } = props;
  const styles = backdropStyles();

  return <Box sx={styles.backdrop}>{children}</Box>;
});

InteractiveTourBackdrop.displayName = 'InteractiveTourBackdrop';

/** @type {MuiSx} */
const backdropStyles = () => ({
  backdrop: ({ palette, zIndex }) => ({
    position: 'fixed',
    inset: 0,
    zIndex: zIndex.modal + 1,
    backgroundColor: palette.background.interactiveTourPrompt.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Block all pointer events on the dim; children may override
    pointerEvents: 'auto',
  }),
});

export default InteractiveTourBackdrop;
