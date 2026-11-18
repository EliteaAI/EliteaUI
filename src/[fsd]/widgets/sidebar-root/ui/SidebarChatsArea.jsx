import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';

const SidebarChatsArea = memo(props => {
  const { children } = props;

  const styles = sidebarChatsAreaStyles();

  return (
    <Box
      component="section"
      aria-label="Chats"
      data-tour={SIDEBAR_TOUR_TARGET_IDS.chats}
      data-testid="sidebar-chats-area"
      sx={styles.root}
    >
      <Box sx={styles.header}>
        <Typography variant="subtitle">Chats</Typography>
      </Box>
      <Box
        sx={styles.list}
        data-testid="sidebar-chats-list"
      >
        {children}
      </Box>
    </Box>
  );
});

SidebarChatsArea.displayName = 'SidebarChatsArea';

/** @type {MuiSx} */
const sidebarChatsAreaStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '0.75rem',
    paddingInline: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '2rem',
    flexShrink: 0,
    paddingLeft: '0.5rem',
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
});

export default SidebarChatsArea;
