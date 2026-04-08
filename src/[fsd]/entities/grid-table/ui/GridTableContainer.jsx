import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const GridTableContainer = memo(props => {
  const {
    children,
    toolbar,
    isLoading = false,
    isEmpty = false,
    emptyMessage = 'No data',
    loadingMessage = 'Loading...',
    sx = {},
    toolbarSx = {},
    containerProps = {},
  } = props;

  const styles = gridTableContainerStyles();

  return (
    <Box
      sx={[styles.root, sx]}
      {...containerProps}
    >
      {toolbar && <Box sx={[styles.toolbar, toolbarSx]}>{toolbar}</Box>}

      <Box sx={styles.tableWrapper}>
        {isLoading ? (
          <Box sx={styles.stateContainer}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {loadingMessage}
            </Typography>
          </Box>
        ) : isEmpty ? (
          <Box sx={styles.stateContainer}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
});

GridTableContainer.displayName = 'GridTableContainer';

/** @type {MuiSx} */
const gridTableContainerStyles = () => ({
  root: {
    flex: 1,
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.7rem 1.5rem',
  },
  tableWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: '0.75rem',
    overflow: 'hidden',
    padding: '0 1.5rem 1rem',
  },
  stateContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
});

export default GridTableContainer;
