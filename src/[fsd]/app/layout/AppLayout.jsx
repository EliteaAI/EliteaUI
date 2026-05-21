import { memo } from 'react';

import { Box } from '@mui/material';

import MainPanel from '@/[fsd]/app/layout/MainPanel';
import MainSidebar from '@/[fsd]/app/layout/MainSidebar';
import { InteractiveTourProvider } from '@/[fsd]/app/providers/InteractiveTourProvider';
import { useInteractiveTourController, useTourFromUrl } from '@/[fsd]/features/interactive-tours';
import InteractiveTourRoot from '@/[fsd]/features/interactive-tours/ui/InteractiveTourRoot';
import { SupportAssistantWidget } from '@/[fsd]/widgets/SupportAssistant';

const AppLayoutInner = memo(props => {
  const { onToggleAssistant } = props;

  useTourFromUrl();
  const styles = appLayoutStyles();

  return (
    <Box sx={styles.appContainer}>
      <MainSidebar onToggleAssistant={onToggleAssistant} />
      <MainPanel />
    </Box>
  );
});

AppLayoutInner.displayName = 'AppLayoutInner';

const AppLayout = memo(() => {
  const tourValue = useInteractiveTourController();

  return (
    <InteractiveTourProvider value={tourValue}>
      <SupportAssistantWidget>
        {({ onToggleAssistant }) => <AppLayoutInner onToggleAssistant={onToggleAssistant} />}
      </SupportAssistantWidget>
      <InteractiveTourRoot />
    </InteractiveTourProvider>
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
