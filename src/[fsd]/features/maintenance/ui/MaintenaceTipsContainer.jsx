import { memo } from 'react';

import { Box } from '@mui/material';

const MaintenaceTipsContainer = memo(({ children, sx }) => {
  const styles = getStyles();

  return (
    <Box sx={[styles.tipsContainerBorder, sx]}>
      <Box sx={styles.tipsContainerBackground}>
        <Box sx={styles.tipsContainer}>{children}</Box>
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  tipsContainerBorder: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '1.5rem',
    padding: '0.0625rem',
    background: palette.background.banner.border,
  }),
  tipsContainerBackground: ({ palette }) => ({
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '1.5rem',
    background: palette.background.onboardingBody,
  }),
  tipsContainer: ({ palette }) => ({
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '1.5rem',
    padding: '1.25rem',
    background: palette.background.welcome.inner,
  }),
});

MaintenaceTipsContainer.displayName = 'MaintenaceTipsContainer';

export default MaintenaceTipsContainer;
