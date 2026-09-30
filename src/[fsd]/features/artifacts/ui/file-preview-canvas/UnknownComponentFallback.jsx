import { memo } from 'react';

import { Box } from '@mui/material';

// Renders children of JSX components the MDX source references but the preview does not know about.
const UnknownComponentFallback = memo(props => {
  const { children } = props;

  const styles = unknownComponentFallbackStyles();

  return (
    <Box
      component="span"
      sx={styles.root}
    >
      {children}
    </Box>
  );
});

UnknownComponentFallback.displayName = 'UnknownComponentFallback';

/** @type {MuiSx} */
const unknownComponentFallbackStyles = () => ({
  root: {
    display: 'contents',
  },
});

export default UnknownComponentFallback;
