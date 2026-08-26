import { memo } from 'react';

import { MenuItem } from '@mui/material';

import MoveTo from '@/components/Icons/MoveTo';
import NestedMenuItem from '@/components/NestedMenuItem';

import { useFolderMenuActions } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';
import FolderMenuContent from './FolderMenuContent';

const MoveToFolderSubmenu = memo(props => {
  const { entityId, entityType, currentFolderId, parentMenuOpen, onAction, menuItemSx } = props;

  const {
    folderEntityType,
    folders,
    isLoading,
    createDialogOpen,
    handleFolderClick,
    handleRemoveFromFolder,
    handleCreateFolderClick,
    handleFolderCreated,
    handleCloseCreateDialog,
  } = useFolderMenuActions({ entityId, entityType, currentFolderId, onAction });

  if (!folderEntityType) return null;

  return (
    <>
      <NestedMenuItem
        leftIcon={<MoveTo sx={{ fontSize: '1rem' }} />}
        label="Move to folder"
        parentMenuOpen={parentMenuOpen}
        MenuItemComponent={MenuItem}
        disabled={isLoading}
        sx={menuItemSx}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        subMenuProps={{ MenuListProps: { sx: { py: 0 } } }}
      >
        <FolderMenuContent
          folders={folders}
          currentFolderId={currentFolderId}
          onCreateClick={handleCreateFolderClick}
          onFolderClick={handleFolderClick}
          onRemoveClick={handleRemoveFromFolder}
          minWidth="13.75rem"
        />
      </NestedMenuItem>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onFolderCreated={handleFolderCreated}
        entityType={folderEntityType}
      />
    </>
  );
});

MoveToFolderSubmenu.displayName = 'MoveToFolderSubmenu';

export default MoveToFolderSubmenu;
