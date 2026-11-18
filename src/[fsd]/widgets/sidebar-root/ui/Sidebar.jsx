import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';
import Drawer from '@mui/material/Drawer';

import { SidebarBody } from '@/[fsd]/widgets/sidebar-root/ui';
import { COLLAPSED_SIDE_BAR_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';

const COLLAPSE_BUTTON_SIZE = 24;

const Sidebar = memo(props => {
  const { onCollapsed, onKeyDown, onToggleAssistant } = props;
  // const { showSearchBar } = useSearchBar();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const styles = sideBarStyles(sideBarCollapsed);

  const onCollapsedHandler = useCallback(
    collapsed => {
      if (onCollapsed) {
        onCollapsed(collapsed);
      }
    },
    [onCollapsed],
  );

  const onClickCollapsed = useCallback(() => {
    onCollapsed(!sideBarCollapsed);
  }, [onCollapsed, sideBarCollapsed]);

  return (
    <Drawer
      variant="permanent"
      open
      sx={styles.drawer}
    >
      <SidebarBody
        onKeyDown={onKeyDown}
        onCollapsed={onCollapsedHandler}
        onToggleAssistant={onToggleAssistant}
      />
      <Box
        onClick={onClickCollapsed}
        sx={styles.collapseButton}
      >
        {sideBarCollapsed ? <ArrowRightIcon /> : <ArrowLeftIcon />}
      </Box>
      {/* {showSearchBar && <FeedbackDialog />} */}
    </Drawer>
  );
});

Sidebar.displayName = 'Sidebar';

/** @type {MuiSx} */
const sideBarStyles = sideBarCollapsed => {
  const width = sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH;

  return {
    drawer: ({ palette }) => ({
      display: { xs: 'none', sm: 'block' },
      // No paper width: the body sets it, and a fixed width here would overflow by the border
      '& .MuiDrawer-paper': {
        boxSizing: 'border-box',
        background: 'transparent',
        borderRight: `0.0625rem solid ${palette.components.sidebar.divider}`,
      },
      background: 'transparent',
      position: 'relative',
      overflow: 'visible',
    }),
    collapseButton: ({ palette }) => ({
      position: 'fixed',
      top: '3rem',
      // Centred on the menu's right edge
      left: `${(width - COLLAPSE_BUTTON_SIZE / 2) / 16}rem`,
      width: `${COLLAPSE_BUTTON_SIZE / 16}rem`,
      height: `${COLLAPSE_BUTTON_SIZE / 16}rem`,
      borderRadius: '50%',
      border: `0.0625rem solid ${palette.border.lines}`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      background: palette.background.default.secondary,
      zIndex: 2101, // Above drawer (1200) but below modals
      pointerEvents: 'auto',
    }),
  };
};

export default Sidebar;
