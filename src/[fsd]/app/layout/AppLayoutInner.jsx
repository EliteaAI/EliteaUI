import { memo } from 'react';

import { Box } from '@mui/material';

import MainPanel from '@/[fsd]/app/layout/MainPanel';
import MainSidebar from '@/[fsd]/app/layout/MainSidebar';
import { useTourFromUrl } from '@/[fsd]/features/interactive-tours';

const AppLayoutInner = memo(props => {
  const { onToggleAssistant } = props;

  useTourFromUrl();
  const styles = appLayoutInnerStyles();

  return (
    <Box sx={styles.appContainer}>
      <MainSidebar onToggleAssistant={onToggleAssistant} />
      <MainPanel />
    </Box>
  );
});

AppLayoutInner.displayName = 'AppLayoutInner';

/** @type {MuiSx} */
const appLayoutInnerStyles = () => ({
  appContainer: {
    display: 'flex',
  },
});

export default AppLayoutInner;
