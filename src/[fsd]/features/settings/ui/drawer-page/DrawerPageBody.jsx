import { memo } from 'react';

import { Box } from '@mui/material';

// The area below DrawerPageHeader; the child (a table) fills the height that is left
const DrawerPageBody = memo(props => {
  const { children, ...rest } = props;
  const styles = drawerPageBodyStyles();
  return (
    <Box
      {...rest}
      sx={styles.container}
    >
      <Box sx={styles.content}>{children}</Box>
    </Box>
  );
});

DrawerPageBody.displayName = 'DrawerPageBody';

/** @type {MuiSx} */
const drawerPageBodyStyles = () => ({
  container: {
    width: '100%',
    height: 'calc(100% - 3.75rem)',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});

export default DrawerPageBody;
