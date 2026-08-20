import { memo } from 'react';

import { Box, CircularProgress } from '@mui/material';

const EditorLoading = memo(props => {
  const { fullCover = false } = props;

  const styles = editorLoadingStyles(fullCover);

  return (
    <Box sx={styles.root}>
      <CircularProgress size="2rem" />
    </Box>
  );
});

EditorLoading.displayName = 'EditorLoading';

/** @type {MuiSx} */
const editorLoadingStyles = fullCover => ({
  root: {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '10rem',
    ...(fullCover && {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1000,
      minHeight: 'unset',
    }),
  },
});

export default EditorLoading;
