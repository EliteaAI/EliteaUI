import { memo } from 'react';

import { Box } from '@mui/material';

import DotMenu from '@/components/DotMenu';

import { useRunHistoryRowMenu } from '../../lib/hooks/useRunHistoryRowMenu.hooks';
import RunHistoryDeleteModal from './RunHistoryDeleteModal';

const ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };

const RunHistoryRowActions = memo(props => {
  const menu = useRunHistoryRowMenu(props);
  const { menuItems, slotProps, menuOpened, openMenu, closeMenu, deleteModal } = menu;

  const styles = runHistoryRowActionsStyles();

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

/** @type {MuiSx} */
const runHistoryRowActionsStyles = () => ({
  actions: ({ palette }) => ({
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: '0rem',
    top: '50%',
    transform: 'translateY(-50%)',
    gap: '0.25rem',
    padding: '0.5rem',
    borderRadius: '0.25rem',

    svg: {
      fontSize: '.9rem',

      path: {
        fill: palette.secondary.main,
      },
    },
  }),
  actionsRevealed: {
    display: 'flex',
  },
});

export default RunHistoryRowActions;
