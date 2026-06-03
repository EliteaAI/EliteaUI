import { memo, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { ImportWizardModal } from '@/[fsd]/entities/import-wizard/ui';
import { useIsOnboarding } from '@/[fsd]/shared/lib/hooks';
import { Sidebar } from '@/[fsd]/widgets/sidebar-root/ui';
import { COLLAPSED_SIDE_BAR_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';
import { actions } from '@/slices/settings';

const MainSidebar = memo(props => {
  const { onToggleAssistant } = props;
  const dispatch = useDispatch();
  const isOnboardingPage = useIsOnboarding();

  const user = useSelector(state => state.user);

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const { openWizard, data, isForking } = useSelector(state => state.importWizard);

  const styles = mainSidebarStyles(sideBarCollapsed);

  const onSideCollapsed = useCallback(
    collapsed => {
      dispatch(actions.setSideBarCollapsed(collapsed));
    },
    [dispatch],
  );

  const onCloseImportWizard = useCallback(
    event => {
      event?.stopPropagation?.();
      dispatch(importWizardActions.closeImportWizard());
    },
    [dispatch],
  );

  if (isOnboardingPage && !user.personal_project_id) return null;

  return (
    <Box
      component="nav"
      sx={styles.leftSideBar}
      aria-label="side-bar"
    >
      <Sidebar
        onCollapsed={onSideCollapsed}
        onToggleAssistant={onToggleAssistant}
      />
      <ImportWizardModal
        open={openWizard}
        onClose={onCloseImportWizard}
        data={data}
        isForking={isForking}
      />
    </Box>
  );
});

MainSidebar.displayName = 'MainSidebar';

/** @type {MuiSx} */
const mainSidebarStyles = sideBarCollapsed => ({
  leftSideBar: {
    width: `${(sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH) / 16}rem`,
    flexShrink: 0,
    overflowX: 'hidden',
  },
});

export default MainSidebar;
