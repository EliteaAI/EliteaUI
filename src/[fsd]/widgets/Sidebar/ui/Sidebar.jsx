import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';
import Drawer from '@mui/material/Drawer';

import { SidebarBody } from '@/[fsd]/widgets/Sidebar/ui';
import { COLLAPSED_SIDE_BAR_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';

const Sidebar = memo(({ onCollapsed, onKeyDown }) => {
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
const sideBarStyles = sideBarCollapsed => ({
  drawer: {
    display: { xs: 'none', sm: 'block' },
    '& .MuiDrawer-paper': {
      boxSizing: 'border-box',
      width: `${sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH}`,
      background: 'transparent',
    },
    background: 'transparent',
    position: 'relative',
    overflow: 'visible',
  },
  collapseButton: ({ palette }) => ({
    position: 'fixed',
    top: '3rem',
    left: sideBarCollapsed ? '3.25rem' : '12.75rem',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    background: palette.background.secondary,
    zIndex: 2101, // Above drawer (1200) but below modals
    pointerEvents: 'auto',
  }),
});

export default Sidebar;
