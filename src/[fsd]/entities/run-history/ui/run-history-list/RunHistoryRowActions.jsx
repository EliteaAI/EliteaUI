import { memo } from 'react';

import { Box } from '@mui/material';

import DotMenu from '@/components/DotMenu';

import { useRunHistoryRowMenu } from '../../lib/hooks/useRunHistoryRowMenu.hooks';
import RunHistoryDeleteModal from './RunHistoryDeleteModal';

const ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };

// The row's hover menu: it is revealed by a row hover (or while open), as before
const RunHistoryRowActions = memo(props => {
  const menu = useRunHistoryRowMenu(props);
  const { menuItems, slotProps, menuOpened, openMenu, closeMenu, styles, deleteModal } = menu;

  if (!menuItems.length) return null;

  return (
    <>
      <Box
        id="actions-block"
        sx={[styles.actions, menuOpened && styles.actionsRevealed]}
      >
        <DotMenu
          id="run-history-menu"
          slotProps={slotProps}
          onClose={closeMenu}
          onShowMenuList={openMenu}
          anchorOrigin={ANCHOR_ORIGIN}
          transformOrigin={TRANSFORM_ORIGIN}
        >
          {menuItems}
        </DotMenu>
      </Box>

      <RunHistoryDeleteModal {...deleteModal} />
    </>
  );
});

RunHistoryRowActions.displayName = 'RunHistoryRowActions';

export default RunHistoryRowActions;
