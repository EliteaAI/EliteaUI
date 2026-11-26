import { memo } from 'react';

import DotMenu from '@/components/DotMenu';

import { useRunHistoryRowMenu } from '../lib/hooks/useRunHistoryRowMenu.hooks';
import RunHistoryDeleteModal from './run-history-list/RunHistoryDeleteModal';

const RunMenu = memo(props => {
  const menu = useRunHistoryRowMenu(props);
  const { menuItems, slotProps, openMenu, closeMenu, deleteModal } = menu;

  if (!menuItems.length) return null;

  return (
    <>
      <DotMenu
        id="run-view-menu"
        slotProps={slotProps}
        onClose={closeMenu}
        onShowMenuList={openMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuItems}
      </DotMenu>
      <RunHistoryDeleteModal {...deleteModal} />
    </>
  );
});

RunMenu.displayName = 'RunMenu';

export default RunMenu;
