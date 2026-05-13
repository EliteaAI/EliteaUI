import { memo } from 'react';

import { Box } from '@mui/material';

import MainPanel from '@/[fsd]/app/layout/MainPanel';
import MainSidebar from '@/[fsd]/app/layout/MainSidebar';
import { SupportAssistantWidget } from '@/[fsd]/widgets/SupportAssistant';

const AppLayout = memo(() => {
  const styles = appLayoutStyles();

  return (
    <SupportAssistantWidget>
      {({ onToggleAssistant }) => (
        <Box sx={styles.appContainer}>
          <MainSidebar onToggleAssistant={onToggleAssistant} />
          <MainPanel />
        </Box>
      )}
    </SupportAssistantWidget>
  );
});

AppLayout.displayName = 'AppLayout';

/** @type {MuiSx} */
const appLayoutStyles = () => ({
  appContainer: {
    display: 'flex',
  },
});

export default AppLayout;
