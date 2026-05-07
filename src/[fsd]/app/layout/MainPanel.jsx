import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { ProtectedRoutes } from '@/[fsd]/app/routes';
import { MaintenanceBanner } from '@/[fsd]/features/maintenance/ui';
import { useIsOnboarding } from '@/[fsd]/shared/lib/hooks';
import { COLLAPSED_SIDE_BAR_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';
import UnsavedDialog from '@/components/UnsavedDialog';

const MainPanel = memo(() => {
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const isOnboardingPage = useIsOnboarding();

  // Check if on Onboarding page
  const sidebarWidth = useMemo(
    () => (isOnboardingPage ? 0 : sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH),
    [isOnboardingPage, sideBarCollapsed],
  );

  const styles = mainPanelStyles(sidebarWidth);

  return (
    <Box
      component="main"
      sx={styles.mainPanel}
    >
      <MaintenanceBanner />
      <ProtectedRoutes />
      <UnsavedDialog />
    </Box>
  );
});

MainPanel.displayName = 'MainPanel';

/** @type {MuiSx} */
const mainPanelStyles = sidebarWidth => ({
  mainPanel: {
    display: 'block',
    flexGrow: 1,
    width: `calc(100% - ${sidebarWidth / 16}rem)`,
    maxWidth: `calc(100% - ${sidebarWidth / 16}rem)`,
    height: '100vh',
    boxSizing: 'border-box',
    padding: 0,
    position: 'relative',
  },
});

export default MainPanel;
