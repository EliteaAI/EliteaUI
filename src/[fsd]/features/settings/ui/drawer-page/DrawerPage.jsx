import { memo } from 'react';

import { Box } from '@mui/material';

const DrawerPage = memo(props => {
  const { sx, children, ...rest } = props;
  const styles = getStyles();
  return (
    <Box
      {...rest}
      sx={[styles.page, sx]}
    >
      {children}
    </Box>
  );
});

DrawerPage.displayName = 'DrawerPage';

/**@type {MuiSx} */
const getStyles = () => ({
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'scroll',
  },
});
export default DrawerPage;
